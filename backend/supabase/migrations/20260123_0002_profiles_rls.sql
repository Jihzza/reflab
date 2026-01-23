-- Migration: profiles RLS policies + public_profiles view
-- Security model:
--   profiles: private (self + admin)
--   public_profiles: view for leaderboard/community (all authenticated)

-- ============================================
-- 1. Enable RLS on profiles
-- ============================================
alter table public.profiles enable row level security;

-- ============================================
-- 2. Helper function: check if current user is admin
-- ============================================
create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
    and role = 'admin'
  );
$$ language sql security definer stable;

-- ============================================
-- 3. SELECT policies
-- ============================================
-- Users can read their own profile
create policy "Users can read own profile"
  on public.profiles for select
  using (id = auth.uid());

-- Admins can read all profiles
create policy "Admins can read all profiles"
  on public.profiles for select
  using (public.is_admin());

-- ============================================
-- 4. UPDATE policies
-- ============================================
-- Users can update their own profile
create policy "Users can update own profile"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- Admins can update any profile
create policy "Admins can update any profile"
  on public.profiles for update
  using (public.is_admin())
  with check (public.is_admin());

-- ============================================
-- 5. INSERT policy
-- ============================================
-- No INSERT policy needed: trigger with SECURITY DEFINER handles it
-- But we add one for edge cases (manual profile repair)
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (id = auth.uid());

-- ============================================
-- 6. DELETE policy
-- ============================================
-- No delete allowed (profiles persist) 
-- If needed later, add soft-delete with a `deleted_at` column

-- ============================================
-- 7. Public profiles view (for leaderboard/community)
-- ============================================
create view public.public_profiles as
select
  id,
  username,
  name,
  photo_url
from public.profiles
where username is not null;  -- Only show users who completed onboarding

-- Grant access to authenticated users
grant select on public.public_profiles to authenticated;
