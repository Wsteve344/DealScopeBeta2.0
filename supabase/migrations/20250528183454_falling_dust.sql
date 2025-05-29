/*
  # Fix delete_deal RPC function

  1. Changes
    - Rewrites the delete_deal function to properly handle transactions
    - Adds proper error handling and transaction management
    - Implements soft delete for deals and related records
    - Validates user permissions before deletion

  2. Security
    - Checks if the user is the owner of the deal
    - Only allows deletion of non-deleted deals
*/

-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS delete_deal;

-- Create the updated function with proper transaction handling
CREATE OR REPLACE FUNCTION delete_deal(
  deal_id uuid,
  user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deal_exists boolean;
  is_owner boolean;
BEGIN
  -- Check if deal exists and user is the owner
  SELECT EXISTS (
    SELECT 1 
    FROM deals 
    WHERE id = deal_id 
    AND investor_id = user_id
    AND deleted_at IS NULL
  ) INTO is_owner;

  IF NOT is_owner THEN
    RAISE EXCEPTION 'Deal not found or user is not the owner';
  END IF;

  -- Soft delete the deal and related records
  UPDATE deals
  SET deleted_at = NOW()
  WHERE id = deal_id;

  -- Soft delete related deal sections
  UPDATE deal_sections
  SET deleted_at = NOW()
  WHERE deal_id = deal_id
  AND deleted_at IS NULL;

  -- Create audit log entry
  INSERT INTO audit_logs (
    user_id,
    deal_id,
    action,
    changes
  ) VALUES (
    user_id,
    deal_id,
    'delete',
    jsonb_build_object(
      'deal_id', deal_id,
      'deleted_at', NOW()::text
    )
  );
END;
$$;