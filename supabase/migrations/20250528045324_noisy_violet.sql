/*
  # Client Pipeline Schema Update
  
  1. New Tables
    - `client_pipeline` table for tracking leads through the sales funnel
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `email` (text)
      - `status` (client_pipeline_status enum)
      - Various tracking fields (source, timestamps, metadata)
  
  2. Security
    - Enable RLS on client_pipeline table
    - Add policies for analyst access
    
  3. Performance
    - Add indexes for common query patterns
    - Add trigger for updated_at timestamp
*/

-- Create client pipeline status enum if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'client_pipeline_status') THEN
    CREATE TYPE client_pipeline_status AS ENUM (
      'lead',
      'signup',
      'trial',
      'checkout_started',
      'paying_customer',
      'churned'
    );
  END IF;
END $$;

-- Client pipeline table
CREATE TABLE IF NOT EXISTS client_pipeline (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  email text NOT NULL,
  status client_pipeline_status NOT NULL DEFAULT 'lead',
  source text,
  converted_from text,
  converted_at timestamptz DEFAULT now(),
  last_activity timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_client_pipeline_user_id ON client_pipeline(user_id);
CREATE INDEX IF NOT EXISTS idx_client_pipeline_email ON client_pipeline(email);
CREATE INDEX IF NOT EXISTS idx_client_pipeline_status ON client_pipeline(status);

-- Enable RLS
ALTER TABLE client_pipeline ENABLE ROW LEVEL SECURITY;

-- Create policies
DO $$ 
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Analysts can view pipeline data" ON client_pipeline;
  DROP POLICY IF EXISTS "Analysts can insert pipeline entries" ON client_pipeline;
  DROP POLICY IF EXISTS "Analysts can update pipeline entries" ON client_pipeline;
END $$;

-- Create new policies
CREATE POLICY "Analysts can view pipeline data"
  ON client_pipeline
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'analyst'
    )
  );

CREATE POLICY "Analysts can insert pipeline entries"
  ON client_pipeline
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'analyst'
    )
  );

CREATE POLICY "Analysts can update pipeline entries"
  ON client_pipeline
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

-- Drop trigger if exists and recreate
DO $$
BEGIN
  DROP TRIGGER IF EXISTS update_client_pipeline_updated_at ON client_pipeline;
  CREATE TRIGGER update_client_pipeline_updated_at
    BEFORE UPDATE ON client_pipeline
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Create function to update pipeline status
CREATE OR REPLACE FUNCTION update_pipeline_status(
  p_user_id uuid,
  p_email text,
  p_status client_pipeline_status,
  p_source text DEFAULT NULL,
  p_metadata jsonb DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO client_pipeline (user_id, email, status, source, metadata)
  VALUES (p_user_id, p_email, p_status, p_source, p_metadata)
  ON CONFLICT (user_id) DO UPDATE
  SET 
    status = p_status,
    converted_from = client_pipeline.status,
    converted_at = now(),
    last_activity = now(),
    metadata = COALESCE(p_metadata, client_pipeline.metadata);
END;
$$ LANGUAGE plpgsql;