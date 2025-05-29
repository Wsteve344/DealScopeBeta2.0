/*
  # Fix client pipeline RLS policies

  1. Changes
    - Add RLS policy to allow analysts to insert into client_pipeline table
    - Add policy to allow analysts to view all pipeline entries

  2. Security
    - Enable RLS on client_pipeline table
    - Add policies for analysts to manage pipeline data
*/

-- Enable RLS
ALTER TABLE client_pipeline ENABLE ROW LEVEL SECURITY;

-- Allow analysts to insert new pipeline entries
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

-- Allow analysts to view all pipeline entries
CREATE POLICY "Analysts can view all pipeline entries"
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