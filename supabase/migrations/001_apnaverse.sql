-- ApnaVerse v1 schema — run in a NEW Supabase project's SQL Editor.
-- Honest scope: real auth + database. OTP via Supabase email codes.
-- Aadhaar docs land in a PRIVATE bucket as "pending" — real e-KYC needs a UIDAI-licensed provider.

create table if not exists public.av_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  full_name text,
  phone text,
  avatar_emoji text default '🙂',
  bio text default '',
  lang text default 'en',
  kyc_status text default 'none', -- none | pending | verified
  wallet_address text,
  created_at timestamptz default now()
);

create table if not exists public.av_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.av_profiles(id) on delete cascade,
  text text not null,
  image_url text,
  likes_count int default 0,
  created_at timestamptz default now()
);

create table if not exists public.av_likes (
  post_id uuid not null references public.av_posts(id) on delete cascade,
  user_id uuid not null references public.av_profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (post_id, user_id)
);

create table if not exists public.av_reels (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.av_profiles(id) on delete cascade,
  title text not null,
  video_url text,
  cover_emoji text default '🎬',
  views int default 0,
  created_at timestamptz default now()
);

create table if not exists public.av_family (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.av_profiles(id) on delete cascade,
  name text not null,
  relation text not null,
  generation int not null default 3, -- 1 = great-grandparents … 4 = children
  birth_year int,
  note text default '',
  photo_url text,
  created_at timestamptz default now()
);

create table if not exists public.av_vault (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.av_profiles(id) on delete cascade,
  title text not null,
  kind text not null default 'doc', -- doc | photo
  file_url text,
  created_at timestamptz default now()
);

create table if not exists public.av_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.av_profiles(id) on delete cascade,
  receiver_id uuid not null references public.av_profiles(id) on delete cascade,
  text text not null,
  created_at timestamptz default now()
);

create table if not exists public.av_rewards (
  user_id uuid primary key references public.av_profiles(id) on delete cascade,
  points int default 0,
  updated_at timestamptz default now()
);

create table if not exists public.av_kyc (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.av_profiles(id) on delete cascade,
  doc_type text not null default 'aadhaar', -- aadhaar | pan | other
  file_url text,
  status text default 'pending', -- pending | verified | rejected (verified ONLY via licensed provider)
  created_at timestamptz default now()
);

create table if not exists public.av_business (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.av_profiles(id) on delete cascade,
  name text not null,
  category text not null,
  city text default '',
  description text default '',
  created_at timestamptz default now()
);

alter table public.av_profiles enable row level security;
alter table public.av_posts enable row level security;
alter table public.av_likes enable row level security;
alter table public.av_reels enable row level security;
alter table public.av_family enable row level security;
alter table public.av_vault enable row level security;
alter table public.av_messages enable row level security;
alter table public.av_rewards enable row level security;
alter table public.av_kyc enable row level security;
alter table public.av_business enable row level security;

-- Profiles: public read, own write
create policy "av_profiles read" on public.av_profiles for select using (true);
create policy "av_profiles own write" on public.av_profiles for all using (auth.uid() = id) with check (auth.uid() = id);

-- Posts & reels: public read, own write
create policy "av_posts read" on public.av_posts for select using (true);
create policy "av_posts own insert" on public.av_posts for insert with check (auth.uid() = user_id);
create policy "av_posts own update" on public.av_posts for update using (auth.uid() = user_id);
create policy "av_posts own delete" on public.av_posts for delete using (auth.uid() = user_id);

create policy "av_reels read" on public.av_reels for select using (true);
create policy "av_reels own write" on public.av_reels for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "av_likes read" on public.av_likes for select using (true);
create policy "av_likes own write" on public.av_likes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Private tables: owner only
create policy "av_family own" on public.av_family for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "av_vault own" on public.av_vault for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "av_rewards own" on public.av_rewards for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "av_kyc own" on public.av_kyc for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "av_business read" on public.av_business for select using (true);
create policy "av_business own write" on public.av_business for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Messages: participants only
create policy "av_messages own" on public.av_messages for select using (auth.uid() = sender_id or auth.uid() = receiver_id);
create policy "av_messages send" on public.av_messages for insert with check (auth.uid() = sender_id);

-- Storage buckets
insert into storage.buckets (id, name, public) values ('av-media', 'av-media', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('av-vault', 'av-vault', false) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('av-kyc', 'av-kyc', false) on conflict (id) do nothing;

create policy "av-media public read" on storage.objects for select using (bucket_id = 'av-media');
create policy "av-media auth upload" on storage.objects for insert with check (bucket_id = 'av-media' and auth.role() = 'authenticated');
create policy "av-vault own" on storage.objects for all using (bucket_id = 'av-vault' and auth.role() = 'authenticated') with check (bucket_id = 'av-vault' and auth.role() = 'authenticated');
create policy "av-kyc own" on storage.objects for all using (bucket_id = 'av-kyc' and auth.role() = 'authenticated') with check (bucket_id = 'av-kyc' and auth.role() = 'authenticated');

-- Auto-create profile + rewards wallet on signup
create or replace function public.av_handle_signup()
returns trigger language plpgsql security definer as $$
begin
  insert into public.av_profiles (id, full_name) values (new.id, coalesce(new.raw_user_meta_data->>'full_name',''))
  on conflict (id) do nothing;
  insert into public.av_rewards (user_id, points) values (new.id, 100)
  on conflict (user_id) do nothing; -- 100 welcome points
  return new;
end $$;

drop trigger if exists av_on_signup on auth.users;
create trigger av_on_signup after insert on auth.users for each row execute function public.av_handle_signup();

-- Reward points helper (only the owner can add to their own wallet)
create or replace function public.av_add_points(uid uuid, pts int)
returns void language plpgsql security definer as $$
begin
  if auth.uid() != uid then raise exception 'not owner'; end if;
  insert into public.av_rewards (user_id, points) values (uid, pts)
  on conflict (user_id) do update set points = public.av_rewards.points + pts, updated_at = now();
end $$;
