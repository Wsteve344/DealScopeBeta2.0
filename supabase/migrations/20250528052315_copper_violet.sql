-- Create client pipeline status enum if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'client_pipeline_status') THEN
    CREATE TYPE client_pipeline_status AS ENUM (
      'lead',
      'signup',
      'trial',
      'checkout_started',
      'paying_customer',
      'churned'
    );
  END IF;
END $$;

-- Add unique constraint to client_pipeline email
ALTER TABLE client_pipeline
ADD CONSTRAINT client_pipeline_email_key UNIQUE (email);

-- Add function to handle contact request assignment
CREATE OR REPLACE FUNCTION handle_contact_request_assignment()
RETURNS trigger AS $$
BEGIN
  -- When a contact request is marked as completed
  IF (TG_OP = 'UPDATE' AND NEW.status = 'completed' AND OLD.status != 'completed') THEN
    -- Add to pipeline as lead if not already exists
    INSERT INTO client_pipeline (
      email,
      status,
      source,
      metadata
    )
    VALUES (
      NEW.email,
      'lead',
      'contact_form',
      jsonb_build_object(
        'name', NEW.name,
        'phone', NEW.phone,
        'initial_message', NEW.message,
        'contact_request_id', NEW.id
      )
    )
    ON CONFLICT (email) DO UPDATE
    SET
      last_activity = now(),
      metadata = jsonb_build_object(
        'name', NEW.name,
        'phone', NEW.phone,
        'initial_message', NEW.message,
        'contact_request_id', NEW.id
      );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for contact request assignment
DROP TRIGGER IF EXISTS contact_request_assignment_trigger ON contact_requests;
CREATE TRIGGER contact_request_assignment_trigger
  AFTER UPDATE ON contact_requests
  FOR EACH ROW
  EXECUTE FUNCTION handle_contact_request_assignment();