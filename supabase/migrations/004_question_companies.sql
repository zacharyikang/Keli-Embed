create table question_companies (
  question_id text not null references questions(id) on delete cascade,
  company_slug text not null references companies(slug) on delete cascade,
  primary key (question_id, company_slug)
);

alter table question_companies enable row level security;

create policy "Anyone can read question_companies"
  on question_companies for select
  using (true);
