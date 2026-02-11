import { useState, type RefObject } from "react"
import { useNotes, useAddNote, useUpdateNote, useDeleteNote } from "@/hooks/use-notes"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Edit2, Trash2, Save, X } from "lucide-react"

type PlayerNotesProps = {
  playerId: string
  matchId?: string
  inputRef?: RefObject<HTMLTextAreaElement | null>
}

export function PlayerNotes({ playerId, matchId, inputRef }: PlayerNotesProps) {
  const [noteContent, setNoteContent] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")

  const { notes, loading } = useNotes(playerId)
  const { addNote, adding } = useAddNote()
  const { updateNote, updating } = useUpdateNote()
  const { deleteNote, deleting } = useDeleteNote()
  const { user, profile } = useAuth()

  const filteredNotes = matchId
    ? notes.filter((n) => n.match_id === matchId)
    : notes

  const handleAddNote = async () => {
    if (!noteContent.trim() || !user) return

    try {
      await addNote(playerId, noteContent.trim(), user.id, matchId)
      setNoteContent("")
    } catch (err) {
      console.error("Failed to add note:", err)
    }
  }

  const handleStartEdit = (noteId: string, content: string) => {
    setEditingId(noteId)
    setEditContent(content)
  }

  const handleSaveEdit = async (noteId: string) => {
    if (!editContent.trim()) return

    try {
      await updateNote(noteId, editContent.trim())
      setEditingId(null)
      setEditContent("")
    } catch (err) {
      console.error("Failed to update note:", err)
    }
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditContent("")
  }

  const handleDelete = async (noteId: string) => {
    if (!confirm("Are you sure you want to delete this note?")) return

    try {
      await deleteNote(noteId)
    } catch (err) {
      console.error("Failed to delete note:", err)
    }
  }

  if (loading) {
    return (
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Notes</h3>
        <div className="text-sm text-muted-foreground">Loading notes...</div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium">Notes</h3>

      {user && (
        <div className="space-y-2">
          <Textarea
            ref={inputRef}
            placeholder={matchId ? "Add a note for this match..." : "Add a note about this player..."}
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                e.preventDefault()
                handleAddNote()
              }
            }}
            rows={3}
            className="resize-none"
          />
          <Button
            size="sm"
            onClick={handleAddNote}
            disabled={!noteContent.trim() || adding}
          >
            {adding ? "Adding..." : "Add Note"}
            <kbd className="ml-1.5 pointer-events-none inline-flex h-5 select-none items-center rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              {navigator.userAgent.includes("Mac") ? "Cmd" : "Ctrl"} + Enter
            </kbd>
          </Button>
        </div>
      )}

      {filteredNotes.length > 0 ? (
        <div className="space-y-2">
          {filteredNotes.map((note) => {
            const isAuthor = user?.id === note.author_id
            const isEditing = editingId === note.id
            const noteDate = new Date(note.created_at).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })

            return (
              <Card key={note.id} className="p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-muted-foreground">
                      {isAuthor ? (profile?.display_name || "You") : "Unknown"} • {noteDate}
                      {note.match_id && !matchId && (
                        <span className="ml-1">(from a match)</span>
                      )}
                    </div>
                  </div>
                  {isAuthor && !isEditing && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => handleStartEdit(note.id, note.content)}
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(note.id)}
                        disabled={deleting}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>

                {isEditing ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={3}
                      className="resize-none"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleSaveEdit(note.id)}
                        disabled={!editContent.trim() || updating}
                      >
                        <Save className="h-3 w-3 mr-1" />
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCancelEdit}
                      >
                        <X className="h-3 w-3 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm whitespace-pre-wrap break-words">{note.content}</p>
                )}
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="text-sm text-muted-foreground">
          {user
            ? "No notes yet. Add one above to get started."
            : "No notes for this player."}
        </div>
      )}
    </div>
  )
}
