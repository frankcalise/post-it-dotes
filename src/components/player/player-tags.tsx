import { usePlayerTags } from "@/hooks/use-tags"
import { TagBadge } from "@/components/tags/tag-badge"
import { TagPicker } from "@/components/tags/tag-picker"

type PlayerTagsProps = {
  playerId: string
}

export function PlayerTags({ playerId }: PlayerTagsProps) {
  const { playerTags, removeTag, loading } = usePlayerTags(playerId)

  if (loading) {
    return (
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Tags</h3>
        <div className="text-sm text-muted-foreground">Loading tags...</div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Tags</h3>
        <TagPicker playerId={playerId} />
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
    </div>
  )
}
