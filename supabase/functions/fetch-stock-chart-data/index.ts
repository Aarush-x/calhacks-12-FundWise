const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CandlestickData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface TechnicalIndicators {
  sma20?: number;
  sma50?: number;
  ema12?: number;
  ema26?: number;
  rsi?: number;
  macd?: number;
  signal?: number;
  bb_upper?: number;
  bb_middle?: number;
  bb_lower?: number;
}

interface ChartDataPoint extends CandlestickData {
  indicators: TechnicalIndicators;
}

async function fetchIntradayData(symbol: string, apiKey: string): Promise<ChartDataPoint[]> {
  // Finnhub free tier only supports daily resolution (D), not intraday (5, 15, 30, 60)
  // We'll fetch daily data for the past 100 days
  const to = Math.floor(Date.now() / 1000);
  const from = to - (100 * 24 * 60 * 60); // 100 days ago
  
  const url = `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=D&from=${from}&to=${to}&token=${apiKey}`;
  
  console.log(`Fetching from Finnhub: ${url.replace(apiKey, 'HIDDEN')}`);
  
  const response = await fetch(url);
  const data = await response.json();

  console.log(`Finnhub response status: ${data.s || 'undefined'}`);

  if (data.s === 'no_data') {
    console.log('No data available for symbol:', symbol);
    return [];
  }

  if (!data.s || data.s !== 'ok') {
    console.error('Finnhub API error:', JSON.stringify(data));
    throw new Error(`API_ERROR: ${data.error || data.s || 'Invalid response from Finnhub'}`);
  }

  if (!data.t || !data.o || !data.h || !data.l || !data.c || !data.v) {
    console.error('Finnhub response missing required fields:', data);
    throw new Error('API_ERROR: Invalid data structure from Finnhub');
  }

  const chartData: CandlestickData[] = [];
  
  // Finnhub returns arrays for t (timestamp), o (open), h (high), l (low), c (close), v (volume)
  for (let i = 0; i < data.t.length; i++) {
    chartData.push({
      date: new Date(data.t[i] * 1000).toISOString(),
      open: data.o[i],
      high: data.h[i],
      low: data.l[i],
      close: data.c[i],
      volume: data.v[i],
    });
  }

  // Return all data points (up to 100 days)
  return chartData.map(d => ({ ...d, indicators: {} }));
}

// Technical indicators will be calculated locally since Finnhub doesn't provide them in the same way

function calculateTechnicalIndicators(chartData: CandlestickData[]): ChartDataPoint[] {
  const result: ChartDataPoint[] = chartData.map(d => ({ ...d, indicators: {} }));

  // Calculate SMA 20
  for (let i = 19; i < result.length; i++) {
    const sum = result.slice(i - 19, i + 1).reduce((acc, d) => acc + d.close, 0);
    result[i].indicators.sma20 = sum / 20;
  }

  // Calculate SMA 50
  for (let i = 49; i < result.length; i++) {
    const sum = result.slice(i - 49, i + 1).reduce((acc, d) => acc + d.close, 0);
    result[i].indicators.sma50 = sum / 50;
  }

  // Calculate EMA 12 and 26
  if (result.length > 0) {
    const multiplier12 = 2 / (12 + 1);
    const multiplier26 = 2 / (26 + 1);
    
    result[0].indicators.ema12 = result[0].close;
    result[0].indicators.ema26 = result[0].close;

    for (let i = 1; i < result.length; i++) {
      result[i].indicators.ema12 = (result[i].close - (result[i - 1].indicators.ema12 || 0)) * multiplier12 + (result[i - 1].indicators.ema12 || 0);
      result[i].indicators.ema26 = (result[i].close - (result[i - 1].indicators.ema26 || 0)) * multiplier26 + (result[i - 1].indicators.ema26 || 0);
    }
  }

  // Calculate RSI
  for (let i = 14; i < result.length; i++) {
    let gains = 0;
    let losses = 0;
    
    for (let j = i - 13; j <= i; j++) {
      const change = result[j].close - result[j - 1].close;
      if (change > 0) gains += change;
      else losses -= change;
    }
    
    const avgGain = gains / 14;
    const avgLoss = losses / 14;
    const rs = avgGain / (avgLoss || 1);
    result[i].indicators.rsi = 100 - (100 / (1 + rs));
  }

  // Calculate Bollinger Bands
  for (let i = 19; i < result.length; i++) {
    const slice = result.slice(i - 19, i + 1);
    const sma = slice.reduce((acc, d) => acc + d.close, 0) / 20;
    const variance = slice.reduce((acc, d) => acc + Math.pow(d.close - sma, 2), 0) / 20;
    const stdDev = Math.sqrt(variance);
    
    result[i].indicators.bb_middle = sma;
    result[i].indicators.bb_upper = sma + (2 * stdDev);
    result[i].indicators.bb_lower = sma - (2 * stdDev);
  }

  // Calculate MACD
  for (let i = 0; i < result.length; i++) {
    const ema12 = result[i].indicators.ema12 || 0;
    const ema26 = result[i].indicators.ema26 || 0;
    result[i].indicators.macd = ema12 - ema26;
  }

  // Calculate MACD Signal Line (9-day EMA of MACD)
  if (result.length > 8) {
    const multiplier = 2 / (9 + 1);
    result[8].indicators.signal = result[8].indicators.macd;
    
    for (let i = 9; i < result.length; i++) {
      result[i].indicators.signal = ((result[i].indicators.macd || 0) - (result[i - 1].indicators.signal || 0)) * multiplier + (result[i - 1].indicators.signal || 0);
    }
  }

  return result;
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

    const apiKey = Deno.env.get('FINNHUB_API_KEY');
    
    if (!apiKey) {
      console.error('FINNHUB_API_KEY not found');
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Fetching chart data for:', symbol);

    // Fetch intraday data
    const chartData = await fetchIntradayData(symbol, apiKey);

    if (chartData.length === 0) {
      return new Response(
        JSON.stringify({ chartData: [] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate technical indicators
    const chartDataWithIndicators = calculateTechnicalIndicators(chartData);

    console.log('Successfully fetched chart data with', chartDataWithIndicators.length, 'data points');

    return new Response(
      JSON.stringify({ chartData: chartDataWithIndicators }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error in fetch-stock-chart-data function:', error);
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
