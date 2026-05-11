# Shorts Agency OS

Full-stack Next.js + Supabase app for finding, scoring, messaging, and closing short-form content leads.

## Features

- Lead Finder routes for YouTube Data API, Apify Instagram profile scraper, Google Maps Places API, and manual Instagram/X imports.
- Automated cross-platform discovery route that searches YouTube, Instagram, and Google Maps in one run, merges likely matches, and scores platform presence.
- AI scoring and outreach generation through `lib/ai-service.js`.
- Grok primary provider with model `grok-3-latest`, OpenAI-compatible xAI endpoint, and Gemini `gemini-2.0-flash` fallback.
- Unified lead profiles with independent platform outreach status.
- Duplicate lead flags based on matching email, handles, YouTube URL, or website.
- Kanban CRM pipeline with drag and drop.
- Follow-up engine for leads that have not replied after 3 days.
- Dashboard KPIs, platform conversion rates, top niche, and monthly revenue tracking.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local` and fill in keys. Use the same Supabase values for both server and browser variables:

   ```bash
   SUPABASE_URL=
   SUPABASE_ANON_KEY=
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   ```

3. Run `supabase/schema.sql` in the Supabase SQL editor.

4. Start the app:

   ```bash
   npm run dev
   ```

## Notes

- Supabase row-level security is enabled. API routes expect the browser Supabase session token.
- Without Supabase browser env vars, the UI runs in demo mode with local sample leads.
- External source routes require their corresponding API keys.
- The default finder mode is automated. It returns partial results if one source is missing or unavailable, instead of failing the whole run.

## Vercel Deploy

1. Push this folder to GitHub, then import it in Vercel as a Next.js project.

2. Add every variable from `.env.vercel.example` in Vercel Project Settings > Environment Variables.

3. In Supabase, run `supabase/schema.sql` once in the SQL editor.

4. Deploy with the default Vercel settings. This repo includes `vercel.json` for the build command and longer API timeouts on source-search and AI routes.

5. After deploy, open the Vercel URL and sign up through Supabase Auth. The app runs in demo mode if Supabase browser env vars are missing.
