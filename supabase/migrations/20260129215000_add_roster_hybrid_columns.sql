-- Add hybrid data columns to roster table
alter table roster 
add column if not exists readiness_score integer default 90 check (readiness_score >= 0 and readiness_score <= 100),
add column if not exists synergy_score integer default 85 check (synergy_score >= 0 and synergy_score <= 100),
add column if not exists is_active boolean default true;

-- Reload schema cache to ensure efficient queries
notify pgrst, 'reload schema';
