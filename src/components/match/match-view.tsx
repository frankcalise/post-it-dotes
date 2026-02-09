import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import type { Match, MatchPlayerWithDetails } from "@/lib/types"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { TeamPanel } from "./team-panel"
import { OpenDotaFetchButton } from "./opendota-fetch-button"

type MatchViewProps = {
  match: Match
  matchPlayers: MatchPlayerWithDetails[]
  setMatchPlayers: React.Dispatch<React.SetStateAction<MatchPlayerWithDetails[]>>
  onRefetch: () => void
}

export function MatchView({ match, matchPlayers, setMatchPlayers, onRefetch }: MatchViewProps) {
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null)
  const [appUserSlots, setAppUserSlots] = useState<Set<number>>(new Set())

  useEffect(() => {
    identifyAppUsers()
  }, [matchPlayers])

  async function identifyAppUsers() {
    try {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, dota_names")

      if (!profiles) return

      const dotaNamesMap = new Map<string, string>()
      for (const p of profiles) {
        for (const name of p.dota_names || []) {
          dotaNamesMap.set(name.toLowerCase(), p.id)
        }
      }

      const appUsers = new Set<number>()
      for (const mp of matchPlayers) {
        const displayName = mp.display_name?.toLowerCase()
        if (displayName && dotaNamesMap.has(displayName)) {
          appUsers.add(mp.slot)
        }
      }

      setAppUserSlots(appUsers)
    } catch (error) {
      console.error("Error identifying app users:", error)
    }
  }

  const movePlayerToTeam = useCallback(
    async (targetTeam: 1 | 2) => {
      if (selectedSlot === null) return
      const player = matchPlayers.find((p) => p.slot === selectedSlot)
      if (!player || player.team === targetTeam) return

      // Optimistic update
      setMatchPlayers((prev) =>
        prev.map((p) => (p.slot === selectedSlot ? { ...p, team: targetTeam } : p))
      )

      try {
        const { error } = await supabase
          .from("match_players")
          .update({ team: targetTeam })
          .eq("id", player.id)

        if (error) throw error
      } catch (err) {
        toast.error("Failed to move player")
        console.error(err)
        onRefetch()
      }
    },
    [selectedSlot, matchPlayers, setMatchPlayers, onRefetch]
  )

  useEffect(() => {
    function handleKeyPress(e: KeyboardEvent) {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) return

      if (e.key === "1") {
        e.preventDefault()
        movePlayerToTeam(1)
      } else if (e.key === "2") {
        e.preventDefault()
        movePlayerToTeam(2)
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [movePlayerToTeam])

  const team1Players = matchPlayers.filter((p) => p.team === 1)
  const team2Players = matchPlayers.filter((p) => p.team === 2)

  const matchDate = new Date(match.created_at).toLocaleString()

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle>Match Details</CardTitle>
              <div className="text-sm text-muted-foreground mt-1">
                {matchDate}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {match.dota_match_id && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Match ID:</span>{" "}
                  <span className="font-mono">{match.dota_match_id}</span>
                </div>
              )}
              {!match.opendota_fetched && (
                <OpenDotaFetchButton
                  matchId={match.id}
                  dotaMatchId={match.dota_match_id}
                  onFetched={onRefetch}
                />
              )}
              {match.opendota_fetched && (
                <div className="text-xs text-green-600 dark:text-green-400">
                  ✓ Data fetched
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        {match.opendota_data && (
          <CardContent>
            <div className="flex gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Duration:</span>{" "}
                {Math.floor(match.opendota_data.duration / 60)}:
                {String(match.opendota_data.duration % 60).padStart(2, "0")}
              </div>
              <Separator orientation="vertical" className="h-5" />
              <div>
                <span className="text-muted-foreground">Winner:</span>{" "}
                {match.opendota_data.radiant_win ? "Radiant" : "Dire"}
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TeamPanel
          players={team1Players}
          teamNumber={1}
          isOurTeam={match.our_team_slot === 1}
          selectedSlot={selectedSlot}
          onSelectSlot={setSelectedSlot}
          appUserSlots={appUserSlots}
        />
        <TeamPanel
          players={team2Players}
          teamNumber={2}
          isOurTeam={match.our_team_slot === 2}
          selectedSlot={selectedSlot}
          onSelectSlot={setSelectedSlot}
          appUserSlots={appUserSlots}
        />
      </div>
    </div>
  )
}
