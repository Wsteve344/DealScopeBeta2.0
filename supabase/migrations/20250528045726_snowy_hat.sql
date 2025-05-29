/*
  # Fix contact request permissions

  1. Changes
    - Add policy to allow public users to create contact requests
    - Add policy to allow users to read their own contact requests
    - Add policy to allow analysts to view and update contact requests

  2. Security
    - Enable RLS on contact_requests table
    - Add appropriate policies for public and authenticated users
*/

-- Enable RLS
ALTER TABLE contact_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Anyone can create contact requests" ON contact_requests;
  DROP POLICY IF EXISTS "Users can read their own contact requests" ON contact_requests;
  DROP POLICY IF EXISTS "Analysts can view contact requests" ON contact_requests;
  DROP POLICY IF EXISTS "Analysts can update contact requests" ON contact_requests;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Create new policies
CREATE POLICY "Anyone can create contact requests"
  ON contact_requests
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Users can read their own contact requests"
  ON contact_requests
  FOR SELECT
  TO public
  USING (email = current_setting('request.jwt.claims')::json->>'email');

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
  );