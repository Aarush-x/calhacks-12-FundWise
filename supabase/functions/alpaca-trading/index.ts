import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error('Not authenticated');
    }

    const { action, symbol, quantity, side, orderType, limitPrice } = await req.json();
    console.log('Alpaca trading request:', { action, symbol, quantity, side, orderType, limitPrice, userId: user.id });

    const ALPACA_API_KEY = Deno.env.get('ALPACA_API_KEY');
    const ALPACA_SECRET_KEY = Deno.env.get('ALPACA_SECRET_KEY');
    
    if (!ALPACA_API_KEY || !ALPACA_SECRET_KEY) {
      throw new Error('Alpaca API credentials not configured');
    }

    const alpacaBaseUrl = 'https://paper-api.alpaca.markets/v2';

    // Get user trading settings
    const { data: settings } = await supabaseClient
      .from('user_trading_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (action === 'place_order') {
      // First, check for existing open orders for the same symbol
      const existingOrdersResponse = await fetch(`${alpacaBaseUrl}/orders?status=open&symbols=${symbol}`, {
        headers: {
          'APCA-API-KEY-ID': ALPACA_API_KEY,
          'APCA-API-SECRET-KEY': ALPACA_SECRET_KEY,
        },
      });

      if (existingOrdersResponse.ok) {
        const existingOrders = await existingOrdersResponse.json();
        
        // Cancel any conflicting orders (opposite side)
        for (const order of existingOrders) {
          if (order.side !== side) {
            console.log(`Canceling conflicting ${order.side} order for ${symbol}`);
            await fetch(`${alpacaBaseUrl}/orders/${order.id}`, {
              method: 'DELETE',
              headers: {
                'APCA-API-KEY-ID': ALPACA_API_KEY,
                'APCA-API-SECRET-KEY': ALPACA_SECRET_KEY,
              },
            });
          }
        }
      }

      // Place order with Alpaca
      const orderPayload: any = {
        symbol,
        qty: quantity,
        side,
        type: orderType || 'market',
        time_in_force: orderType === 'limit' ? 'gtc' : 'day'
      };

      // Add limit price if it's a limit order
      if (orderType === 'limit' && limitPrice) {
        orderPayload.limit_price = limitPrice;
      }

      console.log('Placing Alpaca order:', orderPayload);

      const orderResponse = await fetch(`${alpacaBaseUrl}/orders`, {
        method: 'POST',
        headers: {
          'APCA-API-KEY-ID': ALPACA_API_KEY,
          'APCA-API-SECRET-KEY': ALPACA_SECRET_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderPayload),
      });

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json();
        console.error('Alpaca order error:', errorData);
        throw new Error(`Failed to place order: ${errorData.message || 'Unknown error'}`);
      }

      const orderData = await orderResponse.json();
      console.log('Alpaca order placed:', orderData);

      // Determine initial status based on order type and Alpaca response
      let initialStatus = 'pending';
      if (orderData.status === 'filled') {
        initialStatus = 'filled';
      } else if (orderData.status === 'accepted' && orderType === 'market') {
        // Market orders usually fill quickly, check again in a moment
        initialStatus = 'pending';
      }

      // Save to database
      const { data: trade, error: insertError } = await supabaseClient
        .from('automated_trades')
        .insert({
          user_id: user.id,
          symbol,
          order_type: side,
          quantity,
          status: initialStatus,
          alpaca_order_id: orderData.id,
          entry_price: orderData.filled_avg_price ? parseFloat(orderData.filled_avg_price) : (orderType === 'limit' ? limitPrice : null),
        })
        .select()
        .single();

      if (insertError) {
        console.error('Database insert error:', insertError);
        throw insertError;
      }

      // For market orders, wait a moment and check if it filled
      if (orderType === 'market') {
        setTimeout(async () => {
          try {
            const orderCheckResponse = await fetch(`${alpacaBaseUrl}/orders/${orderData.id}`, {
              headers: {
                'APCA-API-KEY-ID': ALPACA_API_KEY,
                'APCA-API-SECRET-KEY': ALPACA_SECRET_KEY,
              },
            });

            if (orderCheckResponse.ok) {
              const updatedOrder = await orderCheckResponse.json();
              console.log('Order status check:', updatedOrder);

              if (updatedOrder.status === 'filled') {
                await supabaseClient
                  .from('automated_trades')
                  .update({
                    status: 'filled',
                    entry_price: parseFloat(updatedOrder.filled_avg_price),
                    current_price: parseFloat(updatedOrder.filled_avg_price),
                  })
                  .eq('alpaca_order_id', orderData.id);
              }
            }
          } catch (error) {
            console.error('Error checking order status:', error);
          }
        }, 2000); // Check after 2 seconds
      }

      return new Response(JSON.stringify({ success: true, order: orderData, trade }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'get_positions') {
      const positionsResponse = await fetch(`${alpacaBaseUrl}/positions`, {
        headers: {
          'APCA-API-KEY-ID': ALPACA_API_KEY,
          'APCA-API-SECRET-KEY': ALPACA_SECRET_KEY,
        },
      });

      if (!positionsResponse.ok) {
        throw new Error('Failed to fetch positions');
      }

      const positions = await positionsResponse.json();
      console.log('Fetched positions:', positions.length);

      // Update trades in database with current prices
      for (const position of positions) {
        const profitLossPercentage = parseFloat(position.unrealized_plpc) * 100;
        
        await supabaseClient
          .from('automated_trades')
          .update({
            current_price: parseFloat(position.current_price),
            entry_price: parseFloat(position.avg_entry_price),
            profit_loss_percentage: profitLossPercentage,
            status: 'filled'
          })
          .eq('symbol', position.symbol)
          .eq('user_id', user.id)
          .eq('status', 'pending');

        // Check for profit target or stop loss
        if (settings && settings.automated_trading_enabled) {
          const shouldSell = 
            profitLossPercentage >= settings.profit_target_percentage ||
            (settings.stop_loss_enabled && profitLossPercentage <= -settings.stop_loss_percentage);

          if (shouldSell) {
            console.log(`Auto-selling ${position.symbol} at ${profitLossPercentage.toFixed(2)}% P/L`);
            
            // Place sell order
            const sellOrder = await fetch(`${alpacaBaseUrl}/orders`, {
              method: 'POST',
              headers: {
                'APCA-API-KEY-ID': ALPACA_API_KEY,
                'APCA-API-SECRET-KEY': ALPACA_SECRET_KEY,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                symbol: position.symbol,
                qty: position.qty,
                side: 'sell',
                type: 'market',
                time_in_force: 'day'
              }),
            });

            if (sellOrder.ok) {
              const sellData = await sellOrder.json();
              await supabaseClient
                .from('automated_trades')
                .insert({
                  user_id: user.id,
                  symbol: position.symbol,
                  order_type: 'sell',
                  quantity: parseFloat(position.qty),
                  entry_price: parseFloat(position.current_price),
                  status: 'pending',
                  alpaca_order_id: sellData.id,
                });
            }
          }
        }
      }

      return new Response(JSON.stringify({ success: true, positions }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'get_account') {
      const accountResponse = await fetch(`${alpacaBaseUrl}/account`, {
        headers: {
          'APCA-API-KEY-ID': ALPACA_API_KEY,
          'APCA-API-SECRET-KEY': ALPACA_SECRET_KEY,
        },
      });

      if (!accountResponse.ok) {
        throw new Error('Failed to fetch account');
      }

      const account = await accountResponse.json();
      return new Response(JSON.stringify({ success: true, account }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error('Invalid action');

  } catch (error) {
    console.error('Error in alpaca-trading function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});