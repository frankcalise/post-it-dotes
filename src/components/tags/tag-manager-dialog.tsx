import { useState } from "react"
import { Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { useTags } from "@/hooks/use-tags"
import { DEFAULT_COLORS } from "./tag-picker"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type TagManagerDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TagManagerDialog({ open, onOpenChange }: TagManagerDialogProps) {
  const { tags, updateTag, deleteTag } = useTags()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editColor, setEditColor] = useState("")
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  function startEdit(id: string, name: string, color: string) {
    setEditingId(id)
    setEditName(name)
    setEditColor(color)
    setDeletingId(null)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditName("")
    setEditColor("")
  }

  async function handleSave() {
    if (!editingId || !editName.trim()) return
    try {
      setSaving(true)
      await updateTag(editingId, { name: editName.trim(), color: editColor })
      toast.success("Tag updated")
      cancelEdit()
    } catch {
      toast.error("Failed to update tag")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      setSaving(true)
      await deleteTag(id)
      toast.success("Tag deleted")
      setDeletingId(null)
    } catch {
      toast.error("Failed to delete tag")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Tags</DialogTitle>
          <DialogDescription>
            Edit or delete tags. Deleting a tag removes it from all players.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[400px]">
          <div className="space-y-1">
            {tags.length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No tags yet.
              </p>
            )}
            {tags.map((tag) => (
              <div key={tag.id} className="rounded-md border p-2">
                {deletingId === tag.id ? (
                  <div className="space-y-2">
                    <p className="text-sm">
                      Delete <strong>{tag.name}</strong>? Removes from all players.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(tag.id)}
                        disabled={saving}
                      >
                        Confirm
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setDeletingId(null)}
                        disabled={saving}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : editingId === tag.id ? (
                  <div className="space-y-2">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          handleSave()
                        } else if (e.key === "Escape") {
                          cancelEdit()
                        }
                      }}
                      autoFocus
                    />
                    <div className="flex gap-1.5 flex-wrap">
                      {DEFAULT_COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          className={cn(
                            "w-6 h-6 rounded-full border-2 transition-all",
                            editColor === color
                              ? "border-foreground scale-110"
                              : "border-transparent hover:scale-105"
                          )}
                          style={{ backgroundColor: color }}
                          onClick={() => setEditColor(color)}
                        />
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSave} disabled={saving || !editName.trim()}>
                        {saving ? "Saving..." : "Save"}
                      </Button>
                      <Button size="sm" variant="outline" onClick={cancelEdit} disabled={saving}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: tag.color }}
                    />
                    <span className="flex-1 text-sm">{tag.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => startEdit(tag.id, tag.name, tag.color)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => {
                        setDeletingId(tag.id)
                        setEditingId(null)
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
