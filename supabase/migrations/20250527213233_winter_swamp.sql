/*
  # Add phone number to users table

  1. Changes
    - Add phone_number column to users table
    - Update RLS policies to include phone number
*/

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS phone_number text;

-- Update existing policies to include phone number
CREATE POLICY "Users can update own phone number"
    ON users
    FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());