import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { Link, redirect } from '@/lib/i18n/routing'
import CourseViewer from '@/components/course-viewer'
import type { CourseContent } from '@/lib/types/course-content'

interface LearnPageProps {
  params: Promise<{
    locale: string
    id: string
  }>
}

export default async function LearnPage({ params }: LearnPageProps) {
  const { locale, id } = await params
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect({ href: "/auth/login", locale })
  }

  const { data: course, error: courseError } = await supabase
    .from("courses")
    .select("id, title, description, content, is_published, instructor_id, primary_event_id")
    .eq("id", id)
    .single()

  if (courseError || !course) {
    redirect({ href: "/courses", locale })
  }

  const currentUser = user!
  const currentCourse = course

  const isInstructor = currentUser.id === currentCourse.instructor_id

  let userRole: string | null = null
  if (!isInstructor) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
  .eq("id", currentUser.id)
      .maybeSingle()

    userRole = profile?.role ?? null
  }

  const isAdmin = userRole === "admin"

  const linkedEventIds = new Set<string>()
  if (currentCourse.primary_event_id) {
    linkedEventIds.add(currentCourse.primary_event_id)
  }

  const { data: eventLinks } = await supabase
    .from("event_courses")
    .select("event_id")
    .eq("course_id", id)

  eventLinks?.forEach((link) => {
    if (link?.event_id) {
      linkedEventIds.add(link.event_id)
    }
  })

  const eventIds = Array.from(linkedEventIds)
  let hasEventAccess = false

  if (eventIds.length > 0) {
    const { data: verifiedRegistrations } = await supabase
      .from("event_registrations")
      .select("id")
  .eq("user_id", currentUser.id)
      .in("event_id", eventIds)
      .eq("is_attended", true)

    hasEventAccess = (verifiedRegistrations?.length ?? 0) > 0
  }

  let hasEnrollmentAccess = false
  if (eventIds.length === 0) {
    const { data: enrollment } = await supabase
      .from("course_enrollments")
      .select("id")
      .eq("course_id", id)
  .eq("student_id", currentUser.id)
      .maybeSingle()

    hasEnrollmentAccess = Boolean(enrollment)
  }

  const hasAccess =
    isInstructor ||
    isAdmin ||
    (eventIds.length > 0 ? hasEventAccess : hasEnrollmentAccess)

  if (!hasAccess || (!currentCourse.is_published && !isInstructor && !isAdmin)) {
    redirect({ href: `/courses/${id}`, locale })
  }

  let courseContent: CourseContent | null = null
  try {
    if (currentCourse.content) {
      courseContent =
        typeof currentCourse.content === "string"
          ? JSON.parse(currentCourse.content)
          : currentCourse.content
    }
  } catch (error) {
    console.error("Error parsing course content:", error)
  }

  const safeCourse = currentCourse

  return (
    <main className="min-h-screen bg-background">
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link href={`/courses/${id}`}>
            <Button variant="ghost" className="mb-3 gap-2">
              <ArrowLeft className="w-4 h-4" />
              Volver al curso
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{safeCourse.title}</h1>
            {safeCourse.description && (
              <p className="text-muted-foreground mt-2 line-clamp-2">
                {safeCourse.description}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CourseViewer
          courseId={id}
          courseTitle={safeCourse.title}
          content={courseContent}
          isEnrolled={hasAccess}
        />
      </div>
    </main>
  )
}
