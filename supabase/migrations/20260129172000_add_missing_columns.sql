-- Add metadata column to roster
ALTER TABLE IF EXISTS public.roster ADD COLUMN IF NOT EXISTS metadata jsonb;

-- Add new analysis columns to ai_calibration
ALTER TABLE IF EXISTS public.ai_calibration ADD COLUMN IF NOT EXISTS matchup_delta jsonb;
ALTER TABLE IF EXISTS public.ai_calibration ADD COLUMN IF NOT EXISTS derivation_factors jsonb;
ALTER TABLE IF EXISTS public.ai_calibration ADD COLUMN IF NOT EXISTS opponent_name text;
ALTER TABLE IF EXISTS public.ai_calibration ADD COLUMN IF NOT EXISTS meta jsonb;

-- Force schema cache reload
NOTIFY pgrst, 'reload config';
