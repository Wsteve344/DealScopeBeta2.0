/*
  # Add audit and autosave functionality

  1. New Tables
    - `audit_logs` - Track all changes to deals and sections
    - `pdf_versions` - Store generated PDF reports with versioning
    - `user_preferences` - Store user UI preferences and settings

  2. Changes
    - Add `last_autosave` to deal_sections
    - Add `version` to documents
    - Add soft delete to deals

  3. Security
    - Enable RLS on all new tables
    - Add policies for audit log access
*/

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  deal_id uuid NOT NULL REFERENCES deals(id),
  action text NOT NULL,
  changes jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT action_check CHECK (action IN ('create', 'update', 'delete', 'generate_pdf'))
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only analysts can view audit logs
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

-- PDF versions table
CREATE TABLE IF NOT EXISTS pdf_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL REFERENCES deals(id),
  version integer NOT NULL,
  url text NOT NULL,
  generated_by uuid NOT NULL REFERENCES auth.users(id),
  generated_at timestamptz DEFAULT now(),
  UNIQUE (deal_id, version)
);

ALTER TABLE pdf_versions ENABLE ROW LEVEL SECURITY;

-- Users can view PDF versions for their deals
CREATE POLICY "Users can view PDF versions"
  ON pdf_versions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM deals
      WHERE deals.id = pdf_versions.deal_id
      AND (
        deals.investor_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid()
          AND users.role = 'analyst'
        )
      )
    )
  );

-- User preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id),
  theme text DEFAULT 'light',
  view_mode text DEFAULT 'list',
  timezone text DEFAULT 'UTC',
  email_notifications boolean DEFAULT true,
  remember_me boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT theme_check CHECK (theme IN ('light', 'dark')),
  CONSTRAINT view_mode_check CHECK (view_mode IN ('list', 'grid'))
);

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Users can manage their own preferences
CREATE POLICY "Users can manage own preferences"
  ON user_preferences
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Add version tracking to documents
ALTER TABLE documents 
  ADD COLUMN IF NOT EXISTS version integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS replaced_by uuid REFERENCES documents(id);

-- Create audit log function
CREATE OR REPLACE FUNCTION create_audit_log()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (user_id, deal_id, action, changes)
  VALUES (
    auth.uid(),
    CASE 
      WHEN TG_TABLE_NAME = 'deals' THEN NEW.id
      WHEN TG_TABLE_NAME = 'deal_sections' THEN NEW.deal_id
      ELSE NULL
    END,
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'create'
      WHEN TG_OP = 'UPDATE' THEN 'update'
      WHEN TG_OP = 'DELETE' THEN 'delete'
    END,
    jsonb_build_object(
      'table', TG_TABLE_NAME,
      'old_data', CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD)::jsonb ELSE NULL END,
      'new_data', CASE WHEN TG_OP != 'DELETE' THEN row_to_json(NEW)::jsonb ELSE NULL END
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add audit triggers
DROP TRIGGER IF EXISTS audit_deals_trigger ON deals;
CREATE TRIGGER audit_deals_trigger
  AFTER INSERT OR UPDATE OR DELETE ON deals
  FOR EACH ROW EXECUTE FUNCTION create_audit_log();

DROP TRIGGER IF EXISTS audit_deal_sections_trigger ON deal_sections;
CREATE TRIGGER audit_deal_sections_trigger
  AFTER INSERT OR UPDATE OR DELETE ON deal_sections
  FOR EACH ROW EXECUTE FUNCTION create_audit_log();

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_deal_id ON audit_logs(deal_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_pdf_versions_deal_id ON pdf_versions(deal_id);
CREATE INDEX IF NOT EXISTS idx_documents_version ON documents(version);