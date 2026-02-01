-- Create a cache table for GRID team matches to avoid rate limits
create table if not exists team_match_cache (
  team_id text primary key,
  matches jsonb not null,
  updated_at timestamptz default now()
);

-- Policy to allow authenticated users to read/write (since edge function usually uses service key or user context)
-- Actually edge function bypasses RLS if using service role, but let's add basic RLS.
alter table team_match_cache enable row level security;

create policy "Enable read access for authenticated users"
on team_match_cache for select
to authenticated
using (true);

create policy "Enable insert/update for service role only"
on team_match_cache for insert
to authenticated
with check (false);
    
create policy "Enable update for service role only"
on team_match_cache for update
to authenticated
using (false);

notify pgrst, 'reload schema';
