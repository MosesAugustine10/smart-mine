"use client"

import { useState } from "react"
import { Calendar, Check } from "lucide-react"
import { cn } from "@/lib/utils"

export type ReportPeriod = "all" | "daily" | "weekly" | "monthly" | "yearly"

interface SystemPeriodFilterProps {
  onPeriodChange: (period: ReportPeriod) => void
  currentPeriod: ReportPeriod
}

export function SystemPeriodFilter({ onPeriodChange, currentPeriod }: SystemPeriodFilterProps) {
  const options: { id: ReportPeriod, label_en: string, label_sw: string }[] = [
    { id: "all", label_en: "All Time", label_sw: "Zote" },
    { id: "daily", label_en: "Daily", label_sw: "Leo" },
    { id: "weekly", label_en: "Weekly", label_sw: "Wiki" },
    { id: "monthly", label_en: "Monthly", label_sw: "Mwezi" },
    { id: "yearly", label_en: "Yearly", label_sw: "Mwaka" },
  ]

  const vibe = () => { if (typeof navigator !== 'undefined') navigator.vibrate?.(40) }

  return (
    <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-1.5 rounded-[1.5rem] border-2 border-slate-100 dark:border-slate-800 shadow-sm overflow-x-auto no-scrollbar max-w-full">
      <div className="flex items-center gap-1.5 px-3 border-r-2 border-slate-100 dark:border-slate-800 shrink-0">
         <Calendar className="w-4 h-4 text-slate-400" />
         <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest leading-none">Filters</p>
      </div>
      <div className="flex items-center gap-1">
        {options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => { vibe(); onPeriodChange(opt.id) }}
            className={cn(
              "h-10 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all relative shrink-0",
              currentPeriod === opt.id 
                ? "bg-slate-900 text-white shadow-lg shadow-slate-900/10" 
                : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
            )}
          >
            <span className="relative z-10 flex items-center gap-2">
                {currentPeriod === opt.id && <Check className="w-3 h-3" />}
                {opt.label_en}
            </span>
            {currentPeriod === opt.id && (
                <div className="absolute inset-0 bg-slate-900 rounded-xl animate-in fade-in zoom-in duration-200" />
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
