-- Add deleted_at column to contact_requests if it doesn't exist
ALTER TABLE contact_requests 
ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_contact_requests_deleted_at ON contact_requests(deleted_at);

-- Update RLS policies to exclude deleted records
DROP POLICY IF EXISTS "Analysts can view contact requests" ON contact_requests;
CREATE POLICY "Analysts can view contact requests"
  ON contact_requests
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'analyst'
    )
    AND deleted_at IS NULL
  );