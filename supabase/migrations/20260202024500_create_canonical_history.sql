-- Create Canonical History Tables

-- SERIES
create table if not exists series (
  id text primary key, -- GRID ID
  title_id text,
  start_time timestamptz,
  end_time timestamptz,
  status text,
  tournament_id text,
  tournament_name text,
  updated_at timestamptz default now()
);

alter table series enable row level security;
create policy "Read access for authenticated" on series for select to authenticated using (true);

-- MATCHES
create table if not exists matches (
  id text primary key, -- GRID ID
  series_id text references series(id) on delete cascade,
  status text,
  number int, -- Match 1, 2, 3...
  updated_at timestamptz default now()
);

alter table matches enable row level security;
create policy "Read access for authenticated" on matches for select to authenticated using (true);

-- GAMES
create table if not exists games (
  id text primary key, -- GRID ID
  match_id text references matches(id) on delete cascade,
  sequence_number int,
  winner_id text,
  status text,
  finished boolean default false,
  length_ms bigint,
  updated_at timestamptz default now()
);

alter table games enable row level security;
create policy "Read access for authenticated" on games for select to authenticated using (true);

-- PARTICIPANTS (Many-to-Many for Series-Teams)
create table if not exists series_participants (
  series_id text references series(id) on delete cascade,
  team_id text, -- GRID Team ID
  team_name text,
  primary key (series_id, team_id)
);

alter table series_participants enable row level security;
create policy "Read access for authenticated" on series_participants for select to authenticated using (true);

notify pgrst, 'reload schema';
