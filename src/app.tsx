import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { Toaster } from "sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AuthProvider } from "@/hooks/use-auth"
import AuthGuard from "@/components/layout/auth-guard"
import AppShell from "@/components/layout/app-shell"
import LoginPage from "@/pages/login"
import MatchesPage from "@/pages/matches"
import MatchPage from "@/pages/match"
import PlayersPage from "@/pages/players"
import PlayerPage from "@/pages/player"

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <TooltipProvider>
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

          <Toaster position="top-right" richColors />
        </TooltipProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
