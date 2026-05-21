create function save_review_with_log(
  p_question_id text,
  p_ease_factor float,
  p_interval_days integer,
  p_repetitions integer,
  p_due_at timestamptz,
  p_is_weak boolean,
  p_weak_marked_at timestamptz,
  p_last_rating text,
  p_last_reviewed_at timestamptz,
  p_total_reviews integer,
  p_rating text,
  p_prev_interval integer,
  p_next_interval integer,
  p_mode text,
  p_queue_source text,
  p_client_id text,
  p_reviewed_at timestamptz
)
returns void
language plpgsql
security definer
as $$
declare
  v_user_id uuid := auth.uid();
begin
  insert into user_card_states (user_id, question_id, ease_factor, interval_days, repetitions, due_at, is_weak, weak_marked_at, last_rating, last_reviewed_at, total_reviews, updated_at)
  values (v_user_id, p_question_id, p_ease_factor, p_interval_days, p_repetitions, p_due_at, p_is_weak, p_weak_marked_at, p_last_rating, p_last_reviewed_at, p_total_reviews, now())
  on conflict (user_id, question_id) do update set
    ease_factor = excluded.ease_factor,
    interval_days = excluded.interval_days,
    repetitions = excluded.repetitions,
    due_at = excluded.due_at,
    is_weak = excluded.is_weak,
    weak_marked_at = excluded.weak_marked_at,
    last_rating = excluded.last_rating,
    last_reviewed_at = excluded.last_reviewed_at,
    total_reviews = excluded.total_reviews,
    updated_at = now();

  insert into review_logs (user_id, question_id, rating, prev_interval, next_interval, mode, queue_source, client_id, reviewed_at)
  values (v_user_id, p_question_id, p_rating, p_prev_interval, p_next_interval, p_mode, p_queue_source, p_client_id, p_reviewed_at);
end;
$$;
