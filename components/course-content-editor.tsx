"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Plus, Trash2, GripVertical, Save, ArrowLeft, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { FileUploader } from '@/components/file-uploader'
import {
  type CourseContent,
  type CourseModule,
  type CourseLesson,
  type CourseResource,
  createEmptyModule,
  createEmptyLesson,
  createEmptyResource,
  calculateCourseDuration,
  countTotalLessons,
} from '@/lib/types/course-content'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'

interface CourseContentEditorProps {
  courseId: string
  courseTitle: string
}

export default function CourseContentEditor({ courseId, courseTitle }: CourseContentEditorProps) {
  const router = useRouter()
  const [content, setContent] = useState<CourseContent>({ modules: [] })
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isPublished, setIsPublished] = useState(false)

  // Cargar contenido existente
  useEffect(() => {
    loadContent()
  }, [courseId])

  const loadContent = async () => {
    try {
      const response = await fetch(`/api/courses/${courseId}/content`)
      if (response.ok) {
        const data = await response.json()
        setContent(data.content || { modules: [] })
        setIsPublished(Boolean(data.isPublished))
      }
    } catch (error) {
      console.error('Error loading content:', error)
      toast.error('Error al cargar el contenido')
    } finally {
      setIsLoading(false)
    }
  }

  const saveContent = async () => {
    setIsSaving(true)
    try {
      const wasPublished = isPublished
  const response = await fetch(`/api/courses/${courseId}/content`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  })

  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.error || 'Error al guardar')
  }
      setIsPublished(Boolean(result.isPublished))
      toast.success('Contenido guardado exitosamente')

      if (result.isPublished && !wasPublished) {
        toast.success('El curso se ha publicado automáticamente para los asistentes verificados')
      } else if (!result.isPublished) {
        toast.warning('Agrega al menos una lección para publicar el curso')
      }
    } catch (error) {
      console.error('Error saving content:', error)
      toast.error(error instanceof Error ? error.message : 'Error al guardar')
    } finally {
      setIsSaving(false)
    }
  }

  // Gestión de módulos
  const addModule = () => {
    const newModule = createEmptyModule(content.modules.length)
    setContent({ modules: [...content.modules, newModule] })
  }

  const updateModule = (moduleIndex: number, updates: Partial<CourseModule>) => {
    const newModules = [...content.modules]
    newModules[moduleIndex] = { ...newModules[moduleIndex], ...updates }
    setContent({ modules: newModules })
  }

  const deleteModule = (moduleIndex: number) => {
    if (confirm('¿Estás seguro de eliminar este módulo y todas sus lecciones?')) {
      const newModules = content.modules.filter((_, i) => i !== moduleIndex)
      setContent({ modules: newModules })
      toast.success('Módulo eliminado')
    }
  }

  // Gestión de lecciones
  const addLesson = (moduleIndex: number) => {
    const newModules = [...content.modules]
    const newLesson = createEmptyLesson(newModules[moduleIndex].lessons.length)
    newModules[moduleIndex].lessons.push(newLesson)
    setContent({ modules: newModules })
  }

  const updateLesson = (
    moduleIndex: number,
    lessonIndex: number,
    updates: Partial<CourseLesson>
  ) => {
    const newModules = [...content.modules]
    newModules[moduleIndex].lessons[lessonIndex] = {
      ...newModules[moduleIndex].lessons[lessonIndex],
      ...updates,
    }
    setContent({ modules: newModules })
  }

  const deleteLesson = (moduleIndex: number, lessonIndex: number) => {
    if (confirm('¿Estás seguro de eliminar esta lección?')) {
      const newModules = [...content.modules]
      newModules[moduleIndex].lessons = newModules[moduleIndex].lessons.filter(
        (_, i) => i !== lessonIndex
      )
      setContent({ modules: newModules })
      toast.success('Lección eliminada')
    }
  }

  // Gestión de recursos
  const addResource = (moduleIndex: number, lessonIndex: number) => {
    const newModules = [...content.modules]
    const newResource = createEmptyResource()
    if (!newModules[moduleIndex].lessons[lessonIndex].resources) {
      newModules[moduleIndex].lessons[lessonIndex].resources = []
    }
    newModules[moduleIndex].lessons[lessonIndex].resources!.push(newResource)
    setContent({ modules: newModules })
  }

  const updateResource = (
    moduleIndex: number,
    lessonIndex: number,
    resourceIndex: number,
    updates: Partial<CourseResource>
  ) => {
    const newModules = [...content.modules]
    if (newModules[moduleIndex].lessons[lessonIndex].resources) {
      newModules[moduleIndex].lessons[lessonIndex].resources![resourceIndex] = {
        ...newModules[moduleIndex].lessons[lessonIndex].resources![resourceIndex],
        ...updates,
      }
      setContent({ modules: newModules })
    }
  }

  const deleteResource = (moduleIndex: number, lessonIndex: number, resourceIndex: number) => {
    const newModules = [...content.modules]
    if (newModules[moduleIndex].lessons[lessonIndex].resources) {
      newModules[moduleIndex].lessons[lessonIndex].resources = newModules[moduleIndex].lessons[
        lessonIndex
      ].resources!.filter((_, i) => i !== resourceIndex)
      setContent({ modules: newModules })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando contenido...</p>
        </div>
      </div>
    )
  }

  const totalLessons = countTotalLessons(content)
  const estimatedHours = calculateCourseDuration(content)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/instructor">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Editor de Contenido</h1>
                <p className="text-sm text-muted-foreground">{courseTitle}</p>
              </div>
            </div>
            <Badge variant={isPublished ? 'default' : 'secondary'} className="uppercase tracking-wide">
              {isPublished ? 'Publicado' : 'Borrador'}
            </Badge>
            <Button onClick={saveContent} disabled={isSaving}>
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>

          {/* Estadísticas */}
          <div className="flex gap-6 mt-4 text-sm text-muted-foreground">
            <div>
              <span className="font-semibold">{content.modules.length}</span> módulos
            </div>
            <div>
              <span className="font-semibold">{totalLessons}</span> lecciones
            </div>
            <div>
              <span className="font-semibold">{estimatedHours}</span> horas estimadas
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {content.modules.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay módulos todavía</h3>
              <p className="text-muted-foreground mb-4">
                Comienza agregando el primer módulo a tu curso
              </p>
              <Button onClick={addModule}>
                <Plus className="w-4 h-4 mr-2" />
                Agregar Primer Módulo
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <Accordion type="multiple" defaultValue={content.modules.map(m => m.id)} className="space-y-4">
              {content.modules.map((module, moduleIndex) => (
                <ModuleEditor
                  key={module.id}
                  module={module}
                  moduleIndex={moduleIndex}
                  courseId={courseId}
                  onUpdateModule={(updates) => updateModule(moduleIndex, updates)}
                  onDeleteModule={() => deleteModule(moduleIndex)}
                  onAddLesson={() => addLesson(moduleIndex)}
                  onUpdateLesson={(lessonIndex, updates) =>
                    updateLesson(moduleIndex, lessonIndex, updates)
                  }
                  onDeleteLesson={(lessonIndex) => deleteLesson(moduleIndex, lessonIndex)}
                  onAddResource={(lessonIndex) => addResource(moduleIndex, lessonIndex)}
                  onUpdateResource={(lessonIndex, resourceIndex, updates) =>
                    updateResource(moduleIndex, lessonIndex, resourceIndex, updates)
                  }
                  onDeleteResource={(lessonIndex, resourceIndex) =>
                    deleteResource(moduleIndex, lessonIndex, resourceIndex)
                  }
                />
              ))}
            </Accordion>

            <Button onClick={addModule} variant="outline" className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Agregar Módulo
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

// Componente auxiliar para editar un módulo
interface ModuleEditorProps {
  module: CourseModule
  moduleIndex: number
  courseId: string
  onUpdateModule: (updates: Partial<CourseModule>) => void
  onDeleteModule: () => void
  onAddLesson: () => void
  onUpdateLesson: (lessonIndex: number, updates: Partial<CourseLesson>) => void
  onDeleteLesson: (lessonIndex: number) => void
  onAddResource: (lessonIndex: number) => void
  onUpdateResource: (
    lessonIndex: number,
    resourceIndex: number,
    updates: Partial<CourseResource>
  ) => void
  onDeleteResource: (lessonIndex: number, resourceIndex: number) => void
}

function ModuleEditor({
  module,
  moduleIndex,
  courseId,
  onUpdateModule,
  onDeleteModule,
  onAddLesson,
  onUpdateLesson,
  onDeleteLesson,
  onAddResource,
  onUpdateResource,
  onDeleteResource,
}: ModuleEditorProps) {
  return (
    <AccordionItem value={module.id} className="border rounded-lg">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            <GripVertical className="w-5 h-5 text-muted-foreground mt-2 cursor-move" />
            <div className="flex-1 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <Input
                    value={module.title}
                    onChange={(e) => onUpdateModule({ title: e.target.value })}
                    placeholder="Título del módulo"
                    className="text-lg font-bold"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {module.lessons.length} lecciones
                  </span>
                  <Button variant="ghost" size="icon" onClick={onDeleteModule}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
              <Textarea
                value={module.description || ''}
                onChange={(e) => onUpdateModule({ description: e.target.value })}
                placeholder="Descripción del módulo (opcional)"
                rows={2}
              />
            </div>
          </div>
        </CardHeader>

        <AccordionTrigger className="px-6 pb-3 hover:no-underline">
          <span className="text-sm text-muted-foreground">
            {module.lessons.length === 0 ? 'Sin lecciones' : 'Ver lecciones'}
          </span>
        </AccordionTrigger>

        <AccordionContent>
          <CardContent className="space-y-4 pt-0">
            {module.lessons.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed rounded-lg">
                <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-sm text-muted-foreground mb-4">
                  Este módulo no tiene lecciones todavía
                </p>
                <Button onClick={onAddLesson} variant="default" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Primera Lección
                </Button>
              </div>
            ) : (
              <>
                {module.lessons.map((lesson, lessonIndex) => (
                  <LessonEditor
                    key={lesson.id}
                    lesson={lesson}
                    lessonIndex={lessonIndex}
                    courseId={courseId}
                    onUpdate={(updates) => onUpdateLesson(lessonIndex, updates)}
                    onDelete={() => onDeleteLesson(lessonIndex)}
                    onAddResource={() => onAddResource(lessonIndex)}
                    onUpdateResource={(resourceIndex, updates) =>
                      onUpdateResource(lessonIndex, resourceIndex, updates)
                    }
                    onDeleteResource={(resourceIndex) => onDeleteResource(lessonIndex, resourceIndex)}
                  />
                ))}

                <Button onClick={onAddLesson} variant="outline" size="sm" className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Lección
                </Button>
              </>
            )}
          </CardContent>
        </AccordionContent>
      </Card>
    </AccordionItem>
  )
}

