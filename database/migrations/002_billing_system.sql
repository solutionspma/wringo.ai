-- WringoAI Complete Database Schema

-- Users table
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  stripe_customer_id text unique,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Subscriptions table
create table if not exists subscriptions (
  user_id uuid references users(id) on delete cascade,
  stripe_subscription_id text unique not null,
  stripe_price_id text not null,
  plan text not null,
  status text not null,
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  cancel_at_period_end boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  primary key (user_id)
);

-- Entitlements table
create table if not exists entitlements (
  user_id uuid references users(id) on delete cascade,
  key text not null,
  value jsonb not null default '{}'::jsonb,
  expires_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  primary key (user_id, key)
);

-- Credits table
create table if not exists credits (
  user_id uuid references users(id) on delete cascade,
  credit_type text not null,
  balance integer not null default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  primary key (user_id, credit_type)
);

-- Usage log table
create table if not exists usage_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  usage_type text not null,
  amount integer not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default now()
);

-- Indexes for performance
create index if not exists idx_subscriptions_user_id on subscriptions(user_id);
create index if not exists idx_subscriptions_stripe_id on subscriptions(stripe_subscription_id);
create index if not exists idx_entitlements_user_id on entitlements(user_id);
create index if not exists idx_credits_user_id on credits(user_id);
create index if not exists idx_usage_log_user_id on usage_log(user_id);
create index if not exists idx_usage_log_created_at on usage_log(created_at desc);

-- Enable Row Level Security
alter table users enable row level security;
alter table subscriptions enable row level security;
alter table entitlements enable row level security;
alter table credits enable row level security;
alter table usage_log enable row level security;

-- RLS Policies - Users can read their own data
create policy "Users can read own data"
  on users for select
  using (auth.uid() = id);

create policy "Users can read own subscriptions"
  on subscriptions for select
  using (auth.uid() = user_id);

create policy "Users can read own entitlements"
  on entitlements for select
  using (auth.uid() = user_id);

create policy "Users can read own credits"
  on credits for select
  using (auth.uid() = user_id);

create policy "Users can read own usage"
  on usage_log for select
  using (auth.uid() = user_id);

-- Server role (service_role) has full access via bypass RLS
