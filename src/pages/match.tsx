import { useParams } from "react-router-dom"
import { useMatch } from "@/hooks/use-matches"
import { MatchView } from "@/components/match/match-view"

export default function MatchPage() {
  const { id } = useParams<{ id: string }>()
  const { match, matchPlayers, loading, error } = useMatch(id)

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4">
            <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">Loading match...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !match) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <div className="text-6xl">❌</div>
          <h1 className="text-2xl font-bold">Match Not Found</h1>
          <p className="text-muted-foreground">
            The match you're looking for doesn't exist.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <MatchView
        match={match}
        matchPlayers={matchPlayers}
        onRefetch={() => window.location.reload()}
      />
    </div>
  )
}
