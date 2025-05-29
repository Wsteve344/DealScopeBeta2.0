/*
  # Create appointments table for calendar management
  
  1. New Tables
    - `appointments`
      - `id` (uuid, primary key)
      - `contact_name` (text, required)
      - `contact_email` (text, optional)
      - `contact_phone` (text, optional)
      - `start_time` (timestamptz, required)
      - `end_time` (timestamptz, required)
      - `deal_name` (text, optional)
      - `status` (text, required) - one of: pending, confirmed, completed
      - `notes` (text, optional)
      - `analyst_id` (uuid, required) - references users table
      - `created_at` (timestamptz, default: now())
  
  2. Security
    - Enable RLS on appointments table
    - Add policies for:
      - Read access for authenticated users
      - Insert for authenticated users
      - Update/delete for analysts on their own appointments
*/

-- Create appointments table
CREATE TABLE public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_name TEXT NOT NULL,
    contact_email TEXT,
    contact_phone TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    deal_name TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed')),
    notes TEXT,
    analyst_id UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Enable read access for authenticated users" ON public.appointments
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable insert for authenticated users" ON public.appointments
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable update for authenticated users on their own appointments" ON public.appointments
    FOR UPDATE USING (auth.uid() = analyst_id);

CREATE POLICY "Enable delete for authenticated users on their own appointments" ON public.appointments
    FOR DELETE USING (auth.uid() = analyst_id);

-- Create indexes for better query performance
CREATE INDEX idx_appointments_analyst_id ON public.appointments(analyst_id);
CREATE INDEX idx_appointments_start_time ON public.appointments(start_time);