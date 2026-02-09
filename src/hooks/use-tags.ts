import { useEffect, useState, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import type { Tag, PlayerTag } from "@/lib/types"

export function useTags() {
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    fetchTags()
  }, [])

  async function fetchTags() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("tags")
        .select("*")
        .order("name", { ascending: true })

      if (error) throw error
      setTags(data || [])
      setError(null)
    } catch (err) {
      setError(err as Error)
      console.error("Error fetching tags:", err)
    } finally {
      setLoading(false)
    }
  }

  const createTag = useCallback(async (name: string, color: string, userId: string | null) => {
    try {
      const { data, error } = await supabase
        .from("tags")
        .insert({ name, color, created_by: userId })
        .select()
        .single()

      if (error) throw error
      setTags((prev) => [...prev, data])
      return data
    } catch (err) {
      console.error("Error creating tag:", err)
      throw err
    }
  }, [])

  const updateTag = useCallback(async (id: string, updates: { name?: string; color?: string }) => {
    try {
      const { data, error } = await supabase
        .from("tags")
        .update(updates)
        .eq("id", id)
        .select()
        .single()

      if (error) throw error
      setTags((prev) => prev.map((t) => (t.id === id ? data : t)))
      return data
    } catch (err) {
      console.error("Error updating tag:", err)
      throw err
    }
  }, [])

  const deleteTag = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from("tags")
        .delete()
        .eq("id", id)

      if (error) throw error
      setTags((prev) => prev.filter((t) => t.id !== id))
    } catch (err) {
      console.error("Error deleting tag:", err)
      throw err
    }
  }, [])

  return { tags, loading, error, refetch: fetchTags, createTag, updateTag, deleteTag }
}

export function usePlayerTags(playerId: string) {
  const [playerTags, setPlayerTags] = useState<(PlayerTag & { tag: Tag })[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!playerId) {
      setLoading(false)
      return
    }
    fetchPlayerTags()
  }, [playerId])

  async function fetchPlayerTags() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("player_tags")
        .select(`
          *,
          tag:tags (*)
        `)
        .eq("player_id", playerId)

      if (error) throw error
      setPlayerTags(data as (PlayerTag & { tag: Tag })[] || [])
      setError(null)
    } catch (err) {
      setError(err as Error)
      console.error("Error fetching player tags:", err)
    } finally {
      setLoading(false)
    }
  }

  const addTag = useCallback(async (tagId: string, userId: string | null) => {
    try {
      const { data, error } = await supabase
        .from("player_tags")
        .insert({ player_id: playerId, tag_id: tagId, tagged_by: userId })
        .select(`
          *,
          tag:tags (*)
        `)
        .single()

      if (error) throw error
      setPlayerTags((prev) => [...prev, data as PlayerTag & { tag: Tag }])
    } catch (err) {
      console.error("Error adding tag:", err)
      throw err
    }
  }, [playerId])

  const removeTag = useCallback(async (tagId: string) => {
    try {
      const { error } = await supabase
        .from("player_tags")
        .delete()
        .eq("player_id", playerId)
        .eq("tag_id", tagId)

      if (error) throw error
      setPlayerTags((prev) => prev.filter((pt) => pt.tag_id !== tagId))
    } catch (err) {
      console.error("Error removing tag:", err)
      throw err
    }
  }, [playerId])

  return { playerTags, loading, error, addTag, removeTag, refetch: fetchPlayerTags }
}
