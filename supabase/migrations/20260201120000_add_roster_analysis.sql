-- Add analysis_data column to roster table for persistent AI insights
alter table roster 
add column if not exists analysis_data jsonb;

-- Add comment for documentation
comment on column roster.analysis_data is 'Stores AI-generated analysis including synergies and potential (Gemini 3 Pro)';

-- Reload schema cache
notify pgrst, 'reload schema';
