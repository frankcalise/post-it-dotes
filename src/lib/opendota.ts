import type { OpenDotaHero, OpenDotaMatchData, OpenDotaPlayerHero } from "./types"

const BASE_URL = "https://api.opendota.com/api"
const RATE_LIMIT_MS = 1100 // ~60 req/min with margin

let lastRequestTime = 0

async function rateLimitedRequest(url: string, init?: RequestInit): Promise<Response> {
  const now = Date.now()
  const timeSinceLastRequest = now - lastRequestTime
  if (timeSinceLastRequest < RATE_LIMIT_MS) {
    await new Promise((r) => setTimeout(r, RATE_LIMIT_MS - timeSinceLastRequest))
  }
  lastRequestTime = Date.now()
  return fetch(url, init)
}

function rateLimitedFetch(url: string): Promise<Response> {
  return rateLimitedRequest(url)
}

export async function fetchMatch(matchId: number): Promise<OpenDotaMatchData> {
  const res = await rateLimitedFetch(`${BASE_URL}/matches/${matchId}`)
  if (!res.ok) throw new Error(`OpenDota match fetch failed: ${res.status}`)
  return res.json()
}

export async function fetchPlayerHeroes(
  accountId: number,
  turboOnly = true
): Promise<OpenDotaPlayerHero[]> {
  const params = turboOnly ? "?game_mode=23" : ""
  const res = await rateLimitedFetch(
    `${BASE_URL}/players/${accountId}/heroes${params}`
  )
  if (!res.ok) throw new Error(`OpenDota player heroes fetch failed: ${res.status}`)
  return res.json()
}

let heroCache: OpenDotaHero[] | null = null

export async function fetchHeroes(): Promise<OpenDotaHero[]> {
  if (heroCache) return heroCache
  const res = await rateLimitedFetch(`${BASE_URL}/heroes`)
  if (!res.ok) throw new Error(`OpenDota heroes fetch failed: ${res.status}`)
  heroCache = await res.json()
  return heroCache!
}

export function getHeroName(heroes: OpenDotaHero[], heroId: number): string {
  return heroes.find((h) => h.id === heroId)?.localized_name ?? `Hero #${heroId}`
}

export async function requestParse(matchId: number): Promise<{ job: { jobId: number } }> {
  const res = await rateLimitedRequest(`${BASE_URL}/request/${matchId}`, { method: "POST" })
  if (!res.ok) throw new Error(`OpenDota parse request failed: ${res.status}`)
  return res.json()
}

const POLL_INTERVAL_MS = 3000
const MAX_POLL_ATTEMPTS = 60

export async function pollParseJob(jobId: number, signal?: AbortSignal): Promise<void> {
  for (let i = 0; i < MAX_POLL_ATTEMPTS; i++) {
    signal?.throwIfAborted()
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS))
    signal?.throwIfAborted()

    const res = await rateLimitedRequest(`${BASE_URL}/request/${jobId}`, { signal })
    if (!res.ok) throw new Error(`OpenDota parse poll failed: ${res.status}`)

    const data = await res.json()
    if (!data?.type) return // job complete when no type field or null response
  }
  throw new Error("Parse timed out after 3 minutes")
}
