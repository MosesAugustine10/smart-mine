"use client"

import React, { useRef, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface DigitalSignatureProps {
  onSave: (signatureDataUrl: string) => void
  title?: string
  buttonText?: string
  required?: boolean
}

export function DigitalSignature({
  onSave,
  title = "Signature",
  buttonText = "Save Signature",
  required = false
}: DigitalSignatureProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)
  
  // Set up canvas context and high-DPI scaling
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    
    // High DPI Scaling
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)
    canvas.style.width = `${rect.width}px`
    canvas.style.height = `${rect.height}px`

    // Fill white background for the exported image to not be transparent
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, rect.width, rect.height)
    
    ctx.strokeStyle = "#000000"
    ctx.lineWidth = 3
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
  }, [])

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    
    setIsDrawing(true)
    const { offsetX, offsetY } = getCoordinates(e, canvas)
    ctx.beginPath()
    ctx.moveTo(offsetX, offsetY)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    
    const { offsetX, offsetY } = getCoordinates(e, canvas)
    ctx.lineTo(offsetX, offsetY)
    ctx.stroke()
    setHasSignature(true)
  }

  const stopDrawing = () => {
    if (!isDrawing) return
    setIsDrawing(false)
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext("2d")
      ctx?.closePath()
      
      // Auto-save on stop for better UX
      const dataUrl = canvas.toDataURL("image/png")
      onSave(dataUrl)
    }
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    
    const rect = canvas.getBoundingClientRect()
    ctx.clearRect(0, 0, rect.width, rect.height)
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, rect.width, rect.height)
    setHasSignature(false)
    onSave("") // Notify parent that signature is cleared
  }

  const handleSave = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dataUrl = canvas.toDataURL("image/png")
    onSave(dataUrl)
  }

  const getCoordinates = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
    canvas: HTMLCanvasElement
  ) => {
    const rect = canvas.getBoundingClientRect()
    
    // Handle touch events with better precision
    if ("touches" in e && e.touches.length > 0) {
      const touch = e.touches[0]
      return {
        offsetX: touch.clientX - rect.left,
        offsetY: touch.clientY - rect.top
      }
    }
    
    // Handle mouse events using nativeEvent for guaranteed offsetX/Y
    const nativeEvent = e.nativeEvent as any
    if (nativeEvent && typeof nativeEvent.offsetX === 'number') {
      return {
        offsetX: nativeEvent.offsetX,
        offsetY: nativeEvent.offsetY
      }
    }

    return { offsetX: 0, offsetY: 0 }
  }

  return (
    <div className="flex flex-col gap-3 w-full max-w-md">
      <div className="flex justify-between items-end px-2">
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
          {hasSignature ? "Signature Captured" : title} {required && <span className="text-red-500">*</span>}
        </span>
        {hasSignature && (
          <div className="flex items-center gap-3">
             <span className="flex items-center gap-1 text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 uppercase tracking-tighter">
                Authenticated
             </span>
             <button 
                type="button" 
                onClick={clearCanvas}
                className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-red-500 transition-colors"
                title="Clear Signature"
              >
                Reset
             </button>
          </div>
        )}
      </div>
      
      <div className={cn(
        "relative group border-4 rounded-[2.5rem] overflow-hidden bg-white shadow-sm transition-all duration-500",
        hasSignature ? "border-emerald-500/50 shadow-2xl shadow-emerald-500/10" : "border-slate-100 hover:border-slate-200"
      )}>
        <canvas
          ref={canvasRef}
          width={500}
          height={180}
          className="w-full cursor-crosshair touch-none"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseOut={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        
        {!hasSignature && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20 select-none">
                 <p className="text-sm font-black uppercase tracking-[0.5em] text-slate-300">Authorization Pad</p>
            </div>
        )}

        {hasSignature && (
            <div className="absolute bottom-4 right-6 pointer-events-none select-none opacity-40">
                <div className="flex flex-col items-end">
                    <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">Digital Site ID Certified</p>
                    <p className="text-[6px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{new Date().toISOString()}</p>
                </div>
            </div>
        )}
      </div>
      
      <p className="text-[9px] font-bold text-center text-slate-400 uppercase tracking-[0.2em] mt-2 italic px-8">
         Sign clearly within the boundaries to authorize this digital ledger entry.
      </p>
    </div>
  )
}
