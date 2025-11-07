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

  // Verificar autenticación
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    redirect({ href: '/auth/login', locale })
  }

  // Obtener información del curso
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('id, title, description, content, is_published')
    .eq('id', id)
    .single()

  if (courseError || !course) {
    redirect({ href: '/courses', locale })
  }

  // NUEVO: Verificar si este curso está asociado a un evento
  const { data: associatedEvent } = await supabase
    .from('events')
    .select('id, title, status')
    .eq('course_id', id)
    .maybeSingle()

  let hasAccess = false
  let accessMessage = ''

  if (associatedEvent) {
    // Este curso pertenece a un evento - verificar asistencia
    const { data: registration } = await supabase
      .from('event_registrations')
      .select('is_attended, attended_at')
      .eq('event_id', associatedEvent.id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (registration?.is_attended) {
      hasAccess = true
      accessMessage = 'event_validated'
    } else if (registration) {
      accessMessage = 'event_not_attended'
    } else {
      accessMessage = 'not_registered_to_event'
    }
  } else {
    // Curso tradicional - verificar inscripción
    const { data: enrollment } = await supabase
      .from('course_enrollments')
      .select('id')
      .eq('course_id', id)
      .eq('student_id', user.id)
      .maybeSingle()

    if (enrollment) {
      hasAccess = true
      accessMessage = 'enrolled'
    } else {
      accessMessage = 'not_enrolled'
    }
  }

  // Si no tiene acceso, redirigir
  if (!hasAccess) {
    redirect({ href: `/courses/${id}`, locale })
  }

  // Parsear el contenido JSON
  let courseContent: CourseContent | null = null
  try {
    if (course?.content) {
      courseContent = typeof course.content === 'string' 
        ? JSON.parse(course.content) 
        : course.content
    }
  } catch (error) {
    console.error('Error parsing course content:', error)
  }

  // Garantizar que course y user no son null después de las validaciones
  const safeCourse = course!
  const safeUser = user!

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
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
              <p className="text-muted-foreground mt-2 line-clamp-2">{safeCourse.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Course Content */}
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
