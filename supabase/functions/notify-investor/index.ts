import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { dealId } = await req.json();

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get deal and investor details
    const { data: deal, error: dealError } = await supabaseClient
      .from('deals')
      .select(`
        *,
        investor:investor_id (
          email,
          phone_number
        )
      `)
      .eq('id', dealId)
      .is('deleted_at', null)
      .single();

    if (dealError) throw dealError;

    // Create notification
    const { error: notificationError } = await supabaseClient
      .from('notifications')
      .insert([{
        user_id: deal.investor_id,
        type: 'deal_completed',
        deal_id: dealId,
        message: `Your deal analysis for ${deal.address} is complete.`,
        read: false
      }]);

    if (notificationError) throw notificationError;

    // In a real app, you would send an email/SMS here using a service like SendGrid/Twilio
    console.log(`Notification sent to investor ${deal.investor.email}`);

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('Error sending notification:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});