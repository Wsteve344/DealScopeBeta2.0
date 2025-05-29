-- Drop existing policies to start fresh
DO $$ BEGIN
  DROP POLICY IF EXISTS "Analysts can update contact requests" ON contact_requests;
  DROP POLICY IF EXISTS "Analysts can create contact requests" ON contact_requests;
  DROP POLICY IF EXISTS "Analysts can soft delete contact requests" ON contact_requests;
  DROP POLICY IF EXISTS "Analysts can view contact requests" ON contact_requests;
  DROP POLICY IF EXISTS "Anyone can create contact requests" ON contact_requests;
  DROP POLICY IF EXISTS "Users can read their own contact requests" ON contact_requests;
  DROP POLICY IF EXISTS "Analysts can delete contact requests" ON contact_requests;
  DROP POLICY IF EXISTS "Analysts can delete contact notes" ON contact_notes;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Add ON DELETE CASCADE to contact_notes foreign key
ALTER TABLE contact_notes 
DROP CONSTRAINT IF EXISTS contact_notes_request_id_fkey,
ADD CONSTRAINT contact_notes_request_id_fkey 
  FOREIGN KEY (request_id) 
  REFERENCES contact_requests(id) 
  ON DELETE CASCADE;

-- Create comprehensive policies for contact requests

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

-- Create policy for contact notes deletion
CREATE POLICY "Analysts can delete contact notes"
ON contact_notes
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'analyst'
  )
);