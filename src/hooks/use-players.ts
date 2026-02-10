import { useEffect, useState, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import type { Player, PlayerTag, Tag, Note, MatchPlayer } from "@/lib/types"

export type PlayerWithTags = Player & {
  tags: (PlayerTag & { tag: Tag })[]
  match_players: { count: number }[]
}

export type PlayerWithDetails = Player & {
  tags: (PlayerTag & { tag: Tag })[]
  notes: Note[]
  match_history: (MatchPlayer & { match: { id: string; created_at: string } })[]
}

export function usePlayers() {
  const [players, setPlayers] = useState<PlayerWithTags[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    fetchPlayers()
  }, [])

  async function fetchPlayers() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("players")
        .select(
          `
          *,
          tags:player_tags (
            *,
            tag:tags (*)
          ),
          match_players (count)
        `
        )
        .order("created_at", { ascending: false })

      if (error) throw error
      setPlayers(data as PlayerWithTags[] || [])
      setError(null)
    } catch (err) {
      setError(err as Error)
      console.error("Error fetching players:", err)
    } finally {
      setLoading(false)
    }
  }

  return { players, loading, error, refetch: fetchPlayers }
}

export function usePlayer(id: string | undefined) {
  const [player, setPlayer] = useState<PlayerWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!id) {
      setLoading(false)
      return
    }

    fetchPlayer(id)
  }, [id])

  async function fetchPlayer(playerId: string) {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from("players")
        .select(
          `
          *,
          tags:player_tags (
            *,
            tag:tags (*)
          ),
          notes (*),
          match_history:match_players (
            *,
            match:matches (
              id,
              created_at
            )
          )
        `
        )
        .eq("id", playerId)
        .single()

      if (error) throw error
      setPlayer(data as PlayerWithDetails)
      setError(null)
    } catch (err) {
      setError(err as Error)
      console.error("Error fetching player:", err)
    } finally {
      setLoading(false)
    }
  }

  return { player, loading, error }
}

export function useSearchPlayers() {
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const searchPlayers = useCallback(async (query: string): Promise<PlayerWithTags[]> => {
    if (!query.trim()) {
      return []
    }

    try {
      setSearching(true)
      setError(null)

      // Search for players where any of their known_names contains the query
      const { data, error } = await supabase
        .from("players")
        .select(
          `
          *,
          tags:player_tags (
            *,
            tag:tags (*)
          )
        `
        )
        .order("created_at", { ascending: false })

      if (error) throw error

      // Filter client-side for fuzzy matching against known_names
      const filtered = (data as PlayerWithTags[] || []).filter((player) =>
        player.known_names.some((name) =>
          name.toLowerCase().includes(query.toLowerCase())
        )
      )

      return filtered
    } catch (err) {
      setError(err as Error)
      console.error("Error searching players:", err)
      return []
    } finally {
      setSearching(false)
    }
  }, [])

  return { searchPlayers, searching, error }
}
