import { useEffect, useCallback, type SetStateAction } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { queryKeys } from "@/lib/query-keys"
import type { Match, MatchPlayerWithDetails, ParsedStatusPlayer } from "@/lib/types"

type MatchDetailData = {
  match: Match
  matchPlayers: MatchPlayerWithDetails[]
}

export function useMatches() {
  const queryClient = useQueryClient()

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.matches.all,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("matches")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error
      return data as Match[]
    },
  })

  useEffect(() => {
    const channel = supabase
      .channel(`matches-changes-${crypto.randomUUID()}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "matches" },
        () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.matches.all })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel).catch(() => {})
    }
  }, [queryClient])

  return {
    matches: data ?? [],
    loading: isLoading,
    error: error as Error | null,
    refetch,
  }
}

export function useMatch(id: string | undefined) {
  const queryClient = useQueryClient()

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.matches.detail(id ?? ""),
    queryFn: async () => {
      const { data: matchData, error: matchError } = await supabase
        .from("matches")
        .select("*")
        .eq("dota_match_id", parseInt(id!))
        .single()

      if (matchError) throw matchError

      const { data: playersData, error: playersError } = await supabase
        .from("match_players")
        .select(
          `
          *,
          player:players (
            *,
            tags:player_tags (
              *,
              tag:tags (*)
            ),
            notes (*),
            match_history:match_players (
              hero_id,
              match:matches (
                id,
                created_at
              )
            )
          )
        `
        )
        .eq("match_id", matchData.id)
        .order("slot", { ascending: true })

      if (playersError) throw playersError

      return {
        match: matchData as Match,
        matchPlayers: (playersData as MatchPlayerWithDetails[]) || [],
      }
    },
    enabled: !!id,
  })

  const matchId = data?.match?.id
  const playerIds = data?.matchPlayers.map((p) => p.player_id)
  useEffect(() => {
    if (!matchId || !playerIds?.length) return

    const playerIdSet = new Set(playerIds)
    const invalidate = () =>
      queryClient.invalidateQueries({
        queryKey: queryKeys.matches.detail(id ?? ""),
      })

    const channel = supabase
      .channel(`match-detail-${matchId}-${crypto.randomUUID()}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "match_players",
          filter: `match_id=eq.${matchId}`,
        },
        invalidate
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notes" },
        (payload) => {
          const row = payload.new as { player_id?: string }
          if (row?.player_id && playerIdSet.has(row.player_id)) invalidate()
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "notes" },
        (payload) => {
          const row = payload.new as { player_id?: string }
          if (row?.player_id && playerIdSet.has(row.player_id)) invalidate()
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "notes" },
        invalidate
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "player_tags" },
        (payload) => {
          const row = payload.new as { player_id?: string }
          if (row?.player_id && playerIdSet.has(row.player_id)) invalidate()
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "player_tags" },
        (payload) => {
          const row = payload.new as { player_id?: string }
          if (row?.player_id && playerIdSet.has(row.player_id)) invalidate()
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "player_tags" },
        invalidate
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel).catch(() => {})
    }
  }, [matchId, playerIds?.join(), id, queryClient])

  const setMatchPlayers = useCallback(
    (action: SetStateAction<MatchPlayerWithDetails[]>) => {
      queryClient.setQueryData<MatchDetailData>(
        queryKeys.matches.detail(id ?? ""),
        (prev) => {
          if (!prev) return prev
          const newPlayers =
            typeof action === "function" ? action(prev.matchPlayers) : action
          return { ...prev, matchPlayers: newPlayers }
        }
      )
    },
    [queryClient, id]
  )

  return {
    match: data?.match ?? null,
    matchPlayers: data?.matchPlayers ?? [],
    setMatchPlayers,
    loading: isLoading,
    error: error as Error | null,
    refetch,
  }
}

export function useCreateMatch() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async ({
      rawStatusText,
      parsedPlayers,
      matchId,
      ourTeamSlot,
      userId,
    }: {
      rawStatusText: string
      parsedPlayers: ParsedStatusPlayer[]
      matchId: string | null
      ourTeamSlot: 1 | 2 | null
      userId: string
    }) => {
      const { data: match, error: matchError } = await supabase
        .from("matches")
        .insert({
          dota_match_id: matchId ? parseInt(matchId) : null,
          raw_status_text: rawStatusText,
          our_team_slot: ourTeamSlot,
          created_by: userId,
        })
        .select()
        .single()

      if (matchError) throw matchError

      for (const parsedPlayer of parsedPlayers) {
        const { data: existingPlayers } = await supabase
          .from("players")
          .select("*")
          .overlaps("known_names", [parsedPlayer.name])

        let playerId: string

        if (existingPlayers && existingPlayers.length > 0) {
          const existingPlayer = existingPlayers[0]
          const updatedNames = Array.from(
            new Set([...existingPlayer.known_names, parsedPlayer.name])
          )

          const { error: updateError } = await supabase
            .from("players")
            .update({ known_names: updatedNames })
            .eq("id", existingPlayer.id)

          if (updateError) throw updateError
          playerId = existingPlayer.id
        } else {
          const { data: newPlayer, error: insertError } = await supabase
            .from("players")
            .insert({
              known_names: [parsedPlayer.name],
              top_heroes: [],
            })
            .select()
            .single()

          if (insertError) throw insertError
          playerId = newPlayer.id
        }

        const { error: matchPlayerError } = await supabase
          .from("match_players")
          .insert({
            match_id: match.id,
            player_id: playerId,
            slot: parsedPlayer.slot,
            team: parsedPlayer.team,
            display_name: parsedPlayer.name,
          })

        if (matchPlayerError) throw matchPlayerError
      }

      return match
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.matches.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.players.all })
    },
  })

  const createMatch = useCallback(
    (
      rawStatusText: string,
      parsedPlayers: ParsedStatusPlayer[],
      matchId: string | null,
      ourTeamSlot: 1 | 2 | null,
      userId: string
    ) =>
      mutation.mutateAsync({
        rawStatusText,
        parsedPlayers,
        matchId,
        ourTeamSlot,
        userId,
      }),
    [mutation.mutateAsync]
  )

  return {
    createMatch,
    creating: mutation.isPending,
    error: mutation.error as Error | null,
  }
}
