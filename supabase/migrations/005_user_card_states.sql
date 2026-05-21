create table user_card_states (
  user_id          uuid not null references auth.users(id) on delete cascade,
  question_id      text not null references questions(id) on delete cascade,
  ease_factor      float not null default 2.5,
  interval_days    integer not null default 0,
  repetitions      integer not null default 0,
  due_at           timestamptz not null default now(),
  is_weak          boolean not null default false,
  weak_marked_at   timestamptz,
  last_rating      text check (last_rating in ('again','hard','good','easy')),
  last_reviewed_at timestamptz,
  total_reviews    integer not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  primary key (user_id, question_id)
);

create index idx_card_states_user on user_card_states (user_id);
create index idx_card_states_due on user_card_states (user_id, due_at)
  where is_weak = false;
create index idx_card_states_weak on user_card_states (user_id, is_weak)
  where is_weak = true;

alter table user_card_states enable row level security;

create policy "Users can read own card states"
  on user_card_states for select
  using (auth.uid() = user_id);

create policy "Users can insert own card states"
  on user_card_states for insert
  with check (auth.uid() = user_id);

create policy "Users can update own card states"
  on user_card_states for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own card states"
  on user_card_states for delete
  using (auth.uid() = user_id);
