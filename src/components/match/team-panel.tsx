import type { MatchPlayerWithDetails } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MatchPlayerRow } from "./match-player-row"

type TeamPanelProps = {
  players: MatchPlayerWithDetails[]
  teamNumber: 1 | 2
  isOurTeam: boolean
  selectedSlot: number | null
  onSelectSlot: (slot: number) => void
  appUserSlots: Set<number>
  currentMatchId: string
  onOpenNotes: (playerId: string, playerName: string | null) => void
}

export function TeamPanel({
  players,
  teamNumber,
  isOurTeam,
  selectedSlot,
  onSelectSlot,
  appUserSlots,
  currentMatchId,
  onOpenNotes,
}: TeamPanelProps) {
  const side = teamNumber === 1 ? "Radiant" : "Dire"
  const teamLabel = isOurTeam ? `${side} (Us)` : side

  return (
    <Card className={cn(isOurTeam && "ring-2 ring-primary/20")}>
      <CardHeader>
        <CardTitle>{teamLabel}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {players.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-4">
            No players on this team
          </div>
        ) : (
          players.map((player) => (
            <MatchPlayerRow
              key={player.id}
              matchPlayer={player}
              isSelected={selectedSlot === player.slot}
              isAppUser={appUserSlots.has(player.slot)}
              currentMatchId={currentMatchId}
              onSelect={() => onSelectSlot(player.slot)}
              onOpenNotes={() => onOpenNotes(player.player.id, player.display_name)}
            />
          ))
        )}
      </CardContent>
    </Card>
  )
}
