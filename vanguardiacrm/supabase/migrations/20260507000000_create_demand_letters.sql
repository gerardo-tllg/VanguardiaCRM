create table if not exists demand_letters (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  content text,
  version integer default 1,
  model text default 'claude-sonnet-4-20250514',
  generated_at timestamptz,
  last_saved_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(case_id)
);

alter table demand_letters enable row level security;

create policy "Authenticated users can manage demand letters"
  on demand_letters
  for all
  to authenticated
  using (true)
  with check (true);