// Componente para editar una lección
interface LessonEditorProps {
  lesson: CourseLesson
  lessonIndex: number
  courseId: string
  onUpdate: (updates: Partial<CourseLesson>) => void
  onDelete: () => void
  onAddResource: () => void
  onUpdateResource: (resourceIndex: number, updates: Partial<CourseResource>) => void
  onDeleteResource: (resourceIndex: number) => void
}

function LessonEditor({
  lesson,
  lessonIndex,
  courseId,
  onUpdate,
  onDelete,
  onAddResource,
  onUpdateResource,
  onDeleteResource,
}: LessonEditorProps) {
  return (
    <Card className="border-l-4 border-l-primary">
      <CardContent className="p-4 space-y-4">
        {/* Título y tipo de contenido */}
        <div className="flex items-start gap-3">
          <div className="flex-1 space-y-3">
            <Input
              value={lesson.title}
              onChange={(e) => onUpdate({ title: e.target.value })}
              placeholder="Título de la lección"
              className="font-medium"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Select
                value={lesson.contentType}
                onValueChange={(value) =>
                  onUpdate({ contentType: value as any })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tipo de contenido" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="video">📹 Video</SelectItem>
                  <SelectItem value="text">📝 Texto/Artículo</SelectItem>
                  <SelectItem value="pdf">📄 Documento PDF</SelectItem>
                  <SelectItem value="quiz">❓ Quiz/Evaluación</SelectItem>
                </SelectContent>
              </Select>

              <Input
                type="number"
                value={lesson.duration || 0}
                onChange={(e) => onUpdate({ duration: parseInt(e.target.value) })}
                placeholder="Duración (minutos)"
                min="0"
              />
            </div>
          </div>

          <Button variant="ghost" size="icon" onClick={onDelete}>
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>

        {/* Descripción */}
        <Textarea
          value={lesson.description || ''}
          onChange={(e) => onUpdate({ description: e.target.value })}
          placeholder="Descripción de la lección"
          rows={2}
        />

        {/* Contenido según el tipo */}
        {lesson.contentType === 'video' && (
          <div>
            <label className="text-sm font-medium mb-2 block">URL del Video</label>
            <Input
              value={lesson.videoUrl || ''}
              onChange={(e) => onUpdate({ videoUrl: e.target.value })}
              placeholder="https://www.youtube.com/watch?v=..."
            />
            <p className="text-xs text-muted-foreground mt-1">
              Soportado: YouTube, Vimeo
            </p>
          </div>
        )}

        {lesson.contentType === 'text' && (
          <div>
            <label className="text-sm font-medium mb-2 block">Contenido de Texto</label>
            <Textarea
              value={lesson.textContent || ''}
              onChange={(e) => onUpdate({ textContent: e.target.value })}
              placeholder="Escribe el contenido de la lección aquí..."
              rows={6}
            />
          </div>
        )}

        {lesson.contentType === 'pdf' && (
          <div>
            <label className="text-sm font-medium mb-2 block">Subir Documento PDF</label>
            <FileUploader
              courseId={courseId}
              fileType="document"
              accept=".pdf"
              onUploadComplete={(url, path) => {
                onUpdate({ documentUrl: url, documentPath: path })
                toast.success('Documento subido')
              }}
            />
            {lesson.documentUrl && (
              <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
                <FileText className="w-4 h-4" />
                <span>Documento cargado</span>
                <a
                  href={lesson.documentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  Ver
                </a>
              </div>
            )}
          </div>
        )}

        {/* Recursos adicionales */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium">Recursos Adicionales</label>
            <Button onClick={onAddResource} variant="outline" size="sm">
              <Plus className="w-3 h-3 mr-1" />
              Agregar
            </Button>
          </div>

          {lesson.resources && lesson.resources.length > 0 && (
            <div className="space-y-2">
              {lesson.resources.map((resource, resourceIndex) => (
                <div
                  key={resource.id}
                  className="flex items-center gap-2 p-2 border rounded"
                >
                  <Input
                    value={resource.title}
                    onChange={(e) =>
                      onUpdateResource(resourceIndex, { title: e.target.value })
                    }
                    placeholder="Título del recurso"
                    className="flex-1"
                    size={32}
                  />
                  <FileUploader
                    courseId={courseId}
                    fileType="document"
                    onUploadComplete={(url, path) => {
                      onUpdateResource(resourceIndex, { url, filePath: path })
                    }}
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDeleteResource(resourceIndex)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
