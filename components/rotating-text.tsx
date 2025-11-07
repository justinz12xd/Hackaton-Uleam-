'use client'

import { useEffect, useState } from 'react'

interface RotatingTextProps {
  words: string[]
  staticText?: string
  className?: string
}

export function RotatingText({ words, staticText = '', className = '' }: RotatingTextProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true)
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % words.length)
        setIsAnimating(false)
      }, 500) // Half of the animation duration
    }, 8000) // Change word every 12 seconds

    return () => clearInterval(interval)
  }, [words.length])

  return (
    <span className={`inline-flex items-baseline ${className}`}>
      <span className="relative inline-block overflow-hidden mr-3">
        <span
          className={`inline-block transition-all duration-500 ${
            isAnimating
              ? 'translate-y-[-100%] opacity-0'
              : 'translate-y-0 opacity-100'
          }`}
        >
          {words[currentIndex]}
        </span>
      </span>
      <span>{staticText}</span>
    </span>
  )
}
