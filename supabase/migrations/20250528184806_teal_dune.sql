-- Drop all dependent triggers first
DROP TRIGGER IF EXISTS update_deal_sections_updated_at ON deal_sections;
DROP TRIGGER IF EXISTS update_contact_requests_updated_at ON contact_requests;
DROP TRIGGER IF EXISTS update_client_pipeline_updated_at ON client_pipeline;
DROP TRIGGER IF EXISTS update_deals_updated_at ON deals;

-- Now we can safely drop and recreate the function
DROP FUNCTION IF EXISTS update_updated_at();

-- Create a new trigger function that checks for column existence
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger AS $$
BEGIN
  -- Check if the table has an updated_at column
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = TG_TABLE_SCHEMA
    AND table_name = TG_TABLE_NAME
    AND column_name = 'updated_at'
  ) THEN
    NEW.updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate triggers only for tables that have updated_at column
DO $$
BEGIN
  -- Recreate trigger for deal_sections
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'deal_sections' 
    AND column_name = 'updated_at'
  ) THEN
    CREATE TRIGGER update_deal_sections_updated_at
      BEFORE UPDATE ON deal_sections
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at();
  END IF;

  -- Recreate trigger for contact_requests
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'contact_requests' 
    AND column_name = 'updated_at'
  ) THEN
    CREATE TRIGGER update_contact_requests_updated_at
      BEFORE UPDATE ON contact_requests
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at();
  END IF;

  -- Recreate trigger for client_pipeline
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'client_pipeline' 
    AND column_name = 'updated_at'
  ) THEN
    CREATE TRIGGER update_client_pipeline_updated_at
      BEFORE UPDATE ON client_pipeline
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;