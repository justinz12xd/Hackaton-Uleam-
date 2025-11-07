"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuthStore } from "@/lib/store/auth-store"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  const { setUser, setProfile, setLoading, logout } = useAuthStore()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const supabase = createClient()

    // Get initial session
    const initAuth = async () => {
      try {
        setLoading(true)
        
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          // Fetch profile
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .maybeSingle()

          if (profile) {
            setUser(user)
            setProfile(profile)
          } else {
            setUser(null)
            setProfile(null)
          }
        } else {
          setUser(null)
          setProfile(null)
        }
      } catch (error) {
        console.error("Error initializing auth:", error)
      } finally {
        setLoading(false)
      }
    }

    initAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event, session?.user?.email)

        if (event === "SIGNED_IN" && session?.user) {
          // Fetch profile when user signs in
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .maybeSingle()

          if (profile) {
            setUser(session.user)
            setProfile(profile)
          }
        } else if (event === "SIGNED_OUT") {
          logout()
        } else if (event === "TOKEN_REFRESHED" && session?.user) {
          setUser(session.user)
        } else if (event === "USER_UPDATED" && session?.user) {
          setUser(session.user)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [mounted, setUser, setProfile, setLoading, logout])

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return <>{children}</>
  }

  return <>{children}</>
}
