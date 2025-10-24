const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface HistoricalDataPoint {
  date: string;
  price: number;
}

async function fetchStockHistory(symbol: string): Promise<HistoricalDataPoint[]> {
  try {
    // Fetch 30 days of historical data
    const endDate = Math.floor(Date.now() / 1000);
    const startDate = endDate - (30 * 24 * 60 * 60); // 30 days ago
    
    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${startDate}&period2=${endDate}&interval=1d`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0',
        },
      }
    );
    
    const data = await response.json();
    
    if (!data.chart?.result?.[0]) {
      throw new Error(`No historical data found for ${symbol}`);
    }

    const result = data.chart.result[0];
    const timestamps = result.timestamp;
    const prices = result.indicators?.quote?.[0]?.close;
    
    if (!timestamps || !prices) {
      throw new Error('Invalid data format');
    }

    const history: HistoricalDataPoint[] = timestamps.map((timestamp: number, index: number) => ({
      date: new Date(timestamp * 1000).toISOString().split('T')[0],
      price: parseFloat(prices[index]?.toFixed(2) || '0'),
    })).filter((point: HistoricalDataPoint) => point.price > 0);
    
    return history;
  } catch (error) {
    console.error(`Error fetching history for ${symbol}:`, error);
    throw error;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbol } = await req.json();
    
    if (!symbol) {
      return new Response(
        JSON.stringify({ error: 'Symbol is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Fetching historical data for:', symbol);

    const history = await fetchStockHistory(symbol);

    console.log('Successfully fetched:', history.length, 'data points');

    return new Response(
      JSON.stringify({ history }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error in fetch-stock-history function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
