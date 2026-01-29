-- =============================================
-- MetaCoach Database Schema
-- Run this in Supabase SQL Editor
-- =============================================

-- Create a table for public profiles (safe if exists)
create table if not exists profiles (
  id uuid references auth.users not null primary key,
  updated_at timestamp with time zone,
  username text unique,
  full_name text,
  avatar_url text,
  website text,
  onboarding_complete boolean default false,

  constraint username_length check (char_length(username) >= 3)
);

-- Set up Row Level Security (RLS)
alter table profiles enable row level security;

-- Policies (Re-create to ensure latest definition)
drop policy if exists "Public profiles are viewable by everyone." on profiles;
create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

drop policy if exists "Users can insert their own profile." on profiles;
create policy "Users can insert their own profile."
  on profiles for insert
  with check ( (select auth.uid()) = id );

drop policy if exists "Users can update own profile." on profiles;
create policy "Users can update own profile."
  on profiles for update
  using ( (select auth.uid()) = id );

-- This triggers a function every time a new user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'username', new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- Re-create trigger
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =============================================
-- WORKSPACES TABLE (One per coach-team binding)
-- =============================================
create table if not exists workspaces (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  grid_title_id text not null,
  grid_team_id text not null,
  team_name text,
  game_title text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(user_id, grid_team_id)
);

alter table workspaces enable row level security;

drop policy if exists "Users can view own workspaces" on workspaces;
create policy "Users can view own workspaces"
  on workspaces for select
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own workspaces" on workspaces;
create policy "Users can insert own workspaces"
  on workspaces for insert
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own workspaces" on workspaces;
create policy "Users can update own workspaces"
  on workspaces for update
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can delete own workspaces" on workspaces;
create policy "Users can delete own workspaces"
  on workspaces for delete
  using ((select auth.uid()) = user_id);

-- =============================================
-- ROSTER TABLE (Players in a workspace)
-- =============================================
create table if not exists roster (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references workspaces on delete cascade not null,
  role text not null,
  ign text,
  grid_player_id text,
  created_at timestamp with time zone default now()
);

alter table roster enable row level security;

drop policy if exists "Users can manage roster in own workspaces" on roster;
create policy "Users can manage roster in own workspaces"
  on roster for all
  using (
    workspace_id in (select id from workspaces where user_id = (select auth.uid()))
  );

-- =============================================
-- AI CALIBRATION TABLE (Strategy settings)
-- =============================================
create table if not exists ai_calibration (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references workspaces on delete cascade not null unique,
  aggression integer default 50 check (aggression >= 0 and aggression <= 100),
  resource_priority integer default 50 check (resource_priority >= 0 and resource_priority <= 100),
  vision_investment integer default 50 check (vision_investment >= 0 and vision_investment <= 100),
  early_game_pathing boolean default false,
  objective_control boolean default false,
  calibrated_at timestamp with time zone default now()
);

alter table ai_calibration enable row level security;

drop policy if exists "Users can manage own AI calibration" on ai_calibration;
create policy "Users can manage own AI calibration"
  on ai_calibration for all
  using (
    workspace_id in (select id from workspaces where user_id = (select auth.uid()))
  );
