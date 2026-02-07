-- seed.sql
-- Minimal seed for MVP: 1 test + a few questions

insert into public.tests (slug, title, is_active)
values
  ('offside-basics', 'Offside Basics', true)
on conflict (slug) do update set
  title = excluded.title,
  is_active = excluded.is_active;

-- Insert questions for the test
with t as (
  select id as test_id from public.tests where slug = 'offside-basics'
)
insert into public.test_questions
  (test_id, order_index, question_text, option_a, option_b, option_c, option_d, correct_option)
select
  t.test_id,
  q.order_index,
  q.question_text,
  q.option_a,
  q.option_b,
  q.option_c,
  q.option_d,
  q.correct_option
from t
join (
  values
    (1, 'A player is in an offside position if...', 'They are in the opponent half', 'They are nearer to the goal line than both the ball and the second-last opponent', 'They touch the ball', 'They are behind the ball', 'B'),
    (2, 'Offside is punished when the player in offside position...', 'Receives the ball anywhere', 'Is closer to the corner flag', 'Becomes involved in active play', 'Is in their own half', 'C'),
    (3, 'A player cannot be offside directly from...', 'A goal kick', 'A throw-in', 'A corner kick', 'All of the above', 'D')
) as q(order_index, question_text, option_a, option_b, option_c, option_d, correct_option)
on conflict (test_id, order_index) do update set
  question_text = excluded.question_text,
  option_a = excluded.option_a,
  option_b = excluded.option_b,
  option_c = excluded.option_c,
  option_d = excluded.option_d,
  correct_option = excluded.correct_option;

-- ============================================
-- Practice questions (standalone)
-- ============================================
insert into public.practice_questions (
  question_text, option_a, option_b, option_c, option_d, correct_option, is_active
)
select
  'Practice: An assistant referee should signal offside when...',
  'A player is in an offside position',
  'A player in an offside position becomes involved in active play',
  'The ball is played backwards',
  'A player receives the ball from a throw-in',
  'B',
  true
where not exists (
  select 1
  from public.practice_questions
  where question_text = 'Practice: An assistant referee should signal offside when...'
);
