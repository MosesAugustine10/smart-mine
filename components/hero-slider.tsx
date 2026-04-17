"use client"

import React, { useState, useEffect } from "react"

export interface Slide {
  src: string
  label: string
}

const defaultSlides: Slide[] = [
  { src: "/images/hero/hero-1.jpg", label: "Migodi ya Kati" },
  { src: "/images/hero/hero-2.jpg", label: "Wachimbaji Wadogo" },
  { src: "/images/hero/hero-3.jpg", label: "Usimamizi wa Kitaalamu" },
]

interface HeroSliderProps {
  slides?: Slide[]
}

export function HeroSlider({ slides = defaultSlides }: HeroSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [prevIndex, setPrevIndex] = useState<number | null>(null)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      goTo((prev) => (prev + 1) % slides.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [slides.length])

  function goTo(nextFn: (prev: number) => number) {
    setCurrentIndex((prev) => {
      const next = nextFn(prev)
      setPrevIndex(prev)
      setFading(true)
      setTimeout(() => setFading(false), 800)
      return next
    })
  }

  function goToIndex(i: number) {
    if (i === currentIndex) return
    setPrevIndex(currentIndex)
    setFading(true)
    setTimeout(() => setFading(false), 800)
    setCurrentIndex(i)
  }

  return (
    /* This wrapper must be relative so all absolute children are clipped to it */
    <div className="relative w-full h-full overflow-hidden bg-slate-900">

      {/* Previous image — stays visible while new one fades in */}
      {prevIndex !== null && slides[prevIndex] && (
        <img
          key={`prev-${prevIndex}`}
          src={slides[prevIndex].src}
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover"
          style={{ zIndex: 1 }}
        />
      )}

      {/* Current image — fades in on top */}
      <img
        key={`curr-${currentIndex}`}
        src={slides[currentIndex]?.src}
        alt={slides[currentIndex]?.label}
        className="absolute inset-0 w-full h-full object-cover transition-opacity"
        style={{
          zIndex: 2,
          opacity: fading ? 0 : 1,
          transitionDuration: "900ms",
          transitionTimingFunction: "ease-in-out",
        }}
      />

      {/* Subtle bottom vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 3, background: "linear-gradient(to top, rgba(0,0,0,0.40) 0%, transparent 50%, rgba(0,0,0,0.10) 100%)" }}
      />

      {/* Dot indicators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3" style={{ zIndex: 10 }}>
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => goToIndex(i)}
            aria-label={`Slide ${i + 1}`}
            className={`rounded-full transition-all duration-500 ${
              i === currentIndex ? "w-8 h-2 bg-amber-400" : "w-2 h-2 bg-white/50 hover:bg-white/80"
            }`}
          />
        ))}
      </div>

      {/* Label badge — bottom left */}
      <div
        className="absolute bottom-14 left-5 text-white text-[10px] font-black uppercase tracking-[0.3em] px-4 py-2 rounded-full border border-white/20"
        style={{ zIndex: 10, background: "rgba(0,0,0,0.50)", backdropFilter: "blur(8px)", transition: "opacity 0.5s", opacity: fading ? 0 : 1 }}
      >
        {slides[currentIndex]?.label}
      </div>
    </div>
  )
}
