"use client"

import React from "react"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog"
import { Info, X } from "lucide-react"
import { chimboKeyLabels } from "@/lib/chimbo-translations"

interface SimpleDetailModalProps {
  isOpen: boolean
  onClose: () => void
  data: any
  title?: string
}

export function SimpleDetailModal({ isOpen, onClose, data, title = "Operation Details" }: SimpleDetailModalProps) {
  if (!data) return null

  // Helper to format keys
  const formatKey = (key: string) => {
    if (chimboKeyLabels[key]) {
      return chimboKeyLabels[key]
    }
    return key
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
              <Info className="w-5 h-5 text-white" />
            </div>
            {title}
          </DialogTitle>
        </DialogHeader>
        <div className="mt-6 space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
          {Object.entries(data).map(([key, value]) => {
            // Filter out internal/complex fields
            if (
              key === 'id' || 
              key === 'created_at' || 
              key === 'updated_at' || 
              key === 'operator_signature' ||
              key === 'supervisor_signature' ||
              key === 'manager_signature' ||
              typeof value === 'object'
            ) return null

            return (
              <div key={key} className="flex flex-col border-b border-slate-100 dark:border-white/5 pb-3 transition-all hover:bg-slate-50 dark:hover:bg-white/5 px-2 rounded-lg">
                <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{formatKey(key)}</span>
                <span className="text-slate-700 dark:text-slate-200 font-bold text-sm">
                  {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value || "N/A")}
                </span>
              </div>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}
