"use client"

import { useEffect, useState, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuthStore } from "@/lib/store/auth-store"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  // Usar selectores para evitar re-renders innecesarios
  const setUser = useAuthStore((state) => state.setUser)
  const setProfile = useAuthStore((state) => state.setProfile)
  const setLoading = useAuthStore((state) => state.setLoading)
  const logout = useAuthStore((state) => state.logout)

  // Memoizar el cliente de Supabase para evitar recrearlo en cada render
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    // Get initial session
    const initAuth = async () => {
      try {
        setLoading(true)
        
        // Verificar si hay una sesión en Supabase
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        // Si no hay sesión, limpiar estado y salir
        if (!session || sessionError) {
          setUser(null)
          setProfile(null)
          setLoading(false)
          return
        }
        
        // Si hay sesión, verificar el usuario
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        // Si no hay usuario o hay error, limpiar estado
        if (!user || userError) {
          setUser(null)
          setProfile(null)
          setLoading(false)
          return
        }
        
        // Si hay usuario, obtener el perfil
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
      } catch (error) {
        console.error("Error initializing auth:", error)
        // En caso de error, limpiar estado
        setUser(null)
        setProfile(null)
      } finally {
        setLoading(false)
      }
    }

    initAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event, session?.user?.email)

        try {
          if (event === "SIGNED_IN" && session?.user) {
            console.log("SIGNED_IN event detected, updating state...")
            setLoading(true)
            
            // Verificar si el usuario ya está en el store (puede haber sido actualizado por login())
            const currentUser = useAuthStore.getState().user
            const currentProfile = useAuthStore.getState().profile
            
            // Si el usuario ya está en el store y coincide, no hacer nada
            if (currentUser?.id === session.user.id && currentProfile) {
              console.log("User already in store, skipping profile fetch")
              setLoading(false)
              return
            }
            
            // Fetch profile when user signs in
            const { data: profile, error: profileError } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", session.user.id)
              .maybeSingle()

            if (profileError) {
              console.error("Error fetching profile:", profileError)
            }

            if (profile) {
              console.log("Setting user and profile from SIGNED_IN event")
              setUser(session.user)
              setProfile(profile)
            } else {
              // Si no hay perfil, aún así establecer el usuario
              console.log("Setting user without profile from SIGNED_IN event")
              setUser(session.user)
              setProfile(null)
            }
            setLoading(false)
            console.log("Auth state updated from SIGNED_IN event")
          } else if (event === "SIGNED_OUT") {
            // Limpiar estado cuando se cierra sesión
            console.log("Usuario cerró sesión, limpiando estado...")
            logout() // logout() ya limpia todo el estado
            setLoading(false)
          } else if (event === "TOKEN_REFRESHED" && session?.user) {
            // Actualizar usuario cuando se refresca el token
            setUser(session.user)
          } else if (event === "USER_UPDATED" && session?.user) {
            // Actualizar usuario cuando se actualiza
            setUser(session.user)
            // También actualizar perfil si está disponible
            const { data: profile } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", session.user.id)
              .maybeSingle()
            
            if (profile) {
              setProfile(profile)
            }
          } else if (event === "USER_DELETED") {
            // Limpiar estado si el usuario fue eliminado
            logout()
            setLoading(false)
          }
        } catch (error) {
          console.error("Error en auth state change:", error)
          setLoading(false)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
    // Las funciones del store son estables, no necesitan estar en las dependencias
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted])

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return <>{children}</>
  }

  return <>{children}</>
}
