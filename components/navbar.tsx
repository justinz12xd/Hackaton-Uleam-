"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface UserProfile {
  role: string
}

export function Navbar() {
  const [user, setUser] = useState<{ user: { email?: string } | null } | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Check current user
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user ? { user: { email: user.email } } : null)

      // Fetch user profile
      if (user) {
        const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single()
        setProfile(data)
      }

      setIsLoading(false)
    }

    checkUser()
  }, [supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  if (isLoading) {
    return null
  }

  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-primary">
          EduCred
        </Link>
        <div className="flex gap-4 items-center">
          {user ? (
            <>
              <Link href="/courses">
                <Button variant="ghost">Courses</Button>
              </Link>
              {profile?.role === "instructor" || profile?.role === "admin" ? (
                <Link href="/instructor">
                  <Button variant="ghost">Instructor</Button>
                </Link>
              ) : (
                <Link href="/dashboard">
                  <Button variant="ghost">Dashboard</Button>
                </Link>
              )}
              <Button variant="outline" onClick={handleLogout}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link href="/courses">
                <Button variant="ghost">Browse Courses</Button>
              </Link>
              <Link href="/auth/login">
                <Button variant="ghost">Log in</Button>
              </Link>
              <Link href="/auth/signup">
                <Button>Sign up</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
