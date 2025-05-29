-- Enable RLS on analytics tables
ALTER TABLE analytics_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ BEGIN
  -- Drop analytics_sessions policies
  DROP POLICY IF EXISTS "Users can insert their own sessions" ON analytics_sessions;
  DROP POLICY IF EXISTS "Users can view their own sessions" ON analytics_sessions;
  DROP POLICY IF EXISTS "Analysts can view all sessions" ON analytics_sessions;

  -- Drop analytics_page_views policies
  DROP POLICY IF EXISTS "Users can insert their own page views" ON analytics_page_views;
  DROP POLICY IF EXISTS "Users can view their own page views" ON analytics_page_views;
  DROP POLICY IF EXISTS "Analysts can view all page views" ON analytics_page_views;

  -- Drop analytics_events policies
  DROP POLICY IF EXISTS "Users can insert their own events" ON analytics_events;
  DROP POLICY IF EXISTS "Users can view their own events" ON analytics_events;
  DROP POLICY IF EXISTS "Analysts can view all events" ON analytics_events;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Analytics Sessions Policies
CREATE POLICY "Users can insert their own sessions"
  ON analytics_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own sessions"
  ON analytics_sessions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Analysts can view all sessions"
  ON analytics_sessions
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'analyst'
  ));

-- Analytics Page Views Policies
CREATE POLICY "Users can insert their own page views"
  ON analytics_page_views
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own page views"
  ON analytics_page_views
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Analysts can view all page views"
  ON analytics_page_views
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'analyst'
  ));

-- Analytics Events Policies
CREATE POLICY "Users can insert their own events"
  ON analytics_events
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own events"
  ON analytics_events
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Analysts can view all events"
  ON analytics_events
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'analyst'
  ));