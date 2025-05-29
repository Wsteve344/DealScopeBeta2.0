/*
  # Create Stripe Enums
  
  1. New Types
    - stripe_subscription_status: Enum for subscription states
    - stripe_order_status: Enum for order states
  
  2. Changes
    - Creates required enum types before table creation
*/

-- Create ENUMs only if they don't exist
DO $$ 
BEGIN
  -- Create subscription status enum if it doesn't exist
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

  -- Create order status enum if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'stripe_order_status') THEN
    CREATE TYPE stripe_order_status AS ENUM (
        'pending',
        'completed',
        'canceled'
    );
  END IF;
END $$;