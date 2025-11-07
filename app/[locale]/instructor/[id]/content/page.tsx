import { redirect } from '@/lib/i18n/routing'
import { createClient } from '@/lib/supabase/server'
import CourseContentEditor from '@/components/course-content-editor'

interface CourseContentPageProps {
  params: Promise<{
    locale: string
    id: string
  }>
}

export default async function CourseContentPage({ params }: CourseContentPageProps) {
  const { locale, id } = await params
  const supabase = await createClient()

  // Verificar autenticación
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect({ href: '/auth/login', locale })
  }

  // Obtener el curso
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('id, title, instructor_id')
    .eq('id', id)
    .single()

  if (courseError || !course) {
    redirect({ href: '/instructor', locale })
  }

  // Verificar que el usuario sea el instructor del curso
  if (course.instructor_id !== user.id) {
    // Verificar si es admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      redirect({ href: '/instructor', locale })
    }
  }

  return <CourseContentEditor courseId={course.id} courseTitle={course.title} />
}
