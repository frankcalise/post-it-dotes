import { useState, useEffect } from "react"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type ProfileSettingsDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProfileSettingsDialog({ open, onOpenChange }: ProfileSettingsDialogProps) {
  const { profile, updateProfile } = useAuth()
  const [steamAccountId, setSteamAccountId] = useState("")
  const [dotaNamesInput, setDotaNamesInput] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open && profile) {
      setSteamAccountId(profile.steam_account_id?.toString() ?? "")
      setDotaNamesInput(profile.dota_names.join(", "))
    }
  }, [open, profile])

  async function handleSave() {
    try {
      setSaving(true)
      const dotaNames = dotaNamesInput
        .split(",")
        .map((n) => n.trim())
        .filter(Boolean)
      const steamId = steamAccountId.trim()
        ? parseInt(steamAccountId.trim(), 10)
        : null

      if (steamId !== null && isNaN(steamId)) {
        toast.error("Steam Account ID must be a number")
        return
      }

      await updateProfile({
        steam_account_id: steamId,
        dota_names: dotaNames,
      })
      toast.success("Profile updated")
      onOpenChange(false)
    } catch (error) {
      toast.error("Failed to update profile")
      console.error(error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Profile Settings</DialogTitle>
          <DialogDescription>
            Configure your Dota identity so the app can recognize you in matches.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-muted-foreground text-xs">Discord</Label>
            <p className="text-sm">
              {profile?.display_name ?? "—"}
              {profile?.discord_username && (
                <span className="text-muted-foreground ml-1.5">
                  ({profile.discord_username})
                </span>
              )}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="steam-id">Game ID</Label>
            <Input
              id="steam-id"
              placeholder="e.g. 123456789"
              value={steamAccountId}
              onChange={(e) => setSteamAccountId(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              The number from your OpenDota or Dotabuff profile URL (e.g. opendota.com/players/<strong>123456789</strong>).
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="dota-names">Dota In-Game Names</Label>
            <Input
              id="dota-names"
              placeholder="e.g. MyName, AltName, OtherName"
              value={dotaNamesInput}
              onChange={(e) => setDotaNamesInput(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Comma-separated list of names you use in Dota. Used to auto-identify you when parsing status output.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
