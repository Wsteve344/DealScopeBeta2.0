-- Enable RLS on credit_transactions if not already enabled
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert their own credit transactions" ON public.credit_transactions;
DROP POLICY IF EXISTS "System can manage transactions" ON public.credit_transactions;
DROP POLICY IF EXISTS "Users can view own transactions" ON public.credit_transactions;

-- Create policy for users to insert their own transactions
CREATE POLICY "Users can insert their own credit transactions"
ON public.credit_transactions
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Create policy for system role to manage all transactions
CREATE POLICY "System can manage transactions"
ON public.credit_transactions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Create policy for users to view their own transactions
CREATE POLICY "Users can view own transactions"
ON public.credit_transactions
FOR SELECT
TO authenticated
USING (user_id = auth.uid());