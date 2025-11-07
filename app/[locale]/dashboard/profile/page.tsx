"use client"

import { useEffect, useState, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Link, redirect } from "@/lib/i18n/routing"
import { useRouter } from "@/lib/i18n/routing"
import { useTranslations } from "next-intl"
import { Camera, Loader2, Award, Download, Share2, Calendar } from "lucide-react"

export default function ProfilePage() {
  const [profile, setProfile] = useState<{ full_name: string; bio: string; role: string; avatar_url?: string } | null>(null)
  const [user, setUser] = useState<{ email: string; id: string } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [certificates, setCertificates] = useState<any[]>([])
  const [isLoadingCertificates, setIsLoadingCertificates] = useState(true)
  const [formData, setFormData] = useState({
    full_name: "",
    bio: "",
  })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()
  const router = useRouter()
  const t = useTranslations('profile')

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true)
      setError(null)
      
      try {
        const { data: userData, error: userError } = await supabase.auth.getUser()
        
        if (userError || !userData?.user) {
          console.error("Error de autenticación:", userError)
          router.push("/auth/login")
          return
        }

        setUser({ email: userData.user.email || "", id: userData.user.id })

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userData.user.id)
          .single()

        if (profileError) throw profileError
        
        if (profileData) {
          setProfile(profileData)
          setFormData({
            full_name: profileData?.full_name || "",
            bio: profileData?.bio || "",
          })
        }

        // Fetch user certificates
        const { data: certificatesData, error: certificatesError } = await supabase
          .from("microcredentials")
          .select("*, course:courses(*), certificate:certificates(*)")
          .eq("student_id", userData.user.id)
          .eq("status", "completed")
          .order("issue_date", { ascending: false })

        if (certificatesError) {
          console.error("Error fetching certificates:", certificatesError)
        } else {
          setCertificates(certificatesData || [])
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Error al cargar el perfil"
        setError(errorMessage)
        console.error("Error fetching profile:", err)
      } finally {
        setIsLoading(false)
        setIsLoadingCertificates(false)
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    setIsUploadingImage(true)
    setError(null)

    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error(t('invalidImage'))
      }

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        throw new Error(t('imageTooLarge'))
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/avatar.${fileExt}`

      // Delete old image if exists
      if (profile?.avatar_url) {
        const oldPath = profile.avatar_url.split('/').pop()
        if (oldPath) {
          await supabase.storage
            .from('profile-images')
            .remove([`${user.id}/${oldPath}`])
        }
      }

      // Upload new image
      const { error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-images')
        .getPublicUrl(fileName)

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id)

      if (updateError) throw updateError

      // Update local state
      setProfile(prev => prev ? { ...prev, avatar_url: publicUrl } : null)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : t('uploadImageError'))
    } finally {
      setIsUploadingImage(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>
              <Skeleton className="h-8 w-48" />
            </CardTitle>
            <CardDescription>
              <Skeleton className="h-4 w-64" />
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar skeleton */}
            <div className="flex items-center gap-4">
              <Skeleton className="h-24 w-24 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
            
            {/* Form fields skeleton */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-24 w-full" />
              </div>
            </div>
            
            {/* Button skeleton */}
            <div className="flex gap-4">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-24" />
            </div>
          </CardContent>
        </Card>
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
            {/* Avatar Section */}
            <div className="flex flex-col items-center gap-4 pb-6 border-b">
              <div className="relative">
                <Avatar className="h-32 w-32">
                  <AvatarImage src={profile?.avatar_url} alt={profile?.full_name} />
                  <AvatarFallback className="text-3xl">
                    {profile?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <Button
                  size="icon"
                  className="absolute bottom-0 right-0 rounded-full"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingImage}
                >
                  {isUploadingImage ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  {t('clickCamera')}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('imageFormats')}
                </p>
              </div>
            </div>

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
                  placeholder={t('bioPlaceholder')}
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
            {isLoadingCertificates ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                ))}
              </div>
            ) : certificates.length > 0 ? (
              <div className="space-y-4">
                {certificates.map((credential) => {
                  const course = credential.course as any
                  const certificate = Array.isArray(credential.certificate) 
                    ? credential.certificate[0] 
                    : credential.certificate as any
                  
                  const issueDate = credential.issue_date 
                    ? new Date(credential.issue_date).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })
                    : null

                  const certificateNumber = certificate?.certificate_number || null

                  return (
                    <div
                      key={credential.id}
                      className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-shrink-0">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <Award className="h-6 w-6 text-primary" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm md:text-base line-clamp-1">
                          {course?.title || 'Curso completado'}
                        </h3>
                        {issueDate && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <Calendar className="h-3 w-3" />
                            <span>Emitido el {issueDate}</span>
                          </div>
                        )}
                        {certificateNumber && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Certificado #{certificateNumber}
                          </p>
                        )}
                      </div>
                      <div className="flex-shrink-0 flex gap-2">
                        {certificateNumber && (
                          <>
                            <Link href={`/certificates/${certificateNumber}`} target="_blank">
                              <Button variant="outline" size="sm" className="gap-2">
                                <Download className="h-4 w-4" />
                                <span className="hidden sm:inline">Ver</span>
                              </Button>
                            </Link>
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-2"
                              onClick={() => {
                                if (navigator.share) {
                                  navigator.share({
                                    title: `Certificado: ${course?.title || 'Curso'}`,
                                    text: `He completado el curso: ${course?.title || 'Curso'}`,
                                    url: `${window.location.origin}/certificates/${certificateNumber}`
                                  })
                                } else {
                                  navigator.clipboard.writeText(
                                    `${window.location.origin}/certificates/${certificateNumber}`
                                  )
                                  alert('Enlace copiado al portapapeles')
                                }
                              }}
                            >
                              <Share2 className="h-4 w-4" />
                              <span className="hidden sm:inline">Compartir</span>
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Award className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                <p className="text-muted-foreground text-sm">{t('completeCourses')}</p>
                <Link href="/courses">
                  <Button variant="outline" className="mt-4">
                    Explorar Cursos
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
