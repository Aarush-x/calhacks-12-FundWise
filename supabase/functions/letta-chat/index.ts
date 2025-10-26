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
    const agentId = Deno.env.get('LETTA_AGENT_ID');

    if (!lettaApiKey) {
      throw new Error('LETTA_API_KEY not configured');
    }

    if (!agentId) {
      throw new Error('LETTA_AGENT_ID not configured. Please add your Letta agent ID in the secrets.');
    }

    console.log('Sending message to Letta agent:', agentId);

    // Call Letta API to send message
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

    try {
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
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log('Letta API response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Letta API error:', response.status, errorText);
        
        // Provide user-friendly error messages
        if (response.status === 404) {
          throw new Error(`Agent not found. Please verify your Letta Agent ID is correct.`);
        } else if (response.status === 401 || response.status === 403) {
          throw new Error(`Authentication failed. Please verify your Letta API key is correct.`);
        }
        
        throw new Error(`Letta API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Letta API full response:', JSON.stringify(data, null, 2));

      // Extract the assistant's message from the response
      // Try multiple possible response structures
      let assistantMessage = '';
      
      if (data.messages && Array.isArray(data.messages)) {
        const assistantMsg = data.messages.find((m: any) => m.role === 'assistant');
        assistantMessage = assistantMsg?.text || assistantMsg?.content || '';
      } else if (data.response) {
        assistantMessage = data.response;
      } else if (data.message) {
        assistantMessage = data.message;
      }

      if (!assistantMessage) {
        console.error('Could not extract message from response:', data);
        assistantMessage = 'I received your message but had trouble formatting the response. Please try again.';
      }

      return new Response(JSON.stringify({ 
        response: assistantMessage,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        throw new Error('Request timed out. The Letta API is taking too long to respond.');
      }
      throw fetchError;
    }
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
