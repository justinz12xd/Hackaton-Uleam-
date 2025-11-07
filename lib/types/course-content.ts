/**
 * Tipos para el sistema de contenido de cursos
 */

/**
 * Tipo de contenido que puede tener una lección
 */
export type LessonContentType = 'video' | 'text' | 'pdf' | 'document' | 'quiz'

/**
 * Estructura de un recurso descargable
 */
export interface CourseResource {
  id: string
  title: string
  type: 'pdf' | 'docx' | 'pptx' | 'zip' | 'other'
  url: string
  filePath?: string
  size?: number
  description?: string
}

/**
 * Estructura de una lección
 */
export interface CourseLesson {
  id: string
  title: string
  description?: string
  contentType: LessonContentType
  
  // Para contenido de video
  videoUrl?: string
  
  // Para contenido de texto/markdown
  textContent?: string
  
  // Para documentos
  documentUrl?: string
  documentPath?: string
  
  // Recursos adicionales de la lección
  resources?: CourseResource[]
  
  // Metadata
  duration?: number // Duración en minutos
  order: number // Orden dentro del módulo
  isFree?: boolean // Si la lección es gratuita (preview)
  isCompleted?: boolean // Si el estudiante la completó (calculado en runtime)
}

/**
 * Estructura de un módulo del curso
 */
export interface CourseModule {
  id: string
  title: string
  description?: string
  lessons: CourseLesson[]
  order: number // Orden dentro del curso
}

/**
 * Estructura completa del contenido de un curso
 */
export interface CourseContent {
  modules: CourseModule[]
  lastUpdated?: string
}

/**
 * Tipo para los cursos con contenido
 */
export interface CourseWithContent {
  id: string
  instructor_id: string
  title: string
  description: string | null
  category: string
  difficulty_level: 'beginner' | 'intermediate' | 'advanced'
  duration_hours: number | null
  image_url: string | null
  is_published: boolean
  content: CourseContent
  created_at: string
  updated_at: string
}

/**
 * Función auxiliar para crear un módulo vacío
 */
export function createEmptyModule(order: number = 0): CourseModule {
  return {
    id: `module-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    title: 'Nuevo Módulo',
    description: '',
    lessons: [],
    order,
  }
}

/**
 * Función auxiliar para crear una lección vacía
 */
export function createEmptyLesson(order: number = 0): CourseLesson {
  return {
    id: `lesson-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    title: 'Nueva Lección',
    description: '',
    contentType: 'video',
    videoUrl: '',
    resources: [],
    duration: 10,
    order,
    isFree: false,
  }
}

/**
 * Función auxiliar para crear un recurso vacío
 */
export function createEmptyResource(): CourseResource {
  return {
    id: `resource-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    title: 'Nuevo Recurso',
    type: 'pdf',
    url: '',
  }
}

/**
 * Función auxiliar para validar la estructura del contenido
 */
export function validateCourseContent(content: any): content is CourseContent {
  if (!content || typeof content !== 'object') {
    return false
  }

  if (!Array.isArray(content.modules)) {
    return false
  }

  // Validar cada módulo
  for (const module of content.modules) {
    if (!module.id || !module.title || !Array.isArray(module.lessons)) {
      return false
    }

    // Validar cada lección
    for (const lesson of module.lessons) {
      if (!lesson.id || !lesson.title || !lesson.contentType) {
        return false
      }
    }
  }

  return true
}

/**
 * Calcula la duración total del curso basado en sus lecciones
 */
export function calculateCourseDuration(content: CourseContent): number {
  let totalMinutes = 0

  content.modules.forEach((module) => {
    module.lessons.forEach((lesson) => {
      if (lesson.duration) {
        totalMinutes += lesson.duration
      }
    })
  })

  return Math.ceil(totalMinutes / 60) // Convertir a horas
}

/**
 * Cuenta el total de lecciones en un curso
 */
export function countTotalLessons(content: CourseContent): number {
  return content.modules.reduce((total, module) => total + module.lessons.length, 0)
}

/**
 * Obtiene una lección específica por su ID
 */
export function getLessonById(content: CourseContent, lessonId: string): CourseLesson | null {
  for (const module of content.modules) {
    const lesson = module.lessons.find((l) => l.id === lessonId)
    if (lesson) {
      return lesson
    }
  }
  return null
}

/**
 * Obtiene el siguiente ID de lección en orden
 */
export function getNextLessonId(
  content: CourseContent,
  currentLessonId: string
): string | null {
  const allLessons: Array<{ moduleId: string; lesson: CourseLesson }> = []

  // Aplanar todas las lecciones con su módulo
  content.modules.forEach((module) => {
    module.lessons.forEach((lesson) => {
      allLessons.push({ moduleId: module.id, lesson })
    })
  })

  // Ordenar por módulo y lección
  allLessons.sort((a, b) => {
    const moduleA = content.modules.find((m) => m.id === a.moduleId)
    const moduleB = content.modules.find((m) => m.id === b.moduleId)

    if (moduleA && moduleB) {
      if (moduleA.order !== moduleB.order) {
        return moduleA.order - moduleB.order
      }
    }

    return a.lesson.order - b.lesson.order
  })

  // Encontrar la lección actual
  const currentIndex = allLessons.findIndex((item) => item.lesson.id === currentLessonId)

  // Si hay una siguiente lección, retornar su ID
  if (currentIndex >= 0 && currentIndex < allLessons.length - 1) {
    return allLessons[currentIndex + 1].lesson.id
  }

  return null
}

/**
 * Obtiene el ID de la lección anterior en orden
 */
export function getPreviousLessonId(
  content: CourseContent,
  currentLessonId: string
): string | null {
  const allLessons: Array<{ moduleId: string; lesson: CourseLesson }> = []

  // Aplanar todas las lecciones con su módulo
  content.modules.forEach((module) => {
    module.lessons.forEach((lesson) => {
      allLessons.push({ moduleId: module.id, lesson })
    })
  })

  // Ordenar por módulo y lección
  allLessons.sort((a, b) => {
    const moduleA = content.modules.find((m) => m.id === a.moduleId)
    const moduleB = content.modules.find((m) => m.id === b.moduleId)

    if (moduleA && moduleB) {
      if (moduleA.order !== moduleB.order) {
        return moduleA.order - moduleB.order
      }
    }

    return a.lesson.order - b.lesson.order
  })

  // Encontrar la lección actual
  const currentIndex = allLessons.findIndex((item) => item.lesson.id === currentLessonId)

  // Si hay una lección anterior, retornar su ID
  if (currentIndex > 0) {
    return allLessons[currentIndex - 1].lesson.id
  }

  return null
}
