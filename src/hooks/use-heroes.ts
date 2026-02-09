import { useEffect, useState } from "react"
import type { OpenDotaHero } from "@/lib/types"

const CACHE_KEY = "opendota-heroes"
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours

export type CachedHeroData = {
  heroes: OpenDotaHero[]
  timestamp: number
}

export function useHeroes() {
  const [heroes, setHeroes] = useState<OpenDotaHero[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    loadHeroes()
  }, [])

  async function loadHeroes() {
    try {
      setLoading(true)

      // Check localStorage first
      const cached = localStorage.getItem(CACHE_KEY)
      if (cached) {
        const cachedData: CachedHeroData = JSON.parse(cached)
        const now = Date.now()

        // Use cache if less than 24 hours old
        if (now - cachedData.timestamp < CACHE_DURATION) {
          setHeroes(cachedData.heroes)
          setError(null)
          setLoading(false)
          return
        }
      }

      // Fetch from OpenDota
      const response = await fetch("https://api.opendota.com/api/heroes")
      if (!response.ok) {
        throw new Error(`Failed to fetch heroes: ${response.statusText}`)
      }

      const data: OpenDotaHero[] = await response.json()

      // Cache the result
      const cacheData: CachedHeroData = {
        heroes: data,
        timestamp: Date.now(),
      }
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData))

      setHeroes(data)
      setError(null)
    } catch (err) {
      setError(err as Error)
      console.error("Error loading heroes:", err)
    } finally {
      setLoading(false)
    }
  }

  function getHeroName(heroId: number): string {
    const hero = heroes.find((h) => h.id === heroId)
    return hero?.localized_name || `Unknown Hero (${heroId})`
  }

  return { heroes, getHeroName, loading, error }
}
