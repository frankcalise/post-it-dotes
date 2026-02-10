import { Link } from "react-router-dom"
import { MessageSquare } from "lucide-react"
import type { MatchPlayerWithDetails } from "@/lib/types"
import { cn } from "@/lib/utils"
import { useHeroes } from "@/hooks/use-heroes"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"

type MatchPlayerRowProps = {
  matchPlayer: MatchPlayerWithDetails
  isSelected: boolean
  isAppUser: boolean
  onSelect: () => void
  onOpenNotes?: () => void
}

export function MatchPlayerRow({
  matchPlayer,
  isSelected,
  isAppUser,
  onSelect,
  onOpenNotes,
}: MatchPlayerRowProps) {
  const { display_name, hero_id, kills, deaths, assists, player } = matchPlayer
  const { getHeroName } = useHeroes()
  const hasKDA = kills !== null && deaths !== null && assists !== null
  const sortedNotes = player.notes
    ? [...player.notes].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
    : []

  return (
    <Card
      className={cn(
        "p-3 cursor-pointer transition-colors hover:bg-muted/50",
        isSelected && "ring-2 ring-primary",
        isAppUser && "bg-primary/5"
      )}
      onClick={onSelect}
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Link
            to={`/player/${player.id}`}
            className="font-medium hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {display_name || "Unknown Player"}
          </Link>
          <div className="flex items-center gap-1.5">
            {sortedNotes.length > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onOpenNotes?.()
                }}
                className="text-muted-foreground hover:text-foreground transition-colors"
                title="View notes"
              >
                <MessageSquare className="h-4 w-4" />
              </button>
            )}
            {isAppUser && (
              <Badge variant="secondary" className="text-xs">
                Us
              </Badge>
            )}
          </div>
        </div>

        {hero_id && (
          <div className="text-sm text-muted-foreground">{getHeroName(hero_id)}</div>
        )}

        {hasKDA && (
          <div className="flex gap-2 text-sm">
            <span className="text-green-600 dark:text-green-400">{kills}</span>
            <span>/</span>
            <span className="text-red-600 dark:text-red-400">{deaths}</span>
            <span>/</span>
            <span className="text-blue-600 dark:text-blue-400">{assists}</span>
          </div>
        )}

        {player.tags && player.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {player.tags.map((pt) => (
              <Badge
                key={pt.tag_id}
                variant="outline"
                style={{
                  borderColor: pt.tag.color,
                  color: pt.tag.color,
                }}
                className="text-xs"
              >
                {pt.tag.name}
              </Badge>
            ))}
          </div>
        )}

        {sortedNotes.length > 0 && (
          <div className="mt-2 pt-2 border-t space-y-1.5">
            {sortedNotes.slice(0, 2).map((note) => (
              <div
                key={note.id}
                className="text-sm text-muted-foreground bg-muted/50 rounded p-2"
              >
                {note.content}
              </div>
            ))}
            {sortedNotes.length > 2 && (
              <div className="text-xs text-muted-foreground text-center">
                +{sortedNotes.length - 2} more notes
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}
