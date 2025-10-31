import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, accountData, positions } = await req.json();
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('K AI received message:', message);
    console.log('Account data:', accountData);
    console.log('Positions:', positions);

    // Build positions information
    let positionsInfo = '';
    if (positions && positions.length > 0) {
      positionsInfo = '\n\n**Current Positions:**\n';
      positions.forEach((pos: any) => {
        const pl = parseFloat(pos.unrealized_pl || 0);
        const plPercent = parseFloat(pos.unrealized_plpc || 0) * 100;
        positionsInfo += `- ${pos.symbol}: ${pos.qty} shares @ $${parseFloat(pos.avg_entry_price).toFixed(2)} (Current: $${parseFloat(pos.current_price).toFixed(2)}, P/L: ${pl >= 0 ? '+' : ''}$${pl.toFixed(2)} / ${plPercent >= 0 ? '+' : ''}${plPercent.toFixed(2)}%)\n`;
      });
    } else {
      positionsInfo = '\n\n**Current Positions:** No open positions';
    }

    // Build context-aware system prompt
    const systemPrompt = `You are "K", an AI Trading Strategist integrated into a web trading app. 
Your role is to guide users in building, testing, and refining automated trading strategies using live financial data.

**Core Objective:**
Help users create trading strategies using technical indicators, analyze market trends, and auto-allocate funds via the Alpaca paper trading API.

**User's Current Portfolio (LIVE DATA):**
- Portfolio Value: $${parseFloat(accountData?.equity || '0').toLocaleString()}
- Buying Power: $${parseFloat(accountData?.buying_power || '0').toLocaleString()}
- Cash: $${parseFloat(accountData?.cash || '0').toLocaleString()}
${positionsInfo}

**Your Capabilities:**
1. Technical Strategy Design - Build strategies using Moving Averages (SMA, EMA), Bollinger Bands, RSI, MACD, Momentum Indicators
2. Trading Automation - Create trade signals (Buy, Sell, Hold) based on live market data
3. Sentiment + News Analysis - Incorporate news sentiment into recommendations
4. Portfolio & Fund Allocation - Recommend splits based on risk tolerance
5. Portfolio Analysis - Analyze current holdings and provide insights on P/L, risk, and optimization

**Interaction Style:**
- Concise, professional explanations
- When asked about portfolio or positions, refer to the LIVE DATA above
- Help users understand reasoning behind strategies
- Output structured recommendations when appropriate
- Provide specific suggestions based on current holdings`;

    // Call Lovable AI Gateway
    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${lovableApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: message }
          ],
          temperature: 0.7,
          max_tokens: 500,
        }),
      }
    );

    console.log('Lovable AI response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again in a moment.');
      }
      
      if (response.status === 402) {
        throw new Error('Payment required. Please add credits to your workspace.');
      }
      
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Lovable AI response:', JSON.stringify(data, null, 2));

    const aiResponse = data.choices?.[0]?.message?.content || 
                       'I received your message but had trouble generating a response. Please try again.';

    return new Response(JSON.stringify({ 
      response: aiResponse,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in k-trading-ai function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
