import { createClient } from '@/lib/supabase/client'

/**
 * Tipo de archivo soportado
 */
export type FileType = 'document' | 'image'

/**
 * Configuración de buckets de Supabase Storage
 */
const STORAGE_BUCKETS = {
  documents: 'course-documents',
  images: 'course-images',
} as const

/**
 * Extensiones de archivo permitidas por tipo
 */
const ALLOWED_EXTENSIONS = {
  document: ['.pdf', '.docx', '.pptx', '.xlsx', '.zip', '.txt', '.md'],
  image: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'],
} as const

/**
 * Tamaño máximo de archivo en bytes (10MB para documentos, 5MB para imágenes)
 */
const MAX_FILE_SIZE = {
  document: 10 * 1024 * 1024, // 10MB
  image: 5 * 1024 * 1024, // 5MB
} as const

/**
 * Valida un archivo antes de subirlo
 */
export function validateFile(file: File, type: FileType): { valid: boolean; error?: string } {
  // Validar tamaño
  if (file.size > MAX_FILE_SIZE[type]) {
    const maxSizeMB = MAX_FILE_SIZE[type] / (1024 * 1024)
    return {
      valid: false,
      error: `El archivo es demasiado grande. Tamaño máximo: ${maxSizeMB}MB`,
    }
  }

  // Validar extensión
  const extension = '.' + file.name.split('.').pop()?.toLowerCase()
  const allowedExtensions = ALLOWED_EXTENSIONS[type]
  if (!extension || !(allowedExtensions as readonly string[]).includes(extension)) {
    return {
      valid: false,
      error: `Tipo de archivo no permitido. Permitidos: ${allowedExtensions.join(', ')}`,
    }
  }

  return { valid: true }
}

/**
 * Genera un nombre de archivo único
 */
function generateUniqueFileName(originalName: string, courseId: string): string {
  const timestamp = Date.now()
  const randomString = Math.random().toString(36).substring(2, 9)
  const extension = originalName.split('.').pop()
  const sanitizedName = originalName
    .split('.')[0]
    .replace(/[^a-z0-9]/gi, '-')
    .toLowerCase()
    .substring(0, 50)

  return `${courseId}/${timestamp}-${randomString}-${sanitizedName}.${extension}`
}

/**
 * Sube un archivo a Supabase Storage
 * 
 * @param file - Archivo a subir
 * @param courseId - ID del curso al que pertenece el archivo
 * @param type - Tipo de archivo ('document' o 'image')
 * @returns URL pública del archivo subido
 * 
 * @example
 * const url = await uploadCourseFile(file, courseId, 'document')
 */
export async function uploadCourseFile(
  file: File,
  courseId: string,
  type: FileType
): Promise<{ url: string; path: string }> {
  // Validar archivo
  const validation = validateFile(file, type)
  if (!validation.valid) {
    throw new Error(validation.error)
  }

  const supabase = createClient()
  const bucket = type === 'document' ? STORAGE_BUCKETS.documents : STORAGE_BUCKETS.images
  const filePath = generateUniqueFileName(file.name, courseId)

  try {
    // Subir archivo
    const { data, error } = await supabase.storage.from(bucket).upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    })

    if (error) {
      console.error('Error uploading file:', error)
      throw new Error(`Error al subir el archivo: ${error.message}`)
    }

    // Obtener URL pública
    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(filePath)

    return {
      url: publicUrl,
      path: filePath,
    }
  } catch (error) {
    console.error('Upload error:', error)
    throw error instanceof Error ? error : new Error('Error desconocido al subir el archivo')
  }
}

/**
 * Elimina un archivo de Supabase Storage
 * 
 * @param filePath - Ruta del archivo en Storage
 * @param type - Tipo de archivo
 * 
 * @example
 * await deleteCourseFile('course-id/timestamp-file.pdf', 'document')
 */
export async function deleteCourseFile(filePath: string, type: FileType): Promise<void> {
  const supabase = createClient()
  const bucket = type === 'document' ? STORAGE_BUCKETS.documents : STORAGE_BUCKETS.images

  try {
    const { error } = await supabase.storage.from(bucket).remove([filePath])

    if (error) {
      console.error('Error deleting file:', error)
      throw new Error(`Error al eliminar el archivo: ${error.message}`)
    }
  } catch (error) {
    console.error('Delete error:', error)
    throw error instanceof Error ? error : new Error('Error desconocido al eliminar el archivo')
  }
}

/**
 * Obtiene la URL de un video embebible desde YouTube o Vimeo
 * 
 * @param url - URL del video
 * @returns URL embebible o null si no es válida
 * 
 * @example
 * const embedUrl = getEmbedVideoUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
 * // Retorna: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
 */
export function getEmbedVideoUrl(url: string): string | null {
  if (!url) return null

  try {
    // YouTube
    const youtubeRegex =
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
    const youtubeMatch = url.match(youtubeRegex)
    if (youtubeMatch) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}`
    }

    // Vimeo
    const vimeoRegex = /vimeo\.com\/(?:.*\/)?(\d+)/
    const vimeoMatch = url.match(vimeoRegex)
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`
    }

    return null
  } catch (error) {
    console.error('Error parsing video URL:', error)
    return null
  }
}

/**
 * Formatea el tamaño de un archivo para mostrar
 * 
 * @param bytes - Tamaño en bytes
 * @returns Tamaño formateado (ej: "1.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

/**
 * Obtiene el icono apropiado para un tipo de archivo
 */
export function getFileIcon(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase()

  const iconMap: Record<string, string> = {
    pdf: '📄',
    docx: '📝',
    doc: '📝',
    pptx: '📊',
    ppt: '📊',
    xlsx: '📊',
    xls: '📊',
    zip: '🗜️',
    txt: '📃',
    md: '📃',
    jpg: '🖼️',
    jpeg: '🖼️',
    png: '🖼️',
    gif: '🖼️',
    webp: '🖼️',
    svg: '🖼️',
  }

  return iconMap[extension || ''] || '📎'
}
