export type Profile = {
  id: string
  discord_username: string | null
  display_name: string | null
  dota_names: string[]
  steam_account_id: number | null
  created_at: string
}

export type Player = {
  id: string
  steam_account_id: number | null
  known_names: string[]
  top_heroes: HeroStat[]
  top_heroes_updated_at: string | null
  profile_id: string | null
  created_at: string
}

export type HeroStat = {
  hero_id: number
  games: number
  win: number
}

export type Match = {
  id: string
  dota_match_id: number | null
  raw_status_text: string | null
  opendota_fetched: boolean
  opendota_data: OpenDotaMatchData | null
  our_team_slot: 1 | 2 | null
  created_by: string | null
  created_at: string
}

export type MatchPlayer = {
  id: string
  match_id: string
  player_id: string
  slot: number
  team: number
  display_name: string | null
  hero_id: number | null
  kills: number | null
  deaths: number | null
  assists: number | null
}

export type Tag = {
  id: string
  name: string
  color: string
  created_by: string | null
  created_at: string
}

export type PlayerTag = {
  player_id: string
  tag_id: string
  tagged_by: string | null
  created_at: string
}

export type Note = {
  id: string
  player_id: string
  author_id: string | null
  content: string
  match_id: string | null
  created_at: string
  updated_at: string
}

// Enriched types for UI
export type MatchPlayerWithDetails = MatchPlayer & {
  player: Player & {
    tags: (PlayerTag & { tag: Tag })[]
    notes: Note[]
  }
}

export type ParsedStatusPlayer = {
  slot: number
  name: string
  team: 1 | 2
}

export type ParsedStatus = {
  matchId: string | null
  players: ParsedStatusPlayer[]
}

// OpenDota API types
export type OpenDotaMatchData = {
  match_id: number
  duration: number
  radiant_win: boolean
  players: OpenDotaPlayer[]
}

export type OpenDotaPlayer = {
  account_id: number | null
  player_slot: number
  hero_id: number
  kills: number
  deaths: number
  assists: number
  personaname: string | null
}

export type OpenDotaHero = {
  id: number
  localized_name: string
  name: string
  img: string
  icon: string
}

export type OpenDotaPlayerHero = {
  hero_id: string
  games: number
  win: number
}
