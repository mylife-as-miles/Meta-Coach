-- =============================================
-- Shortlist Table (Scouted players saved for review)
-- =============================================
create table if not exists shortlist (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references workspaces on delete cascade not null,
  player_name text not null,
  grid_player_id text,
  role text,
  team_name text,
  war_score numeric(5,2),
  metadata jsonb default '{}'::jsonb,
  notes text,
  created_at timestamp with time zone default now(),
  
  -- Prevent duplicate entries for the same player in a workspace
  unique(workspace_id, grid_player_id)
);

alter table shortlist enable row level security;

-- RLS: Users can only access shortlist in their own workspaces
drop policy if exists "Users can manage shortlist in own workspaces" on shortlist;
create policy "Users can manage shortlist in own workspaces"
  on shortlist for all
  using (
    workspace_id in (select id from workspaces where user_id = (select auth.uid()))
  )
  with check (
    workspace_id in (select id from workspaces where user_id = (select auth.uid()))
  );

-- Index for faster lookups
create index if not exists idx_shortlist_workspace on shortlist(workspace_id);
