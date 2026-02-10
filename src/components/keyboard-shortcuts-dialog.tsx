import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const sections = [
  {
    title: "Matches",
    shortcuts: [
      { key: "I", description: "Move up" },
      { key: "K", description: "Move down" },
      { key: "O", description: "Open match" },
      { key: "N", description: "New match" },
    ],
  },
  {
    title: "Match Detail",
    shortcuts: [
      { key: "I", description: "Move up" },
      { key: "K", description: "Move down" },
      { key: "O", description: "Open player" },
      { key: "1 / 2", description: "Move player to team" },
      { key: "T", description: "Tag player" },
      { key: "N", description: "View player notes" },
    ],
  },
  {
    title: "Tagging",
    shortcuts: [
      { key: "Esc", description: "Save & close" },
      { key: "#", description: "Toggle tag" },
    ],
  },
  {
    title: "Player Detail",
    shortcuts: [
      { key: "T", description: "Tag player" },
      { key: "N", description: "Focus note textbox" },
      { key: "⌘ Enter", description: "Add note" },
    ],
  },
]

export function KeyboardShortcutsDialog() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const tag = document.activeElement?.tagName
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return

      if (e.key === "/" || e.key === "?") {
        e.preventDefault()
        setOpen(true)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {sections.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                {section.title}
              </h3>
              <div className="space-y-1">
                {section.shortcuts.map((shortcut) => (
                  <div
                    key={shortcut.key}
                    className="flex items-center justify-between text-sm"
                  >
                    <span>{shortcut.description}</span>
                    <kbd className="inline-flex h-5 items-center rounded border bg-muted px-1.5 font-mono text-[11px] text-muted-foreground">
                      {shortcut.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div className="pt-2 border-t text-xs text-muted-foreground text-center">
            Press <kbd className="px-1 py-0.5 rounded border bg-muted font-mono text-[10px]">/</kbd> or <kbd className="px-1 py-0.5 rounded border bg-muted font-mono text-[10px]">?</kbd> to toggle this dialog
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
