-- Migration: tests RLS policies

-- ============================================
-- 1. Enable RLS
-- ============================================
alter table public.tests enable row level security;
alter table public.test_questions enable row level security;
alter table public.test_attempts enable row level security;
alter table public.test_attempt_answers enable row level security;

-- ============================================
-- 2. tests / questions: readable by authenticated users
-- ============================================
drop policy if exists "Authenticated can read tests" on public.tests;
create policy "Authenticated can read tests"
  on public.tests for select
  to authenticated
  using (true);

drop policy if exists "Authenticated can read test questions" on public.test_questions;
create policy "Authenticated can read test questions"
  on public.test_questions for select
  to authenticated
  using (true);

-- ============================================
-- 3. attempts: owner-only
-- ============================================
drop policy if exists "Users can read own test attempts" on public.test_attempts;
create policy "Users can read own test attempts"
  on public.test_attempts for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can create own test attempts" on public.test_attempts;
create policy "Users can create own test attempts"
  on public.test_attempts for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own test attempts" on public.test_attempts;
create policy "Users can update own test attempts"
  on public.test_attempts for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================
-- 4. attempt answers: owner-only via attempt ownership
-- ============================================
drop policy if exists "Users can read own test attempt answers" on public.test_attempt_answers;
create policy "Users can read own test attempt answers"
  on public.test_attempt_answers for select
  to authenticated
  using (
    exists (
      select 1
      from public.test_attempts a
      where a.id = attempt_id
        and a.user_id = auth.uid()
    )
  );

drop policy if exists "Users can create own test attempt answers" on public.test_attempt_answers;
create policy "Users can create own test attempt answers"
  on public.test_attempt_answers for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.test_attempts a
      where a.id = attempt_id
        and a.user_id = auth.uid()
    )
  );

drop policy if exists "Users can update own test attempt answers" on public.test_attempt_answers;
create policy "Users can update own test attempt answers"
  on public.test_attempt_answers for update
  to authenticated
  using (
    exists (
      select 1
      from public.test_attempts a
      where a.id = attempt_id
        and a.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.test_attempts a
      where a.id = attempt_id
        and a.user_id = auth.uid()
    )
  );

