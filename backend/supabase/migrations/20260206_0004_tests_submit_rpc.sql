-- Migration: submit test attempt RPC
-- Submits + scores an in-progress test attempt atomically.

create or replace function public.submit_test_attempt(p_attempt_id uuid)
returns public.test_attempts
language plpgsql
security definer
set search_path = public
as $$
declare
  v_attempt public.test_attempts;
  v_total int;
  v_answered int;
  v_correct int;
begin
  select *
    into v_attempt
  from public.test_attempts
  where id = p_attempt_id
  for update;

  if not found then
    raise exception 'Attempt not found';
  end if;

  if v_attempt.user_id is distinct from auth.uid() then
    raise exception 'Not authorized';
  end if;

  if v_attempt.status <> 'in_progress' then
    raise exception 'Attempt is not in progress';
  end if;

  select count(*)
    into v_total
  from public.test_questions
  where test_id = v_attempt.test_id;

  if v_total = 0 then
    raise exception 'Test has no questions';
  end if;

  select count(*)
    into v_answered
  from public.test_attempt_answers
  where attempt_id = p_attempt_id;

  if v_answered <> v_total then
    raise exception 'Not all questions answered (%/%).', v_answered, v_total;
  end if;

  -- Mark each answer correct/incorrect
  update public.test_attempt_answers a
  set is_correct = (a.selected_option = q.correct_option)
  from public.test_questions q
  where a.attempt_id = p_attempt_id
    and q.id = a.question_id;

  select count(*)
    into v_correct
  from public.test_attempt_answers a
  join public.test_questions q on q.id = a.question_id
  where a.attempt_id = p_attempt_id
    and a.selected_option = q.correct_option;

  update public.test_attempts
  set status = 'submitted',
      submitted_at = now(),
      score_correct = v_correct,
      score_total = v_total,
      score_percent = round((v_correct::numeric / v_total::numeric) * 100)::int
  where id = p_attempt_id
  returning * into v_attempt;

  return v_attempt;
end;
$$;

revoke all on function public.submit_test_attempt(uuid) from public;
grant execute on function public.submit_test_attempt(uuid) to authenticated;
