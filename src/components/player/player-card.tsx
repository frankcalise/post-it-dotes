import { usePlayer } from "@/hooks/use-players"
import { PlayerTags } from "./player-tags"
import { PlayerNotes } from "./player-notes"
import { PlayerHeroes } from "./player-heroes"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ExternalLink } from "lucide-react"
import { Link } from "react-router-dom"

type PlayerCardProps = {
  playerId: string
  matchId?: string
}

export function PlayerCard({ playerId, matchId }: PlayerCardProps) {
  const { player, loading, error } = usePlayer(playerId)

  if (loading) {
    return (
      <Card className="p-6">
        <div className="text-sm text-muted-foreground">Loading player details...</div>
      </Card>
    )
  }

  if (error || !player) {
    return (
      <Card className="p-6">
        <div className="text-sm text-destructive">
          Failed to load player details
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-bold">
            {player.known_names[0] || "Unknown Player"}
          </h2>
          {player.known_names.length > 1 && (
            <div className="text-sm text-muted-foreground">
              Also: {player.known_names.slice(1).join(", ")}
            </div>
          )}
          {player.steam_account_id && (
            <div className="text-xs text-muted-foreground">
              Steam ID: {player.steam_account_id}
            </div>
          )}
        </div>
        <Link to={`/player/${player.id}`}>
          <Button variant="outline" size="sm">
            <ExternalLink className="h-4 w-4 mr-1" />
            Full Profile
          </Button>
        </Link>
      </div>

      <Separator />

      <PlayerTags playerId={player.id} />

      <Separator />

      <PlayerNotes playerId={player.id} matchId={matchId} />

      <Separator />

      <PlayerHeroes
        playerId={player.id}
        steamAccountId={player.steam_account_id}
        topHeroes={player.top_heroes}
      />
    </Card>
  )
}
