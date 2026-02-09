import { useEffect, useState, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import type { Match, MatchPlayerWithDetails, ParsedStatusPlayer } from "@/lib/types"

export function useMatches() {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchMatches() {
      try {
        const { data, error } = await supabase
          .from("matches")
          .select("*")
          .order("created_at", { ascending: false })

        if (cancelled) return
        if (error) throw error
        setMatches(data || [])
        setError(null)
      } catch (err) {
        if (cancelled) return
        setError(err as Error)
        console.error("Error fetching matches:", err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchMatches()

    // Use unique channel name to avoid conflicts during StrictMode remounts
    const channel = supabase
      .channel(`matches-changes-${crypto.randomUUID()}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "matches" },
        () => {
          if (!cancelled) fetchMatches()
        }
      )
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(channel).catch(() => {})
    }
  }, [])

  const refetch = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("matches")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error
      setMatches(data || [])
      setError(null)
    } catch (err) {
      setError(err as Error)
      console.error("Error fetching matches:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  return { matches, loading, error, refetch }
}

export function useMatch(id: string | undefined) {
  const [match, setMatch] = useState<Match | null>(null)
  const [matchPlayers, setMatchPlayers] = useState<MatchPlayerWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!id) {
      setLoading(false)
      return
    }

    fetchMatch(id)
  }, [id])

  async function fetchMatch(matchId: string, silent = false) {
    try {
      if (!silent) setLoading(true)

      // Fetch match
      const { data: matchData, error: matchError } = await supabase
        .from("matches")
        .select("*")
        .eq("id", matchId)
        .single()

      if (matchError) throw matchError
      setMatch(matchData)

      // Fetch match players with all related data
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
            notes (*)
          )
        `
        )
        .eq("match_id", matchId)
        .order("slot", { ascending: true })

      if (playersError) throw playersError
      setMatchPlayers(playersData as MatchPlayerWithDetails[] || [])
      setError(null)
    } catch (err) {
      setError(err as Error)
      console.error("Error fetching match:", err)
    } finally {
      setLoading(false)
    }
  }

  const refetch = useCallback(() => {
    if (id) fetchMatch(id, true)
  }, [id])

  return { match, matchPlayers, setMatchPlayers, loading, error, refetch }
}

export function useCreateMatch() {
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const createMatch = useCallback(
    async (
      rawStatusText: string,
      parsedPlayers: ParsedStatusPlayer[],
      matchId: string | null,
      ourTeamSlot: 1 | 2 | null,
      userId: string
    ) => {
      try {
        setCreating(true)
        setError(null)

        // Create match
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

        // Process players
        for (const parsedPlayer of parsedPlayers) {
          // Try to find existing player by known_names overlap
          const { data: existingPlayers } = await supabase
            .from("players")
            .select("*")
            .overlaps("known_names", [parsedPlayer.name])

          let playerId: string

          if (existingPlayers && existingPlayers.length > 0) {
            // Update existing player with any new name
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
            // Create new player (steam_account_id resolved later via OpenDota)
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
      } catch (err) {
        setError(err as Error)
        console.error("Error creating match:", err)
        throw err
      } finally {
        setCreating(false)
      }
    },
    []
  )

  return { createMatch, creating, error }
}
