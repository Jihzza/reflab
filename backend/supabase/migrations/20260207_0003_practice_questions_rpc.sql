-- Migration: practice questions RPCs

-- Returns a single random active question. Excludes correct_option so the client can't see it upfront.
create or replace function public.get_random_practice_question(p_exclude_id uuid default null)
returns table (
  id uuid,
  question_text text,
  option_a text,
  option_b text,
  option_c text,
  option_d text
)
language sql
security definer
set search_path = public
as $$
  select
    q.id,
    q.question_text,
    q.option_a,
    q.option_b,
    q.option_c,
    q.option_d
  from public.practice_questions q
  where q.is_active = true
    and (p_exclude_id is null or q.id <> p_exclude_id)
  order by random()
  limit 1;
$$;

revoke all on function public.get_random_practice_question(uuid) from public;
grant execute on function public.get_random_practice_question(uuid) to authenticated;

-- Inserts an attempt and returns the created row with correctness.
create or replace function public.submit_practice_question_attempt(
  p_question_id uuid,
  p_selected_option char(1)
)
returns public.practice_question_attempts
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_question public.practice_questions;
  v_attempt public.practice_question_attempts;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select *
    into v_question
  from public.practice_questions
  where id = p_question_id
    and is_active = true;

  if not found then
    raise exception 'Question not found';
  end if;

  insert into public.practice_question_attempts (
    user_id,
    question_id,
    selected_option,
    correct_option,
    is_correct,
    answered_at
  )
  values (
    v_user_id,
    p_question_id,
    p_selected_option,
    v_question.correct_option,
    (p_selected_option = v_question.correct_option),
    now()
  )
  returning * into v_attempt;

  return v_attempt;
end;
$$;

revoke all on function public.submit_practice_question_attempt(uuid, char) from public;
grant execute on function public.submit_practice_question_attempt(uuid, char) to authenticated;

