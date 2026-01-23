-- Migration: notifications table
-- General notifications system (starting with profile completion reminder)

-- ============================================
-- 1. Create notifications table
-- ============================================
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,  -- e.g., 'profile_incomplete', future: 'new_reply', 'new_test'
  title text not null,
  message text not null,
  read boolean not null default false,
  dismissed_permanently boolean not null default false,
  next_reminder_at timestamptz,  -- for "remind me later" functionality
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for fetching user notifications efficiently
create index notifications_user_id_idx on public.notifications(user_id);
create index notifications_type_idx on public.notifications(type);

-- ============================================
-- 2. Updated_at trigger
-- ============================================
create trigger on_notifications_updated
  before update on public.notifications
  for each row execute function public.handle_updated_at();

-- ============================================
-- 3. Auto-create profile reminder on signup
-- ============================================
create or replace function public.create_profile_reminder()
returns trigger as $$
begin
  insert into public.notifications (user_id, type, title, message, next_reminder_at)
  values (
    new.id,
    'profile_incomplete',
    'Complete your profile',
    'Set a custom username and name to personalize your RefLab experience.',
    now()  -- Show immediately on first login
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_profile_created_notification
  after insert on public.profiles
  for each row execute function public.create_profile_reminder();

-- ============================================
-- 4. RLS policies
-- ============================================
alter table public.notifications enable row level security;

-- Users can read their own notifications
create policy "Users can read own notifications"
  on public.notifications for select
  using (user_id = auth.uid());

-- Users can update their own notifications (mark read, dismiss, etc.)
create policy "Users can update own notifications"
  on public.notifications for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- No direct insert/delete by users (system creates notifications)
