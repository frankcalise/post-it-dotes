import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useSearchPlayers } from "@/hooks/use-players"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { TagBadge } from "@/components/tags/tag-badge"
import { Search, User } from "lucide-react"
import { cn } from "@/lib/utils"

type PlayerSearchProps = {
  onSelect?: (playerId: string) => void
}

export function PlayerSearch({ onSelect }: PlayerSearchProps) {
  const [query, setQuery] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [results, setResults] = useState<Awaited<ReturnType<typeof searchPlayers>>>([])

  const { searchPlayers, searching } = useSearchPlayers()
  const navigate = useNavigate()

  useEffect(() => {
    const handler = setTimeout(async () => {
      if (query.trim()) {
        const players = await searchPlayers(query)
        setResults(players)
        setIsOpen(true)
      } else {
        setResults([])
        setIsOpen(false)
      }
    }, 300)

    return () => clearTimeout(handler)
  }, [query, searchPlayers])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('[data-player-search]')) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelectPlayer = (playerId: string) => {
    setIsOpen(false)
    setQuery("")
    if (onSelect) {
      onSelect(playerId)
    } else {
      navigate(`/player/${playerId}`)
    }
  }

  return (
    <div className="relative w-full max-w-md" data-player-search>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search players..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true)
          }}
          className="pl-9"
        />
      </div>

      {isOpen && (
        <Card className="absolute top-full mt-1 w-full max-h-[400px] overflow-y-auto z-50 p-1 shadow-lg">
          {searching ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Searching...
            </div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No players found
            </div>
          ) : (
            <div className="space-y-1">
              {results.map((player) => (
                <button
                  key={player.id}
                  onClick={() => handleSelectPlayer(player.id)}
                  className={cn(
                    "w-full text-left p-3 rounded-md",
                    "hover:bg-accent transition-colors",
                    "focus:outline-none focus:bg-accent"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="font-medium text-sm">
                        {player.known_names[0] || "Unknown"}
                      </div>
                      {player.known_names.length > 1 && (
                        <div className="text-xs text-muted-foreground">
                          Also known as: {player.known_names.slice(1, 3).join(", ")}
                          {player.known_names.length > 3 && " ..."}
                        </div>
                      )}
                      {player.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {player.tags.slice(0, 3).map((pt) => (
                            <TagBadge key={pt.tag_id} tag={pt.tag} />
                          ))}
                          {player.tags.length > 3 && (
                            <span className="text-xs text-muted-foreground self-center">
                              +{player.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
