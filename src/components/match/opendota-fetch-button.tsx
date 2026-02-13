import { useState, useEffect, useRef } from "react"
import { toast } from "sonner"
import { fetchMatch, requestParse, pollParseJob } from "@/lib/opendota"
import { saveOpenDotaData } from "@/lib/opendota-save"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"

type OpenDotaFetchButtonProps = {
  matchId: string
  dotaMatchId: number | null
  alreadyFetched: boolean
  onFetched: () => void
}

type FetchStep = "idle" | "requesting_parse" | "polling" | "fetching_data"

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
      setStep("requesting_parse")
      const { job } = await requestParse(dotaMatchId)

      setStep("polling")
      await pollParseJob(job.jobId, controller.signal)

      setStep("fetching_data")
      const openDotaData = await fetchMatch(dotaMatchId)

      const result = await saveOpenDotaData(supabase, matchId, openDotaData)
      toast.success(`Updated ${result.updatedPlayers}/${result.totalPlayers} players`)
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
