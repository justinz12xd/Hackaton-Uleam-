import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * POST - Subir archivo del curso
 * Este endpoint maneja la subida de archivos a Supabase Storage
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: courseId } = await params
    const supabase = await createClient()

    // Verificar autenticación
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Verificar que el curso existe y el usuario es el instructor
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
          { error: 'No tienes permiso para subir archivos a este curso' },
          { status: 403 }
        )
      }
    }

    // Obtener el archivo del FormData
    const formData = await request.formData()
    const file = formData.get('file') as File
    const fileType = formData.get('type') as 'document' | 'image'

    if (!file) {
      return NextResponse.json({ error: 'No se proporcionó ningún archivo' }, { status: 400 })
    }

    if (!fileType || !['document', 'image'].includes(fileType)) {
      return NextResponse.json({ error: 'Tipo de archivo inválido' }, { status: 400 })
    }

    // Determinar el bucket
    const bucket = fileType === 'document' ? 'course-documents' : 'course-images'

    // Generar nombre único para el archivo
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 9)
    const extension = file.name.split('.').pop()
    const sanitizedName = file.name
      .split('.')[0]
      .replace(/[^a-z0-9]/gi, '-')
      .toLowerCase()
      .substring(0, 50)

    const filePath = `${courseId}/${timestamp}-${randomString}-${sanitizedName}.${extension}`

    // Subir archivo a Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      console.error('Error uploading file:', uploadError)
      return NextResponse.json(
        { error: `Error al subir el archivo: ${uploadError.message}` },
        { status: 500 }
      )
    }

    // Obtener URL pública
    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(filePath)

    return NextResponse.json({
      success: true,
      url: publicUrl,
      path: filePath,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    })
  } catch (error) {
    console.error('Error in file upload:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

/**
 * DELETE - Eliminar archivo del curso
 */
export async function DELETE(request: Request) {
  try {
    const body = await request.json()
    const { filePath, fileType } = body as { filePath: string; fileType: 'document' | 'image' }

    if (!filePath || !fileType) {
      return NextResponse.json(
        { error: 'Se requiere filePath y fileType' },
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

    // Determinar el bucket
    const bucket = fileType === 'document' ? 'course-documents' : 'course-images'

    // Eliminar archivo
    const { error: deleteError } = await supabase.storage.from(bucket).remove([filePath])

    if (deleteError) {
      console.error('Error deleting file:', deleteError)
      return NextResponse.json(
        { error: `Error al eliminar el archivo: ${deleteError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Archivo eliminado exitosamente',
    })
  } catch (error) {
    console.error('Error in file deletion:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
