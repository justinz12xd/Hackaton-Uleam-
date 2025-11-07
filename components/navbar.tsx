"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { LanguageSwitcher } from "@/components/language-switcher"
import { UserSearch } from "@/components/user-search"
import { useTranslations } from "next-intl"
import { Link } from "@/lib/i18n/routing"
import { useAuthStore } from "@/lib/store/auth-store"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { User, LogOut, Settings } from "lucide-react"

export function Navbar() {
  const [mounted, setMounted] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  // Usar selectores para evitar re-renders innecesarios
  const user = useAuthStore((state) => state.user)
  const profile = useAuthStore((state) => state.profile)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const storeLogout = useAuthStore((state) => state.logout)
  
  // Memoizar el cliente de Supabase para evitar recrearlo en cada render
  const supabase = useMemo(() => createClient(), [])
  
  // useTranslations debe estar dentro del NextIntlClientProvider
  // Si no está disponible, Next.js renderizará en el cliente
  const t = useTranslations('nav')

  useEffect(() => {
    setMounted(true)
  }, [])

  // Memoizar handleLogout para evitar recrearlo en cada render
  const handleLogout = useCallback(async () => {
    setIsLoggingOut(true)
    
    // Limpiar estado local primero
    storeLogout()
    
    // Obtener locale antes de redirigir
    const currentPath = window.location.pathname
    const localeMatch = currentPath.match(/^\/([a-z]{2})\//)
    const locale = localeMatch ? localeMatch[1] : 'es'
    
    try {
      // Cerrar sesión en Supabase y esperar a que se complete
      // Esto asegura que las cookies se limpien correctamente
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error("Error al cerrar sesión:", error)
        // Aún así continuar con la redirección
      }
    } catch (error) {
      console.error("Error inesperado al cerrar sesión:", error)
      // Aún así continuar con la redirección
    }
    
    // Limpiar todas las cookies de Supabase manualmente por si acaso
    if (typeof document !== 'undefined') {
      // Limpiar cookies de Supabase
      const cookies = document.cookie.split(';')
      cookies.forEach(cookie => {
        const eqPos = cookie.indexOf('=')
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim()
        // Limpiar cookies relacionadas con Supabase
        if (name.includes('supabase') || name.includes('sb-')) {
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`
        }
      })
    }
    
    // Redirigir después de limpiar todo
    // Usar window.location.replace para evitar que el usuario pueda volver atrás
    window.location.replace(`/${locale}`)
  }, [supabase, storeLogout])

  // Memoizar funciones helper para evitar recrearlas en cada render
  const getInitials = useCallback((name: string | null, email: string) => {
    if (name) {
      const parts = name.split(' ')
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      }
      return name.substring(0, 2).toUpperCase()
    }
    return email.substring(0, 2).toUpperCase()
  }, [])

  const getFirstName = useCallback((name: string | null) => {
    if (name) {
      return name.split(' ')[0]
    }
    return null
  }, [])

  // Prevent hydration mismatch - usar href directo en lugar de Link durante SSR
  if (!mounted) {
    return (
      <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <a href="/es/events" className="text-2xl font-bold text-primary">
            EduCred
          </a>
          <div className="flex gap-4 items-center">
            <a href="/es/events">
              <Button variant="ghost">Events</Button>
            </a>
          </div>
        </div>
      </nav>
    )
  }

  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <Link href="/events" className="text-2xl font-bold text-primary">
          EduCred
        </Link>
        <div className="flex gap-4 items-center">
          {isAuthenticated && user ? (
            <>
              <Link href="/events">
                <Button variant="ghost">Events</Button>
              </Link>
              <UserSearch />
              {profile?.role === "instructor" || profile?.role === "admin" ? (
                <Link href="/instructor">
                  <Button variant="ghost">{t('instructor')}</Button>
                </Link>
              ) : (
                <Link href="/dashboard">
                  <Button variant="ghost">{t('dashboard')}</Button>
                </Link>
              )}
              
              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 px-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profile?.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getInitials(profile?.full_name || null, user.email || '')}
                      </AvatarFallback>
                    </Avatar>
                    {profile?.full_name && (
                      <span className="hidden md:inline-block text-sm font-medium">
                        {getFirstName(profile.full_name)}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {profile?.full_name || 'Usuario'}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/profile" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>Perfil</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Configuración</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleLogout} 
                    disabled={isLoggingOut}
                    className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950"
                  >
                    <LogOut className={`mr-2 h-4 w-4 ${isLoggingOut ? 'animate-spin' : ''}`} />
                    <span>{isLoggingOut ? 'Cerrando sesión...' : t('logout')}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <LanguageSwitcher />
            </>
          ) : (
            <>
              <Link href="/events">
                <Button variant="ghost">Events</Button>
              </Link>
              <UserSearch />
              <Link href="/auth/login">
                <Button variant="ghost">{t('login')}</Button>
              </Link>
              <Link href="/auth/signup">
                <Button>{t('signup')}</Button>
              </Link>
              <LanguageSwitcher />
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
