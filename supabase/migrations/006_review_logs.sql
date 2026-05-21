create table review_logs (
  id             bigserial primary key,
  user_id        uuid not null references auth.users(id) on delete cascade,
  question_id    text not null references questions(id) on delete cascade,
  rating         text not null check (rating in ('again','hard','good','easy')),
  prev_interval  integer not null,
  next_interval  integer not null,
  mode           text not null check (mode in ('review','practice')),
  queue_source   text not null check (queue_source in ('weak','due','new','practice','library_set')),
  client_id      text,
  reviewed_at    timestamptz not null default now()
);

create index idx_review_logs_user on review_logs (user_id);
create index idx_review_logs_date on review_logs (user_id, reviewed_at);
create index idx_review_logs_question on review_logs (user_id, question_id);

alter table review_logs enable row level security;

create policy "Users can read own review logs"
  on review_logs for select
  using (auth.uid() = user_id);

create policy "Users can insert own review logs"
  on review_logs for insert
  with check (auth.uid() = user_id);
