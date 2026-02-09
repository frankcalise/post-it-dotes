import { usePlayerTags } from "@/hooks/use-tags"
import { TagBadge } from "@/components/tags/tag-badge"
import { TagPicker, TagPickerDialog } from "@/components/tags/tag-picker"

type PlayerTagsProps = {
  playerId: string
  dialogOpen?: boolean
  onDialogOpenChange?: (open: boolean) => void
}

export function PlayerTags({ playerId, dialogOpen, onDialogOpenChange }: PlayerTagsProps) {
  const { playerTags, removeTag, loading, refetch } = usePlayerTags(playerId)

  if (loading) {
    return (
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Tags</h3>
        <div className="text-sm text-muted-foreground">Loading tags...</div>
      </div>
    )
  }

  function handleClose() {
    refetch()
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Tags</h3>
        <TagPicker playerId={playerId} onClose={handleClose} />
      </div>

      {playerTags.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {playerTags.map((pt) => (
            <TagBadge
              key={pt.tag_id}
              tag={pt.tag}
              onRemove={() => removeTag(pt.tag_id)}
            />
          ))}
        </div>
      ) : (
        <div className="text-sm text-muted-foreground">
          No tags yet. Click "Add Tag" to get started.
        </div>
      )}

      {dialogOpen !== undefined && onDialogOpenChange && (
        <TagPickerDialog
          playerId={playerId}
          open={dialogOpen}
          onOpenChange={(open) => {
            onDialogOpenChange(open)
            if (!open) refetch()
          }}
        />
      )}
    </div>
  )
}
