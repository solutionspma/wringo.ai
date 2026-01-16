create table render_jobs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid,
  type text,
  payload jsonb,
  status text default 'queued',
  result_url text,
  error text,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- User settings table for storing API keys, payment info, etc.
create table user_settings (
  id uuid default uuid_generate_v4() primary key,
  user_id text unique not null,
  settings jsonb default '{}',
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- Enable row level security
alter table user_settings enable row level security;

-- Policy to allow users to read/write their own settings
create policy "Users can manage own settings" on user_settings
  for all using (true) with check (true);
