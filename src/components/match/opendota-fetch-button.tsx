import { useState, useEffect, useRef } from "react"
import { toast } from "sonner"
import { fetchMatch, requestParse, pollParseJob } from "@/lib/opendota"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"

type OpenDotaFetchButtonProps = {
  matchId: string
  dotaMatchId: number | null
  alreadyFetched: boolean
  onFetched: () => void
}

type FetchStep = "idle" | "requesting_parse" | "polling" | "fetching_data"

function odSlotToOurSlot(playerSlot: number): number {
  // OpenDota player_slot: 0-4 radiant, 128-132 dire
  if (playerSlot <= 4) return playerSlot + 1
  return playerSlot - 128 + 6
}

export function OpenDotaFetchButton({
  matchId,
  dotaMatchId,
  alreadyFetched,
  onFetched,
}: OpenDotaFetchButtonProps) {
  const [step, setStep] = useState<FetchStep>("idle")
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (step !== "polling") return
    setElapsedSeconds(0)
    const interval = setInterval(() => setElapsedSeconds((s) => s + 1), 1000)
    return () => clearInterval(interval)
  }, [step])

  useEffect(() => {
    return () => abortRef.current?.abort()
  }, [])

  async function handleFetch() {
    if (!dotaMatchId) return

    const controller = new AbortController()
    abortRef.current = controller

    try {
      // Step 1: Request parse
      setStep("requesting_parse")
      const { job } = await requestParse(dotaMatchId)

      // Step 2: Poll until parsed
      setStep("polling")
      await pollParseJob(job.jobId, controller.signal)

      // Step 3: Fetch match data
      setStep("fetching_data")
      const openDotaData = await fetchMatch(dotaMatchId)

      // Step 4: Save & process (existing logic)
      const { error: updateError } = await supabase
        .from("matches")
        .update({
          opendota_fetched: true,
          opendota_data: openDotaData,
        })
        .eq("id", matchId)

      if (updateError) throw updateError

      const { data: matchPlayers, error: fetchError } = await supabase
        .from("match_players")
        .select("id, slot, player_id, display_name, players!inner(id, steam_account_id)")
        .eq("match_id", matchId)

      if (fetchError) throw fetchError
      if (!matchPlayers) throw new Error("No match players found")

      type MatchPlayerRow = NonNullable<typeof matchPlayers>[number]

      const nameMap = new Map<string, MatchPlayerRow>()
      for (const mp of matchPlayers) {
        if (mp.display_name) {
          nameMap.set(mp.display_name.toLowerCase(), mp)
        }
      }

      const slotMap = new Map<number, MatchPlayerRow>()
      for (const mp of matchPlayers) {
        slotMap.set(mp.slot, mp)
      }

      const matchedIds = new Set<string>()
      let updatedCount = 0

      async function updateMatchPlayer(
        mp: MatchPlayerRow,
        odPlayer: (typeof openDotaData.players)[number]
      ) {
        matchedIds.add(mp.id)

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

        const player = mp.players as any
        if (odPlayer.account_id && player && !player.steam_account_id) {
          await supabase
            .from("players")
            .update({ steam_account_id: odPlayer.account_id })
            .eq("id", player.id)
        }
      }

      // Pass 1: match by personaname
      for (const odPlayer of openDotaData.players) {
        if (!odPlayer.personaname) continue
        const mp = nameMap.get(odPlayer.personaname.toLowerCase())
        if (!mp) continue
        await updateMatchPlayer(mp, odPlayer)
      }

      // Pass 2: match unmatched players by slot position
      for (const odPlayer of openDotaData.players) {
        const ourSlot = odSlotToOurSlot(odPlayer.player_slot)
        const mp = slotMap.get(ourSlot)
        if (!mp || matchedIds.has(mp.id)) continue
        await updateMatchPlayer(mp, odPlayer)
      }

      const totalOdPlayers = openDotaData.players.length
      toast.success(`Updated ${updatedCount}/${totalOdPlayers} players`)
      onFetched()
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        toast.info("Parse cancelled")
      } else {
        console.error("Error fetching OpenDota data:", error)
        toast.error(error instanceof Error ? error.message : "Failed to fetch OpenDota data")
      }
    } finally {
      setStep("idle")
      abortRef.current = null
    }
  }

  const busy = step !== "idle"

  const label =
    step === "requesting_parse"
      ? "Requesting parse..."
      : step === "polling"
        ? `Parsing replay... ${elapsedSeconds}s`
        : step === "fetching_data"
          ? "Fetching data..."
          : alreadyFetched
            ? "Re-fetch"
            : "Fetch from OpenDota"

  return (
    <Button
      onClick={handleFetch}
      disabled={!dotaMatchId || busy}
      size="sm"
      variant="outline"
    >
      {label}
    </Button>
  )
}
