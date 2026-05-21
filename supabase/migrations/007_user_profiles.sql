create table user_profiles (
  user_id       uuid primary key references auth.users(id) on delete cascade,
  username      text,
  avatar_url    text,
  daily_goal    integer not null default 10,
  streak_count  integer not null default 0,
  last_active_at timestamptz not null default now(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table user_profiles enable row level security;

create policy "Users can read own profile"
  on user_profiles for select
  using (auth.uid() = user_id);

create policy "Users can update own profile"
  on user_profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can insert own profile"
  on user_profiles for insert
  with check (auth.uid() = user_id);
