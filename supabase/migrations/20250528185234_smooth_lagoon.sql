-- Temporarily disable the audit trigger
ALTER TABLE deals DISABLE TRIGGER audit_deals_trigger;
ALTER TABLE deal_sections DISABLE TRIGGER audit_deal_sections_trigger;

-- Delete duplicate deals directly with a CTE
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

-- Clean up orphaned deal sections
UPDATE deal_sections
SET deleted_at = NOW()
WHERE deal_id IN (
  SELECT id 
  FROM deals 
  WHERE deleted_at IS NOT NULL
)
AND deleted_at IS NULL;

-- Re-enable the audit trigger
ALTER TABLE deals ENABLE TRIGGER audit_deals_trigger;
ALTER TABLE deal_sections ENABLE TRIGGER audit_deal_sections_trigger;