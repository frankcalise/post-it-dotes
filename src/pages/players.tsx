import { usePlayers } from "@/hooks/use-players"
import { PlayerSearch } from "@/components/player/player-search"
import { TagBadge } from "@/components/tags/tag-badge"
import { Card } from "@/components/ui/card"
import { User } from "lucide-react"
import { Link } from "react-router-dom"
import { cn } from "@/lib/utils"

export default function PlayersPage() {
  const { players, loading, error } = usePlayers()

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Players</h1>
        <p className="text-muted-foreground">
          Browse and search all tracked players
        </p>
      </div>

      <PlayerSearch />

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">
          Loading players...
        </div>
      ) : error ? (
        <Card className="p-6">
          <div className="text-destructive">
            Failed to load players. Please try again.
          </div>
        </Card>
      ) : players.length === 0 ? (
        <Card className="p-12 text-center">
          <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">No players yet</h3>
          <p className="text-sm text-muted-foreground">
            Players will appear here once matches are tracked
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {players.map((player) => {
            const matchCount = 0

            return (
              <Link key={player.id} to={`/player/${player.id}`}>
                <Card
                  className={cn(
                    "p-4 transition-colors",
                    "hover:bg-accent cursor-pointer"
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className="mt-1">
                      <User className="h-5 w-5 text-muted-foreground" />
                    </div>

                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1 min-w-0">
                          <h3 className="font-semibold">
                            {player.known_names[0] || "Unknown Player"}
                          </h3>
                          {player.known_names.length > 1 && (
                            <p className="text-sm text-muted-foreground truncate">
                              Also: {player.known_names.slice(1, 3).join(", ")}
                              {player.known_names.length > 3 && " ..."}
                            </p>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground whitespace-nowrap">
                          {matchCount} match{matchCount as number !== 1 ? "es" : ""}
                        </div>
                      </div>

                      {player.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {player.tags.map((pt) => (
                            <TagBadge key={pt.tag_id} tag={pt.tag} />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
