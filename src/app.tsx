import { lazy, Suspense } from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { Toaster } from "sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AuthProvider } from "@/hooks/use-auth"
import { KeyboardShortcutsDialog } from "@/components/keyboard-shortcuts-dialog"
import AuthGuard from "@/components/layout/auth-guard"
import AppShell from "@/components/layout/app-shell"

const LoginPage = lazy(() => import("@/pages/login"))
const MatchesPage = lazy(() => import("@/pages/matches"))
const MatchPage = lazy(() => import("@/pages/match"))
const PlayersPage = lazy(() => import("@/pages/players"))
const PlayerPage = lazy(() => import("@/pages/player"))

const PageSpinner = () => (
  <div className="flex min-h-screen items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      <p className="text-sm text-muted-foreground">Loading...</p>
    </div>
  </div>
)

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <TooltipProvider>
          <Suspense fallback={<PageSpinner />}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />

              <Route element={<AuthGuard />}>
                <Route element={<AppShell />}>
                  <Route index element={<Navigate to="/matches" replace />} />
                  <Route path="/matches" element={<MatchesPage />} />
                  <Route path="/match/:id" element={<MatchPage />} />
                  <Route path="/players" element={<PlayersPage />} />
                  <Route path="/player/:id" element={<PlayerPage />} />
                </Route>
              </Route>
            </Routes>
          </Suspense>

          <KeyboardShortcutsDialog />
          <Toaster position="top-right" richColors />
        </TooltipProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
