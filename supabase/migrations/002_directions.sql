create table directions (
  slug         text primary key,
  name         text not null,
  description  text,
  icon         text,
  display_order integer not null default 0
);

alter table directions enable row level security;

create policy "Anyone can read directions"
  on directions for select
  using (true);
