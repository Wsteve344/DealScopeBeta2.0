-- Add policy to allow public users to create contact requests
CREATE POLICY "Anyone can create contact requests"
  ON contact_requests
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Add policy to allow public users to read their own contact requests
CREATE POLICY "Users can read their own contact requests"
  ON contact_requests
  FOR SELECT
  TO public
  USING (email = current_setting('request.jwt.claims')::json->>'email');