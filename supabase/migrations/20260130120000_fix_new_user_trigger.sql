-- =============================================
-- Fix for "Database error saving new user" issue
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- =============================================

-- The issue is that the handle_new_user() trigger fails when:
-- 1. Username is NULL (violates unique constraint when multiple users have NULL)
-- 2. Username is less than 3 characters (violates check constraint)
-- 
-- This fix makes the trigger more robust by:
-- 1. Using the email prefix as a fallback username
-- 2. Only inserting username if it's valid (3+ characters)

create or replace function public.handle_new_user()
returns trigger as $$
declare
  v_username text;
begin
  -- Get username from metadata, fallback to email prefix
  v_username := coalesce(
    nullif(new.raw_user_meta_data->>'username', ''),
    split_part(new.email, '@', 1)
  );
  
  -- Ensure username is at least 3 characters (pad with random suffix if needed)
  if char_length(v_username) < 3 then
    v_username := v_username || substring(gen_random_uuid()::text from 1 for (3 - char_length(v_username)));
  end if;
  
  -- Handle duplicate usernames by appending a random suffix
  -- Try insert, on conflict update to ensure the profile exists
  insert into public.profiles (id, username, full_name, avatar_url, onboarding_complete)
  values (
    new.id, 
    v_username,
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url',
    false
  )
  on conflict (id) do nothing;
  
  return new;
exception
  when unique_violation then
    -- Username already taken, try with a random suffix
    insert into public.profiles (id, username, full_name, avatar_url, onboarding_complete)
    values (
      new.id, 
      v_username || '_' || substring(gen_random_uuid()::text from 1 for 4),
      new.raw_user_meta_data->>'full_name', 
      new.raw_user_meta_data->>'avatar_url',
      false
    )
    on conflict (id) do nothing;
    return new;
end;
$$ language plpgsql security definer;

-- Recreate the trigger to use the updated function
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
