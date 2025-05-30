-- Remove test lead from client pipeline
DELETE FROM client_pipeline
WHERE email = 'test@test.com';

-- Remove any associated contact requests
DELETE FROM contact_requests 
WHERE email = 'test@test.com';

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

-- Create audit log entry with system user ID
INSERT INTO audit_logs (
  user_id,
  action,
  changes
) VALUES (
  '00000000-0000-0000-0000-000000000000'::uuid,  -- System user ID
  'delete',
  jsonb_build_object(
    'table', 'client_pipeline',
    'email', 'test@test.com',
    'reason', 'Cleanup of test data'
  )
);