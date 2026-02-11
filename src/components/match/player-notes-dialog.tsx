import { useState } from "react"
import { useNotes, useAddNote } from "@/hooks/use-notes"
import { useAuth } from "@/hooks/use-auth"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"

type PlayerNotesDialogProps = {
  playerId: string | null
  playerName: string | null
  matchId?: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PlayerNotesDialog({
  playerId,
  playerName,
  matchId,
  open,
  onOpenChange,
}: PlayerNotesDialogProps) {
  const { user } = useAuth()
  const { notes, loading } = useNotes(open ? (playerId ?? undefined) : undefined)
  const { addNote, adding } = useAddNote()
  const [content, setContent] = useState("")

  async function handleAdd() {
    if (!content.trim() || !user || !playerId) return
    try {
      await addNote(playerId, content.trim(), user.id, matchId)
      setContent("")
    } catch {
      // useAddNote logs internally
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[70vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Notes — {playerName || "Player"}</DialogTitle>
        </DialogHeader>

        {user && (
          <div className="space-y-2">
            <Textarea
              placeholder="Add a note..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                  e.preventDefault()
                  handleAdd()
                }
              }}
              rows={2}
              className="resize-none"
            />
            <Button
              size="sm"
              onClick={handleAdd}
              disabled={!content.trim() || adding}
            >
              {adding ? "Adding..." : "Add Note"}
              <kbd className="ml-1.5 pointer-events-none inline-flex h-5 select-none items-center rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                {navigator.userAgent.includes("Mac") ? "Cmd" : "Ctrl"} + Enter
              </kbd>
            </Button>
          </div>
        )}

        {loading ? (
          <div className="text-sm text-muted-foreground text-center py-4">
            Loading...
          </div>
        ) : notes.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-4">
            No notes yet
          </div>
        ) : (
          <div className="space-y-2">
            {notes.map((note) => (
              <div
                key={note.id}
                className="text-sm bg-muted/50 rounded p-3"
              >
                <div>{note.content}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {new Date(note.created_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
