'use client'

import { useEffect, useState } from 'react'

interface Event {
  id: string
  title: string
  image_url: string | null
  event_date: string
}

interface EventsImageCarouselProps {
  events: Event[]
}

export function EventsImageCarousel({ events }: EventsImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  // Filter events that have images
  const eventsWithImages = events.filter(event => event.image_url)

  useEffect(() => {
    if (!isAutoPlaying || eventsWithImages.length <= 1) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % eventsWithImages.length)
    }, 5000) // Change every 5 seconds

    return () => clearInterval(interval)
  }, [isAutoPlaying, eventsWithImages.length])

  const goToPrevious = () => {
    setIsAutoPlaying(false)
    setCurrentIndex((prev) => (prev - 1 + eventsWithImages.length) % eventsWithImages.length)
  }

  const goToNext = () => {
    setIsAutoPlaying(false)
    setCurrentIndex((prev) => (prev + 1) % eventsWithImages.length)
  }

  const goToSlide = (index: number) => {
    setIsAutoPlaying(false)
    setCurrentIndex(index)
  }

  if (eventsWithImages.length === 0) {
    return (
      <div className="relative w-full h-full bg-gradient-to-br from-primary/20 to-accent/20">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/20 to-black/60" />
      </div>
    )
  }

  const currentEvent = eventsWithImages[currentIndex]

  return (
    <div className="relative w-full h-full group">
      {/* Image Container */}
      <div className="relative w-full h-full overflow-hidden">
        <img
          src={currentEvent.image_url!}
          alt={currentEvent.title}
          className="w-full h-full object-cover transition-all duration-1000"
        />
        
        {/* Gradient Overlay - suave transición hacia la derecha */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-background" 
             style={{
               background: 'linear-gradient(90deg, transparent 0%, transparent 60%, rgba(0,0,0,0.3) 80%, var(--background) 100%)'
             }}
        />
      </div>

      {/* Dots Indicator - positioned at bottom */}
      {eventsWithImages.length > 1 && (
        <div className="absolute bottom-6 left-8 flex gap-2 z-10">
          {eventsWithImages.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`transition-all duration-300 rounded-full ${
                index === currentIndex
                  ? 'w-8 h-2 bg-primary'
                  : 'w-2 h-2 bg-white/50 hover:bg-white/70'
              }`}
              aria-label={`Ir al evento ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
