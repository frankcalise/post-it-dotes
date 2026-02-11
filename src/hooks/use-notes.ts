import { useEffect, useCallback } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { queryKeys } from "@/lib/query-keys"
import type { Note } from "@/lib/types"

export function useNotes(playerId: string | undefined) {
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.notes.byPlayer(playerId ?? ""),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .eq("player_id", playerId!)
        .order("created_at", { ascending: false })

      if (error) throw error
      return data as Note[]
    },
    enabled: !!playerId,
  })

  useEffect(() => {
    if (!playerId) return

    const invalidate = () =>
      queryClient.invalidateQueries({
        queryKey: queryKeys.notes.byPlayer(playerId),
      })

    const channel = supabase
      .channel(`notes-${playerId}-${crypto.randomUUID()}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notes", filter: `player_id=eq.${playerId}` },
        invalidate
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "notes", filter: `player_id=eq.${playerId}` },
        invalidate
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "notes" },
        invalidate
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel).catch(() => {})
    }
  }, [playerId, queryClient])

  return {
    notes: data ?? [],
    loading: isLoading,
    error: error as Error | null,
  }
}

export function useAddNote() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async ({
      playerId,
      content,
      authorId,
      matchId,
    }: {
      playerId: string
      content: string
      authorId: string
      matchId?: string
    }) => {
      const { data, error } = await supabase
        .from("notes")
        .insert({
          player_id: playerId,
          content,
          author_id: authorId,
          match_id: matchId || null,
        })
        .select()
        .single()

      if (error) throw error
      return data as Note
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.notes.byPlayer(variables.playerId),
      })
    },
  })

  const addNote = useCallback(
    (playerId: string, content: string, authorId: string, matchId?: string) =>
      mutation.mutateAsync({ playerId, content, authorId, matchId }),
    [mutation.mutateAsync]
  )

  return {
    addNote,
    adding: mutation.isPending,
    error: mutation.error as Error | null,
  }
}

export function useUpdateNote() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async ({
      noteId,
      content,
    }: {
      noteId: string
      content: string
    }) => {
      const { data, error } = await supabase
        .from("notes")
        .update({ content, updated_at: new Date().toISOString() })
        .eq("id", noteId)
        .select()
        .single()

      if (error) throw error
      return data as Note
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.notes.byPlayer(data.player_id),
      })
    },
  })

  const updateNote = useCallback(
    (noteId: string, content: string) =>
      mutation.mutateAsync({ noteId, content }),
    [mutation.mutateAsync]
  )

  return {
    updateNote,
    updating: mutation.isPending,
    error: mutation.error as Error | null,
  }
}

export function useDeleteNote() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (noteId: string) => {
      const { error } = await supabase.from("notes").delete().eq("id", noteId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] })
    },
  })

  const deleteNote = useCallback(
    (noteId: string) => mutation.mutateAsync(noteId),
    [mutation.mutateAsync]
  )

  return {
    deleteNote,
    deleting: mutation.isPending,
    error: mutation.error as Error | null,
  }
}
