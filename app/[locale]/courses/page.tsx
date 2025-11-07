"use client"

import { useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Search } from "lucide-react"
import { Link } from "@/lib/i18n/routing"
import { useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"

interface Course {
  id: string
  title: string
  description: string
  difficulty_level: string
  duration_hours: number
  is_published: boolean
  created_at: string
  primary_event_id?: string | null
}

type AccessStatus = "loading" | "no-session" | "no-access" | "ready"

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedLevel, setSelectedLevel] = useState<string>("All")
  const [isLoading, setIsLoading] = useState(true)
  const [status, setStatus] = useState<AccessStatus>("loading")
  const [activeEvent, setActiveEvent] = useState<{ id: string; title: string | null } | null>(null)

  const searchParams = useSearchParams()
  const eventIdParam = searchParams.get("eventId")
  const t = useTranslations("courses")

  useEffect(() => {
    fetchCourses()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventIdParam])

  useEffect(() => {
    if (status === "ready") {
      filterCourses()
    }
  }, [searchQuery, selectedLevel, courses, status])

  const fetchCourses = async () => {
    setIsLoading(true)
    setStatus("loading")
    setCourses([])
    setFilteredCourses([])
    setActiveEvent(null)
    const supabase = createClient()

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        setStatus("no-session")
        return
      }

      const { data: registrations, error: registrationsError } = await supabase
        .from("event_registrations")
        .select("event_id")
        .eq("user_id", user.id)
        .eq("is_attended", true)

      if (registrationsError) {
        console.error("Error fetching registrations:", registrationsError)
        setStatus("no-access")
        return
      }

      const verifiedEventIds = (registrations ?? [])
        .map((registration) => registration.event_id)
        .filter((eventId): eventId is string => Boolean(eventId))

      let eventIdsToQuery = verifiedEventIds
      let eventInfo: { id: string; title: string | null } | null = null

      if (eventIdParam) {
        const { data: eventData } = await supabase
          .from("events")
          .select("id, title")
          .eq("id", eventIdParam)
          .maybeSingle()

        if (eventData) {
          eventInfo = { id: eventData.id, title: eventData.title }
        }

        if (!verifiedEventIds.includes(eventIdParam)) {
          setStatus("no-access")
          setActiveEvent(eventInfo ?? { id: eventIdParam, title: null })
          return
        }

        eventIdsToQuery = verifiedEventIds.filter((id) => id === eventIdParam)
      }

      if (eventIdsToQuery.length === 0) {
        setStatus("no-access")
        return
      }

      const { data: eventCourses, error: eventCoursesError } = await supabase
        .from("event_courses")
        .select(
          `event_id,
           courses (
             id,
             title,
             description,
             difficulty_level,
             duration_hours,
             is_published,
             created_at,
             primary_event_id
           )`
        )
        .in("event_id", eventIdsToQuery)
        .eq("courses.is_published", true)

      if (eventCoursesError) {
        console.error("Error fetching event courses:", eventCoursesError)
        setStatus("no-access")
        return
      }

      const uniqueCourses = new Map<string, Course>()
      for (const entry of eventCourses ?? []) {
        const courseData = entry?.courses as Course | Course[] | null | undefined

        if (Array.isArray(courseData)) {
          courseData.forEach((course) => {
            if (course) {
              uniqueCourses.set(course.id, course)
            }
          })
        } else if (courseData) {
          uniqueCourses.set(courseData.id, courseData)
        }
      }

      const accessibleCourses = Array.from(uniqueCourses.values()).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )

      setCourses(accessibleCourses)
      setFilteredCourses(accessibleCourses)
      setActiveEvent(eventInfo)
      setStatus("ready")
    } catch (error) {
      console.error("Unexpected error fetching courses:", error)
      setStatus("no-access")
    } finally {
      setIsLoading(false)
    }
  }

  const filterCourses = () => {
    let filtered = courses

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (course) =>
          course.title.toLowerCase().includes(query) ||
          course.description.toLowerCase().includes(query)
      )
    }

    if (selectedLevel !== "All") {
      filtered = filtered.filter(
        (course) => course.difficulty_level?.toLowerCase() === selectedLevel.toLowerCase()
      )
    }

    setFilteredCourses(filtered)
  }

  const handleLevelChange = (level: string) => {
    setSelectedLevel(level)
  }

  const backHref = useMemo(() => {
    if (activeEvent?.id) {
      return `/events/${activeEvent.id}`
    }
    return "/"
  }, [activeEvent])

  const pageTitle = activeEvent?.title
    ? t("eventCoursesTitle", { event: activeEvent.title })
    : t("allCourses")

  const pageDescription = activeEvent?.title
    ? t("eventCoursesDescription")
    : t("exploreCatalog")

  return (
    <main className="min-h-screen bg-background">
      <div className="border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            {activeEvent?.id ? t("backToEvent") : t("back")}
          </Link>
          <h1 className="text-4xl font-bold text-foreground mb-2">{pageTitle}</h1>
          <p className="text-lg text-muted-foreground">
            {pageDescription}
          </p>
        </div>
      </div>

      {status === "ready" ? (
        <>
          <div className="border-b border-border">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="flex flex-col gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search courses..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant={selectedLevel === "All" ? "outline" : "ghost"}
                    size="sm"
                    onClick={() => handleLevelChange("All")}
                  >
                    All {selectedLevel === "All" && `(${filteredCourses.length})`}
                  </Button>
                  <Button
                    variant={selectedLevel === "Beginner" ? "outline" : "ghost"}
                    size="sm"
                    onClick={() => handleLevelChange("Beginner")}
                  >
                    Beginner
                  </Button>
                  <Button
                    variant={selectedLevel === "Intermediate" ? "outline" : "ghost"}
                    size="sm"
                    onClick={() => handleLevelChange("Intermediate")}
                  >
                    Intermediate
                  </Button>
                  <Button
                    variant={selectedLevel === "Advanced" ? "outline" : "ghost"}
                    size="sm"
                    onClick={() => handleLevelChange("Advanced")}
                  >
                    Advanced
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {isLoading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading courses...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCourses.length > 0 ? (
                  filteredCourses.map((course) => (
                    <Card
                      key={course.id}
                      className="overflow-hidden hover:shadow-lg transition-shadow flex flex-col"
                    >
                      <div className="bg-gradient-to-br from-primary/20 to-accent/20 h-40" />
                      <CardHeader className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded">
                            {course.difficulty_level || "Beginner"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {course.duration_hours} hours
                          </span>
                        </div>
                        <CardTitle className="line-clamp-2">{course.title}</CardTitle>
                        <CardDescription className="line-clamp-2">
                          {course.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Link href={`/courses/${course.id}`}>
                          <Button className="w-full">View Course</Button>
                        </Link>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="col-span-full text-center py-12">
                    <p className="text-muted-foreground">
                      {searchQuery || selectedLevel !== "All"
                        ? "No courses found matching your criteria"
                        : "No courses available yet"}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <Card className="text-center py-12">
            <CardContent className="space-y-4">
              {status === "loading" && (
                <p className="text-muted-foreground">Loading courses...</p>
              )}
              {status === "no-session" && (
                <>
                  <p className="text-lg font-semibold text-foreground">
                    Inicia sesión para ver tus cursos disponibles
                  </p>
                  <p className="text-muted-foreground">
                    Escanea tu código QR en el evento y vuelve para acceder al contenido.
                  </p>
                  <Link href="/auth/login">
                    <Button className="gap-2">Ir al inicio de sesión</Button>
                  </Link>
                </>
              )}
              {status === "no-access" && (
                <>
                    <p className="text-lg font-semibold text-foreground">
                      {activeEvent?.title ? t("eventAccessRequired", { event: activeEvent.title }) : t("verificationRequiredTitle")}
                    </p>
                    <p className="text-muted-foreground">
                      {activeEvent?.title ? t("eventAccessRequiredDescription") : t("verificationRequiredDescription")}
                    </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  )
}
