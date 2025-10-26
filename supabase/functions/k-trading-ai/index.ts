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
    const { message, accountData } = await req.json();
    const hfApiKey = Deno.env.get('HUGGING_FACE_API_KEY');

    if (!hfApiKey) {
      throw new Error('HUGGING_FACE_API_KEY not configured');
    }

    console.log('K AI received message:', message);
    console.log('Account data:', accountData);

    // Build context-aware prompt
    const systemContext = `You are "K", an AI Trading Strategist integrated into a web trading app. 
Your role is to guide users in building, testing, and refining automated trading strategies using live financial data.

**Core Objective:**
Help users create trading strategies using technical indicators, analyze market trends, and auto-allocate funds via the Alpaca paper trading API.

**User's Current Portfolio:**
- Buying Power: $${accountData?.buying_power || '0'}
- Equity: $${accountData?.equity || '0'}
- Portfolio Value: $${accountData?.portfolio_value || '0'}

**Your Capabilities:**
1. Technical Strategy Design - Build strategies using Moving Averages (SMA, EMA), Bollinger Bands, RSI, MACD, Momentum Indicators
2. Trading Automation - Create trade signals (Buy, Sell, Hold) based on live market data
3. Sentiment + News Analysis - Incorporate news sentiment into recommendations
4. Portfolio & Fund Allocation - Recommend splits based on risk tolerance

**Interaction Style:**
- Concise, professional explanations
- Help users understand reasoning behind strategies
- Output structured recommendations when appropriate

User's question: ${message}`;

    // Call Hugging Face Inference API
    const response = await fetch(
      "https://api-inference.huggingface.co/models/meta-llama/Llama-3.2-3B-Instruct",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${hfApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: systemContext,
          parameters: {
            max_new_tokens: 500,
            temperature: 0.7,
            top_p: 0.9,
            return_full_text: false,
          }
        }),
      }
    );

    console.log('HuggingFace API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('HuggingFace API error:', response.status, errorText);
      
      // Handle model loading
      if (response.status === 503) {
        throw new Error('AI model is loading. Please try again in a few moments.');
      }
      
      throw new Error(`AI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('HuggingFace API response:', JSON.stringify(data, null, 2));

    let aiResponse = '';
    
    if (Array.isArray(data) && data.length > 0) {
      aiResponse = data[0].generated_text || data[0].text || '';
    } else if (data.generated_text) {
      aiResponse = data.generated_text;
    } else if (data[0]?.generated_text) {
      aiResponse = data[0].generated_text;
    }

    if (!aiResponse) {
      console.error('Could not extract AI response:', data);
      aiResponse = 'I received your message but had trouble generating a response. Please try rephrasing your question.';
    }

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
