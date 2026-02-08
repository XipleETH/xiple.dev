# hubfol.io (MVP)

Product base for a profile-link platform with routes like `/username`.

## Stack

- Next.js (App Router)
- Supabase Auth + Postgres
- Vercel deployment

## Current routes

- `/` single-page studio (wallet connect + profile/link editor)
- `/auth` compatibility redirect to `/`
- `/:username` public profile page (owner can open edit mode when connected)

## 1) Local setup

```bash
npm install
cp .env.example .env.local
```

Set env values in `.env.local`:

- `NEXT_PUBLIC_APP_URL=http://localhost:3000`
- `NEXT_PUBLIC_SUPABASE_URL=...`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY=...`

Then run:

```bash
npm run dev
```

## 2) Supabase setup

Open Supabase SQL Editor and run:

- `supabase/schema.sql`

This creates:

- `profiles`
- `profile_links`
- `profile_links.image_url`
- Storage buckets: `avatars`, `link-images`
- RLS policies
- trigger to auto-create profile rows for new auth users

## 3) Supabase Auth setup

In Supabase Auth settings:

- Site URL:
  - `https://xiple-dev.vercel.app` (for now)
- Redirect URLs:
  - `https://xiple-dev.vercel.app/**`
  - `https://hubfol.io/**` (future)
  - `https://www.hubfol.io/**` (future)
  - `http://localhost:3000/**`

In Supabase Auth providers:

- Enable `Web3` provider.
- Enable both chains:
  - `Ethereum` (for Base, MetaMask, Trust Wallet)
  - `Solana` (for Phantom)

## 4) Vercel setup

- Import this GitHub repo in Vercel
- Framework: Next.js (auto)
- Add env vars:
  - `NEXT_PUBLIC_APP_URL=https://xiple-dev.vercel.app`
  - `NEXT_PUBLIC_SUPABASE_URL=...`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY=...`

Deploy.

## 5) Domain migration later

When buying `hubfol.io`:

1. Add domain in Vercel and set as Primary.
2. Update `NEXT_PUBLIC_APP_URL` to `https://hubfol.io`.
3. Update Supabase `Site URL` and keep both old/new redirect URLs during transition.

## Platform/social catalog currently included

- Platforms: Steam, Windows, Android, Reddit, Nintendo, PlayStation, Xbox, Web
- Social: X, GitHub, YouTube, Twitch, Facebook, Instagram, TikTok, Discord, Reddit
