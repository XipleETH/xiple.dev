# links.ngo (MVP)

Profile-link platform with public routes like `/username`.

## Stack

- Next.js App Router
- Supabase Auth + Postgres + Storage
- Vercel deploy

## Routes

- `/` editor (wallet login + profile + links)
- `/:username` public profile page
- `/auth` redirects to `/`

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Required env vars:

- `NEXT_PUBLIC_APP_URL=http://localhost:3000`
- `NEXT_PUBLIC_SUPABASE_URL=...`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY=...`

## Supabase setup

Run SQL in Supabase SQL Editor:

- `supabase/schema.sql`

This creates:

- `profiles`
- `profile_links`
- storage buckets: `avatars`, `link-images`
- profile personalization fields:
  - `profile_theme`
  - `profile_layout`
  - `avatar_frame`
  - `link_style`
- RLS policies and trigger for new auth users

## Auth setup (Supabase)

In Auth providers, enable Web3:

- Ethereum
- Solana

Set Auth URLs to your deploy URL and localhost.

## Deploy (Vercel)

- Import repo
- Framework: Next.js
- Add env vars
- Deploy

