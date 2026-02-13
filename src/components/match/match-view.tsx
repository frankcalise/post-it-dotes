import { useState, useEffect, useCallback, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import type { Match, MatchPlayerWithDetails } from "@/lib/types"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { TeamPanel } from "./team-panel"
import { OpenDotaFetchButton } from "./opendota-fetch-button"
import { PlayerNotesDialog } from "./player-notes-dialog"
import { TagPickerDialog } from "@/components/tags/tag-picker"
import { ExternalLink } from "lucide-react"

type MatchViewProps = {
  match: Match
  matchPlayers: MatchPlayerWithDetails[]
  setMatchPlayers: React.Dispatch<React.SetStateAction<MatchPlayerWithDetails[]>>
  onRefetch: () => void
}

export function MatchView({ match, matchPlayers, setMatchPlayers, onRefetch }: MatchViewProps) {
  const navigate = useNavigate()
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null)
  const [appUserSlots, setAppUserSlots] = useState<Set<number>>(new Set())
  const [tagPickerOpen, setTagPickerOpen] = useState(false)
  const [notesDialogPlayerId, setNotesDialogPlayerId] = useState<string | null>(null)
  const [notesDialogPlayerName, setNotesDialogPlayerName] = useState<string | null>(null)

  const selectedPlayer = useMemo(
    () => matchPlayers.find((p) => p.slot === selectedSlot),
    [selectedSlot, matchPlayers]
  )

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

  const handleTagPickerClose = useCallback(
    (open: boolean) => {
      setTagPickerOpen(open)
      if (!open) onRefetch()
    },
    [onRefetch]
  )

  async function updateOurTeamSlot(slot: 1 | 2) {
    if (match.our_team_slot === slot) return
    try {
      // Swap all players' team assignments (1↔2)
      const swaps = matchPlayers.map((p) =>
        supabase
          .from("match_players")
          .update({ team: p.team === 1 ? 2 : 1 })
          .eq("id", p.id)
      )
      const results = await Promise.all(swaps)
      const swapError = results.find((r) => r.error)?.error
      if (swapError) throw swapError

      const { error } = await supabase
        .from("matches")
        .update({ our_team_slot: slot })
        .eq("id", match.id)
      if (error) throw error
      onRefetch()
    } catch (err) {
      toast.error("Failed to update team")
      console.error(err)
      onRefetch()
    }
  }

  const team1Players = matchPlayers.filter((p) => p.team === 1)
  const team2Players = matchPlayers.filter((p) => p.team === 2)

  const allSlots = useMemo(
    () => [...team1Players, ...team2Players].map((p) => p.slot),
    [team1Players, team2Players]
  )

  useEffect(() => {
    function handleKeyPress(e: KeyboardEvent) {
      const tag = document.activeElement?.tagName
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return

      if (e.key === "1") {
        e.preventDefault()
        movePlayerToTeam(1)
      } else if (e.key === "2") {
        e.preventDefault()
        movePlayerToTeam(2)
      } else if ((e.key === "t" || e.key === "T") && selectedPlayer) {
        e.preventDefault()
        setTagPickerOpen(true)
      } else if (e.key === "i" || e.key === "I") {
        e.preventDefault()
        if (allSlots.length === 0) return
        const currentIdx = selectedSlot !== null ? allSlots.indexOf(selectedSlot) : -1
        const nextIdx = currentIdx <= 0 ? 0 : currentIdx - 1
        setSelectedSlot(allSlots[nextIdx])
      } else if (e.key === "k" || e.key === "K") {
        e.preventDefault()
        if (allSlots.length === 0) return
        const currentIdx = selectedSlot !== null ? allSlots.indexOf(selectedSlot) : -1
        const nextIdx = currentIdx < allSlots.length - 1 ? currentIdx + 1 : allSlots.length - 1
        setSelectedSlot(allSlots[nextIdx])
      } else if ((e.key === "o" || e.key === "O") && selectedPlayer) {
        e.preventDefault()
        navigate(`/player/${selectedPlayer.player.id}`)
      } else if ((e.key === "n" || e.key === "N") && selectedPlayer) {
        e.preventDefault()
        setNotesDialogPlayerId(selectedPlayer.player.id)
        setNotesDialogPlayerName(selectedPlayer.display_name)
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [movePlayerToTeam, selectedPlayer, allSlots, selectedSlot])

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
                  <a
                    href={`https://www.opendota.com/matches/${match.dota_match_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1 font-mono"
                  >
                    {match.dota_match_id}
                    <ExternalLink className="size-3" />
                  </a>
                </div>
              )}
              {match.opendota_fetched && (
                <div className="text-xs text-green-600 dark:text-green-400">
                  ✓ Data fetched
                </div>
              )}
              <OpenDotaFetchButton
                matchId={match.id}
                dotaMatchId={match.dota_match_id}
                alreadyFetched={match.opendota_fetched}
                onFetched={onRefetch}
              />
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

      {match.our_team_slot && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Our team:</span>
          <button
            type="button"
            onClick={() => updateOurTeamSlot(1)}
            className={cn(
              "px-3 py-1 text-sm rounded-md border transition-colors",
              match.our_team_slot === 1
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card border-border hover:bg-muted"
            )}
          >
            Radiant
          </button>
          <button
            type="button"
            onClick={() => updateOurTeamSlot(2)}
            className={cn(
              "px-3 py-1 text-sm rounded-md border transition-colors",
              match.our_team_slot === 2
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card border-border hover:bg-muted"
            )}
          >
            Dire
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TeamPanel
          players={team1Players}
          teamNumber={1}
          isOurTeam={match.our_team_slot === 1}
          selectedSlot={selectedSlot}
          onSelectSlot={setSelectedSlot}
          appUserSlots={appUserSlots}
          currentMatchId={match.id}
          onOpenNotes={(playerId, playerName) => {
            setNotesDialogPlayerId(playerId)
            setNotesDialogPlayerName(playerName)
          }}
        />
        <TeamPanel
          players={team2Players}
          teamNumber={2}
          isOurTeam={match.our_team_slot === 2}
          selectedSlot={selectedSlot}
          onSelectSlot={setSelectedSlot}
          appUserSlots={appUserSlots}
          currentMatchId={match.id}
          onOpenNotes={(playerId, playerName) => {
            setNotesDialogPlayerId(playerId)
            setNotesDialogPlayerName(playerName)
          }}
        />
      </div>

      {selectedPlayer && (
        <TagPickerDialog
          playerId={selectedPlayer.player.id}
          open={tagPickerOpen}
          onOpenChange={handleTagPickerClose}
        />
      )}

      <PlayerNotesDialog
        playerId={notesDialogPlayerId}
        playerName={notesDialogPlayerName}
        matchId={match.id}
        open={notesDialogPlayerId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setNotesDialogPlayerId(null)
            setNotesDialogPlayerName(null)
            onRefetch()
          }
        }}
      />
    </div>
  )
}
