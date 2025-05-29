/*
  # Contact Management System
  
  1. New Tables
    - contact_requests
      - id (uuid, primary key)
      - name (text)
      - email (text)
      - phone (text)
      - message (text)
      - status (enum: pending, in_progress, completed)
      - assigned_to (uuid, references auth.users)
      - timestamps
    
    - contact_notes
      - id (uuid, primary key)
      - request_id (uuid, references contact_requests)
      - user_id (uuid, references auth.users)
      - content (text)
      - created_at (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for analyst access
*/

-- Check if enum type exists before creating
DO $$ BEGIN
  CREATE TYPE contact_request_status AS ENUM ('pending', 'in_progress', 'completed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Contact requests table
CREATE TABLE IF NOT EXISTS contact_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  message text NOT NULL,
  status contact_request_status DEFAULT 'pending',
  assigned_to uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE contact_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ BEGIN
  DROP POLICY IF EXISTS "Analysts can view contact requests" ON contact_requests;
  DROP POLICY IF EXISTS "Analysts can update contact requests" ON contact_requests;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Create new policies
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

-- Contact notes table
CREATE TABLE IF NOT EXISTS contact_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES contact_requests(id),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE contact_notes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ BEGIN
  DROP POLICY IF EXISTS "Analysts can view contact notes" ON contact_notes;
  DROP POLICY IF EXISTS "Analysts can create contact notes" ON contact_notes;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Create new policies
CREATE POLICY "Analysts can view contact notes"
  ON contact_notes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'analyst'
    )
  );

CREATE POLICY "Analysts can create contact notes"
  ON contact_notes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'analyst'
    )
  );

-- Add trigger for updated_at on contact_requests
DO $$ BEGIN
  DROP TRIGGER IF EXISTS update_contact_requests_updated_at ON contact_requests;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

CREATE TRIGGER update_contact_requests_updated_at
  BEFORE UPDATE ON contact_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_contact_requests_status ON contact_requests(status);
CREATE INDEX IF NOT EXISTS idx_contact_requests_assigned_to ON contact_requests(assigned_to);
CREATE INDEX IF NOT EXISTS idx_contact_notes_request_id ON contact_notes(request_id);