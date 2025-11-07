'use client'

import { useEffect, useState } from 'react'
import { Calendar, MapPin, Users, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Link } from '@/lib/i18n/routing'

interface Event {
  id: string
  title: string
  description: string | null
  event_date: string
  location: string | null
  capacity: number | null
  image_url: string | null
  registrations_count?: number
}

interface EventsCarouselProps {
  events: Event[]
}

export function EventsCarousel({ events }: EventsCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  // Filter to get featured/upcoming events (top 5)
  const featuredEvents = events.slice(0, 5)

  useEffect(() => {
    if (!isAutoPlaying || featuredEvents.length <= 1) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featuredEvents.length)
    }, 5000) // Change every 5 seconds

    return () => clearInterval(interval)
  }, [isAutoPlaying, featuredEvents.length])

  const goToPrevious = () => {
    setIsAutoPlaying(false)
    setCurrentIndex((prev) => (prev - 1 + featuredEvents.length) % featuredEvents.length)
  }

  const goToNext = () => {
    setIsAutoPlaying(false)
    setCurrentIndex((prev) => (prev + 1) % featuredEvents.length)
  }

  const goToSlide = (index: number) => {
    setIsAutoPlaying(false)
    setCurrentIndex(index)
  }

  if (featuredEvents.length === 0) {
    return null
  }

  const currentEvent = featuredEvents[currentIndex]
  const eventDate = new Date(currentEvent.event_date)

  return (
    <div className="w-full bg-gradient-to-br from-primary/5 via-background to-accent/5 py-8">
      <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-7">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Eventos Destacados</h2>
          <p className="text-muted-foreground">Descubre los próximos eventos más populares</p>
        </div>

        <div className="relative group">
          {/* Main Carousel Card */}
          <Card className="overflow-hidden bg-card border-2 transition-all duration-300 hover:shadow-2xl">
            <div className="grid md:grid-cols-2">
              {/* Image Section */}
              <div className="relative h-[300px] md:h-[400px] overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20">
                {currentEvent.image_url ? (
                  <img
                    src={currentEvent.image_url}
                    alt={currentEvent.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Calendar className="w-32 h-32 text-muted-foreground/20" />
                  </div>
                )}
                
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-black/60" />
              </div>

              {/* Content Section */}
              <div className="p-8 md:p-12 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-sm text-primary font-semibold mb-4">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {eventDate.toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  <h3 className="text-4xl font-bold mb-4 leading-tight">
                    {currentEvent.title}
                  </h3>

                  <p className="text-lg text-muted-foreground mb-6 line-clamp-3">
                    {currentEvent.description || 'Un evento imperdible que no querrás perderte.'}
                  </p>

                  <div className="flex flex-col gap-3 mb-8">
                    {currentEvent.location && (
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <MapPin className="w-5 h-5 text-primary" />
                        <span>{currentEvent.location}</span>
                      </div>
                    )}
                    
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <Link href={`/events/${currentEvent.id}`} className="flex-1">
                    <Button size="lg" className="w-full text-lg">
                      Ver Detalles
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </Card>

          {/* Navigation Arrows */}
          {featuredEvents.length > 1 && (
            <>
              <button
                onClick={goToPrevious}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-background/90 hover:bg-background text-foreground p-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
                aria-label="Evento anterior"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              <button
                onClick={goToNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-background/90 hover:bg-background text-foreground p-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
                aria-label="Siguiente evento"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}
        </div>

        {/* Dots Indicator */}
        {featuredEvents.length > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            {featuredEvents.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`transition-all duration-300 rounded-full ${
                  index === currentIndex
                    ? 'w-8 h-3 bg-primary'
                    : 'w-3 h-3 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                }`}
                aria-label={`Ir al evento ${index + 1}`}
              />
            ))}
          </div>
        )}

        {/* Event Counter */}
        <div className="text-center mt-4 text-sm text-muted-foreground">
          {currentIndex + 1} / {featuredEvents.length}
        </div>
      </div>
    </div>
  )
}
