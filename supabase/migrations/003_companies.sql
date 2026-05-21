create table companies (
  slug          text primary key,
  name          text not null,
  full_name     text,
  logo_url      text,
  description   text,
  category      text,
  display_order integer not null default 0
);

alter table companies enable row level security;

create policy "Anyone can read companies"
  on companies for select
  using (true);
