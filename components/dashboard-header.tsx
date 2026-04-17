"use client"
import React from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { ModuleHelpNotebook } from "@/components/module-help-notebook"

export function DashboardHeader({ title, description }: { title: string, description: string }) {
  const router = useRouter()
  return (
    <div className="flex flex-col w-full border-b bg-white dark:bg-slate-900 shrink-0 shadow-sm border-slate-100 dark:border-slate-800">
      {/* Module Specific Marquee */}
      <div className="h-5 bg-slate-50 dark:bg-slate-950 overflow-hidden flex items-center border-b border-slate-100 dark:border-slate-800">
        <style jsx>{`
          @keyframes marquee-header {
            0% { transform: translateX(100%); }
            100% { transform: translateX(-100%); }
          }
          .animate-marquee-header {
            display: inline-block;
            white-space: nowrap;
            animation: marquee-header 20s linear infinite;
          }
        `}</style>
        <div className="animate-marquee-header">
          <p className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] px-4">
            {title.toUpperCase()} • {description.toUpperCase()} • OPERATIONAL COMMAND NODE • REAL-TIME SYNC • {title.toUpperCase()} • 
          </p>
        </div>
      </div>

      <div className="px-5 py-3 flex items-center gap-3">
        <button 
          onClick={() => router.back()} 
          className="h-7 w-7 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-lg transition-colors flex items-center justify-center border border-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700"
          title="Back"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
        </button>
        <div className="flex-1">
          <h1 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight leading-none">{title}</h1>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{description}</p>
        </div>
        <ModuleHelpNotebook moduleTitle={title} />
      </div>
    </div>
  )
}
