-- Step 1: Recreate the create_audit_log function to be more robust
-- This handles cases where columns might not exist in NEW/OLD records
-- by safely accessing them via jsonb, preventing "record has no field" errors.
CREATE OR REPLACE FUNCTION create_audit_log()
RETURNS trigger AS $$
DECLARE
  v_deal_id uuid;
  v_new_jsonb jsonb;
  v_old_jsonb jsonb;
BEGIN
  -- Convert NEW and OLD records to jsonb for safe field access
  -- This avoids direct access to NEW.column_name which can fail if the column doesn't exist
  IF TG_OP != 'DELETE' THEN
    v_new_jsonb := to_jsonb(NEW);
  END IF;
  IF TG_OP != 'INSERT' THEN
    v_old_jsonb := to_jsonb(OLD);
  END IF;

  -- Determine deal_id based on the table
  -- Use ->> operator which returns NULL if the key does not exist
  IF TG_TABLE_NAME = 'deals' THEN
    v_deal_id := v_new_jsonb ->> 'id';
  ELSIF TG_TABLE_NAME = 'deal_sections' THEN
    v_deal_id := v_new_jsonb ->> 'deal_id';
  ELSE
    v_deal_id := NULL;
  END IF;

  -- Insert into audit_logs
  INSERT INTO audit_logs (user_id, deal_id, action, changes)
  VALUES (
    auth.uid(), -- Assuming auth.uid() is available and valid in this context
    v_deal_id,
    CASE
      WHEN TG_OP = 'INSERT' THEN 'create'
      WHEN TG_OP = 'UPDATE' THEN 'update'
      WHEN TG_OP = 'DELETE' THEN 'delete'
    END,
    jsonb_build_object(
      'table', TG_TABLE_NAME,
      'old_data', v_old_jsonb,
      'new_data', v_new_jsonb
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Drop the cleanup function if it exists from previous attempts
DROP FUNCTION IF EXISTS cleanup_duplicate_deals();

-- Step 3: Create a function to clean up duplicate deals
CREATE OR REPLACE FUNCTION cleanup_duplicate_deals()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Keep only the earliest submission for each address and mark others as deleted
  -- The audit trigger will now handle the update correctly
  WITH duplicates AS (
    SELECT id,
           address,
           created_at,
           ROW_NUMBER() OVER (
             PARTITION BY address
             ORDER BY created_at ASC
           ) as rn
    FROM deals
    WHERE deleted_at IS NULL
  )
  UPDATE deals
  SET deleted_at = NOW()
  FROM duplicates
  WHERE deals.id = duplicates.id
  AND duplicates.rn > 1;

  -- Also clean up any orphaned deal sections
  -- The audit trigger will now handle the update correctly
  UPDATE deal_sections
  SET deleted_at = NOW()
  WHERE deal_id IN (
    SELECT id
    FROM deals
    WHERE deleted_at IS NOT NULL
  )
  AND deleted_at IS NULL;
END;
$$;

-- Step 4: Execute the cleanup
SELECT cleanup_duplicate_deals();

-- Step 5: Drop the cleanup function since we only need it once
DROP FUNCTION cleanup_duplicate_deals();

