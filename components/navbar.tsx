"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
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
  const { user, profile, isAuthenticated, logout: storeLogout } = useAuthStore()
  const router = useRouter()
  const supabase = createClient()
  const t = useTranslations('nav')

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    storeLogout()
    router.push("/")
    router.refresh()
  }

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      const parts = name.split(' ')
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      }
      return name.substring(0, 2).toUpperCase()
    }
    return email.substring(0, 2).toUpperCase()
  }

  const getFirstName = (name: string | null) => {
    if (name) {
      return name.split(' ')[0]
    }
    return null
  }

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/events" className="text-2xl font-bold text-primary">
            EduCred
          </Link>
          <div className="flex gap-4 items-center">
            <Link href="/events">
              <Button variant="ghost">Events</Button>
            </Link>
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
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{t('logout')}</span>
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
