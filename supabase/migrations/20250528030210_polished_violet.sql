/*
  # Add Stripe order status enum

  1. Changes
    - Add stripe_order_status enum for tracking order statuses
    - Add safe check for existing stripe_subscription_status enum

  2. Notes
    - Uses DO block to safely check for existing enum
    - Ensures idempotent creation of enums
*/

DO $$ 
BEGIN
  -- Create stripe_subscription_status enum if it doesn't exist
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

  -- Create stripe_order_status enum if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'stripe_order_status') THEN
    CREATE TYPE stripe_order_status AS ENUM (
      'pending',
      'completed',
      'canceled'
    );
  END IF;
END $$;