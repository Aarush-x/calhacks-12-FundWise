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
    const { message } = await req.json();
    const lettaApiKey = Deno.env.get('LETTA_API_KEY');

    if (!lettaApiKey) {
      throw new Error('LETTA_API_KEY not configured');
    }

    console.log('Sending message to Letta:', message);

    // First, get or create an agent
    // For now, we'll use a default agent ID or create one if needed
    // You'll need to replace this with your actual agent ID from Letta
    const agentId = Deno.env.get('LETTA_AGENT_ID') || 'agent-00000000-0000-4000-8000-000000000000';

    // Call Letta API to send message
    const response = await fetch(`https://api.letta.com/v1/agents/${agentId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lettaApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            text: message,
          }
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Letta API error:', response.status, errorText);
      throw new Error(`Letta API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Letta response:', data);

    // Extract the assistant's message from the response
    const assistantMessage = data.messages?.find((m: any) => m.role === 'assistant')?.text || 
                            data.usage_statistics?.completion_tokens ? 'Response received' : 
                            'No response from agent';

    return new Response(JSON.stringify({ 
      response: assistantMessage,
      data: data 
    }), {
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
