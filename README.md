# Post-it Dotes

A shared Dota 2 player scouting platform for small friend groups. Track players you encounter, leave notes, spot hero spammers, and coordinate bans — all powered by OpenDota's public API.

## What It Does

**Before/during a match:** Paste the in-game `status` console output. The app parses all 10 players, identifies your group members, and lets you tag and annotate opponents in real-time.

**After a match:** Fetch enriched data from OpenDota — hero picks, KDA, Steam IDs. Name changes don't matter — the app tracks players by Steam ID, so aliases won't lose your history.

**Shared database:** Everything is shared across all members. One person leaves a note, everyone sees it instantly via Supabase Realtime.

## Tech Stack

- **Frontend:** Vite + React 19 + TypeScript + Tailwind CSS v4 + shadcn/ui
- **Backend/DB:** Supabase (Postgres, Discord OAuth, Realtime)
- **Package Manager:** Bun
- **Hosting:** Netlify (SPA)
- **Data Source:** [OpenDota API](https://docs.opendota.com/) (free, no auth required)

## Getting Started

1. Clone the repo and install dependencies:
   ```bash
   bun install
   ```

2. Copy `.env.example` to `.env` and fill in your Supabase credentials:
   ```bash
   cp .env.example .env
   ```

3. Run the SQL migration in your Supabase dashboard:
   - Open `supabase/migrations/001_initial_schema.sql`
   - Paste into the Supabase SQL Editor and run

4. Configure Discord OAuth in Supabase:
   - Create a Discord application at the Discord Developer Portal
   - Add OAuth2 redirect URL: `https://your-project.supabase.co/auth/v1/callback`
   - Add Discord provider in Supabase Auth settings

5. Start the dev server:
   ```bash
   bun dev
   ```

## Keyboard Shortcuts

| Key | Action | Scope |
|-----|--------|-------|
| `N` | Open new game dialog | Global |
| `I` | Navigate up in player list | Match view |
| `K` | Navigate down in player list | Match view |
| `E` | Edit selected player (inline notes) | Match view |
| `T` | Open tag picker for selected player | Match view |
| `Esc` | Close dialog / exit edit mode | Global |

## OpenDota API Endpoints Used

| Endpoint | Purpose |
|---|---|
| `GET /api/matches/{match_id}` | Full match data with all player account IDs |
| `GET /api/players/{account_id}/heroes?game_mode=23` | Top heroes filtered to Turbo mode |
| `GET /api/heroes` | Static hero ID-to-name mapping (cached locally) |

No API key needed. Rate limited to ~60 requests/min.

## Deployment

Configured for Netlify as a static SPA with client-side routing redirect.

### First-time setup

1. Install the Netlify CLI and log in:
   ```bash
   bun add -g netlify-cli
   netlify login
   ```

2. Build the project:
   ```bash
   bun run build
   ```

3. Deploy — you'll be prompted to create a new site:
   ```bash
   netlify deploy --prod --dir=dist
   ```

4. Set environment variables in the Netlify dashboard under **Site settings > Environment variables**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

5. Update auth redirect URLs:
   - **Discord Developer Portal:** Add your Netlify URL (e.g. `https://your-site.netlify.app`) as an OAuth2 redirect
   - **Supabase Auth settings:** Add the Netlify URL to **Site URL** and **Redirect URLs**

6. Redeploy so the env vars take effect:
   ```bash
   bun run build && netlify deploy --prod --dir=dist
   ```

### Subsequent deploys

```bash
bun run build && netlify deploy --prod --dir=dist
```
