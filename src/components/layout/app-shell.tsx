import { Outlet } from 'react-router-dom'
import Header from './header'
import { KeyboardShortcutProvider } from '@/hooks/use-keyboard-shortcuts'

export default function AppShell() {
  return (
    <KeyboardShortcutProvider>
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 container mx-auto p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </KeyboardShortcutProvider>
  )
}
