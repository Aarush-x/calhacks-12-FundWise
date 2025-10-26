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
    const { message, conversationId } = await req.json();
    const lettaApiKey = Deno.env.get('LETTA_API_KEY');

    if (!lettaApiKey) {
      throw new Error('LETTA_API_KEY not configured');
    }

    console.log('Sending message to Letta:', message);

    // Call Letta API
    const response = await fetch('https://api.letta.com/v1/agents/chat', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lettaApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        conversation_id: conversationId || undefined,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Letta API error:', response.status, errorText);
      throw new Error(`Letta API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Letta response:', data);

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in letta-chat function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
