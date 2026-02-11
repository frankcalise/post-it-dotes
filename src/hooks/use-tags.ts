import { useCallback, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { queryKeys } from "@/lib/query-keys"
import type { Tag, PlayerTag } from "@/lib/types"

export function useTags() {
  const queryClient = useQueryClient()

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.tags.all,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tags")
        .select("*")
        .order("name", { ascending: true })

      if (error) throw error
      return data as Tag[]
    },
  })

  const createMutation = useMutation({
    mutationFn: async ({ name, color, userId }: { name: string; color: string; userId: string | null }) => {
      const { data, error } = await supabase
        .from("tags")
        .insert({ name, color, created_by: userId })
        .select()
        .single()

      if (error) throw error
      return data as Tag
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tags.all })
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: { name?: string; color?: string } }) => {
      const { data, error } = await supabase
        .from("tags")
        .update(updates)
        .eq("id", id)
        .select()
        .single()

      if (error) throw error
      return data as Tag
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tags.all })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tags").delete().eq("id", id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tags.all })
    },
  })

  const createTag = useCallback(
    (name: string, color: string, userId: string | null) =>
      createMutation.mutateAsync({ name, color, userId }),
    [createMutation.mutateAsync]
  )

  const updateTag = useCallback(
    (id: string, updates: { name?: string; color?: string }) =>
      updateMutation.mutateAsync({ id, updates }),
    [updateMutation.mutateAsync]
  )

  const deleteTag = useCallback(
    (id: string) => deleteMutation.mutateAsync(id),
    [deleteMutation.mutateAsync]
  )

  return {
    tags: data ?? [],
    loading: isLoading,
    error: error as Error | null,
    refetch,
    createTag,
    updateTag,
    deleteTag,
  }
}

export function usePlayerTags(playerId: string) {
  const queryClient = useQueryClient()

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.tags.byPlayer(playerId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("player_tags")
        .select(`
          *,
          tag:tags (*)
        `)
        .eq("player_id", playerId)

      if (error) throw error
      return data as (PlayerTag & { tag: Tag })[]
    },
    enabled: !!playerId,
  })

  useEffect(() => {
    if (!playerId) return

    const invalidate = () =>
      queryClient.invalidateQueries({
        queryKey: queryKeys.tags.byPlayer(playerId),
      })

    const channel = supabase
      .channel(`player-tags-${playerId}-${crypto.randomUUID()}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "player_tags", filter: `player_id=eq.${playerId}` },
        invalidate
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "player_tags", filter: `player_id=eq.${playerId}` },
        invalidate
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "player_tags" },
        invalidate
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel).catch(() => {})
    }
  }, [playerId, queryClient])

  const addMutation = useMutation({
    mutationFn: async ({ tagId, userId }: { tagId: string; userId: string | null }) => {
      const { data, error } = await supabase
        .from("player_tags")
        .insert({ player_id: playerId, tag_id: tagId, tagged_by: userId })
        .select(`
          *,
          tag:tags (*)
        `)
        .single()

      if (error) throw error
      return data as PlayerTag & { tag: Tag }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tags.byPlayer(playerId) })
    },
  })

  const removeMutation = useMutation({
    mutationFn: async (tagId: string) => {
      const { error } = await supabase
        .from("player_tags")
        .delete()
        .eq("player_id", playerId)
        .eq("tag_id", tagId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tags.byPlayer(playerId) })
    },
  })

  const addTag = useCallback(
    (tagId: string, userId: string | null) =>
      addMutation.mutateAsync({ tagId, userId }),
    [addMutation.mutateAsync]
  )

  const removeTag = useCallback(
    (tagId: string) => removeMutation.mutateAsync(tagId),
    [removeMutation.mutateAsync]
  )

  return {
    playerTags: data ?? [],
    loading: isLoading,
    error: error as Error | null,
    addTag,
    removeTag,
    refetch,
  }
}
