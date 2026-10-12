-- EkDuniya migration 002: Stories (24-hour expiring, FB/IG-style carousel)
-- Run in Supabase SQL editor.

create table if not exists public.av_stories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  caption text default '',
  cover_emoji text default '📸',
  media_url text,
  expires_at timestamptz not null default (now() + interval '24 hours'),
  created_at timestamptz not null default now()
);

alter table public.av_stories enable row level security;

-- Everyone can read non-expired stories
drop policy if exists "stories readable" on public.av_stories;
create policy "stories readable" on public.av_stories
  for select using (expires_at > now());

-- Users can post their own stories
drop policy if exists "stories insert own" on public.av_stories;
create policy "stories insert own" on public.av_stories
  for insert with check (auth.uid() = user_id);

-- Users can delete their own stories
drop policy if exists "stories delete own" on public.av_stories;
create policy "stories delete own" on public.av_stories
  for delete using (auth.uid() = user_id);

-- Index for the carousel query
create index if not exists av_stories_expires_idx on public.av_stories (expires_at desc);
create index if not exists av_stories_user_idx on public.av_stories (user_id);
