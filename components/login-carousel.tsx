"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

// Only include images that exist in the directory to avoid 404s
const miningImages = [
  "/images/hero/hero-1.jpg",
  "/images/hero/hero-3.jpg",
  "/images/hero/hero-7.jpg",
  "/images/hero/hero-8.jpg",
]

export function LoginCarousel() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % miningImages.length)
    }, 6000) // Slightly longer duration for professional feel
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="relative w-full h-full bg-stone-950 overflow-hidden">
      <AnimatePresence mode="popLayout">
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 1.2 }}
          animate={{ 
            opacity: 1, 
            scale: 1,
            transition: { 
              opacity: { duration: 2, ease: "easeInOut" },
              scale: { duration: 10, ease: "linear" } // Continuous slow zoom-out (Ken Burns)
            } 
          }}
          exit={{ 
            opacity: 0,
            transition: { duration: 2, ease: "easeInOut" } 
          }}
          className="absolute inset-0 w-full h-full"
        >
          <img
            src={miningImages[index]}
            alt="Mining Operations"
            className="w-full h-full object-cover"
          />
          
          {/* Professional Overlays */}
          <div className="absolute inset-0 bg-stone-950/40 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-r from-stone-950/60 via-transparent to-transparent" />
          
          {/* Subtle Grid Pattern Overlay */}
          <div 
            className="absolute inset-0 opacity-[0.07]" 
            style={{ 
              backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
              backgroundSize: '32px 32px' 
            }} 
          />
        </motion.div>
      </AnimatePresence>

      {/* Decorative Bottom Shadow for Text Readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-transparent opacity-80" />

      {/* Branding / Text Overlay */}
      <div className="absolute bottom-20 left-16 right-16 z-10">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8, duration: 1 }}
          className="space-y-6"
        >
          <div className="flex items-center gap-3">
            <div className="h-[2px] w-12 bg-amber-500" />
            <p className="text-amber-500 text-[10px] font-black uppercase tracking-[0.5em]">Global Standards</p>
          </div>
          
          <h2 className="text-5xl font-black text-white uppercase tracking-tighter italic leading-[0.9] max-w-xl">
            Unlocking <span className="text-amber-500">Value</span> Through<br />
            Digital <span className="text-amber-500">Excellence</span>
          </h2>
          
          <p className="text-stone-400 text-sm font-medium tracking-wide max-w-md leading-relaxed border-l-2 border-stone-800 pl-6">
            Smart Mine Enterprise integrates real-time operational data with strategic intelligence to drive sustainable growth in modern mining.
          </p>
        </motion.div>
      </div>

      {/* Modern Slide Indicators */}
      <div className="absolute bottom-20 right-16 flex gap-3">
        {miningImages.map((_, i) => (
          <div 
            key={i}
            className="relative h-[3px] w-12 bg-white/10 overflow-hidden rounded-full"
          >
            {i === index && (
              <motion.div 
                layoutId="progress"
                initial={{ x: "-100%" }}
                animate={{ x: "0%" }}
                transition={{ duration: 6, ease: "linear" }}
                className="absolute inset-0 bg-amber-500"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
