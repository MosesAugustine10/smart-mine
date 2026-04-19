"use client"

import { usePathname } from "next/navigation"
import { Sidebar } from "@/components/layout/sidebar"
import { Topbar } from "@/components/layout/topbar"
import React, { useState } from "react"
import { cn } from "@/lib/utils"
import { X, Loader2, Mountain } from "lucide-react"
import { useAuth } from "@/components/auth-provider"

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { loading } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Define routes that should strictly hide the backend structural layout
  const isPublicRoute = pathname === "/" || pathname?.startsWith("/auth") || pathname?.startsWith("/landing") || pathname?.startsWith("/chimbo") || pathname?.startsWith("/gate")

  if (isPublicRoute) {
    return (
      <main className="flex-1 w-full h-full min-h-screen relative overflow-x-hidden">
        {children}
      </main>
    )
  }

  // Show premium loading screen while auth resolves (prevents white space)
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 dark:bg-slate-950 flex-col gap-5">
        <div className="relative">
          <div className="w-20 h-20 rounded-[2rem] bg-amber-500 flex items-center justify-center shadow-2xl shadow-amber-500/30 animate-pulse">
            <Mountain className="w-10 h-10 text-white" />
          </div>
          <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center">
            <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
          </div>
        </div>
        <div className="text-center space-y-1">
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400">Smart Mine</p>
          <p className="text-[9px] font-bold uppercase tracking-widest text-slate-300">Authenticating Session...</p>
        </div>
      </div>
    )
  }

  // Dashboard Operator Responsive Grid Structure
  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 dark:bg-[#050505] font-sans">
      {/* Mobile Sidebar Overlay */}
      <div 
        className={cn(
          "fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] transition-opacity md:hidden",
          isMobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      {/* Mobile Drawer */}
      <div 
        className={cn(
          "fixed inset-y-0 left-0 w-64 bg-white dark:bg-slate-900 z-[101] shadow-2xl transition-transform md:hidden",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="absolute right-4 top-4">
          <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="h-full overflow-y-auto">
          <Sidebar />
        </div>
      </div>

      {/* Desktop Sidebar - Fixed column */}
      <div className="hidden md:flex shadow-xl z-20 shrink-0 h-full border-r border-slate-100 dark:border-slate-800">
        <Sidebar />
      </div>

      {/* Main Content Column */}
      <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden relative">
        <Topbar onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
        
        {/* Scrollable Content Area */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto w-full custom-scrollbar bg-slate-50/50 dark:bg-transparent">
          <div className="h-full w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
