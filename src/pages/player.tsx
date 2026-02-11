import { useState, useEffect, useRef } from "react"
import { useParams, Link } from "react-router-dom"
import { usePlayer } from "@/hooks/use-players"
import { useHeroes } from "@/hooks/use-heroes"
import { PlayerTags } from "@/components/player/player-tags"
import { PlayerNotes } from "@/components/player/player-notes"
import { PlayerHeroes } from "@/components/player/player-heroes"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, ExternalLink } from "lucide-react"

export default function PlayerPage() {
  const { id } = useParams<{ id: string }>()
  const { player, loading, error } = usePlayer(id)
  const { getHeroName } = useHeroes()
  const [tagDialogOpen, setTagDialogOpen] = useState(false)
  const noteInputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    function handleKeyPress(e: KeyboardEvent) {
      const tag = document.activeElement?.tagName
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return

      if ((e.key === "t" || e.key === "T") && id) {
        e.preventDefault()
        setTagDialogOpen(true)
      }

      if (e.key === "n" || e.key === "N") {
        e.preventDefault()
        noteInputRef.current?.focus()
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [id])

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="text-center py-12 text-muted-foreground">
          Loading player...
        </div>
      </div>
    )
  }

  if (error || !player) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <Card className="p-12 text-center">
          <div className="text-destructive mb-4">
            Failed to load player details
          </div>
          <Link to="/players">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Players
            </Button>
          </Link>
        </Card>
      </div>
    )
  }

  const matchHistory = player.match_history || []
  const sortedMatches = [...matchHistory].sort(
    (a, b) => new Date(b.match.created_at).getTime() - new Date(a.match.created_at).getTime()
  )

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl space-y-6">
      <div>
        <Link to="/players">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Players
          </Button>
        </Link>
      </div>

      <Card className="p-6 space-y-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">
            {player.known_names[0] || "Unknown Player"}
          </h1>
          {player.known_names.length > 1 && (
            <div className="text-muted-foreground">
              <span className="font-medium">Also known as:</span>{" "}
              {player.known_names.slice(1).join(", ")}
            </div>
          )}
        </div>

        {player.steam_account_id && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Steam Account ID:</span>
            <code className="bg-secondary px-2 py-1 rounded">
              {player.steam_account_id}
            </code>
            <a
              href={`https://www.opendota.com/players/${player.steam_account_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-1"
            >
              OpenDota
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <PlayerTags
            playerId={player.id}
            dialogOpen={tagDialogOpen}
            onDialogOpenChange={setTagDialogOpen}
          />
        </Card>

        <Card className="p-6">
          <PlayerHeroes
            playerId={player.id}
            steamAccountId={player.steam_account_id}
            topHeroes={player.top_heroes}
          />
        </Card>
      </div>

      <Card className="p-6">
        <PlayerNotes playerId={player.id} inputRef={noteInputRef} />
      </Card>

      <Card className="p-6 space-y-4">
        <h2 className="text-xl font-bold">Match History</h2>
        <Separator />

        {sortedMatches.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No matches recorded for this player
          </div>
        ) : (
          <div className="space-y-2">
            {sortedMatches.map((mp) => (
              <Link
                key={mp.id}
                to={`/match/${mp.match?.dota_match_id}`}
                className="block"
              >
                <Card className="p-4 hover:bg-accent transition-colors cursor-pointer">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        {mp.hero_id && (
                          <span className="font-medium">
                            {getHeroName(mp.hero_id)}
                          </span>
                        )}
                        {mp.display_name && (
                          <span className="text-muted-foreground text-sm">
                            as {mp.display_name}
                          </span>
                        )}
                      </div>
                      {(mp.kills !== null || mp.deaths !== null || mp.assists !== null) && (
                        <div className="text-sm text-muted-foreground">
                          {mp.kills ?? 0} / {mp.deaths ?? 0} / {mp.assists ?? 0}
                        </div>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground whitespace-nowrap">
                      {new Date(mp.match.created_at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
