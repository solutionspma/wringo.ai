-- =====================================================
-- WRINGO.AI - LEADS & REFERRALS TABLES
-- Run this in Supabase SQL Editor
-- Project: wringo.ai
-- Created: December 2024
-- =====================================================

-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- =====================================================
-- 📥 TABLE 1: LEADS
-- Core lead capture from voice/chat interactions
-- =====================================================

create table if not exists leads (
  id uuid primary key default uuid_generate_v4(),
  
  -- Contact Info
  name text,
  email text,
  phone text,
  company text,
  
  -- Lead Details  
  interest text,
  notes text,
  
  -- Source Tracking
  source text default 'wringo.ai',
  source_detail text, -- 'voice_agent', 'web_chat', 'phone_call', etc.
  conversation_id text, -- ElevenLabs conversation reference
  
  -- Status
  status text default 'new', -- 'new', 'contacted', 'qualified', 'converted', 'lost'
  
  -- Referral link (if this lead came from a referral)
  referral_code text,
  referred_by uuid references leads(id),
  
  -- Metadata
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Index for faster lookups
create index if not exists idx_leads_email on leads(email);
create index if not exists idx_leads_phone on leads(phone);
create index if not exists idx_leads_referral_code on leads(referral_code);
create index if not exists idx_leads_source on leads(source);
create index if not exists idx_leads_created_at on leads(created_at desc);

-- =====================================================
-- 🔁 TABLE 2: REFERRALS
-- Tracks referral activity from the AI Referral Engine
-- =====================================================

create table if not exists referrals (
  id uuid primary key default uuid_generate_v4(),
  
  -- Referrer (the person making the referral)
  referrer_name text,
  referrer_contact text, -- email or phone
  referrer_lead_id uuid references leads(id), -- link to leads table
  
  -- Referral Method
  referral_method text not null check (referral_method in (
    'share_link',     -- wants to share a link
    'direct_intro',   -- will make an introduction
    'provide_contact', -- providing contact info directly
    'not_sure_yet'    -- expressed interest but hasn't committed
  )),
  
  -- Referred Person (if provided)
  referred_name text,
  referred_contact text, -- email or phone
  
  -- Tracking
  referral_code text unique, -- e.g., 'WRG-8F3A2'
  notes text,
  
  -- Source
  source text default 'wringo.ai referral engine',
  conversation_id text, -- ElevenLabs conversation reference
  
  -- Status
  status text default 'pending', -- 'pending', 'contacted', 'converted', 'inactive'
  
  -- Metadata
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Indexes for referral analytics
create index if not exists idx_referrals_referral_code on referrals(referral_code);
create index if not exists idx_referrals_referrer_lead_id on referrals(referrer_lead_id);
create index if not exists idx_referrals_referral_method on referrals(referral_method);
create index if not exists idx_referrals_status on referrals(status);
create index if not exists idx_referrals_created_at on referrals(created_at desc);

-- =====================================================
-- 🔗 FUNCTION: Generate Referral Code
-- Creates short unique codes like 'WRG-8F3A2'
-- =====================================================

create or replace function generate_referral_code()
returns text as $$
declare
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- No I, O, 0, 1 for readability
  code text := 'WRG-';
  i integer;
begin
  for i in 1..5 loop
    code := code || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  end loop;
  return code;
end;
$$ language plpgsql;

-- =====================================================
-- 🔄 TRIGGER: Auto-generate referral code
-- =====================================================

create or replace function set_referral_code()
returns trigger as $$
begin
  if NEW.referral_code is null then
    -- Try up to 10 times to generate a unique code
    for i in 1..10 loop
      NEW.referral_code := generate_referral_code();
      -- Check if it's unique
      if not exists (select 1 from referrals where referral_code = NEW.referral_code) then
        exit;
      end if;
    end loop;
  end if;
  return NEW;
end;
$$ language plpgsql;

create trigger trigger_set_referral_code
  before insert on referrals
  for each row
  execute function set_referral_code();

-- =====================================================
-- 🔄 TRIGGER: Update timestamp on modification
-- =====================================================

create or replace function update_updated_at()
returns trigger as $$
begin
  NEW.updated_at = now();
  return NEW;
end;
$$ language plpgsql;

create trigger trigger_leads_updated_at
  before update on leads
  for each row
  execute function update_updated_at();

create trigger trigger_referrals_updated_at
  before update on referrals
  for each row
  execute function update_updated_at();

-- =====================================================
-- 📊 VIEW: Referral Analytics
-- Quick stats for referral performance
-- =====================================================

create or replace view referral_stats as
select
  referral_method,
  count(*) as total_referrals,
  count(case when status = 'converted' then 1 end) as converted,
  count(case when status = 'pending' then 1 end) as pending,
  round(
    count(case when status = 'converted' then 1 end)::numeric / 
    nullif(count(*), 0) * 100, 
    2
  ) as conversion_rate
from referrals
group by referral_method
order by total_referrals desc;

-- =====================================================
-- 🔐 ROW LEVEL SECURITY (RLS) - Optional
-- Uncomment to enable if needed
-- =====================================================

-- alter table leads enable row level security;
-- alter table referrals enable row level security;

-- Service role has full access
-- create policy "Service role full access - leads" on leads
--   for all using (true);
-- create policy "Service role full access - referrals" on referrals
--   for all using (true);

-- =====================================================
-- ✅ SUCCESS MESSAGE
-- =====================================================

do $$
begin
  raise notice '✅ Wringo.ai leads and referrals tables created successfully!';
  raise notice '   - leads table: stores captured contact information';
  raise notice '   - referrals table: tracks AI Referral Engine activity';
  raise notice '   - referral codes auto-generated (e.g., WRG-8F3A2)';
end $$;
