/*
  # Add foreign key constraint to credit_wallets table

  1. Changes
    - Add foreign key constraint between credit_wallets.user_id and users.id
    - This enables proper joining between users and credit_wallets tables
    - Ensures referential integrity for credit wallet records

  2. Security
    - ON DELETE CASCADE ensures child records are removed when a user is deleted
    - Maintains data consistency
*/

-- Add foreign key constraint
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'credit_wallets_user_id_fkey'
  ) THEN
    ALTER TABLE credit_wallets 
    ADD CONSTRAINT credit_wallets_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES users(id) 
    ON DELETE CASCADE;
  END IF;
END $$;