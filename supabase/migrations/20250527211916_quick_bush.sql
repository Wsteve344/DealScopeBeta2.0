/*
  # Consolidated Schema Migration

  1. Schema Overview
    - Core tables for deals, users, and documents
    - Stripe integration tables for payments and subscriptions
    - Credit system tables for managing user credits
    - Security policies for row-level security

  2. Tables Created
    - users: Core user profiles
    - deals: Property deals and their status
    - deal_sections: Sections within each deal analysis
    - messages: Communication system
    - documents: Document management
    - shared_reports: Report sharing functionality
    - credit_wallets: User credit balances
    - credit_transactions: Credit transaction history
    - stripe_customers: Stripe customer mapping
    - stripe_subscriptions: Subscription management
    - stripe_orders: Order tracking

  3. Security
    - RLS enabled on all tables
    - Policies for user data access
    - Role-based access control
*/

-- Drop existing objects if they exist
DROP VIEW IF EXISTS stripe_user_subscriptions;
DROP VIEW IF EXISTS stripe_user_orders;
DROP TABLE IF EXISTS credit_transactions;
DROP TABLE IF EXISTS credit_wallets;
DROP TABLE IF EXISTS shared_reports;
DROP TABLE IF EXISTS documents;
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS deal_sections;
DROP TABLE IF EXISTS deals;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS stripe_orders;
DROP TABLE IF EXISTS stripe_subscriptions;
DROP TABLE IF EXISTS stripe_customers;
DROP TYPE IF EXISTS stripe_subscription_status;
DROP TYPE IF EXISTS stripe_order_status;

-- Create ENUMs
CREATE TYPE stripe_subscription_status AS ENUM (
    'not_started',
    'incomplete',
    'incomplete_expired',
    'trialing',
    'active',
    'past_due',
    'canceled',
    'unpaid',
    'paused'
);

CREATE TYPE stripe_order_status AS ENUM (
    'pending',
    'completed',
    'canceled'
);

-- Create Tables
CREATE TABLE users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text UNIQUE NOT NULL,
    role text NOT NULL,
    credits integer DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    CONSTRAINT users_role_check CHECK (role = ANY (ARRAY['investor'::text, 'analyst'::text]))
);

CREATE TABLE deals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamptz DEFAULT now(),
    address text NOT NULL,
    latitude double precision,
    longitude double precision,
    status text DEFAULT 'pending' NOT NULL,
    progress integer DEFAULT 0 NOT NULL,
    investor_id uuid NOT NULL REFERENCES auth.users(id)
);

CREATE TABLE deal_sections (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id uuid NOT NULL REFERENCES deals(id),
    type text NOT NULL,
    data jsonb DEFAULT '{}'::jsonb,
    completed boolean DEFAULT false,
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id uuid NOT NULL REFERENCES deals(id),
    user_id uuid NOT NULL REFERENCES users(id),
    content text NOT NULL,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE documents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id uuid NOT NULL REFERENCES deals(id),
    name text NOT NULL,
    url text NOT NULL,
    uploaded_at timestamptz DEFAULT now()
);

CREATE TABLE shared_reports (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id uuid NOT NULL REFERENCES deals(id),
    shared_with text NOT NULL,
    expires_at timestamptz NOT NULL,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE credit_wallets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id),
    credits integer DEFAULT 0 NOT NULL,
    tier text DEFAULT 'basic' NOT NULL,
    rollover_credits integer DEFAULT 0 NOT NULL,
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT credit_wallets_tier_check CHECK (tier = ANY (ARRAY['basic'::text, 'pro'::text, 'enterprise'::text]))
);

CREATE TABLE credit_transactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id),
    amount integer NOT NULL,
    type text NOT NULL,
    payment_intent_id text,
    status text DEFAULT 'pending' NOT NULL,
    created_at timestamptz DEFAULT now(),
    CONSTRAINT credit_transactions_type_check CHECK (type = ANY (ARRAY['purchase'::text, 'debit'::text, 'refund'::text])),
    CONSTRAINT credit_transactions_status_check CHECK (status = ANY (ARRAY['pending'::text, 'completed'::text, 'failed'::text]))
);

CREATE TABLE stripe_customers (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id uuid REFERENCES auth.users(id) NOT NULL UNIQUE,
    customer_id text NOT NULL UNIQUE,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    deleted_at timestamptz DEFAULT null
);

CREATE TABLE stripe_subscriptions (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    customer_id text UNIQUE NOT NULL,
    subscription_id text DEFAULT null,
    price_id text DEFAULT null,
    current_period_start bigint DEFAULT null,
    current_period_end bigint DEFAULT null,
    cancel_at_period_end boolean DEFAULT false,
    payment_method_brand text DEFAULT null,
    payment_method_last4 text DEFAULT null,
    status stripe_subscription_status NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    deleted_at timestamptz DEFAULT null
);

