-- Drop existing functions with the same name but different signatures
DROP FUNCTION IF EXISTS delete_deal(uuid);
DROP FUNCTION IF EXISTS delete_deal(uuid, uuid);

-- Create the updated function with proper transaction handling
CREATE OR REPLACE FUNCTION delete_deal(
  p_deal_id uuid,
  p_user_id uuid
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
    WHERE id = p_deal_id 
    AND investor_id = p_user_id
    AND deleted_at IS NULL
  ) INTO is_owner;

  IF NOT is_owner THEN
    RAISE EXCEPTION 'Deal not found or user is not the owner';
  END IF;

  -- Soft delete the deal and related records
  UPDATE deals
  SET deleted_at = NOW()
  WHERE id = p_deal_id;

  -- Soft delete related deal sections
  UPDATE deal_sections
  SET deleted_at = NOW()
  WHERE deal_id = p_deal_id
  AND deleted_at IS NULL;

  -- Create audit log entry
  INSERT INTO audit_logs (
    user_id,
    deal_id,
    action,
    changes
  ) VALUES (
    p_user_id,
    p_deal_id,
    'delete',
    jsonb_build_object(
      'deal_id', p_deal_id,
      'deleted_at', NOW()::text
    )
  );
END;
$$;