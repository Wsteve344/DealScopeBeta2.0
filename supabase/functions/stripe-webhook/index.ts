import { createClient } from 'npm:@supabase/supabase-js@2.39.7';
import Stripe from 'npm:stripe@14.18.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '');
const endpointSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '';
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
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      throw new Error('No signature found');
    }

    const body = await req.text();
    const event = stripe.webhooks.constructEvent(body, signature, endpointSecret);

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const customerId = session.customer;
        const userId = session.client_reference_id;

        if (!userId) {
          throw new Error('No user ID provided in client_reference_id');
        }

        // Update orders table
        await supabase
          .from('stripe_orders')
          .insert([{
            checkout_session_id: session.id,
            payment_intent_id: session.payment_intent,
            customer_id: customerId,
            amount_subtotal: session.amount_subtotal,
            amount_total: session.amount_total,
            currency: session.currency,
            payment_status: session.payment_status,
            status: 'completed'
          }]);

        // If subscription, update subscriptions table with user_id
        if (session.mode === 'subscription') {
          await supabase
            .from('stripe_subscriptions')
            .upsert([{
              customer_id: customerId,
              user_id: userId, // Add user_id to link with users table
              subscription_id: session.subscription,
              price_id: session.line_items?.data[0]?.price?.id,
              status: 'active'
            }], {
              onConflict: 'customer_id'
            });
        }

        // Add credits based on the product purchased
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
        for (const item of lineItems.data) {
          const product = await stripe.products.retrieve(item.price?.product as string);
          const credits = parseInt(product.metadata.credits || '0');
          
          if (credits > 0) {
            const { data: wallet } = await supabase
              .from('credit_wallets')
              .select('credits')
              .eq('user_id', userId)
              .single();

            await supabase
              .from('credit_wallets')
              .upsert([{
                user_id: userId,
                credits: (wallet?.credits || 0) + credits
              }]);

            // Record the transaction
            await supabase
              .from('credit_transactions')
              .insert([{
                user_id: userId,
                amount: credits,
                type: 'purchase',
                payment_intent_id: session.payment_intent,
                status: 'completed'
              }]);
          }
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        
        // Get the user_id from existing subscription
        const { data: existingSubscription } = await supabase
          .from('stripe_subscriptions')
          .select('user_id')
          .eq('subscription_id', subscription.id)
          .single();

        if (!existingSubscription?.user_id) {
          throw new Error('No user_id found for subscription');
        }

        await supabase
          .from('stripe_subscriptions')
          .update({
            status: subscription.status,
            current_period_start: subscription.current_period_start,
            current_period_end: subscription.current_period_end,
            cancel_at_period_end: subscription.cancel_at_period_end,
            payment_method_brand: subscription.default_payment_method?.card?.brand,
            payment_method_last4: subscription.default_payment_method?.card?.last4
          })
          .eq('subscription_id', subscription.id);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        await supabase
          .from('stripe_subscriptions')
          .update({
            status: 'canceled',
            deleted_at: new Date().toISOString()
          })
          .eq('subscription_id', subscription.id);
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
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