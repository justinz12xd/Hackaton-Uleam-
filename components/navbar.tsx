"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { LanguageSwitcher } from "@/components/language-switcher"
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet"
import { User, LogOut, Settings, Award, Menu, X, Calendar, LayoutDashboard, GraduationCap, Shield } from "lucide-react"
import { Separator } from "@/components/ui/separator"

export function Navbar() {
  const [mounted, setMounted] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
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

  // Forzar re-render cuando cambie el estado de autenticación
  useEffect(() => {
    // Este efecto se ejecutará cuando user, profile o isAuthenticated cambien
    // gracias a los selectores de Zustand
  }, [user, profile, isAuthenticated])

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
      <nav className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <a href="/es" className="text-xl sm:text-2xl font-bold text-primary">
              EduCred
            </a>
            <div className="flex gap-2 items-center">
              <a href="/es/events" className="hidden sm:inline-block">
                <Button variant="ghost" size="sm">Events</Button>
              </a>
            </div>
          </div>
        </div>
      </nav>
    )
  }

  return (
    <nav className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="text-xl sm:text-2xl font-bold text-primary shrink-0">
            EduCred
          </Link>

          {/* Desktop Navigation - Hidden on mobile */}
          <div className="hidden md:flex items-center gap-2 lg:gap-4">
            {isAuthenticated && user ? (
              <>
                <Link href="/events">
                  <Button variant="ghost" size="sm">
                    <Calendar className="h-4 w-4 mr-2" />
                    Events
                  </Button>
                </Link>
                {profile?.role === "admin" ? (
                  <>
                    <Link href="/admin">
                      <Button variant="ghost" size="sm">
                        <Shield className="h-4 w-4 mr-2" />
                        {t('admin')}
                      </Button>
                    </Link>
                    <Link href="/admin/certificates">
                      <Button variant="ghost" size="sm">
                        <Award className="h-4 w-4 mr-2" />
                        Certificados
                      </Button>
                    </Link>
                  </>
                ) : profile?.role === "instructor" ? (
                  <Link href="/instructor">
                    <Button variant="ghost" size="sm">
                      <GraduationCap className="h-4 w-4 mr-2" />
                      {t('instructor')}
                    </Button>
                  </Link>
                ) : (
                  <Link href="/dashboard">
                    <Button variant="ghost" size="sm">
                      <LayoutDashboard className="h-4 w-4 mr-2" />
                      {t('dashboard')}
                    </Button>
                  </Link>
                )}
                
                {/* User Menu Desktop */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-2 px-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={profile?.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getInitials(profile?.full_name || null, user.email || '')}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden lg:inline-block text-sm font-medium">
                        {getFirstName(profile?.full_name || null) || t('user')}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {profile?.full_name || t('user')}
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
                        <span>{t('profile')}</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>{t('settings')}</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950"
                    >
                      <LogOut className={`mr-2 h-4 w-4 ${isLoggingOut ? 'animate-spin' : ''}`} />
                      <span>{isLoggingOut ? t('loggingOut') : t('logout')}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <LanguageSwitcher />
              </>
            ) : (
              <>
                <Link href="/events">
                  <Button variant="ghost" size="sm">
                    <Calendar className="h-4 w-4 mr-2" />
                    Events
                  </Button>
                </Link>
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm">{t('login')}</Button>
                </Link>
                <Link href="/auth/signup">
                  <Button size="sm">{t('signup')}</Button>
                </Link>
                <LanguageSwitcher />
              </>
            )}
          </div>

          {/* Mobile Menu - Visible on mobile only */}
          <div className="flex md:hidden items-center gap-2">
            <LanguageSwitcher />
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Abrir menú</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[350px]">
                <SheetHeader>
                  <SheetTitle className="text-left">
                    <Link href="/" className="text-2xl font-bold text-primary" onClick={() => setIsMobileMenuOpen(false)}>
                      EduCred
                    </Link>
                  </SheetTitle>
                </SheetHeader>
                
                <div className="mt-8 flex flex-col gap-4">
                  {isAuthenticated && user ? (
                    <>
                      {/* User Info */}
                      <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={profile?.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {getInitials(profile?.full_name || null, user.email || '')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {profile?.full_name || t('user')}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {user.email}
                          </p>
                        </div>
                      </div>

                      <Separator />

                      {/* Navigation Links */}
                      <div className="flex flex-col gap-2">
                        <SheetClose asChild>
                          <Link href="/events">
                            <Button variant="ghost" className="w-full justify-start gap-3" size="lg">
                              <Calendar className="h-5 w-5" />
                              Events
                            </Button>
                          </Link>
                        </SheetClose>

                        {profile?.role === "admin" && (
                          <>
                            <SheetClose asChild>
                              <Link href="/admin">
                                <Button variant="ghost" className="w-full justify-start gap-3" size="lg">
                                  <Shield className="h-5 w-5" />
                                  {t('admin')}
                                </Button>
                              </Link>
                            </SheetClose>
                            <SheetClose asChild>
                              <Link href="/admin/certificates">
                                <Button variant="ghost" className="w-full justify-start gap-3" size="lg">
                                  <Award className="h-5 w-5" />
                                  Certificados
                                </Button>
                              </Link>
                            </SheetClose>
                          </>
                        )}

                        {profile?.role === "instructor" && (
                          <SheetClose asChild>
                            <Link href="/instructor">
                              <Button variant="ghost" className="w-full justify-start gap-3" size="lg">
                                <GraduationCap className="h-5 w-5" />
                                {t('instructor')}
                              </Button>
                            </Link>
                          </SheetClose>
                        )}

                        {!profile?.role || (profile.role !== "admin" && profile.role !== "instructor") ? (
                          <SheetClose asChild>
                            <Link href="/dashboard">
                              <Button variant="ghost" className="w-full justify-start gap-3" size="lg">
                                <LayoutDashboard className="h-5 w-5" />
                                {t('dashboard')}
                              </Button>
                            </Link>
                          </SheetClose>
                        ) : null}

                        <Separator />

                        <SheetClose asChild>
                          <Link href="/dashboard/profile">
                            <Button variant="ghost" className="w-full justify-start gap-3" size="lg">
                              <User className="h-5 w-5" />
                              {t('profile')}
                            </Button>
                          </Link>
                        </SheetClose>

                        <SheetClose asChild>
                          <Link href="/dashboard">
                            <Button variant="ghost" className="w-full justify-start gap-3" size="lg">
                              <Settings className="h-5 w-5" />
                              {t('settings')}
                            </Button>
                          </Link>
                        </SheetClose>

                        <Separator />

                        <Button
                          variant="ghost"
                          className="w-full justify-start gap-3 text-red-600 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                          size="lg"
                          onClick={() => {
                            setIsMobileMenuOpen(false)
                            handleLogout()
                          }}
                          disabled={isLoggingOut}
                        >
                          <LogOut className={`h-5 w-5 ${isLoggingOut ? 'animate-spin' : ''}`} />
                          {isLoggingOut ? t('loggingOut') : t('logout')}
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Guest Navigation */}
                      <div className="flex flex-col gap-2">
                        <SheetClose asChild>
                          <Link href="/events">
                            <Button variant="ghost" className="w-full justify-start gap-3" size="lg">
                              <Calendar className="h-5 w-5" />
                              Events
                            </Button>
                          </Link>
                        </SheetClose>

                        <Separator />

                        <SheetClose asChild>
                          <Link href="/auth/login">
                            <Button variant="ghost" className="w-full justify-start gap-3" size="lg">
                              <User className="h-5 w-5" />
                              {t('login')}
                            </Button>
                          </Link>
                        </SheetClose>

                        <SheetClose asChild>
                          <Link href="/auth/signup">
                            <Button className="w-full gap-3" size="lg">
                              <GraduationCap className="h-5 w-5" />
                              {t('signup')}
                            </Button>
                          </Link>
                        </SheetClose>
                      </div>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  )
}