CREATE TABLE stripe_orders (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    checkout_session_id text NOT NULL,
    payment_intent_id text NOT NULL,
    customer_id text NOT NULL,
    amount_subtotal bigint NOT NULL,
    amount_total bigint NOT NULL,
    currency text NOT NULL,
    payment_status text NOT NULL,
    status stripe_order_status NOT NULL DEFAULT 'pending',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    deleted_at timestamptz DEFAULT null
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_orders ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies

-- Users table policies
CREATE POLICY "Enable insert for authentication service" ON users
    FOR INSERT TO public
    WITH CHECK (true);

CREATE POLICY "Users can read own data" ON users
    FOR SELECT TO authenticated
    USING (id = auth.uid());

CREATE POLICY "Users can update own data" ON users
    FOR UPDATE TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- Deals table policies
CREATE POLICY "Analysts can read all deals" ON deals
    FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role = 'analyst'
    ));

CREATE POLICY "Investors can create deals" ON deals
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = investor_id);

CREATE POLICY "Investors can read own deals" ON deals
    FOR SELECT TO authenticated
    USING (auth.uid() = investor_id);

-- Deal sections policies
CREATE POLICY "Analysts can update deal sections" ON deal_sections
    FOR ALL TO authenticated
    USING (EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role = 'analyst'
    ));

CREATE POLICY "Investors can view own deal sections" ON deal_sections
    FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM deals
        WHERE deals.id = deal_sections.deal_id
        AND deals.investor_id = auth.uid()
    ));

-- Messages policies
CREATE POLICY "Users can create messages for their deals" ON messages
    FOR INSERT TO authenticated
    WITH CHECK (EXISTS (
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
    ));

CREATE POLICY "Users can read messages for their deals" ON messages
    FOR SELECT TO authenticated
    USING (EXISTS (
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
    ));

-- Documents policies
CREATE POLICY "Analysts can create documents" ON documents
    FOR INSERT TO authenticated
    WITH CHECK (EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role = 'analyst'
    ));

CREATE POLICY "Users can read documents for their deals" ON documents
    FOR SELECT TO authenticated
    USING (EXISTS (
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
    ));

-- Shared reports policies
CREATE POLICY "Analysts can manage shared reports" ON shared_reports
    FOR ALL TO authenticated
    USING (EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role = 'analyst'
    ));

CREATE POLICY "Deal owners can manage shared reports" ON shared_reports
    FOR ALL TO authenticated
    USING (EXISTS (
        SELECT 1 FROM deals
        WHERE deals.id = shared_reports.deal_id
        AND deals.investor_id = auth.uid()
    ));

-- Credit wallets policies
CREATE POLICY "System can manage wallets" ON credit_wallets
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Users can view own wallet" ON credit_wallets
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

-- Credit transactions policies
CREATE POLICY "System can manage transactions" ON credit_transactions
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Users can view own transactions" ON credit_transactions
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

-- Stripe customers policies
CREATE POLICY "Users can view their own customer data" ON stripe_customers
    FOR SELECT TO authenticated
    USING (user_id = auth.uid() AND deleted_at IS NULL);

-- Stripe subscriptions policies
CREATE POLICY "Users can view their own subscription data" ON stripe_subscriptions
    FOR SELECT TO authenticated
    USING (
        customer_id IN (
            SELECT customer_id
            FROM stripe_customers
            WHERE user_id = auth.uid()
            AND deleted_at IS NULL
        )
        AND deleted_at IS NULL
    );

-- Stripe orders policies
CREATE POLICY "Users can view their own order data" ON stripe_orders
    FOR SELECT TO authenticated
    USING (
        customer_id IN (
            SELECT customer_id
            FROM stripe_customers
            WHERE user_id = auth.uid()
            AND deleted_at IS NULL
        )
        AND deleted_at IS NULL
    );

-- Create Views
CREATE VIEW stripe_user_subscriptions WITH (security_invoker = true) AS
SELECT
    c.customer_id,
    s.subscription_id,
    s.status as subscription_status,
    s.price_id,
    s.current_period_start,
    s.current_period_end,
    s.cancel_at_period_end,
    s.payment_method_brand,
    s.payment_method_last4
FROM stripe_customers c
LEFT JOIN stripe_subscriptions s ON c.customer_id = s.customer_id
WHERE c.user_id = auth.uid()
AND c.deleted_at IS NULL
AND s.deleted_at IS NULL;

CREATE VIEW stripe_user_orders WITH (security_invoker = true) AS
SELECT
    c.customer_id,
    o.id as order_id,
    o.checkout_session_id,
    o.payment_intent_id,
    o.amount_subtotal,
    o.amount_total,
    o.currency,
    o.payment_status,
    o.status as order_status,
    o.created_at as order_date
FROM stripe_customers c
LEFT JOIN stripe_orders o ON c.customer_id = o.customer_id
WHERE c.user_id = auth.uid()
AND c.deleted_at IS NULL
AND o.deleted_at IS NULL;

-- Grant access to views
GRANT SELECT ON stripe_user_subscriptions TO authenticated;
GRANT SELECT ON stripe_user_orders TO authenticated;