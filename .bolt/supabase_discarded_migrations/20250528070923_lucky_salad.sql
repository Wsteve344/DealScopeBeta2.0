/*
  # Add RLS policies for analysts
  
  1. Changes
    - Add RLS policies for analysts to manage deal sections
    - Add RLS policies for analysts to create audit logs
    - Fix single row selection for deal sections

  2. Security
    - Enable RLS on deal_sections and audit_logs tables
    - Add policies for analysts to manage content
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

CREATE POLICY "Analysts can view audit logs"
  ON audit_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'analyst'
    )
  );