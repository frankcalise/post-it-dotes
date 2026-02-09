# Post-it Dotes

A shared Dota 2 player scouting platform for small friend groups. Track players you encounter, leave notes, spot hero spammers, and coordinate bans — all powered by OpenDota's public API.

## What It Does

**Before/during a match:** Search for a player by name. If they're someone you've played with before, instantly see notes your group has left, their most-played heroes, and tags like "skilled," "toxic," or "trustworthy."

**After a match:** Drop in a Match ID. The app pulls all 10 players with their permanent Steam IDs, sorted by team. Leave notes, tag players, and move on. Name changes don't matter — the app tracks players by Steam ID, so "xXx_Shadow_xXx" renaming to "John" won't lose your history.

**Ban Board:** Paste in enemy player names before a match. For known players, the app suggests which heroes your party should ban based on their most-played heroes and Turbo winrates. Prioritizes heroes that multiple enemies share.

**Shared database:** Everything is shared across all members. One person leaves a note, everyone sees it.

## Planned Tech Stack

- **Frontend:** Next.js (React)
- **Backend/DB:** Supabase (Auth, Postgres, real-time sync)
- **Hosting:** Vercel
- **Data Source:** [OpenDota API](https://docs.opendota.com/) (free, no auth required for basic queries)

## Data Model

### Players
- Steam ID (unique, permanent identifier)
- Known names (array of all aliases seen)
- Top heroes (cached from OpenDota, with games played and winrates)

### Notes
- Linked to a player and an author
- Free-text content
- Tags (e.g. `skilled`, `toxic`, `trustworthy`)
- Optional Match ID for context

### Matches (optional)
- Cached OpenDota match data (all 10 players, teams, hero picks)

## Key Workflows

1. **Post-match import** — Enter a Match ID, fetch all players via OpenDota, review and annotate
2. **Name search** — Fuzzy search against known aliases in your database
3. **Ban recommendations** — Aggregate top heroes across identified enemies, rank by threat
4. **Player merge** — If a name-only entry later matches a Steam ID from a match import, merge records

## OpenDota API Endpoints Used

| Endpoint | Purpose |
|---|---|
| `GET /api/matches/{match_id}` | Full match data with all player account IDs and team slots |
| `GET /api/players/{account_id}` | Player profile and recent names |
| `GET /api/players/{account_id}/heroes?game_mode=23` | Top heroes filtered to Turbo mode |
| `GET /api/heroes` | Static hero ID-to-name mapping (cache once) |

No API key needed. Rate limited to 60 requests/min (plenty for this use case).

## Future Ideas

- Tag-based color coding (green = trusted, red = avoid)
- Frequency tracking ("you've played against this person 7 times")
- Private vs. shared notes
- Browser extension overlay for Dotabuff/OpenDota pages
