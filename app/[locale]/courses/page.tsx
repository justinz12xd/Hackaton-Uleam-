import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import { Link } from "@/lib/i18n/routing"
import { CoursesClient } from "./courses-client"

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

type AccessStatus = "no-session" | "no-access" | "ready"

const COURSE_FIELDS = "id, title, description, difficulty_level, duration_hours, is_published, created_at, primary_event_id"

export default async function CoursesPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) {
    console.error("Error fetching authenticated user:", userError)
  }

  let status: AccessStatus = "no-session"
  let accessibleCourses: Course[] = []

  if (user && !userError) {
    const uniqueCourses = new Map<string, Course>()

    const addCourses = (courses?: Course[] | null) => {
      for (const course of courses ?? []) {
        if (course?.id) {
          uniqueCourses.set(course.id, course)
        }
      }
    }

    const userId = user.id

    const { data: profileData } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle()

    const userRole = profileData?.role ?? null
    const isAdmin = userRole === "admin"

    if (isAdmin) {
      const { data: publishedCourses, error: coursesError } = await supabase
        .from("courses")
        .select(COURSE_FIELDS)
        .eq("is_published", true)
        .order("created_at", { ascending: false })

      if (coursesError) {
        console.error("Error fetching published courses:", coursesError)
      }

      addCourses(publishedCourses ?? [])
    } else {
      const { data: registrations, error: registrationsError } = await supabase
        .from("event_registrations")
        .select("event_id")
        .eq("user_id", userId)
        .eq("is_attended", true)

      if (registrationsError) {
        console.error("Error fetching registrations:", registrationsError)
      }

      const verifiedEventIds = (registrations ?? [])
        .map((registration) => registration.event_id)
        .filter((eventId): eventId is string => Boolean(eventId))

      if (verifiedEventIds.length > 0) {
        const { data: eventCourses, error: eventCoursesError } = await supabase
          .from("event_courses")
          .select(
            `event_id,
             courses (
               ${COURSE_FIELDS}
             )`
          )
          .in("event_id", verifiedEventIds)
          .eq("courses.is_published", true)

        if (eventCoursesError) {
          console.error("Error fetching event courses:", eventCoursesError)
        }

        for (const entry of eventCourses ?? []) {
          const courseData = entry?.courses as Course | Course[] | null | undefined

          if (Array.isArray(courseData)) {
            addCourses(courseData)
          } else if (courseData) {
            addCourses([courseData])
          }
        }
      }

      const { data: enrollmentCourses, error: enrollmentError } = await supabase
        .from("course_enrollments")
        .select(
          `course:courses (
             ${COURSE_FIELDS}
           )`
        )
        .eq("student_id", userId)
        .eq("courses.is_published", true)

      if (enrollmentError) {
        console.error("Error fetching course enrollments:", enrollmentError)
      }

      for (const enrollment of enrollmentCourses ?? []) {
        const courseData = enrollment?.course
        if (Array.isArray(courseData)) {
          addCourses(courseData as Course[])
        } else if (courseData) {
          addCourses([courseData as Course])
        }
      }

      const { data: instructorCourses, error: instructorError } = await supabase
        .from("courses")
        .select(COURSE_FIELDS)
        .eq("instructor_id", userId)

      if (instructorError) {
        console.error("Error fetching instructor courses:", instructorError)
      }

      addCourses(instructorCourses ?? [])
    }

    accessibleCourses = Array.from(uniqueCourses.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

    status = accessibleCourses.length > 0 ? "ready" : "no-access"
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <h1 className="text-4xl font-bold text-foreground mb-2">All Courses</h1>
          <p className="text-lg text-muted-foreground">
            Explore our complete catalog of microcredential programs
          </p>
        </div>
      </div>

      {status === "ready" ? (
        <CoursesClient initialCourses={accessibleCourses} />
      ) : (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <Card className="text-center py-12">
            <CardContent className="space-y-4">
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
                  <p className="text-lg font-semibold text-foreground">Verificación requerida</p>
                  <p className="text-muted-foreground">
                    Los cursos se habilitan automáticamente cuando tu asistencia se valida con el
                    código QR del evento. Consulta a tu instructor si necesitas ayuda.
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
