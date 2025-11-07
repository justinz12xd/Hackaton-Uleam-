'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import {
  PlayCircle,
  FileText,
  Download,
  CheckCircle,
  Circle,
  BookOpen,
  Award,
  Check,
  Award as AwardIcon
} from 'lucide-react'
import { toast } from 'sonner'
import type { CourseContent, CourseModule, CourseLesson, CourseResource } from '@/lib/types/course-content'
import { getNextLessonId } from '@/lib/types/course-content'

interface CourseViewerProps {
  courseId: string
  courseTitle: string
  content: CourseContent | null
  isEnrolled: boolean
  enrollmentId?: string | null
  studentName?: string | null
  studentEmail?: string | null
  eventContext?: {
    id: string
    title: string
    organizerName?: string | null
  } | null
  locale?: string
}

interface LessonProgress {
  module_id: string
  lesson_id: string
  completed: boolean
  completed_at: string | null
}

interface ProgressStats {
  totalLessons: number
  completedLessons: number
  progressPercentage: number
  courseCompleted: boolean
}

interface CertificateInfo {
  certificateNumber: string
  credentialId: string | null
  qrCodeDataUrl: string
  verificationUrl: string
  issuedAt: string
}

export default function CourseViewer({
  courseId,
  courseTitle,
  content,
  isEnrolled,
  enrollmentId,
  studentName,
  studentEmail,
  eventContext,
  locale = 'es'
}: CourseViewerProps) {
  const [selectedLesson, setSelectedLesson] = useState<{
    module: CourseModule
    lesson: CourseLesson
  } | null>(null)
  const [progress, setProgress] = useState<LessonProgress[]>([])
  const [stats, setStats] = useState<ProgressStats>({
    totalLessons: 0,
    completedLessons: 0,
    progressPercentage: 0,
    courseCompleted: false
  })
  const [isLoadingProgress, setIsLoadingProgress] = useState(false)
  const [isGeneratingCertificate, setIsGeneratingCertificate] = useState(false)
  const [certificateInfo, setCertificateInfo] = useState<CertificateInfo | null>(null)
  const [autoGenerationTriggered, setAutoGenerationTriggered] = useState(false)

  // Cargar progreso del estudiante
  useEffect(() => {
    if (isEnrolled) {
      loadProgress()
      loadExistingCertificate()
    }
  }, [isEnrolled, courseId])

  // Seleccionar la primera lección al cargar
  useEffect(() => {
    if (content?.modules && content.modules.length > 0 && !selectedLesson) {
      const firstModule = content.modules[0]
      if (firstModule.lessons && firstModule.lessons.length > 0) {
        setSelectedLesson({
          module: firstModule,
          lesson: firstModule.lessons[0]
        })
      }
    }
  }, [content])

  // Intentar generar certificado automáticamente cuando se complete el curso
  useEffect(() => {
    if (
      isEnrolled &&
      stats.courseCompleted &&
      enrollmentId &&
      !certificateInfo &&
      !isGeneratingCertificate &&
      !autoGenerationTriggered
    ) {
      setAutoGenerationTriggered(true)
      handleGenerateCertificate()
    }
  }, [stats.courseCompleted, enrollmentId, certificateInfo, isGeneratingCertificate, isEnrolled])

  const loadProgress = async () => {
    try {
      const response = await fetch(`/api/courses/${courseId}/progress`)
      if (!response.ok) throw new Error('Error al cargar progreso')
      
      // Verificar que la respuesta sea JSON antes de parsear
      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text()
        console.error("Expected JSON but got:", text.substring(0, 200))
        throw new Error('Error al cargar progreso')
      }
      
      const data = await response.json()
      setProgress(data.progress || [])
      setStats(data.stats || {
        totalLessons: 0,
        completedLessons: 0,
        progressPercentage: 0,
        courseCompleted: false
      })
    } catch (error) {
      console.error('Error loading progress:', error)
    }
  }

  const loadExistingCertificate = async () => {
    try {
      const response = await fetch(`/api/certificates/status?courseId=${courseId}`)
      if (!response.ok) {
        // Verificar que la respuesta sea JSON antes de parsear
        const contentType = response.headers.get("content-type")
        if (!contentType || !contentType.includes("application/json")) {
          const text = await response.text()
          console.error("Expected JSON but got:", text.substring(0, 200))
          return
        }
        return
      }

      // Verificar que la respuesta sea JSON antes de parsear
      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text()
        console.error("Expected JSON but got:", text.substring(0, 200))
        return
      }

      const data = await response.json()
      if (data?.certificate) {
        setCertificateInfo(data.certificate)
      }
    } catch (error) {
      console.error('Error fetching certificate status:', error)
    }
  }

  const isLessonCompleted = (moduleId: string, lessonId: string) => {
    return progress.some(
      p => p.module_id === moduleId && p.lesson_id === lessonId && p.completed
    )
  }

  const toggleLessonComplete = async (moduleId: string, lessonId: string) => {
    if (!isEnrolled) {
      toast.error('Debes inscribirte en el curso primero')
      return
    }

    setIsLoadingProgress(true)
    try {
      const isCompleted = isLessonCompleted(moduleId, lessonId)
      
      const response = await fetch(`/api/courses/${courseId}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleId,
          lessonId,
          completed: !isCompleted
        })
      })

      if (!response.ok) throw new Error('Error al actualizar progreso')

      // Verificar que la respuesta sea JSON antes de parsear
      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text()
        console.error("Expected JSON but got:", text.substring(0, 200))
        throw new Error('Error al actualizar progreso')
      }

      const data = await response.json()
      
      // Actualizar progreso local
      await loadProgress()
      
      if (!isCompleted) {
        toast.success('¡Lección completada!')
        
        // Si completó el curso al 100%
        if (data.stats.courseCompleted) {
          toast.success('🎉 ¡Felicidades! Has completado el curso', {
            description: 'Generaremos tu certificado en un momento'
          })
        }
      } else {
        toast.info('Lección marcada como incompleta')
      }
    } catch (error) {
      console.error('Error updating progress:', error)
      toast.error('Error al actualizar el progreso')
    } finally {
      setIsLoadingProgress(false)
    }
  }

  const totalLessonsInCourse = useMemo(() => {
    if (!content?.modules) return 0
    return content.modules.reduce((total, module) => total + (module.lessons?.length || 0), 0)
  }, [content])

  const nextLessonId = useMemo(() => {
    if (!content || !selectedLesson) return null
    return getNextLessonId(content, selectedLesson.lesson.id)
  }, [content, selectedLesson])

  const getNormalizedVideoUrl = (url: string) => {
    if (!url) return null

    try {
      const parsed = new URL(url)
      if (parsed.hostname.includes('youtube.com')) {
        const videoId = parsed.searchParams.get('v')
        if (videoId) {
          return `https://www.youtube.com/embed/${videoId}`
        }
      }

      if (parsed.hostname === 'youtu.be') {
        return `https://www.youtube.com/embed${parsed.pathname}`
      }

      return url
    } catch (error) {
      console.warn('Invalid video URL provided, using raw value:', url)
      return url
    }
  }

  const handleGenerateCertificate = async () => {
    if (!enrollmentId) {
      toast.error('No pudimos encontrar tu inscripción al curso')
      return
    }

    setIsGeneratingCertificate(true)
    try {
      const response = await fetch('/api/certificates/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          enrollmentId,
          locale,
          studentName,
          studentEmail,
          eventContext,
        }),
      })

      if (!response.ok) {
        // Verificar que la respuesta sea JSON antes de parsear
        const contentType = response.headers.get("content-type")
        if (contentType && contentType.includes("application/json")) {
          const error = await response.json()
          throw new Error(error.error || 'No se pudo generar el certificado')
        } else {
          const text = await response.text()
          console.error("Expected JSON but got:", text.substring(0, 200))
          throw new Error('No se pudo generar el certificado')
        }
      }

      // Verificar que la respuesta sea JSON antes de parsear
      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text()
        console.error("Expected JSON but got:", text.substring(0, 200))
        throw new Error('No se pudo generar el certificado')
      }

      const data = await response.json()

      setCertificateInfo({
        certificateNumber: data.certificateNumber,
        credentialId: data.credentialId || null,
        qrCodeDataUrl: data.qrCodeDataUrl,
        verificationUrl: data.verificationUrl,
        issuedAt: data.issuedAt,
      })

      toast.success('Tu certificado ha sido generado correctamente')
    } catch (error) {
      console.error('Error generating certificate:', error)
      toast.error(error instanceof Error ? error.message : 'No se pudo generar el certificado')
    } finally {
      setIsGeneratingCertificate(false)
    }
  }

  const handleCertificateAction = () => {
    if (certificateInfo?.verificationUrl) {
      window.open(certificateInfo.verificationUrl, '_blank', 'noopener,noreferrer')
      return
    }

    if (!isGeneratingCertificate) {
      void handleGenerateCertificate()
    }
  }

  const renderResource = (resource: CourseResource) => {
    const getIcon = (type: string) => {
      if (type === 'pdf') return FileText
      if (type === 'docx') return FileText
      if (type === 'pptx') return FileText
      return FileText
    }

    const Icon = getIcon(resource.type)

    return (
      <div
        key={resource.id}
        className="flex items-start gap-3 p-3 border rounded-lg hover:bg-accent/5 transition-colors"
      >
        <div className="mt-1">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">{resource.title}</p>
          {resource.description && (
            <p className="text-xs text-muted-foreground mt-1">{resource.description}</p>
          )}
          {resource.size && (
            <p className="text-xs text-muted-foreground mt-1">
              Tamaño: {(resource.size / 1024 / 1024).toFixed(2)} MB
            </p>
          )}
        </div>
        {resource.url && (
          <a
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0"
          >
            <Button size="sm" variant="ghost">
              <Download className="w-3 h-3 mr-1" />
              Descargar
            </Button>
          </a>
        )}
      </div>
    )
  }

  if (!content || !content.modules || content.modules.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <BookOpen className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center">
            Este curso aún no tiene contenido disponible
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Sidebar - Lista de Módulos y Lecciones */}
      <div className="lg:col-span-1">
        <Card className="sticky top-4">
          <CardHeader>
            <CardTitle className="text-lg">Contenido del Curso</CardTitle>
            {isEnrolled && (
              <div className="space-y-2 pt-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progreso</span>
                  <span className="font-medium">{stats.progressPercentage}%</span>
                </div>
                <Progress value={stats.progressPercentage} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {stats.completedLessons} de {stats.totalLessons} lecciones completadas
                </p>
                {stats.courseCompleted && (
                  <Badge className="w-full justify-center gap-2" variant="default">
                    <Award className="w-3 h-3" />
                    Curso Completado
                  </Badge>
                )}
              </div>
            )}
          </CardHeader>
          <CardContent className="max-h-[600px] overflow-y-auto">
            <Accordion type="single" collapsible className="w-full">
              {content.modules.map((module, moduleIndex) => (
                <AccordionItem key={module.id} value={module.id}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-start gap-2 text-left">
                      <span className="shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold mt-0.5">
                        {moduleIndex + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm leading-tight">{module.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {module.lessons?.length || 0} lecciones
                        </p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-1 pl-8 pr-2">
                      {module.lessons?.map((lesson, lessonIndex) => {
                        const isCompleted = isLessonCompleted(module.id, lesson.id)
                        const isSelected = 
                          selectedLesson?.module.id === module.id && 
                          selectedLesson?.lesson.id === lesson.id

                        return (
                          <button
                            key={lesson.id}
                            onClick={() => setSelectedLesson({ module, lesson })}
                            className={`w-full text-left p-2 rounded-lg transition-colors ${
                              isSelected
                                ? 'bg-primary/10 border border-primary/20'
                                : 'hover:bg-accent/5'
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              <div className="mt-0.5">
                                {isCompleted ? (
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                ) : (
                                  <Circle className="w-4 h-4 text-muted-foreground" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium leading-tight ${
                                  isCompleted ? 'text-muted-foreground line-through' : ''
                                }`}>
                                  {lessonIndex + 1}. {lesson.title}
                                </p>
                                {lesson.duration && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {lesson.duration} min
                                  </p>
                                )}
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </div>

      {/* Main Content - Lección Seleccionada */}
      <div className="lg:col-span-2">
        {selectedLesson ? (
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <Badge variant="outline" className="mb-2">
                    {selectedLesson.module.title}
                  </Badge>
                  <CardTitle className="text-2xl">{selectedLesson.lesson.title}</CardTitle>
                  {selectedLesson.lesson.description && (
                    <CardDescription className="mt-2">
                      {selectedLesson.lesson.description}
                    </CardDescription>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Video Player */}
              {selectedLesson.lesson.videoUrl && (
                <div className="aspect-video bg-black rounded-lg overflow-hidden">
                  <iframe
                    src={getNormalizedVideoUrl(selectedLesson.lesson.videoUrl) || undefined}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )}

              {/* Contenido de Texto */}
              {selectedLesson.lesson.textContent && (
                <div className="prose prose-sm max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: selectedLesson.lesson.textContent }} />
                </div>
              )}

              {/* Documento */}
              {selectedLesson.lesson.documentUrl && (
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <FileText className="w-8 h-8 text-primary" />
                    <div className="flex-1">
                      <p className="font-medium">Documento de la lección</p>
                      <p className="text-sm text-muted-foreground">Descarga el material de estudio</p>
                    </div>
                    <a
                      href={selectedLesson.lesson.documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Descargar
                      </Button>
                    </a>
                  </div>
                </div>
              )}

              {/* Recursos de la Lección */}
              {selectedLesson.lesson.resources && selectedLesson.lesson.resources.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Recursos Adicionales</h3>
                  <div className="space-y-2">
                    {selectedLesson.lesson.resources.map(renderResource)}
                  </div>
                </div>
              )}

              {!selectedLesson.lesson.videoUrl && 
               !selectedLesson.lesson.textContent && 
               !selectedLesson.lesson.documentUrl &&
               (!selectedLesson.lesson.resources || selectedLesson.lesson.resources.length === 0) && (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Esta lección aún no tiene contenido disponible</p>
                </div>
              )}

              {isEnrolled && (
                <div className="space-y-4 pt-4 border-t">
                  <Button
                    onClick={() => toggleLessonComplete(selectedLesson.module.id, selectedLesson.lesson.id)}
                    disabled={isLoadingProgress}
                    variant={isLessonCompleted(selectedLesson.module.id, selectedLesson.lesson.id) ? 'secondary' : 'default'}
                    className="w-full gap-2"
                  >
                    {isLessonCompleted(selectedLesson.module.id, selectedLesson.lesson.id) ? (
                      <>
                        <Check className="w-4 h-4" />
                        Lección completada
                      </>
                    ) : (
                      <>
                        <Circle className="w-4 h-4" />
                        Marcar lección como completada
                      </>
                    )}
                  </Button>

                  {stats.courseCompleted && (
                    <div className="space-y-3">
                      <Button
                        onClick={handleCertificateAction}
                        disabled={isGeneratingCertificate}
                        className="w-full gap-2"
                      >
                        <AwardIcon className="w-4 h-4" />
                        {certificateInfo ? 'Ver certificado' : 'Generar certificado'}
                      </Button>

                      {certificateInfo && (
                        <div className="border rounded-lg p-4 text-center space-y-3">
                          <p className="text-sm font-semibold">Certificado listo</p>
                          <p className="text-xs text-muted-foreground">
                            Escanea el código QR o abre el certificado para compartirlo.
                          </p>
                          <div className="flex justify-center">
                            <img
                              src={certificateInfo.qrCodeDataUrl}
                              alt="QR del certificado"
                              className="w-40 h-40 rounded-lg border"
                            />
                          </div>
                          <div className="space-y-2">
                            <p className="text-xs font-mono text-muted-foreground">
                              {certificateInfo.certificateNumber}
                            </p>
                            <Button asChild variant="outline" size="sm" className="w-full">
                              <a href={certificateInfo.verificationUrl} target="_blank" rel="noopener noreferrer">
                                Abrir certificado
                              </a>
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {!stats.courseCompleted && !nextLessonId && totalLessonsInCourse > 0 && (
                    <p className="text-xs text-muted-foreground text-center">
                      ¡Estás en la última lección! Marca la lección como completada para finalizar el curso.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <PlayCircle className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Selecciona una lección para comenzar
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
