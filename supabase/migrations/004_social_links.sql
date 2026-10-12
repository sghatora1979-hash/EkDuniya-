-- EkDuniya migration 004: social links on profiles
-- Run in Supabase SQL editor.

alter table public.av_profiles
  add column if not exists social_links jsonb not null default '{}'::jsonb;
