import type { SupabaseClient } from "@supabase/supabase-js"
import type { OpenDotaMatchData } from "./types"

export function odSlotToOurSlot(playerSlot: number): number {
  if (playerSlot <= 4) return playerSlot + 1
  return playerSlot - 128 + 6
}

export async function saveOpenDotaData(
  supabaseClient: SupabaseClient,
  matchId: string,
  openDotaData: OpenDotaMatchData
): Promise<{ updatedPlayers: number; totalPlayers: number }> {
  const { error: updateError } = await supabaseClient
    .from("matches")
    .update({
      opendota_fetched: true,
      opendota_data: openDotaData,
    })
    .eq("id", matchId)

  if (updateError) throw updateError

  const { data: matchPlayers, error: fetchError } = await supabaseClient
    .from("match_players")
    .select("id, slot, player_id, display_name, players!inner(id, steam_account_id)")
    .eq("match_id", matchId)

  if (fetchError) throw fetchError
  if (!matchPlayers) throw new Error("No match players found")

  type MatchPlayerRow = NonNullable<typeof matchPlayers>[number]

  const nameMap = new Map<string, MatchPlayerRow>()
  for (const mp of matchPlayers) {
    if (mp.display_name) {
      nameMap.set(mp.display_name.toLowerCase(), mp)
    }
  }

  const slotMap = new Map<number, MatchPlayerRow>()
  for (const mp of matchPlayers) {
    slotMap.set(mp.slot, mp)
  }

  const matchedIds = new Set<string>()
  let updatedCount = 0

  async function updateMatchPlayer(
    mp: MatchPlayerRow,
    odPlayer: OpenDotaMatchData["players"][number]
  ) {
    matchedIds.add(mp.id)

    const { error: updateMpError } = await supabaseClient
      .from("match_players")
      .update({
        hero_id: odPlayer.hero_id,
        kills: odPlayer.kills,
        deaths: odPlayer.deaths,
        assists: odPlayer.assists,
      })
      .eq("id", mp.id)

    if (updateMpError) throw updateMpError
    updatedCount++

    const player = mp.players as any
    if (odPlayer.account_id && player && !player.steam_account_id) {
      await supabaseClient
        .from("players")
        .update({ steam_account_id: odPlayer.account_id })
        .eq("id", player.id)
    }
  }

  // Pass 1: match by personaname
  for (const odPlayer of openDotaData.players) {
    if (!odPlayer.personaname) continue
    const mp = nameMap.get(odPlayer.personaname.toLowerCase())
    if (!mp) continue
    await updateMatchPlayer(mp, odPlayer)
  }

  // Pass 2: match unmatched players by slot position
  for (const odPlayer of openDotaData.players) {
    const ourSlot = odSlotToOurSlot(odPlayer.player_slot)
    const mp = slotMap.get(ourSlot)
    if (!mp || matchedIds.has(mp.id)) continue
    await updateMatchPlayer(mp, odPlayer)
  }

  return { updatedPlayers: updatedCount, totalPlayers: openDotaData.players.length }
}
