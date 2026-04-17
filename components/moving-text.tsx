"use client"

import React from "react"
import { cn } from "@/lib/utils"

interface MovingTextProps {
  text: string
  speed?: number
  direction?: 'left' | 'right'
  className?: string
}

export function MovingText({ text, speed = 20, direction = 'left', className }: MovingTextProps) {
  return (
    <div className={cn("overflow-hidden whitespace-nowrap py-2 flex items-center relative", className)}>
      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(${direction === 'left' ? '100%' : '-100%'}); }
          100% { transform: translateX(${direction === 'left' ? '-100%' : '100%'}); }
        }
        .animate-marquee {
          animation: marquee ${speed}s linear infinite;
          display: inline-block;
          min-width: 100%;
        }
      `}</style>
      <div className="animate-marquee">
        {text} {text} {text}
      </div>
    </div>
  )
}
