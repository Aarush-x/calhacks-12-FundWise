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
  const url = `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=5min&outputsize=full&apikey=${apiKey}`;
  
  const response = await fetch(url);
  const data = await response.json();

  if (data.Note) {
    throw new Error('API_RATE_LIMIT: Alpha Vantage rate limit reached.');
  }

  if (data['Error Message']) {
    throw new Error(`API_ERROR: ${data['Error Message']}`);
  }

  const timeSeries = data['Time Series (5min)'];
  if (!timeSeries) {
    return [];
  }

  const chartData: CandlestickData[] = [];
  const sortedDates = Object.keys(timeSeries).sort().slice(-100); // Last 100 data points

  for (const date of sortedDates) {
    const candle = timeSeries[date];
    chartData.push({
      date,
      open: parseFloat(candle['1. open']),
      high: parseFloat(candle['2. high']),
      low: parseFloat(candle['3. low']),
      close: parseFloat(candle['4. close']),
      volume: parseInt(candle['5. volume']),
    });
  }

  return chartData.map(d => ({ ...d, indicators: {} }));
}

async function fetchTechnicalIndicator(
  symbol: string,
  apiKey: string,
  function_name: string,
  params: Record<string, string>
): Promise<Record<string, any>> {
  const paramString = Object.entries(params)
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
  
  const url = `https://www.alphavantage.co/query?function=${function_name}&symbol=${symbol}&${paramString}&apikey=${apiKey}`;
  
  const response = await fetch(url);
  const data = await response.json();

  if (data.Note || data['Error Message']) {
    return {};
  }

  return data;
}

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

    const apiKey = Deno.env.get('ALPHA_VANTAGE_API_KEY');
    
    if (!apiKey) {
      console.error('ALPHA_VANTAGE_API_KEY not found');
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
