import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

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
    const { userId } = await req.json();

    if (!userId) {
      throw new Error('User ID is required');
    }

    // Initialize Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Delete dependent records first to avoid foreign key constraints
    // Order matters: delete from children tables before parent tables

    // Tables referencing auth.users(id) or public.users(id)
    await supabase.from('notifications').delete().eq('user_id', userId);
    await supabase.from('audit_logs').delete().eq('user_id', userId);
    await supabase.from('pdf_versions').delete().eq('generated_by', userId);
    await supabase.from('user_preferences').delete().eq('user_id', userId);
    await supabase.from('contact_notes').delete().eq('user_id', userId);
    await supabase.from('appointments').delete().eq('analyst_id', userId);
    await supabase.from('client_pipeline').delete().eq('user_id', userId);
    await supabase.from('analytics_sessions').delete().eq('user_id', userId);
    await supabase.from('analytics_page_views').delete().eq('user_id', userId);
    await supabase.from('analytics_events').delete().eq('user_id', userId);
    await supabase.from('credit_wallets').delete().eq('user_id', userId);
    await supabase.from('credit_transactions').delete().eq('user_id', userId);
    await supabase.from('stripe_customers').delete().eq('user_id', userId);
    await supabase.from('stripe_subscriptions').delete().eq('user_id', userId);
    await supabase.from('deals').delete().eq('investor_id', userId);
    await supabase.from('messages').delete().eq('user_id', userId); // References public.users

    // Special case: contact_requests.assigned_to references auth.users(id)
    // Nullify assigned_to for contact requests assigned to the user being deleted.
    await supabase.from('contact_requests').update({ assigned_to: null }).eq('assigned_to', userId);

    // Now delete from public.users
    await supabase.from('users').delete().eq('id', userId);

    // Finally, delete the user from Supabase Auth
    const { error: authDeleteError } = await supabase.auth.admin.deleteUser(userId);
    if (authDeleteError) {
      throw new Error(`Failed to delete user from auth: ${authDeleteError.message}`);
    }

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
    console.error('Error deleting user:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
        details: error instanceof Error ? error.stack : undefined
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});