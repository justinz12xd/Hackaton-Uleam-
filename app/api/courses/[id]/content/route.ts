import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { CourseContent } from '@/lib/types/course-content'
import { validateCourseContent } from '@/lib/types/course-content'

/**
 * GET - Obtener el contenido de un curso
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: courseId } = await params
    const supabase = await createClient()

    // Obtener contenido del curso
    const { data: course, error } = await supabase
      .from('courses')
      .select('id, title, content, instructor_id')
      .eq('id', courseId)
      .single()

    if (error || !course) {
      return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      content: course.content || { modules: [] },
      courseId: course.id,
      title: course.title,
    })
  } catch (error) {
    console.error('Error fetching course content:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

/**
 * PUT - Actualizar el contenido de un curso
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: courseId } = await params
    const body = await request.json()
    const { content } = body as { content: CourseContent }

    // Validar que el contenido tenga la estructura correcta
    if (!validateCourseContent(content)) {
      return NextResponse.json(
        { error: 'Estructura de contenido inválida' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Verificar autenticación
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Verificar que el usuario sea el instructor del curso
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('instructor_id')
      .eq('id', courseId)
      .single()

    if (courseError || !course) {
      return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 })
    }

    if (course.instructor_id !== user.id) {
      // Verificar si es admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role !== 'admin') {
        return NextResponse.json(
          { error: 'No tienes permiso para editar este curso' },
          { status: 403 }
        )
      }
    }

    // Actualizar el contenido
    const { error: updateError } = await supabase
      .from('courses')
      .update({
        content,
        updated_at: new Date().toISOString(),
      })
      .eq('id', courseId)

    if (updateError) {
      console.error('Error updating course content:', updateError)
      return NextResponse.json(
        { error: 'Error al actualizar el contenido' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Contenido actualizado exitosamente',
    })
  } catch (error) {
    console.error('Error updating course content:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
