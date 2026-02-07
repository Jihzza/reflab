-- Migration: tests tables
-- Creates schema for tests, questions, attempts, and attempt answers.

create extension if not exists pgcrypto;

-- ============================================
-- 1. tests
-- ============================================
create table if not exists public.tests (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger on_tests_updated
  before update on public.tests
  for each row execute function public.handle_updated_at();

-- ============================================
-- 2. test_questions
-- ============================================
create table if not exists public.test_questions (
  id uuid primary key default gen_random_uuid(),
  test_id uuid not null references public.tests(id) on delete cascade,
  order_index int not null,
  question_text text not null,
  option_a text not null,
  option_b text not null,
  option_c text not null,
  option_d text not null,
  correct_option char(1) not null check (correct_option in ('A', 'B', 'C', 'D')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (test_id, order_index)
);

create index if not exists idx_test_questions_test_id on public.test_questions(test_id);

create trigger on_test_questions_updated
  before update on public.test_questions
  for each row execute function public.handle_updated_at();

-- ============================================
-- 3. test_attempts
-- ============================================
create table if not exists public.test_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  test_id uuid not null references public.tests(id) on delete cascade,
  status text not null check (status in ('in_progress', 'submitted', 'abandoned')),
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  abandoned_at timestamptz,
  score_correct int,
  score_total int,
  score_percent int check (score_percent between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_test_attempts_user_status on public.test_attempts(user_id, status);
create index if not exists idx_test_attempts_test_status on public.test_attempts(test_id, status);

create trigger on_test_attempts_updated
  before update on public.test_attempts
  for each row execute function public.handle_updated_at();

-- ============================================
-- 4. test_attempt_answers
-- ============================================
create table if not exists public.test_attempt_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.test_attempts(id) on delete cascade,
  question_id uuid not null references public.test_questions(id) on delete cascade,
  selected_option char(1) not null check (selected_option in ('A', 'B', 'C', 'D')),
  is_correct boolean,
  confirmed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (attempt_id, question_id)
);

create index if not exists idx_test_attempt_answers_attempt_id on public.test_attempt_answers(attempt_id);

create trigger on_test_attempt_answers_updated
  before update on public.test_attempt_answers
  for each row execute function public.handle_updated_at();

