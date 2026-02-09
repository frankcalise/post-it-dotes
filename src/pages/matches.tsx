import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { useMatches } from "@/hooks/use-matches"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { NewGameDialog } from "@/components/match/new-game-dialog"

export default function MatchesPage() {
  const { matches, loading, error } = useMatches()
  const [newGameDialogOpen, setNewGameDialogOpen] = useState(false)

  useEffect(() => {
    function handleKeyPress(e: KeyboardEvent) {
      if (e.key === "n" || e.key === "N") {
        if (
          document.activeElement?.tagName !== "INPUT" &&
          document.activeElement?.tagName !== "TEXTAREA"
        ) {
          e.preventDefault()
          setNewGameDialogOpen(true)
        }
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4">
            <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">Loading matches...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <div className="text-6xl">⚠️</div>
          <h1 className="text-2xl font-bold">Error Loading Matches</h1>
          <p className="text-muted-foreground">{error.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Matches</h1>
          <p className="text-muted-foreground mt-1">
            View and manage your Dota 2 matches
          </p>
        </div>
        <Button onClick={() => setNewGameDialogOpen(true)}>
          New Game
          <kbd className="ml-2 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
            N
          </kbd>
        </Button>
      </div>

      {matches.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="text-6xl">🎮</div>
            <h2 className="text-xl font-semibold">No matches yet</h2>
            <p className="text-muted-foreground text-center max-w-md">
              Create your first match by clicking the "New Game" button or
              pressing <kbd className="px-2 py-1 bg-muted rounded">N</kbd>
            </p>
            <Button onClick={() => setNewGameDialogOpen(true)} className="mt-4">
              Create Your First Match
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {matches.map((match) => {
            const matchDate = new Date(match.created_at).toLocaleDateString(
              undefined,
              {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              }
            )

            return (
              <Link key={match.id} to={`/match/${match.id}`}>
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        {match.dota_match_id
                          ? `Match ${match.dota_match_id}`
                          : "Unidentified Match"}
                      </CardTitle>
                      <div className="flex items-center gap-3">
                        {match.our_team_slot && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                            Team {match.our_team_slot}
                          </span>
                        )}
                        {match.opendota_fetched && (
                          <span className="text-xs text-green-600 dark:text-green-400">
                            ✓ Data fetched
                          </span>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div>{matchDate}</div>
                      {match.opendota_data && (
                        <>
                          <div>•</div>
                          <div>
                            Duration:{" "}
                            {Math.floor(match.opendota_data.duration / 60)}:
                            {String(match.opendota_data.duration % 60).padStart(
                              2,
                              "0"
                            )}
                          </div>
                          <div>•</div>
                          <div>
                            Winner:{" "}
                            {match.opendota_data.radiant_win
                              ? "Radiant"
                              : "Dire"}
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}

      <NewGameDialog
        open={newGameDialogOpen}
        onOpenChange={setNewGameDialogOpen}
      />
    </div>
  )
}
