"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { Link } from "@/lib/i18n/routing"
import { useTranslations } from "next-intl"
import { useAuthStore } from "@/lib/store/auth-store"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const t = useTranslations('auth.login')
  // Usar selector para evitar re-renders innecesarios
  const login = useAuthStore((state) => state.login)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (signInError) {
        throw signInError
      }
      
      if (data.user) {
        // Fetch user profile
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", data.user.id)
          .maybeSingle()

        if (profileError) {
          console.error("Error fetching profile:", profileError)
        }

        // Actualizar el store de Zustand primero
        console.log("Updating Zustand store with user and profile")
        if (profile) {
          login(data.user, profile)
        } else {
          // Si no hay perfil, aún así establecer el usuario
          login(data.user, {
            id: data.user.id,
            email: data.user.email || '',
            full_name: null,
            role: 'student',
            avatar_url: null,
            bio: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
        }
        
        // Verificar que el estado se actualizó
        const updatedState = useAuthStore.getState()
        console.log("Store updated:", {
          user: updatedState.user?.email,
          profile: updatedState.profile?.full_name,
          isAuthenticated: updatedState.isAuthenticated
        })

        // Establecer isLoading en false
        setIsLoading(false)

        // Redirigir según el rol del usuario
        const redirectPath = profile?.role === 'admin' || profile?.role === 'instructor' 
          ? '/instructor' 
          : '/dashboard'
        
        // Usar window.location para una redirección completa que actualice todo
        const currentPath = window.location.pathname
        const localeMatch = currentPath.match(/^\/([a-z]{2})\//)
        const locale = localeMatch ? localeMatch[1] : 'es'
        
        // Forzar un pequeño delay para asegurar que el estado se propague a todos los componentes
        // antes de redirigir
        await new Promise(resolve => setTimeout(resolve, 200))
        
        // Redirigir - window.location.href fuerza una recarga completa
        window.location.href = `/${locale}${redirectPath}`
      }
    } catch (error: unknown) {
      console.error("Error en login:", error)
      setError(error instanceof Error ? error.message : t('error'))
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{t('title')}</CardTitle>
              <CardDescription>{t('description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin}>
                <div className="flex flex-col gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="email">{t('email')}</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="m@example.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">{t('password')}</Label>
                    <Input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? t('loggingIn') : t('submit')}
                  </Button>
                </div>
                <div className="mt-4 text-center text-sm">
                  {t('noAccount')}{" "}
                  <Link href="/auth/signup" className="underline underline-offset-4">
                    {t('signUp')}
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

