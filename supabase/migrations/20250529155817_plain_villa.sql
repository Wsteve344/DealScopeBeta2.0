-- Drop existing policies if they exist
DO $$ BEGIN
  DROP POLICY IF EXISTS "Analysts can update contact requests" ON contact_requests;
  DROP POLICY IF EXISTS "Analysts can create contact requests" ON contact_requests;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Add policy for analysts to update contact requests (including soft delete)
CREATE POLICY "Analysts can update contact requests"
ON contact_requests
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'analyst'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'analyst'
  )
);

-- Add policy for analysts to create contact requests manually
CREATE POLICY "Analysts can create contact requests"
ON contact_requests
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'analyst'
  )
);