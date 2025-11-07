'use client'

import { useEffect, useState } from 'react'
import { BookOpen, Clock, Award, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Link } from '@/lib/i18n/routing'

interface Course {
  id: string
  title: string
  description: string | null
  difficulty_level: string | null
  duration_hours: number | null
  image_url: string | null
  instructor_id?: string
}

interface CoursesCarouselProps {
  courses: Course[]
}

export function CoursesCarousel({ courses }: CoursesCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  // Filter to get featured courses (top 5)
  const featuredCourses = courses.slice(0, 5)

  useEffect(() => {
    if (!isAutoPlaying || featuredCourses.length <= 1) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featuredCourses.length)
    }, 5000) // Change every 5 seconds

    return () => clearInterval(interval)
  }, [isAutoPlaying, featuredCourses.length])

  const goToPrevious = () => {
    setIsAutoPlaying(false)
    setCurrentIndex((prev) => (prev - 1 + featuredCourses.length) % featuredCourses.length)
  }

  const goToNext = () => {
    setIsAutoPlaying(false)
    setCurrentIndex((prev) => (prev + 1) % featuredCourses.length)
  }

  const goToSlide = (index: number) => {
    setIsAutoPlaying(false)
    setCurrentIndex(index)
  }

  if (featuredCourses.length === 0) {
    return null
  }

  const currentCourse = featuredCourses[currentIndex]

  const getDifficultyLabel = (level: string | null) => {
    const levels: { [key: string]: string } = {
      'beginner': 'Principiante',
      'intermediate': 'Intermedio',
      'advanced': 'Avanzado'
    }
    return level ? levels[level] || 'Principiante' : 'Principiante'
  }

  const getDifficultyColor = (level: string | null) => {
    const colors: { [key: string]: string } = {
      'beginner': 'bg-green-500/10 text-green-700 dark:text-green-400',
      'intermediate': 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
      'advanced': 'bg-red-500/10 text-red-700 dark:text-red-400'
    }
    return level ? colors[level] || colors['beginner'] : colors['beginner']
  }

  return (
    <div className="w-full bg-gradient-to-br from-primary/5 via-background to-accent/5 py-8">
      <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-7">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Cursos Destacados</h2>
          <p className="text-muted-foreground">Descubre los cursos más populares y mejor valorados</p>
        </div>

        <div className="relative group">
          {/* Main Carousel Card */}
          <Card className="overflow-hidden bg-card border-2 transition-all duration-300 hover:shadow-2xl">
            <div className="grid md:grid-cols-2 md:min-h-[500px]">
              {/* Image Section */}
              <div className="relative h-[350px] md:h-[500px] overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20 group">
                {currentCourse.image_url ? (
                  <img
                    src={currentCourse.image_url}
                    alt={currentCourse.title}
                    className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-110"
                  />
                ) : (
                  <div className="absolute inset-0 w-full h-full flex items-center justify-center">
                    <BookOpen className="w-32 h-32 text-muted-foreground/20" />
                  </div>
                )}
                
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-black/40" />
              </div>

              {/* Content Section */}
              <div className="p-8 md:p-12 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${getDifficultyColor(currentCourse.difficulty_level)}`}>
                      {getDifficultyLabel(currentCourse.difficulty_level)}
                    </span>
                    {currentCourse.duration_hours && (
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span>{currentCourse.duration_hours}h</span>
                      </div>
                    )}
                  </div>

                  <h3 className="text-4xl font-bold mb-4 leading-tight">
                    {currentCourse.title}
                  </h3>

                  <p className="text-lg text-muted-foreground mb-6 line-clamp-4">
                    {currentCourse.description || 'Un curso completo que te ayudará a dominar nuevas habilidades.'}
                  </p>

                  <div className="flex flex-col gap-3 mb-8">
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <Award className="w-5 h-5 text-primary" />
                      <span>Certificado al completar</span>
                    </div>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <BookOpen className="w-5 h-5 text-primary" />
                      <span>Acceso de por vida</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <Link href={`/courses/${currentCourse.id}`} className="flex-1">
                    <Button size="lg" className="w-full text-lg">
                      Ver Curso
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </Card>

          {/* Navigation Arrows */}
          {featuredCourses.length > 1 && (
            <>
              <button
                onClick={goToPrevious}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-background/90 hover:bg-background text-foreground p-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
                aria-label="Curso anterior"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              <button
                onClick={goToNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-background/90 hover:bg-background text-foreground p-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
                aria-label="Siguiente curso"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}
        </div>

        {/* Dots Indicator */}
        {featuredCourses.length > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            {featuredCourses.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`transition-all duration-300 rounded-full ${
                  index === currentIndex
                    ? 'w-8 h-3 bg-primary'
                    : 'w-3 h-3 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                }`}
                aria-label={`Ir al curso ${index + 1}`}
              />
            ))}
          </div>
        )}

        {/* Course Counter */}
        <div className="text-center mt-4 text-sm text-muted-foreground">
          {currentIndex + 1} / {featuredCourses.length}
        </div>
      </div>
    </div>
  )
}
