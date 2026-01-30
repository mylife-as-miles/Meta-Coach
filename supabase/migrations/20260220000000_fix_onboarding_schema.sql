-- Add missing coaching_bias column to ai_calibration if it doesn't exist
do $$
begin
    if not exists (select 1 from information_schema.columns where table_name = 'ai_calibration' and column_name = 'coaching_bias') then
        alter table public.ai_calibration add column coaching_bias text;
    end if;

    if not exists (select 1 from information_schema.columns where table_name = 'ai_calibration' and column_name = 'confidence_score') then
        alter table public.ai_calibration add column confidence_score numeric(4,1) default 98.4;
    end if;

     if not exists (select 1 from information_schema.columns where table_name = 'ai_calibration' and column_name = 'generated_reasoning') then
        alter table public.ai_calibration add column generated_reasoning text;
    end if;
end $$;
