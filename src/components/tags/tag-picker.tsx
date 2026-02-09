import { useState } from "react"
import { Check, Plus } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
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
import { cn } from "@/lib/utils"

type TagPickerProps = {
  playerId: string
  onClose?: () => void
}

const DEFAULT_COLORS = [
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

export function TagPicker({ playerId }: TagPickerProps) {
  const [open, setOpen] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newTagName, setNewTagName] = useState("")
  const [selectedColor, setSelectedColor] = useState(DEFAULT_COLORS[0])

  const { tags, createTag } = useTags()
  const { playerTags, addTag, removeTag } = usePlayerTags(playerId)
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

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Add Tag
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search tags..." />
          <CommandList>
            <CommandEmpty>No tags found.</CommandEmpty>
            <CommandGroup>
              {tags.map((tag) => (
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
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
