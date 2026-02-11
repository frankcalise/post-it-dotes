import { useCallback, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { queryKeys } from "@/lib/query-keys"
import type { Player, PlayerTag, Tag, Note, MatchPlayer } from "@/lib/types"

export type PlayerWithTags = Player & {
  tags: (PlayerTag & { tag: Tag })[]
  match_players: { count: number }[]
}

export type PlayerWithDetails = Player & {
  tags: (PlayerTag & { tag: Tag })[]
  notes: Note[]
  match_history: (MatchPlayer & { match: { id: string; dota_match_id: number | null; created_at: string } })[]
}

export function usePlayers() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.players.all,
    queryFn: async () => {
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
      return data as PlayerWithTags[]
    },
  })

  return {
    players: data ?? [],
    loading: isLoading,
    error: error as Error | null,
    refetch,
  }
}

export function usePlayer(id: string | undefined) {
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.players.detail(id ?? ""),
    queryFn: async () => {
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
              dota_match_id,
              created_at
            )
          )
        `
        )
        .eq("id", id!)
        .single()

      if (error) throw error
      return data as PlayerWithDetails
    },
    enabled: !!id,
  })

  return {
    player: data ?? null,
    loading: isLoading,
    error: error as Error | null,
  }
}

export function useSearchPlayers() {
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const queryClient = useQueryClient()

  const searchPlayers = useCallback(async (query: string): Promise<PlayerWithTags[]> => {
    if (!query.trim()) return []

    const cached = queryClient.getQueryData<PlayerWithTags[]>(queryKeys.players.all)
    if (cached) {
      return cached.filter((player) =>
        player.known_names.some((name) =>
          name.toLowerCase().includes(query.toLowerCase())
        )
      )
    }

    try {
      setSearching(true)
      setError(null)

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

      const all = (data as PlayerWithTags[]) || []
      return all.filter((player) =>
        player.known_names.some((name) =>
          name.toLowerCase().includes(query.toLowerCase())
        )
      )
    } catch (err) {
      setError(err as Error)
      console.error("Error searching players:", err)
      return []
    } finally {
      setSearching(false)
    }
  }, [queryClient])

  return { searchPlayers, searching, error }
}
