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

      // Fetch all match_players for this match in one query
      const { data: matchPlayers, error: fetchError } = await supabase
        .from("match_players")
        .select("id, player_id, display_name, players!inner(id, steam_account_id)")
        .eq("match_id", matchId)

      if (fetchError) throw fetchError

      // Build lowercase name → match_player lookup
      const nameMap = new Map<string, (typeof matchPlayers)[number]>()
      for (const mp of matchPlayers) {
        if (mp.display_name) {
          nameMap.set(mp.display_name.toLowerCase(), mp)
        }
      }

      let updatedCount = 0
      for (const odPlayer of openDotaData.players) {
        if (!odPlayer.personaname) continue

        const mp = nameMap.get(odPlayer.personaname.toLowerCase())
        if (!mp) continue

        const { error: updateMpError } = await supabase
          .from("match_players")
          .update({
            hero_id: odPlayer.hero_id,
            kills: odPlayer.kills,
            deaths: odPlayer.deaths,
            assists: odPlayer.assists,
          })
          .eq("id", mp.id)

        if (updateMpError) throw updateMpError
        updatedCount++

        // Backfill steam_account_id if player doesn't have one yet
        const player = mp.players as any
        if (odPlayer.account_id && player && !player.steam_account_id) {
          await supabase
            .from("players")
            .update({ steam_account_id: odPlayer.account_id })
            .eq("id", player.id)
        }
      }

      const totalOdPlayers = openDotaData.players.length
      toast.success(`Updated ${updatedCount}/${totalOdPlayers} players`)
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
