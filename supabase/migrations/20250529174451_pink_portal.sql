-- Create a temporary table to store the system user ID
CREATE TEMP TABLE IF NOT EXISTS temp_system_user (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid()
);

-- Insert system user ID if not exists
INSERT INTO temp_system_user (id)
SELECT gen_random_uuid()
WHERE NOT EXISTS (SELECT 1 FROM temp_system_user);

-- Remove test lead from client pipeline and log the action
WITH deleted_leads AS (
    DELETE FROM client_pipeline
    WHERE email = 'test@test.com'
    RETURNING *
)
INSERT INTO audit_logs (
    id,
    user_id,
    action,
    changes,
    created_at
)
SELECT 
    gen_random_uuid(),
    (SELECT id FROM temp_system_user LIMIT 1),
    'delete',
    jsonb_build_object(
        'table', 'client_pipeline',
        'email', 'test@test.com',
        'reason', 'Cleanup of test data'
    ),
    now()
FROM deleted_leads;

-- Remove any associated contact requests
DELETE FROM contact_requests 
WHERE email = 'test@test.com';

-- Add unique constraint if not exists
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

-- Clean up temporary table
DROP TABLE IF EXISTS temp_system_user;