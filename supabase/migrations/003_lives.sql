-- EkDuniya migration 003: Live streams
-- Run in Supabase SQL editor.

create table if not exists public.av_lives (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Live',
  status text not null default 'live' check (status in ('live', 'ended')),
  viewer_count int not null default 0,
  started_at timestamptz not null default now(),
  ended_at timestamptz
);

alter table public.av_lives enable row level security;

drop policy if exists "lives readable" on public.av_lives;
create policy "lives readable" on public.av_lives for select using (true);

drop policy if exists "lives insert own" on public.av_lives;
create policy "lives insert own" on public.av_lives
  for insert with check (auth.uid() = user_id);

drop policy if exists "lives update own" on public.av_lives;
create policy "lives update own" on public.av_lives
  for update using (auth.uid() = user_id);

create index if not exists av_lives_status_idx on public.av_lives (status, started_at desc);
