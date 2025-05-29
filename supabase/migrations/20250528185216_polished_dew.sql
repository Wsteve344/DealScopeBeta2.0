-- Create a function to clean up duplicate deals
CREATE OR REPLACE FUNCTION cleanup_duplicate_deals()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Keep only the earliest submission for each address and mark others as deleted
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

-- Execute the cleanup
SELECT cleanup_duplicate_deals();

-- Drop the function since we only need it once
DROP FUNCTION cleanup_duplicate_deals();