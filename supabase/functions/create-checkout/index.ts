import { createClient } from 'npm:@supabase/supabase-js@2.39.7';
import Stripe from 'npm:stripe@14.18.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '');
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

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
    const { priceId, customerId, mode } = await req.json();

    if (!priceId || !customerId || !mode) {
      throw new Error('Missing required parameters: priceId, customerId, or mode');
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get or create Stripe customer
    let stripeCustomerId;
    const { data: customerData, error: customerError } = await supabase
      .from('stripe_customers')
      .select('customer_id')
      .eq('user_id', customerId)
      .single();

    if (customerError && customerError.code !== 'PGRST116') {
      throw new Error(`Failed to fetch customer: ${customerError.message}`);
    }

    if (customerData) {
      stripeCustomerId = customerData.customer_id;
    } else {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('email')
        .eq('id', customerId)
        .single();

      if (userError) {
        throw new Error(`Failed to fetch user data: ${userError.message}`);
      }

      if (!userData?.email) {
        throw new Error('User email not found');
      }

      const customer = await stripe.customers.create({
        email: userData.email,
        metadata: {
          supabase_user_id: customerId
        }
      });

      const { error: insertError } = await supabase
        .from('stripe_customers')
        .insert([{
          user_id: customerId,
          customer_id: customer.id
        }]);

      if (insertError) {
        throw new Error(`Failed to save customer: ${insertError.message}`);
      }

      stripeCustomerId = customer.id;
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: mode as Stripe.Checkout.SessionCreateParams.Mode,
      success_url: `${req.headers.get('origin')}/thank-you`,
      cancel_url: `${req.headers.get('origin')}/credits/purchase`,
      automatic_tax: { enabled: true },
      customer_update: {
        address: 'auto',
        name: 'auto'
      },
      billing_address_collection: 'required',
      payment_method_types: ['card']
    });

    return new Response(
      JSON.stringify({ url: session.url }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('Checkout error:', error);
    
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