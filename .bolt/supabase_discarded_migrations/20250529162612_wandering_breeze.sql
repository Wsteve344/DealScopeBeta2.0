-- Remove test lead from client pipeline
DELETE FROM client_pipeline
WHERE email = 'test@test.com'
  OR name = 'Test';

-- Remove any associated contact requests
DELETE FROM contact_requests 
WHERE email = 'test@test.com'
  OR name = 'Test';

-- Add unique constraint if not exists to prevent duplicate emails
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conname = 'client_pipeline_email_unique'
  ) THEN
    ALTER TABLE client_pipeline
    ADD CONSTRAINT client_pipeline_email_unique UNIQUE (email);
  END IF;
END $$;

-- Create audit log entry
INSERT INTO audit_logs (
  user_id,
  action,
  changes
) VALUES (
  auth.uid(),
  'delete',
  jsonb_build_object(
    'table', 'client_pipeline',
    'email', 'test@test.com',
    'reason', 'Cleanup of test data'
  )
);