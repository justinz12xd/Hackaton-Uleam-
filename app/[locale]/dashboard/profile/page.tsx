"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Link, redirect } from "@/lib/i18n/routing"
import { useRouter } from "@/lib/i18n/routing"
import { useTranslations } from "next-intl"

export default function ProfilePage() {
  const [profile, setProfile] = useState<{ full_name: string; bio: string; role: string } | null>(null)
  const [user, setUser] = useState<{ email: string } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    full_name: "",
    bio: "",
  })
  const supabase = createClient()
  const router = useRouter()
  const t = useTranslations('profile')

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: userData, error: userError } = await supabase.auth.getUser()
        if (userError || !userData.user) {
          router.push("/auth/login")
          return
        }

        setUser({ email: userData.user.email || "" })

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userData.user.id)
          .single()

        if (profileError) throw profileError

        setProfile(profileData)
        setFormData({
          full_name: profileData?.full_name || "",
          bio: profileData?.bio || "",
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load profile")
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [supabase, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    setError(null)

    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) throw new Error("Not authenticated")

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name,
          bio: formData.bio,
        })
        .eq("id", userData.user.id)

      if (updateError) throw updateError

      setProfile((prev) => prev ? { ...prev, full_name: formData.full_name, bio: formData.bio } : null)
      setIsEditing(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('error'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || "",
        bio: profile.bio || "",
      })
    }
    setIsEditing(false)
    setError(null)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">{t('loading')}</p>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link href="/dashboard">
            <Button variant="ghost" className="mb-4">
              {t('backToDashboard')}
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-foreground">{t('title')}</h1>
        </div>
      </div>

      {/* Profile Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card>
          <CardHeader>
            <CardTitle>{t('profileInformation')}</CardTitle>
            <CardDescription>{t('viewManage')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">{t('fullName')}</Label>
                <Input
                  id="name"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t('email')}</Label>
                <Input id="email" value={user?.email || ""} disabled />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="bio">{t('bio')}</Label>
                <Textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder="Add your bio"
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">{t('accountType')}</Label>
                <Input id="role" value={profile?.role || "student"} disabled />
              </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            {isEditing ? (
              <div className="flex gap-3">
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? t('saving') : t('saveChanges')}
                </Button>
                <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                  {t('cancel')}
                </Button>
              </div>
            ) : (
              <Button onClick={() => setIsEditing(true)}>{t('editProfile')}</Button>
            )}
          </CardContent>
        </Card>

        {/* Certificates */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>{t('yourCertificates')}</CardTitle>
            <CardDescription>{t('downloadShare')}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">{t('completeCourses')}</p>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
