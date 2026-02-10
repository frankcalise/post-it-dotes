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
  onOpenNotes: (playerId: string, playerName: string | null) => void
}

export function TeamPanel({
  players,
  teamNumber,
  isOurTeam,
  selectedSlot,
  onSelectSlot,
  appUserSlots,
  onOpenNotes,
}: TeamPanelProps) {
  const teamLabel = isOurTeam ? "Our Team" : `Team ${teamNumber}`

  return (
    <Card className={cn(isOurTeam && "ring-2 ring-primary/20")}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {teamLabel}
          {isOurTeam && (
            <span className="text-xs font-normal text-muted-foreground">
              (You)
            </span>
          )}
        </CardTitle>
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
              onSelect={() => onSelectSlot(player.slot)}
              onOpenNotes={() => onOpenNotes(player.player.id, player.display_name)}
            />
          ))
        )}
      </CardContent>
    </Card>
  )
}
