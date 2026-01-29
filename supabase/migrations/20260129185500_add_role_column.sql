-- Add role column to profiles if missing
ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS role text default 'Coach';

-- Force schema cache reload again to be sure
NOTIFY pgrst, 'reload config';
