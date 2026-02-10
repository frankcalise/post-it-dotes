import type { ParsedStatus, ParsedStatusPlayer } from "./types"

const MATCH_ID_RE = /\[Client\]\s+Lobby MatchID:\s+(\d+)/
const PLAYER_RE = /^\[Client\]\s+(\d+)\s+[^']+\s*'(.+)'$/

export function parseStatus(text: string): ParsedStatus {
  const lines = text.replace(/\r/g, "").split("\n")
  let matchId: string | null = null
  const players: ParsedStatusPlayer[] = []

  for (const line of lines) {
    const matchIdMatch = line.match(MATCH_ID_RE)
    if (matchIdMatch) {
      matchId = matchIdMatch[1]
      continue
    }

    const playerMatch = line.match(PLAYER_RE)
    if (playerMatch) {
      const slot = parseInt(playerMatch[1], 10)
      if (slot === 0) continue // skip SourceTV

      const name = playerMatch[2]

      players.push({
        slot,
        name,
        team: slot <= 5 ? 1 : 2,
      })
    }
  }

  return { matchId, players }
}

export function identifyUsers(
  players: ParsedStatusPlayer[],
  dotaNames: Map<string, string> // lowercase dota name -> profile id
): Map<number, string> {
  const identified = new Map<number, string>() // slot -> profile id
  for (const player of players) {
    const profileId = dotaNames.get(player.name.toLowerCase())
    if (profileId) {
      identified.set(player.slot, profileId)
    }
  }
  return identified
}
