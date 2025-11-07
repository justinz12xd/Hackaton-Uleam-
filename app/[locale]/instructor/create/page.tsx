"use client"

import type React from "react"

import { Suspense, useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter, useSearchParams } from "next/navigation"
import { useRouter as useI18nRouter } from "@/lib/i18n/routing"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft } from "lucide-react"
import { Link } from "@/lib/i18n/routing"
import { Alert, AlertDescription } from "@/components/ui/alert"

function CreateCoursePageContent() {
  const searchParams = useSearchParams()
  const eventId = searchParams.get('eventId')
  const [event, setEvent] = useState<any>(null)
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    difficulty_level: "beginner",
    duration_hours: "8",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const i18nRouter = useI18nRouter()
  const supabase = createClient()

  // Fetch event details if eventId is provided
  useEffect(() => {
    if (eventId) {
      fetchEvent()
    }
  }, [eventId])

  const fetchEvent = async () => {
    if (!eventId) return

    const { data, error } = await supabase
      .from('events')
      .select('id, title')
      .eq('id', eventId)
      .single()

    if (error) {
      console.error("Error fetching event:", error)
      return
    }

    setEvent(data)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const { data: userData, error: authError } = await supabase.auth.getUser()
      
      if (authError || !userData.user) {
        throw new Error("No estás autenticado. Por favor inicia sesión.")
      }

      console.log("Creating course with data:", {
        instructor_id: userData.user.id,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        difficulty_level: formData.difficulty_level,
        duration_hours: Number.parseInt(formData.duration_hours),
      })

      const { data, error: insertError } = await supabase
        .from("courses")
        .insert([
          {
            instructor_id: userData.user.id,
            title: formData.title,
            description: formData.description,
            category: formData.category,
            difficulty_level: formData.difficulty_level,
            duration_hours: Number.parseInt(formData.duration_hours),
            is_published: false,
            content: { modules: [] }, // Agregar contenido vacío por defecto
            primary_event_id: eventId || null,
          },
        ])
        .select()
        .single()

      if (insertError) {
        console.error("Insert error:", insertError)
        throw new Error(`Error al crear el curso: ${insertError.message}`)
      }

      console.log("Course created successfully:", data)
      
      // If eventId exists, link the course to the event
      if (eventId && data) {
        const { error: linkError } = await supabase
          .from('event_courses')
          .insert([
            {
              event_id: eventId,
              course_id: data.id,
            }
          ])

        if (linkError) {
          console.error("Error linking course to event:", linkError)
          // Don't throw, course was created successfully
        } else {
          console.log("Course linked to event successfully")
        }
      }

      // Redirect based on context
      if (eventId) {
        i18nRouter.push(`/events/${eventId}`)
      } else {
        i18nRouter.push("/instructor")
      }
    } catch (err: unknown) {
      console.error("Error completo:", err)
      setError(err instanceof Error ? err.message : "Ocurrió un error desconocido")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link href="/instructor">
            <Button variant="ghost" className="mb-4 gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-foreground">Create New Course</h1>
          <p className="text-muted-foreground mt-2">Set up your course and share your expertise</p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {event && (
          <Alert className="mb-6 bg-blue-500/10 border-blue-500/20">
            <AlertDescription className="text-blue-700 dark:text-blue-400">
              📚 Creando curso para el evento: <strong>{event.title}</strong>
            </AlertDescription>
          </Alert>
        )}
        
        <Card>
          <CardHeader>
            <CardTitle>Course Information</CardTitle>
            <CardDescription>Provide details about your course</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Course Title</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="e.g., Advanced Web Development"
                  value={formData.title}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Course Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Describe what students will learn in this course..."
                  rows={4}
                  value={formData.description}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    name="category"
                    placeholder="e.g., Technology, Business"
                    value={formData.category}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="difficulty">Difficulty Level</Label>
                  <Select
                    value={formData.difficulty_level}
                    onValueChange={(value) => handleSelectChange("difficulty_level", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duration (hours)</Label>
                <Input
                  id="duration"
                  name="duration_hours"
                  type="number"
                  min="1"
                  value={formData.duration_hours}
                  onChange={handleChange}
                  required
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <div className="flex gap-3">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Creating..." : "Create Course"}
                </Button>
                <Link href="/instructor">
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

export default function CreateCoursePage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-sm text-muted-foreground">Cargando formulario…</div>
      </main>
    }>
      <CreateCoursePageContent />
    </Suspense>
  )
}

