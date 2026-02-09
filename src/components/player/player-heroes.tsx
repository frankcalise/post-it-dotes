import { useState } from "react"
import type { HeroStat } from "@/lib/types"
import { useHeroes } from "@/hooks/use-heroes"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"

type PlayerHeroesProps = {
  playerId: string
  steamAccountId: number | null
  topHeroes: HeroStat[]
}

export function PlayerHeroes({ playerId, steamAccountId, topHeroes }: PlayerHeroesProps) {
  const [refreshing, setRefreshing] = useState(false)
  const { getHeroName } = useHeroes()

  const handleRefresh = async () => {
    if (!steamAccountId) return

    try {
      setRefreshing(true)
      // TODO: Implement refresh endpoint
      // This would call your backend to re-fetch from OpenDota
      console.log("Refreshing heroes for player:", playerId)
    } catch (err) {
      console.error("Error refreshing heroes:", err)
    } finally {
      setRefreshing(false)
    }
  }

  if (!topHeroes || topHeroes.length === 0) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Top Heroes</h3>
          {steamAccountId && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
            </Button>
          )}
        </div>
        <div className="text-sm text-muted-foreground">
          {steamAccountId
            ? "Click refresh to fetch hero data from OpenDota"
            : "No Steam account linked"}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Top Heroes</h3>
        {steamAccountId && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {topHeroes.slice(0, 10).map((hero) => {
          const winrate = hero.games > 0 ? (hero.win / hero.games) * 100 : 0

          return (
            <div key={hero.hero_id} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{getHeroName(hero.hero_id)}</span>
                <span className="text-muted-foreground">
                  {hero.games} game{hero.games !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full transition-all",
                      winrate >= 50 ? "bg-green-500" : "bg-red-500"
                    )}
                    style={{ width: `${winrate}%` }}
                  />
                </div>
                <span
                  className={cn(
                    "text-xs font-medium w-12 text-right",
                    winrate >= 50 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                  )}
                >
                  {winrate.toFixed(0)}%
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
