-- Drop existing policies to recreate them with permanent deletion support
DO $$ BEGIN
  DROP POLICY IF EXISTS "Analysts can update contact requests" ON contact_requests;
  DROP POLICY IF EXISTS "Analysts can create contact requests" ON contact_requests;
  DROP POLICY IF EXISTS "Analysts can soft delete contact requests" ON contact_requests;
  DROP POLICY IF EXISTS "Analysts can view contact requests" ON contact_requests;
  DROP POLICY IF EXISTS "Anyone can create contact requests" ON contact_requests;
  DROP POLICY IF EXISTS "Users can read their own contact requests" ON contact_requests;
  DROP POLICY IF EXISTS "Analysts can delete contact requests" ON contact_requests;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Create comprehensive policies including permanent deletion

-- Allow analysts to view contact requests
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
);

-- Allow analysts to create contact requests manually
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

-- Allow analysts to permanently delete contact requests
CREATE POLICY "Analysts can delete contact requests"
ON contact_requests
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'analyst'
  )
);

-- Allow public users to create contact requests through the contact form
CREATE POLICY "Anyone can create contact requests"
ON contact_requests
FOR INSERT
TO public
WITH CHECK (true);

-- Allow users to view their own contact requests
CREATE POLICY "Users can read their own contact requests"
ON contact_requests
FOR SELECT
TO public
USING (
  email = current_setting('request.jwt.claims')::json->>'email'
);