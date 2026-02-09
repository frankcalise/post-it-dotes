import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'

export default function Header() {
  const { profile, signOut } = useAuth()

  return (
    <header className="border-b bg-background">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link to="/matches" className="flex items-center gap-2 font-semibold text-lg">
            <span>📝</span>
            <span className="hidden sm:inline">Post-it Dotes</span>
          </Link>

          <nav className="flex items-center gap-4">
            <Link
              to="/matches"
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              Matches
            </Link>
            <Link
              to="/players"
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              Players
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-muted-foreground sm:inline">
            {profile?.display_name || profile?.discord_username || 'User'}
          </span>
          <Button variant="outline" size="sm" onClick={signOut}>
            Sign Out
          </Button>
        </div>
      </div>
    </header>
  )
}
