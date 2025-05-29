/*
  # Create Stripe status enums

  1. New Types
    - `stripe_subscription_status` enum for subscription states
    - `stripe_order_status` enum for order states

  2. Changes
    - Safe creation of enum types with existence check
*/

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'stripe_subscription_status') THEN
        CREATE TYPE stripe_subscription_status AS ENUM (
            'not_started',
            'incomplete',
            'incomplete_expired',
            'trialing',
            'active',
            'past_due',
            'canceled',
            'unpaid',
            'paused'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'stripe_order_status') THEN
        CREATE TYPE stripe_order_status AS ENUM (
            'pending',
            'completed',
            'canceled'
        );
    END IF;
END $$;