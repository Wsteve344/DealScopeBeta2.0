-- Drop existing indexes if they exist
DROP INDEX IF EXISTS idx_appointments_analyst_id;
DROP INDEX IF EXISTS idx_appointments_start_time;
DROP INDEX IF EXISTS idx_appointments_status;

-- Create appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  analyst_id uuid NOT NULL REFERENCES auth.users(id),
  contact_name text NOT NULL,
  contact_email text,
  contact_phone text,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  deal_name text,
  status text NOT NULL DEFAULT 'pending',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT status_check CHECK (status IN ('pending', 'confirmed', 'completed')),
  CONSTRAINT time_check CHECK (end_time > start_time)
);

-- Enable RLS
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Analysts can manage their appointments" ON appointments;

-- Create policies
CREATE POLICY "Analysts can manage their appointments"
  ON appointments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'analyst'
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_appointments_analyst_id ON appointments(analyst_id);
CREATE INDEX IF NOT EXISTS idx_appointments_start_time ON appointments(start_time);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_appointments_updated_at ON appointments;

-- Add trigger for updated_at
CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();