import { useState } from "react"
import { Check, Plus, Settings } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useTags, usePlayerTags } from "@/hooks/use-tags"
import { useAuth } from "@/hooks/use-auth"
import { TagManagerDialog } from "./tag-manager-dialog"
import { cn } from "@/lib/utils"

export const DEFAULT_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#f59e0b", // amber
  "#84cc16", // lime
  "#10b981", // emerald
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#6b7280", // gray
]

const KEY_TO_INDEX: Record<string, number> = {
  "1": 0, "2": 1, "3": 2, "4": 3, "5": 4,
  "6": 5, "7": 6, "8": 7, "9": 8, "0": 9,
}

function shortcutLabel(index: number): string | null {
  if (index < 9) return String(index + 1)
  if (index === 9) return "0"
  return null
}

function TagPickerContent({ playerId }: { playerId: string }) {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newTagName, setNewTagName] = useState("")
  const [selectedColor, setSelectedColor] = useState(DEFAULT_COLORS[0])
  const [managerOpen, setManagerOpen] = useState(false)
  const [search, setSearch] = useState("")

  const { tags, createTag, refetch: refetchTags } = useTags()
  const { playerTags, addTag, removeTag, refetch: refetchPlayerTags } = usePlayerTags(playerId)
  const { user } = useAuth()

  const playerTagIds = new Set(playerTags.map((pt) => pt.tag_id))

  const handleToggleTag = async (tagId: string) => {
    try {
      if (playerTagIds.has(tagId)) {
        await removeTag(tagId)
      } else {
        await addTag(tagId, user?.id || null)
      }
    } catch (err) {
      console.error("Error toggling tag:", err)
    }
  }

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return

    try {
      const newTag = await createTag(newTagName.trim(), selectedColor, user?.id || null)
      await addTag(newTag.id, user?.id || null)
      setNewTagName("")
      setShowCreateForm(false)
      setSelectedColor(DEFAULT_COLORS[0])
    } catch (err) {
      console.error("Error creating tag:", err)
    }
  }

  const handleManagerClose = (open: boolean) => {
    setManagerOpen(open)
    if (!open) {
      refetchTags()
      refetchPlayerTags()
    }
  }

  return (
    <>
      <Command>
        <CommandInput
          placeholder="Search tags..."
          value={search}
          onValueChange={setSearch}
          onKeyDown={(e) => {
            if (search) return
            const idx = KEY_TO_INDEX[e.key]
            if (idx !== undefined && idx < tags.length) {
              e.preventDefault()
              handleToggleTag(tags[idx].id)
            }
          }}
        />
        <CommandList>
          <CommandEmpty>No tags found.</CommandEmpty>
          <CommandGroup>
            {tags.map((tag, i) => (
              <CommandItem
                key={tag.id}
                onSelect={() => handleToggleTag(tag.id)}
                className="cursor-pointer"
              >
                <div className="flex items-center gap-2 flex-1">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: tag.color }}
                  />
                  <span className="flex-1">{tag.name}</span>
                  {!search && shortcutLabel(i) && (
                    <kbd className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-mono">
                      {shortcutLabel(i)}
                    </kbd>
                  )}
                  {playerTagIds.has(tag.id) && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup>
            {!showCreateForm ? (
              <CommandItem
                onSelect={() => setShowCreateForm(true)}
                className="cursor-pointer"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create new tag
              </CommandItem>
            ) : (
              <div className="p-2 space-y-2">
                <Input
                  placeholder="Tag name"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleCreateTag()
                    } else if (e.key === "Escape") {
                      setShowCreateForm(false)
                      setNewTagName("")
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
                        selectedColor === color
                          ? "border-foreground scale-110"
                          : "border-transparent hover:scale-105"
                      )}
                      style={{ backgroundColor: color }}
                      onClick={() => setSelectedColor(color)}
                      aria-label={`Select color ${color}`}
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={handleCreateTag}
                    disabled={!newTagName.trim()}
                  >
                    Create
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setShowCreateForm(false)
                      setNewTagName("")
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup>
            <CommandItem
              onSelect={() => setManagerOpen(true)}
              className="cursor-pointer"
            >
              <Settings className="h-4 w-4 mr-2" />
              Manage Tags
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
      <TagManagerDialog open={managerOpen} onOpenChange={handleManagerClose} />
    </>
  )
}

export function TagPicker({ playerId, onClose }: { playerId: string; onClose?: () => void }) {
  const [open, setOpen] = useState(false)

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) onClose?.()
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Add Tag
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <TagPickerContent playerId={playerId} />
      </PopoverContent>
    </Popover>
  )
}

type TagPickerDialogProps = {
  playerId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TagPickerDialog({ playerId, open, onOpenChange }: TagPickerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm p-0 gap-0">
        <DialogHeader className="px-4 pt-4 pb-0">
          <DialogTitle className="text-base">Tags</DialogTitle>
        </DialogHeader>
        <TagPickerContent playerId={playerId} />
      </DialogContent>
    </Dialog>
  )
}
