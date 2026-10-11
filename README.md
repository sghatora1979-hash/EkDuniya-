# EkDuniya — v1 ("One World")

India's next-generation social network: feed, reels, family tree, password-locked Briefcase,
daily-colour messages, rewards, business network, ID verification, Web3-ready profiles.
6 languages: English, Hindi, Punjabi, Tamil, Telugu, Bengali.

## What's real in v1
- **Real auth**: Supabase email OTP (register + login), sessions, logout
- **Real database**: profiles, posts, likes, reels, family, vault records, messages, rewards, KYC, business pages
- **Row-level security**: private data (family, vault, messages, KYC) visible only to its owner
- **Storage**: public media bucket + private vault/KYC buckets
- **Honest limits**: Aadhaar docs are stored as "pending" — "verified" only via an approved,
  compliant process (never automatic). Briefcase PIN gates access in the browser;
  true end-to-end encryption ships in v2. Private data never goes on public blockchains.

## Setup (do once)

### 1. New Supabase project
1. Go to supabase.com → New project (free tier allows 2 projects).
2. Name it `apnaverse`, pick a region close to India (South Asia / Mumbai).
3. Wait for it to finish provisioning.

### 2. Run the database migration
1. In Supabase: **SQL Editor → New query**.
2. Open `supabase/migrations/001_apnaverse.sql` from this zip, copy everything, paste, **Run**.
3. You should see "Success".

### 3. GitHub
1. Create a new repo (e.g. `apnaverse`), upload this zip's files (folders intact).
2. Do NOT commit `.env.local`.

### 4. Vercel
1. vercel.com → Add New → Project → Import the repo → Deploy.
2. After deploy: **Project → Settings → Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL` = your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your Supabase anon key
3. **Redeploy** so the variables take effect.

### 5. Test
1. Open the site → Create Account → enter email → code arrives by email → verify.
2. Post, add family, lock the Briefcase, chat (colour changes daily!), earn rewards.

## Name
Working name is **EkDuniya** — changeable. To rename: replace "EkDuniya" in
`app/layout.tsx`, `components/ui.tsx`, `app/page.tsx` and `package.json`.
