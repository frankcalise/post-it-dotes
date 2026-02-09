import { useEffect, useState, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import type { Note } from "@/lib/types"

export function useNotes(playerId: string | undefined) {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!playerId) {
      setLoading(false)
      return
    }

    let cancelled = false

    async function fetchNotes() {
      try {
        const { data, error } = await supabase
          .from("notes")
          .select("*")
          .eq("player_id", playerId!)
          .order("created_at", { ascending: false })

        if (cancelled) return
        if (error) throw error
        setNotes(data || [])
        setError(null)
      } catch (err) {
        if (cancelled) return
        setError(err as Error)
        console.error("Error fetching notes:", err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchNotes()

    const channel = supabase
      .channel(`notes-${playerId}-${crypto.randomUUID()}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notes",
          filter: `player_id=eq.${playerId}`,
        },
        () => {
          if (!cancelled) fetchNotes()
        }
      )
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(channel).catch(() => {})
    }
  }, [playerId])

  return { notes, loading, error }
}

export function useAddNote() {
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const addNote = useCallback(
    async (playerId: string, content: string, authorId: string, matchId?: string) => {
      try {
        setAdding(true)
        setError(null)

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
        return data
      } catch (err) {
        setError(err as Error)
        console.error("Error adding note:", err)
        throw err
      } finally {
        setAdding(false)
      }
    },
    []
  )

  return { addNote, adding, error }
}

export function useUpdateNote() {
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const updateNote = useCallback(async (noteId: string, content: string) => {
    try {
      setUpdating(true)
      setError(null)

      const { data, error } = await supabase
        .from("notes")
        .update({ content, updated_at: new Date().toISOString() })
        .eq("id", noteId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (err) {
      setError(err as Error)
      console.error("Error updating note:", err)
      throw err
    } finally {
      setUpdating(false)
    }
  }, [])

  return { updateNote, updating, error }
}

export function useDeleteNote() {
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const deleteNote = useCallback(async (noteId: string) => {
    try {
      setDeleting(true)
      setError(null)

      const { error } = await supabase.from("notes").delete().eq("id", noteId)

      if (error) throw error
    } catch (err) {
      setError(err as Error)
      console.error("Error deleting note:", err)
      throw err
    } finally {
      setDeleting(false)
    }
  }, [])

  return { deleteNote, deleting, error }
}
