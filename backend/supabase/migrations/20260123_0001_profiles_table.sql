-- Migration: profiles table
-- Creates profiles table with auto-creation trigger on user signup

-- ============================================
-- 1. Create profiles table
-- ============================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  username_customized boolean not null default false,
  role text not null default 'user' check (role in ('user', 'moderator', 'admin')),
  name text,
  email text,
  photo_url text,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================
-- 2. Username constraints
-- ============================================
-- Rules: 3-30 chars, letters/numbers/underscore/dot only, no spaces
alter table public.profiles
  add constraint username_format check (
    length(username) >= 3 and
    length(username) <= 30 and
    username ~ '^[a-zA-Z0-9_.]+$'
  );

-- Case-insensitive uniqueness (JohnDoe = johndoe)
create unique index profiles_username_lower_idx
  on public.profiles (lower(username));

-- ============================================
-- 3. Updated_at trigger
-- ============================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_profiles_updated
  before update on public.profiles
  for each row execute function public.handle_updated_at();

-- ============================================
-- 4. Referee-themed username generator
-- ============================================
create or replace function public.generate_username()
returns text as $$
declare
  adjectives text[] := array[
    'Sharp', 'Fair', 'Quick', 'Swift', 'Alert', 'Steady', 'Calm', 'Keen',
    'True', 'Clear', 'Focused', 'Precise', 'Vigilant', 'Decisive', 'Trusted'
  ];
  nouns text[] := array[
    'Ref', 'Referee', 'Whistle', 'Official', 'Arbiter'
  ];
  adj text;
  noun text;
  num int;
  result text;
  attempts int := 0;
begin
  loop
    adj := adjectives[1 + floor(random() * array_length(adjectives, 1))::int];
    noun := nouns[1 + floor(random() * array_length(nouns, 1))::int];
    num := floor(random() * 9000 + 1000)::int; -- 4-digit number (1000-9999)
    result := adj || noun || num::text;

    -- Check if username already exists (case-insensitive)
    if not exists (select 1 from public.profiles where lower(username) = lower(result)) then
      return result;
    end if;

    attempts := attempts + 1;
    if attempts > 100 then
      -- Fallback: add more random digits
      result := adj || noun || floor(random() * 900000 + 100000)::int::text;
      return result;
    end if;
  end loop;
end;
$$ language plpgsql;

-- ============================================
-- 5. Auto-create profile on user signup
-- ============================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, username)
  values (new.id, new.email, public.generate_username());
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
