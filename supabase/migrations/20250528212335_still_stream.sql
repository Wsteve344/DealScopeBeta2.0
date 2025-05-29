/*
  # Add user_id to stripe_subscriptions table

  1. Changes
    - Add user_id column to stripe_subscriptions table
    - Add foreign key constraint to users table
    - Add index for performance
    - Update existing subscriptions to link with users via stripe_customers table
  
  2. Security
    - Maintain existing RLS policies
*/

-- Add user_id column
ALTER TABLE stripe_subscriptions 
ADD COLUMN user_id uuid REFERENCES auth.users(id);

-- Create index for performance
CREATE INDEX idx_stripe_subscriptions_user_id ON stripe_subscriptions(user_id);

-- Update existing subscriptions with user_id from stripe_customers
UPDATE stripe_subscriptions
SET user_id = stripe_customers.user_id
FROM stripe_customers
WHERE stripe_subscriptions.customer_id = stripe_customers.customer_id;