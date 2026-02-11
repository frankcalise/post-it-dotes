import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import type { ParsedStatusPlayer } from "@/lib/types"
import { parseStatus, identifyUsers } from "@/lib/parse-status"
import { useCreateMatch } from "@/hooks/use-matches"
import { useAuth } from "@/hooks/use-auth"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

type NewGameDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NewGameDialog({ open, onOpenChange }: NewGameDialogProps) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { createMatch, creating } = useCreateMatch()
  const [statusText, setStatusText] = useState("")
  const [parsed, setParsed] = useState<{
    matchId: string | null
    players: ParsedStatusPlayer[]
  } | null>(null)
  const [appUsers, setAppUsers] = useState<Map<number, string>>(new Map())
  const [ourTeamSlot, setOurTeamSlot] = useState<1 | 2 | null>(null)
  const [existingMatchId, setExistingMatchId] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setStatusText("")
      setParsed(null)
      setOurTeamSlot(null)
      setAppUsers(new Map())
      setExistingMatchId(null)
    }
  }, [open])

  useEffect(() => {
    if (statusText.trim()) {
      const result = parseStatus(statusText)
      setParsed(result)

      if (result.players.length > 0) {
        fetchAppUsers(result.players)
      }

      if (result.matchId) {
        checkExistingMatch(result.matchId)
      } else {
        setExistingMatchId(null)
      }
    } else {
      setParsed(null)
      setAppUsers(new Map())
      setExistingMatchId(null)
    }
  }, [statusText])

  async function checkExistingMatch(dotaMatchId: string) {
    try {
      const { data } = await supabase
        .from("matches")
        .select("id")
        .eq("dota_match_id", parseInt(dotaMatchId))
        .maybeSingle()

      setExistingMatchId(data?.id ?? null)
    } catch {
      setExistingMatchId(null)
    }
  }

  async function fetchAppUsers(players: ParsedStatusPlayer[]) {
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

      const identified = identifyUsers(players, dotaNamesMap)
      setAppUsers(identified)
    } catch (error) {
      console.error("Error fetching app users:", error)
    }
  }

  useEffect(() => {
    if (!parsed || appUsers.size === 0) return

    let radiantCount = 0
    let direCount = 0
    for (const [slot] of appUsers) {
      if (slot >= 1 && slot <= 5) radiantCount++
      else if (slot >= 6 && slot <= 10) direCount++
    }

    setOurTeamSlot(direCount > radiantCount ? 2 : 1)
  }, [appUsers])

  async function handleConfirm() {
    if (!parsed || !user) return

    if (existingMatchId) {
      const confirmed = window.confirm(
        "This will delete the existing match and create a new one. Notes will be preserved on players. Continue?"
      )
      if (!confirmed) return

      try {
        const { error } = await supabase
          .from("matches")
          .delete()
          .eq("id", existingMatchId)
        if (error) throw error
      } catch (error) {
        toast.error("Failed to delete existing match")
        console.error(error)
        return
      }
    }

    try {
      const match = await createMatch(
        statusText,
        parsed.players,
        parsed.matchId,
        ourTeamSlot,
        user.id
      )
      toast.success(existingMatchId ? "Match overwritten" : "Match created successfully")
      onOpenChange(false)
      navigate(`/match/${match.dota_match_id}`)
    } catch (error) {
      toast.error("Failed to create match")
      console.error(error)
    }
  }

  const team1Players = parsed?.players.filter((p) => p.team === 1) || []
  const team2Players = parsed?.players.filter((p) => p.team === 2) || []
  const hasAppUsers = appUsers.size > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>New Game</DialogTitle>
          <DialogDescription>
            Paste the output of your <code className="text-xs bg-muted px-1 rounded">status</code> command
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Textarea
            placeholder="Paste status output here..."
            value={statusText}
            onChange={(e) => setStatusText(e.target.value)}
            className="min-h-[200px] font-mono text-sm"
          />

          {parsed && parsed.players.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">
                  Parsed {parsed.players.length} players
                  {parsed.matchId && (
                    <span className="text-muted-foreground ml-2">
                      Match ID: {parsed.matchId}
                    </span>
                  )}
                </div>
              </div>

              {hasAppUsers && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Our team:</span>
                  <button
                    type="button"
                    onClick={() => setOurTeamSlot(1)}
                    className={cn(
                      "px-3 py-1 text-sm rounded-md border transition-colors",
                      ourTeamSlot === 1
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card border-border hover:bg-muted"
                    )}
                  >
                    Radiant
                  </button>
                  <button
                    type="button"
                    onClick={() => setOurTeamSlot(2)}
                    className={cn(
                      "px-3 py-1 text-sm rounded-md border transition-colors",
                      ourTeamSlot === 2
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card border-border hover:bg-muted"
                    )}
                  >
                    Dire
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="font-medium text-sm">
                    {hasAppUsers
                      ? ourTeamSlot === 1 ? "Radiant (Us)" : "Radiant"
                      : "Team 1"}
                  </h3>
                  <div className="space-y-1">
                    {team1Players.map((player) => {
                      const isAppUser = appUsers.has(player.slot)
                      return (
                        <div
                          key={player.slot}
                          className={cn(
                            "rounded border p-2 text-sm",
                            isAppUser
                              ? "bg-primary/10 border-primary"
                              : "bg-card"
                          )}
                        >
                          <div className="font-medium">{player.name}</div>
                          {isAppUser && (
                            <div className="text-xs text-muted-foreground">
                              App user
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-medium text-sm">
                    {hasAppUsers
                      ? ourTeamSlot === 2 ? "Dire (Us)" : "Dire"
                      : "Team 2"}
                  </h3>
                  <div className="space-y-1">
                    {team2Players.map((player) => {
                      const isAppUser = appUsers.has(player.slot)
                      return (
                        <div
                          key={player.slot}
                          className={cn(
                            "rounded border p-2 text-sm",
                            isAppUser
                              ? "bg-primary/10 border-primary"
                              : "bg-card"
                          )}
                        >
                          <div className="font-medium">{player.name}</div>
                          {isAppUser && (
                            <div className="text-xs text-muted-foreground">
                              App user
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {!parsed?.matchId && (
                <div className="text-sm text-muted-foreground">
                  No Match ID found in status output. Paste must include a match ID to create a game.
                </div>
              )}

              {existingMatchId && (
                <div className="text-sm text-amber-600 dark:text-amber-400 font-medium">
                  A match with this Dota Match ID already exists. Creating will overwrite it.
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={creating}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirm}
                  disabled={creating || !parsed?.matchId}
                  variant={existingMatchId ? "destructive" : "default"}
                >
                  {creating
                    ? "Creating..."
                    : existingMatchId
                      ? "Overwrite Match"
                      : "Create Match"}
                </Button>
              </div>
            </div>
          )}

          {parsed && parsed.players.length === 0 && (
            <div className="text-sm text-muted-foreground text-center py-8">
              No players found. Please paste a valid status output.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
