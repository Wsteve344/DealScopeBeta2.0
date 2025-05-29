-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Analysts can soft delete contact requests" ON contact_requests;

-- Add policy to allow analysts to soft delete contact requests
CREATE POLICY "Analysts can soft delete contact requests"
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