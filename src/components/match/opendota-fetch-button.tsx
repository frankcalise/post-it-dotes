import { useState } from "react"
import { toast } from "sonner"
import { fetchMatch } from "@/lib/opendota"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"

type OpenDotaFetchButtonProps = {
  matchId: string
  dotaMatchId: number | null
  onFetched: () => void
}

export function OpenDotaFetchButton({
  matchId,
  dotaMatchId,
  onFetched,
}: OpenDotaFetchButtonProps) {
  const [fetching, setFetching] = useState(false)

  async function handleFetch() {
    if (!dotaMatchId) return

    try {
      setFetching(true)
      const openDotaData = await fetchMatch(dotaMatchId)

      const { error: updateError } = await supabase
        .from("matches")
        .update({
          opendota_fetched: true,
          opendota_data: openDotaData,
        })
        .eq("id", matchId)

      if (updateError) throw updateError

      for (const odPlayer of openDotaData.players) {
        if (!odPlayer.account_id) continue

        const { data: matchPlayers, error: fetchError } = await supabase
          .from("match_players")
          .select("id, player_id, players!inner(steam_account_id)")
          .eq("match_id", matchId)

        if (fetchError) throw fetchError

        const matchPlayer = matchPlayers.find(
          (mp) => (mp.players as any)?.steam_account_id === odPlayer.account_id
        )

        if (matchPlayer) {
          const { error: updatePlayerError } = await supabase
            .from("match_players")
            .update({
              hero_id: odPlayer.hero_id,
              kills: odPlayer.kills,
              deaths: odPlayer.deaths,
              assists: odPlayer.assists,
            })
            .eq("id", matchPlayer.id)

          if (updatePlayerError) throw updatePlayerError
        }
      }

      toast.success("OpenDota data fetched successfully")
      onFetched()
    } catch (error) {
      console.error("Error fetching OpenDota data:", error)
      toast.error("Failed to fetch OpenDota data")
    } finally {
      setFetching(false)
    }
  }

  return (
    <Button
      onClick={handleFetch}
      disabled={!dotaMatchId || fetching}
      size="sm"
      variant="outline"
    >
      {fetching ? "Fetching..." : "Fetch from OpenDota"}
    </Button>
  )
}
