"use client"

import { useMemo, useState, useEffect } from "react"
import { Bell, Menu, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/components/language-context"
import { LanguageSwitcher } from "@/components/language-switcher"
import { useNotifications } from "@/components/notification-provider"

interface TopbarProps {
  onMenuToggle?: () => void
}

export function Topbar({ onMenuToggle }: TopbarProps) {
  const [mounted, setMounted] = useState(false)
  const { t } = useTranslation()
  const { unreadCount, clearCount } = useNotifications()
  
  useEffect(() => {
    setMounted(true)
  }, [])

  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good morning"
    if (hour < 18) return "Good afternoon"
    return "Good evening"
  }, [])

  if (!mounted) return <header className="flex h-14 items-center gap-4 border-b bg-background px-4" />

  return (
    <header className="flex flex-col border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
      {/* Global Module Marquee */}
      <div className="h-6 bg-slate-900 dark:bg-black overflow-hidden flex items-center">
        <style jsx>{`
          @keyframes marquee-top {
            0% { transform: translateX(100%); }
            100% { transform: translateX(-100%); }
          }
          .animate-marquee-top {
            display: inline-block;
            white-space: nowrap;
            animation: marquee-top 30s linear infinite;
          }
        `}</style>
        <div className="animate-marquee-top">
          <p className="text-[9px] font-bold text-amber-500 uppercase tracking-[0.3em] px-4">
            SMART MINE • LIVE OPERATIONS MONITORING • REAL-TIME DATA SYNC ACTIVE • SYSTEM HEALTH: OPTIMAL • {greeting.toUpperCase()}, COMMAND CENTER • 
          </p>
        </div>
      </div>

      <div className="flex h-14 items-center gap-4 px-4 justify-between">
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="icon" 
            className="h-7 w-7 shrink-0 md:hidden border-slate-200"
            onClick={onMenuToggle}
          >
            <Menu className="h-3.5 w-3.5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <p className="hidden xs:block text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Command Node: {greeting}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-end gap-2">
        <div className="relative hidden md:flex max-w-xs flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="search"
            placeholder={t("search") || "Search…"}
            className="h-8 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-8 pr-3 text-xs text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-400 transition"
          />
        </div>

        <LanguageSwitcher />

        <Button
          variant="ghost"
          size="icon"
          className="relative h-8 w-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
          onClick={clearCount}
        >
          <Bell className="h-4 w-4 text-slate-500" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-red-500 text-white flex items-center justify-center text-[9px] font-bold">
              {unreadCount}
            </span>
          )}
          <span className="sr-only">Notifications</span>
        </Button>

        <div className="h-7 w-7 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
          <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">A</span>
        </div>
      </div>
    </header>
  )
}
