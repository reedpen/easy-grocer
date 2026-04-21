# Easy Grocer

Easy Grocer is a personal-first progressive web app for meal planning and
Walmart cart handoff.

This repository currently includes Phase 0 scaffolding:

- Next.js 16 (App Router, TypeScript, Tailwind)
- Supabase SSR client wiring with `proxy.ts` token refresh flow
- Serwist service worker pipeline + installable web manifest
- Offline fallback route at `/~offline`
- Phase 1 auth/profile foundation (`/login`, `/onboarding/profile`, `/dashboard`)
- Phase 2 preferences persistence (`/onboarding/preferences`)

## Prerequisites

- Node.js 20+
- npm 10+

## Environment setup

Copy `.env.example` to `.env.local` and fill in your Supabase values:

```bash
cp .env.example .env.local
```

Required values:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_SITE_URL` (defaults to `http://localhost:3000` for local)
- `SPOONACULAR_API_KEY` (required for live Phase 3 generation; optional fallback to mock data)

## Local development

Start development mode:

```bash
npm run dev
```

This runs both:

- `serwist build --watch` (service worker rebuilds)
- `next dev` (web app)

Open [http://localhost:3000](http://localhost:3000).

## Scripts

- `npm run dev` - start Next.js + Serwist watcher
- `npm run dev:once` - build service worker once, then run Next.js
- `npm run lint` - run ESLint
- `npm run typecheck` - run TypeScript checks
- `npm run build` - production build + service worker build

## Current feature routes

- `/login` - magic link and Google sign-in
- `/onboarding/profile` - profile and calorie target setup
- `/onboarding/preferences` - dietary, fasting, and budget preferences
- `/dashboard` - saved target overview

## Supabase migrations

Apply both migrations in order:

1. `supabase/migrations/0001_phase1_profiles.sql`
2. `supabase/migrations/0002_phase2_preferences.sql`
3. `supabase/migrations/0003_phase3_meal_plans.sql`

## CI

GitHub Actions CI (`.github/workflows/ci.yml`) runs:

1. `npm ci`
2. `npm run lint`
3. `npm run typecheck`
4. `npm run build`
