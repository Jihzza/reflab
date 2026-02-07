-- Migration: practice questions tables
-- Standalone question bank + per-question attempts (outside of tests).

create extension if not exists pgcrypto;

-- ============================================
-- 1. practice_questions
-- ============================================
create table if not exists public.practice_questions (
  id uuid primary key default gen_random_uuid(),
  question_text text not null,
  option_a text not null,
  option_b text not null,
  option_c text not null,
  option_d text not null,
  correct_option char(1) not null check (correct_option in ('A', 'B', 'C', 'D')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_practice_questions_active on public.practice_questions(is_active);

create trigger on_practice_questions_updated
  before update on public.practice_questions
  for each row execute function public.handle_updated_at();

-- ============================================
-- 2. practice_question_attempts
-- ============================================
create table if not exists public.practice_question_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id uuid not null references public.practice_questions(id) on delete cascade,
  selected_option char(1) not null check (selected_option in ('A', 'B', 'C', 'D')),
  correct_option char(1) not null check (correct_option in ('A', 'B', 'C', 'D')),
  is_correct boolean not null,
  answered_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_practice_question_attempts_user_id on public.practice_question_attempts(user_id);
create index if not exists idx_practice_question_attempts_question_id on public.practice_question_attempts(question_id);
create index if not exists idx_practice_question_attempts_answered_at on public.practice_question_attempts(answered_at);

create trigger on_practice_question_attempts_updated
  before update on public.practice_question_attempts
  for each row execute function public.handle_updated_at();

