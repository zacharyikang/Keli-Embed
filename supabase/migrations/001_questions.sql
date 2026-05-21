create table questions (
  id              text primary key,
  title           text not null,
  body            text not null,
  type            text not null check (type in ('concept','choice','code-reading')),
  direction       text not null references directions(slug),
  difficulty      text not null check (difficulty in ('easy','medium','hard')),
  tags            text[] default '{}',
  answer          text not null,
  explanation     text,
  choices         jsonb,
  companies       text[] default '{}',
  interview_year  integer,
  interview_round text check (interview_round in ('笔试','一面','二面','三面','终面')),
  source          text,
  is_interview    boolean generated always as (array_length(companies, 1) > 0) stored,
  is_premium      boolean default false,
  deleted_at      timestamptz,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create index idx_questions_direction on questions (direction);
create index idx_questions_difficulty on questions (difficulty);
create index idx_questions_tags on questions using gin (tags);
create index idx_questions_companies on questions using gin (companies);
create index idx_questions_deleted on questions (deleted_at) where deleted_at is null;

alter table questions enable row level security;

create policy "Anyone can read non-deleted questions"
  on questions for select
  using (deleted_at is null);
