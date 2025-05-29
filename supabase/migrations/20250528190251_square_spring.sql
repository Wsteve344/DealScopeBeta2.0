-- Remove duplicates from contact_requests before adding unique constraint
DELETE FROM contact_requests a USING contact_requests b
WHERE a.id > b.id 
AND a.email = b.email;

-- Remove duplicates from client_pipeline before adding unique constraint
DELETE FROM client_pipeline a USING client_pipeline b
WHERE a.id > b.id 
AND a.email = b.email;

-- Add unique constraint to prevent duplicate contacts
ALTER TABLE contact_requests
ADD CONSTRAINT contact_requests_email_unique UNIQUE (email);

-- Add unique constraint to prevent duplicate pipeline entries
ALTER TABLE client_pipeline
ADD CONSTRAINT client_pipeline_email_unique UNIQUE (email);

-- Drop existing triggers and functions if they exist
DROP TRIGGER IF EXISTS contact_request_assignment_trigger ON contact_requests;
DROP TRIGGER IF EXISTS sync_contact_to_pipeline_trigger ON contact_requests;
DROP FUNCTION IF EXISTS handle_contact_request_assignment();
DROP FUNCTION IF EXISTS sync_contact_to_pipeline();

-- Add trigger function for contact request assignment
CREATE OR REPLACE FUNCTION handle_contact_request_assignment()
RETURNS trigger AS $$
BEGIN
  -- When a contact request is assigned to an analyst
  IF NEW.assigned_to IS NOT NULL AND OLD.assigned_to IS NULL THEN
    -- Create a notification for the assigned analyst
    INSERT INTO notifications (
      user_id,
      type,
      message
    ) VALUES (
      NEW.assigned_to,
      'contact_assigned',
      format('You have been assigned to contact request from %s', NEW.name)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for contact request assignment
CREATE TRIGGER contact_request_assignment_trigger
  AFTER UPDATE ON contact_requests
  FOR EACH ROW
  EXECUTE FUNCTION handle_contact_request_assignment();

-- Add function to sync contact to pipeline
CREATE OR REPLACE FUNCTION sync_contact_to_pipeline()
RETURNS trigger AS $$
BEGIN
  -- When a contact request is completed, add to pipeline if not exists
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    INSERT INTO client_pipeline (
      email,
      status,
      source,
      metadata
    ) VALUES (
      NEW.email,
      'lead',
      'contact_form',
      jsonb_build_object(
        'name', NEW.name,
        'phone', NEW.phone,
        'message', NEW.message
      )
    )
    ON CONFLICT (email) 
    DO UPDATE SET
      metadata = EXCLUDED.metadata,
      updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for pipeline sync
CREATE TRIGGER sync_contact_to_pipeline_trigger
  AFTER UPDATE ON contact_requests
  FOR EACH ROW
  EXECUTE FUNCTION sync_contact_to_pipeline();