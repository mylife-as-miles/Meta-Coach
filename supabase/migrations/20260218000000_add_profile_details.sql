-- Add bio, location, and languages to profiles table
alter table public.profiles
add column if not exists bio text,
add column if not exists location text,
add column if not exists languages text[];
