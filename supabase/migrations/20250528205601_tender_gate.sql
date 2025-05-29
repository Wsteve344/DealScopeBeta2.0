-- Analytics System Schema

-- Event Types Enum
CREATE TYPE analytics_event_type AS ENUM (
  'auth', 'navigation', 'feature_usage', 
  'deal_progress', 'revenue', 'subscription',
  'customer_interaction', 'system_performance'
);

-- Analytics Events Table
CREATE TABLE analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  event_type analytics_event_type NOT NULL,
  event_name text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  session_id uuid,
  timestamp timestamptz DEFAULT now(),
  
  -- Hypertable partition key
  CONSTRAINT valid_timestamp CHECK (timestamp > '2024-01-01'::timestamptz)
);

-- User Sessions Table
CREATE TABLE analytics_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  start_time timestamptz DEFAULT now(),
  end_time timestamptz,
  device_info jsonb,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Page Views Table
CREATE TABLE analytics_page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES analytics_sessions(id),
  user_id uuid REFERENCES auth.users(id),
  path text NOT NULL,
  query_params jsonb,
  timestamp timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX idx_events_user_id ON analytics_events(user_id);
CREATE INDEX idx_events_type_timestamp ON analytics_events(event_type, timestamp DESC);
CREATE INDEX idx_sessions_user_id ON analytics_sessions(user_id);
CREATE INDEX idx_page_views_session ON analytics_page_views(session_id);

-- Enable RLS
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_page_views ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Analysts can view all analytics data"
  ON analytics_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'analyst'
    )
  );

CREATE POLICY "Users can view own analytics data"
  ON analytics_events
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Create analytics views
CREATE VIEW analytics_daily_active_users AS
SELECT 
  date_trunc('day', timestamp) as day,
  count(DISTINCT user_id) as active_users
FROM analytics_events
GROUP BY 1
ORDER BY 1 DESC;

CREATE VIEW analytics_feature_usage AS
SELECT 
  event_name,
  count(*) as usage_count,
  count(DISTINCT user_id) as unique_users
FROM analytics_events
WHERE event_type = 'feature_usage'
GROUP BY 1
ORDER BY 2 DESC;