-- Migration: practice questions RLS policies

alter table public.practice_questions enable row level security;
alter table public.practice_question_attempts enable row level security;

-- practice questions: readable by authenticated users (active only)
drop policy if exists "Authenticated can read practice questions" on public.practice_questions;
create policy "Authenticated can read practice questions"
  on public.practice_questions for select
  to authenticated
  using (is_active = true);

-- attempts: owner-only
drop policy if exists "Users can read own practice question attempts" on public.practice_question_attempts;
create policy "Users can read own practice question attempts"
  on public.practice_question_attempts for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can create own practice question attempts" on public.practice_question_attempts;
create policy "Users can create own practice question attempts"
  on public.practice_question_attempts for insert
  to authenticated
  with check (auth.uid() = user_id);

