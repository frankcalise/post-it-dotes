import { createContext, useContext, useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"
import type { Profile } from "@/lib/types"

export type AuthContextValue = {
  user: User | null
  profile: Profile | null
  loading: boolean
  signInWithDiscord: () => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<Pick<Profile, "dota_names" | "steam_account_id">>) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)

      if (session?.user) {
        // Must not await Supabase calls inside onAuthStateChange — it
        // deadlocks when a token refresh is in flight. Fire-and-forget.
        fetchOrCreateProfile(session.user)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  async function fetchOrCreateProfile(authUser: User) {
    const meta = authUser.user_metadata
    const discordUsername = meta?.name ?? meta?.preferred_username ?? null
    const displayName = meta?.full_name ?? meta?.custom_claims?.global_name ?? null

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .single()

      if (error) {
        if (error.code === "PGRST116") {
          const { data: newProfile, error: insertError } = await supabase
            .from("profiles")
            .insert({
              id: authUser.id,
              discord_username: discordUsername,
              display_name: displayName,
              dota_names: [],
              steam_account_id: null,
            })
            .select()
            .single()

          if (insertError) throw insertError
          setProfile(newProfile)
        } else {
          throw error
        }
      } else {
        // Sync Discord metadata on each login in case it changed
        if (data.discord_username !== discordUsername || data.display_name !== displayName) {
          const { data: updated, error: updateError } = await supabase
            .from("profiles")
            .update({ discord_username: discordUsername, display_name: displayName })
            .eq("id", authUser.id)
            .select()
            .single()

          if (updateError) throw updateError
          setProfile(updated)
        } else {
          setProfile(data)
        }
      }
    } catch (error) {
      console.error("Error fetching/creating profile:", error)
    } finally {
      setLoading(false)
    }
  }

  async function updateProfile(updates: Partial<Pick<Profile, "dota_names" | "steam_account_id">>) {
    if (!user) throw new Error("Not authenticated")

    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id)
      .select()
      .single()

    if (error) throw error
    setProfile(data)
  }

  async function signInWithDiscord() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "discord",
    })
    if (error) {
      console.error("Error signing in with Discord:", error)
      throw error
    }
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error("Error signing out:", error)
      throw error
    }
  }

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, signInWithDiscord, signOut, updateProfile }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
