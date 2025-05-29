/*
  # Create Stripe status enums

  1. New Types
    - `stripe_subscription_status` enum for subscription statuses
    - `stripe_order_status` enum for order statuses
  
  2. Changes
    - Added DO blocks to check if types exist before creating
    - Safe creation of enums that handles existing types
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
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'stripe_order_status') THEN
        CREATE TYPE stripe_order_status AS ENUM (
            'pending',
            'completed',
            'canceled'
        );
    END IF;
END $$;