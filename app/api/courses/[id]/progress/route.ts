import { createClient } from '@/lib/supabase/server'
import { countTotalLessons } from '@/lib/types/course-content'
import type { CourseContent } from '@/lib/types/course-content'
import { NextRequest, NextResponse } from 'next/server'

// GET: Obtener progreso del estudiante en el curso
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: courseId } = await params
    const supabase = await createClient()

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Obtener todo el progreso del estudiante en este curso
    const { data: progressData, error: progressError } = await supabase
      .from('lesson_progress')
      .select('*')
      .eq('course_id', courseId)
      .eq('student_id', user.id)

    if (progressError) {
      console.error('Error fetching progress:', progressError)
      return NextResponse.json(
        { error: 'Error al obtener progreso' },
        { status: 500 }
      )
    }

    // Obtener contenido del curso para contar todas las lecciones existentes
    let totalLessons = 0
    try {
      const { data: courseContentRow } = await supabase
        .from('courses')
        .select('content')
        .eq('id', courseId)
        .single()

      if (courseContentRow?.content) {
        const content: CourseContent =
          typeof courseContentRow.content === 'string'
            ? JSON.parse(courseContentRow.content)
            : courseContentRow.content

        totalLessons = countTotalLessons(content)
      }
    } catch (error) {
      console.warn('No se pudo calcular el número total de lecciones', error)
    }

    // Calcular estadísticas
    const completedLessons = progressData?.filter(p => p.completed).length || 0
    if (totalLessons === 0) {
      totalLessons = progressData?.length || 0
    }
    const progressPercentage = totalLessons > 0 
      ? Math.round((completedLessons / totalLessons) * 100) 
      : 0

    return NextResponse.json({
      progress: progressData || [],
      stats: {
        totalLessons,
        completedLessons,
        progressPercentage,
        courseCompleted: progressPercentage >= 100
      }
    })
  } catch (error) {
    console.error('Error in GET /api/courses/[id]/progress:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST: Marcar lección como completada
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: courseId } = await params
    const supabase = await createClient()

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Obtener datos del body
    const body = await request.json()
    const { moduleId, lessonId, completed = true } = body

    if (!moduleId || !lessonId) {
      return NextResponse.json(
        { error: 'Se requiere moduleId y lessonId' },
        { status: 400 }
      )
    }

    // Verificar que el estudiante esté inscrito
    const { data: enrollment } = await supabase
      .from('course_enrollments')
      .select('id')
      .eq('course_id', courseId)
      .eq('student_id', user.id)
      .single()

    if (!enrollment) {
      return NextResponse.json(
        { error: 'No estás inscrito en este curso' },
        { status: 403 }
      )
    }

    // Insertar o actualizar progreso
    const progressData = {
      student_id: user.id,
      course_id: courseId,
      module_id: moduleId,
      lesson_id: lessonId,
      completed,
      completed_at: completed ? new Date().toISOString() : null,
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('lesson_progress')
      .upsert(progressData, {
        onConflict: 'student_id,course_id,module_id,lesson_id'
      })
      .select()
      .single()

    if (error) {
      console.error('Error updating progress:', error)
      return NextResponse.json(
        { error: 'Error al actualizar progreso' },
        { status: 500 }
      )
    }

    // Obtener progreso actualizado
    const { data: allProgress } = await supabase
      .from('lesson_progress')
      .select('*')
      .eq('course_id', courseId)
      .eq('student_id', user.id)

    let totalLessons = 0
    try {
      const { data: courseContentRow } = await supabase
        .from('courses')
        .select('content')
        .eq('id', courseId)
        .single()

      if (courseContentRow?.content) {
        const content: CourseContent =
          typeof courseContentRow.content === 'string'
            ? JSON.parse(courseContentRow.content)
            : courseContentRow.content

        totalLessons = countTotalLessons(content)
      }
    } catch (error) {
      console.warn('No se pudo calcular el número total de lecciones', error)
    }

    const completedLessons = allProgress?.filter(p => p.completed).length || 0
    if (totalLessons === 0) {
      totalLessons = allProgress?.length || 0
    }
    const progressPercentage = totalLessons > 0 
      ? Math.round((completedLessons / totalLessons) * 100) 
      : 0

    // Si el curso está completado al 100%, podemos generar el certificado
    const courseCompleted = progressPercentage >= 100

    return NextResponse.json({
      success: true,
      progress: data,
      stats: {
        totalLessons,
        completedLessons,
        progressPercentage,
        courseCompleted
      }
    })
  } catch (error) {
    console.error('Error in POST /api/courses/[id]/progress:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
