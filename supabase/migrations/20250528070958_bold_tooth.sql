/*
  # Add analyst policies for deal sections and audit logs
  
  1. New Policies
    - Allow analysts to manage all deal sections
    - Allow analysts to create audit logs
  
  2. Changes
    - Add RLS policy for deal sections management
    - Add RLS policy for audit log creation
    
  Note: Removed duplicate "Analysts can view audit logs" policy since it already exists
*/

-- Deal Sections policies
CREATE POLICY "Analysts can manage all deal sections"
  ON deal_sections
  FOR ALL
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

-- Audit Logs policies
CREATE POLICY "Analysts can create audit logs"
  ON audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'analyst'
    )
  );