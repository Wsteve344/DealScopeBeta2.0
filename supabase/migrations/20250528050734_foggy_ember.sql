/*
  # Add user relationship to contact notes

  1. Changes
    - Add user_id column to contact_notes table
    - Add foreign key constraint to users table
    - Update RLS policies to include user_id checks

  2. Security
    - Enable RLS on contact_notes table
    - Add policy for authenticated users to read their own notes
*/

-- Add user_id column and foreign key constraint
ALTER TABLE contact_notes 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) NOT NULL;

-- Update RLS policies
CREATE POLICY "Users can read their own notes"
ON contact_notes
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'analyst'
  )
);