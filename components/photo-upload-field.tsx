"use client"

import React, { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Camera, X, Loader2, Image as ImageIcon, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

interface PhotoUploadFieldProps {
  onPhotosChange?: (urls: string[]) => void
  photos?: string[]
  setPhotos?: (urls: string[] | ((prev: string[]) => string[])) => void
  label?: string
  maxPhotos?: number
}

export function PhotoUploadField({
  onPhotosChange,
  photos: externalPhotos,
  setPhotos: externalSetPhotos,
  label = "Site Photos",
  maxPhotos = 5
}: PhotoUploadFieldProps) {
  const [uploading, setUploading] = useState(false)
  const [internalPhotos, setInternalPhotos] = useState<string[]>([])
  
  const photos = externalPhotos !== undefined ? externalPhotos : internalPhotos
  const setPhotos = (newPhotos: string[] | ((prev: string[]) => string[])) => {
    if (externalSetPhotos) {
      externalSetPhotos(newPhotos)
    } else {
      setInternalPhotos(newPhotos)
    }
    
    // Call onPhotosChange if provided
    if (onPhotosChange) {
      if (typeof newPhotos === 'function') {
        onPhotosChange(newPhotos(photos))
      } else {
        onPhotosChange(newPhotos)
      }
    }
  }
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = getSupabaseBrowserClient()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    const newUrls: string[] = [...photos]

    try {
      for (let i = 0; i < files.length; i++) {
        if (newUrls.length >= maxPhotos) break
        
        const file = files[i]
        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`
        const filePath = `site_logs/${fileName}`

        const { data, error } = await supabase.storage
          .from('operating-photos')
          .upload(filePath, file)

        if (error) throw error

        const { data: { publicUrl } } = supabase.storage
          .from('operating-photos')
          .getPublicUrl(filePath)

        newUrls.push(publicUrl)
      }

      setPhotos(newUrls)
    } catch (error) {
      console.error('Error uploading photos:', error)
      alert('Failed to upload photos. Please try again.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const removePhoto = (index: number) => {
    const newUrls = photos.filter((_, i) => i !== index)
    setPhotos(newUrls)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
          <Camera className="w-4 h-4" />
          {label}
        </label>
        <span className="text-[10px] font-bold text-slate-400">
          {photos.length} / {maxPhotos} Photos
        </span>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
        {photos.map((url, idx) => (
          <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group border-2 border-slate-200">
            <img 
              src={url} 
              alt={`Site photo ${idx + 1}`} 
              className="w-full h-full object-cover" 
            />
            <button
              type="button"
              onClick={() => removePhoto(idx)}
              className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}

        {photos.length < maxPhotos && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className={cn(
              "aspect-square rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-2 hover:border-blue-500 transition-all group",
              uploading && "opacity-50 cursor-not-allowed"
            )}
          >
            {uploading ? (
              <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
            ) : (
              <>
                <div className="p-2 bg-slate-100 rounded-full group-hover:bg-blue-50 transition-colors">
                  <Plus className="w-5 h-5 text-slate-400 group-hover:text-blue-500" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 group-hover:text-blue-500">
                  Add Photo
                </span>
              </>
            )}
          </button>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        multiple
        className="hidden"
      />
    </div>
  )
}
