import type { Config } from "@netlify/functions"
import { createClient } from "@supabase/supabase-js"
import { saveOpenDotaData } from "../../src/lib/opendota-save.js"

const OPENDOTA_BASE = "https://api.opendota.com/api"
const RATE_LIMIT_MS = 1100
const BATCH_SIZE = 3

function env(key: string): string {
  const val = process.env[key]
  if (!val) throw new Error(`Missing env var: ${key}`)
  return val
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

async function rateLimitedFetch(url: string, init?: RequestInit): Promise<Response> {
  await sleep(RATE_LIMIT_MS)
  return fetch(url, init)
}

export default async function handler() {
  const supabase = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"))

  // Phase B — Harvest matches where parse was previously requested
  const { data: harvestable, error: harvestErr } = await supabase
    .from("matches")
    .select("id, dota_match_id, opendota_parse_attempts")
    .eq("opendota_fetched", false)
    .not("opendota_parse_requested_at", "is", null)
    .lt("opendota_parse_requested_at", new Date(Date.now() - 5 * 60_000).toISOString())
    .lt("opendota_parse_attempts", 5)
    .gt("created_at", new Date(Date.now() - 48 * 3600_000).toISOString())
    .order("created_at", { ascending: true })
    .limit(BATCH_SIZE)

  if (harvestErr) {
    console.error("Harvest query error:", harvestErr)
  }

  for (const match of harvestable ?? []) {
    try {
      const res = await rateLimitedFetch(`${OPENDOTA_BASE}/matches/${match.dota_match_id}`)
      if (!res.ok) {
        console.warn(`OpenDota GET /matches/${match.dota_match_id} returned ${res.status}`)
        await supabase
          .from("matches")
          .update({ opendota_parse_attempts: (match.opendota_parse_attempts ?? 0) + 1 })
          .eq("id", match.id)
        continue
      }

      const data = await res.json()
      const hasHeroData = data.players?.some((p: any) => p.hero_id != null && p.hero_id !== 0)

      if (hasHeroData) {
        await saveOpenDotaData(supabase, match.id, data)
        console.log(`Harvested match ${match.dota_match_id}`)
      } else {
        // Parse not ready — bump attempts and re-request
        await supabase
          .from("matches")
          .update({
            opendota_parse_attempts: (match.opendota_parse_attempts ?? 0) + 1,
            opendota_parse_requested_at: new Date().toISOString(),
          })
          .eq("id", match.id)

        await rateLimitedFetch(`${OPENDOTA_BASE}/request/${match.dota_match_id}`, { method: "POST" })
        console.log(`Re-requested parse for match ${match.dota_match_id}`)
      }
    } catch (err) {
      console.error(`Error harvesting match ${match.dota_match_id}:`, err)
    }
  }

  // Phase A — Request parse for newly-eligible matches
  const { data: requestable, error: requestErr } = await supabase
    .from("matches")
    .select("id, dota_match_id")
    .eq("opendota_fetched", false)
    .not("dota_match_id", "is", null)
    .is("opendota_parse_requested_at", null)
    .lt("created_at", new Date(Date.now() - 45 * 60_000).toISOString())
    .gt("created_at", new Date(Date.now() - 48 * 3600_000).toISOString())
    .order("created_at", { ascending: true })
    .limit(BATCH_SIZE)

  if (requestErr) {
    console.error("Request query error:", requestErr)
  }

  for (const match of requestable ?? []) {
    try {
      const res = await rateLimitedFetch(`${OPENDOTA_BASE}/request/${match.dota_match_id}`, {
        method: "POST",
      })

      if (!res.ok) {
        console.warn(`OpenDota POST /request/${match.dota_match_id} returned ${res.status}`)
        continue
      }

      await supabase
        .from("matches")
        .update({ opendota_parse_requested_at: new Date().toISOString() })
        .eq("id", match.id)

      console.log(`Requested parse for match ${match.dota_match_id}`)
    } catch (err) {
      console.error(`Error requesting parse for match ${match.dota_match_id}:`, err)
    }
  }
}

export const config: Config = {
  schedule: "*/10 * * * *",
}
