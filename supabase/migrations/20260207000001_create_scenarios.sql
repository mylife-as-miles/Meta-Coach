-- =============================================
-- Scenarios Table (Saved comparison scenarios)
-- =============================================
create table if not exists scenarios (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references workspaces on delete cascade not null,
  name text not null,
  current_player_id uuid references roster(id) on delete set null,
  target_player_id uuid references shortlist(id) on delete set null,
  comparison_data jsonb default '{}'::jsonb,
  recommendation text,
  status text default 'draft' check (status in ('draft', 'saved', 'archived')),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table scenarios enable row level security;

drop policy if exists "Users can manage scenarios in own workspaces" on scenarios;
create policy "Users can manage scenarios in own workspaces"
  on scenarios for all
  using (
    workspace_id in (select id from workspaces where user_id = (select auth.uid()))
  )
  with check (
    workspace_id in (select id from workspaces where user_id = (select auth.uid()))
  );

create index if not exists idx_scenarios_workspace on scenarios(workspace_id);

-- =============================================
-- Negotiations Table (FIFA-style player talks)
-- =============================================
create table if not exists negotiations (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references workspaces on delete cascade not null,
  player_id uuid references shortlist(id) on delete cascade not null,
  player_name text not null,
  status text default 'pending' check (status in ('pending', 'in_progress', 'accepted', 'rejected', 'expired')),
  initial_offer numeric(12,2),
  current_offer numeric(12,2),
  counter_offer numeric(12,2),
  asking_price numeric(12,2),
  rounds integer default 0,
  max_rounds integer default 5,
  agent_mood text default 'neutral' check (agent_mood in ('happy', 'neutral', 'frustrated', 'angry')),
  notes text,
  contract_terms jsonb default '{}'::jsonb,
  created_at timestamp with time zone default now(),
  resolved_at timestamp with time zone
);

alter table negotiations enable row level security;

drop policy if exists "Users can manage negotiations in own workspaces" on negotiations;
create policy "Users can manage negotiations in own workspaces"
  on negotiations for all
  using (
    workspace_id in (select id from workspaces where user_id = (select auth.uid()))
  )
  with check (
    workspace_id in (select id from workspaces where user_id = (select auth.uid()))
  );

create index if not exists idx_negotiations_workspace on negotiations(workspace_id);
create index if not exists idx_negotiations_player on negotiations(player_id);
