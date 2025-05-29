/*
  # Core Schema Setup
  
  1. New Tables
    - deals (property deals with investor and status tracking)
    - deal_sections (modular sections of deal analysis)
    - messages (deal-related communications)
    - documents (deal-related files)
    
  2. Security
    - RLS enabled on all tables
    - Policies for analysts and investors
    - Role-based access control
    
  3. Performance
    - Indexes on foreign keys
    - Automatic timestamp updates
*/

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Analysts can read all deals" ON deals;
  DROP POLICY IF EXISTS "Investors can read own deals" ON deals;
  DROP POLICY IF EXISTS "Analysts can manage deal sections" ON deal_sections;
  DROP POLICY IF EXISTS "Investors can view deal sections" ON deal_sections;
  DROP POLICY IF EXISTS "Users can read deal messages" ON messages;
  DROP POLICY IF EXISTS "Users can create messages" ON messages;
  DROP POLICY IF EXISTS "Users can read deal documents" ON documents;
EXCEPTION
  WHEN undefined_table THEN NULL;
END $$;

-- Deals table
CREATE TABLE IF NOT EXISTS deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  address text NOT NULL,
  investor_id uuid NOT NULL REFERENCES auth.users(id),
  status text NOT NULL DEFAULT 'pending',
  progress integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  latitude double precision,
  longitude double precision,
  deleted_at timestamptz,
  CONSTRAINT status_check CHECK (status IN ('pending', 'in_progress', 'completed')),
  CONSTRAINT progress_range CHECK (progress >= 0 AND progress <= 100)
);

ALTER TABLE deals ENABLE ROW LEVEL SECURITY;

-- Analysts can read all deals
CREATE POLICY "Analysts can read all deals"
  ON deals
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'analyst'
    )
  );

-- Investors can read their own deals
CREATE POLICY "Investors can read own deals"
  ON deals
  FOR SELECT
  TO authenticated
  USING (investor_id = auth.uid());

-- Deal sections table
CREATE TABLE IF NOT EXISTS deal_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL REFERENCES deals(id),
  type text NOT NULL,
  data jsonb DEFAULT '{}'::jsonb,
  completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_autosave timestamptz,
  CONSTRAINT type_check CHECK (type IN (
    'sourcing',
    'financial',
    'inspections',
    'legal',
    'financing',
    'marketplace',
    'review'
  ))
);

ALTER TABLE deal_sections ENABLE ROW LEVEL SECURITY;

-- Analysts can manage deal sections
CREATE POLICY "Analysts can manage deal sections"
  ON deal_sections
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'analyst'
    )
  );

-- Investors can view their deal sections
CREATE POLICY "Investors can view deal sections"
  ON deal_sections
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM deals
      WHERE deals.id = deal_sections.deal_id
      AND deals.investor_id = auth.uid()
    )
  );

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL REFERENCES deals(id),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Users can read messages for their deals
CREATE POLICY "Users can read deal messages"
  ON messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM deals
      WHERE deals.id = messages.deal_id
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

-- Users can create messages for their deals
CREATE POLICY "Users can create messages"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM deals
      WHERE deals.id = messages.deal_id
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

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL REFERENCES deals(id),
  name text NOT NULL,
  url text NOT NULL,
  type text NOT NULL,
  size bigint NOT NULL,
  uploaded_at timestamptz DEFAULT now(),
  uploaded_by uuid NOT NULL REFERENCES auth.users(id)
);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Users can read documents for their deals
CREATE POLICY "Users can read deal documents"
  ON documents
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM deals
      WHERE deals.id = documents.deal_id
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

-- Create functions for timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS update_deals_updated_at ON deals;
CREATE TRIGGER update_deals_updated_at
  BEFORE UPDATE ON deals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_deal_sections_updated_at ON deal_sections;
CREATE TRIGGER update_deal_sections_updated_at
  BEFORE UPDATE ON deal_sections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_deals_investor_id ON deals(investor_id);
CREATE INDEX IF NOT EXISTS idx_deal_sections_deal_id ON deal_sections(deal_id);
CREATE INDEX IF NOT EXISTS idx_messages_deal_id ON messages(deal_id);
CREATE INDEX IF NOT EXISTS idx_documents_deal_id ON documents(deal_id);