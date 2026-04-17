"use client"

import { useState, useEffect, useCallback } from "react"
import { Bell, X, ShieldAlert, TrendingUp, Pickaxe, Fuel, Mic, AlertTriangle, CheckCircle2, Zap, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

export interface ChimboNotification {
  id: string
  type: "safety" | "production" | "sales" | "fuel" | "voice" | "system" | "alert"
  title: string
  body: string
  time: string
  read: boolean
  urgent?: boolean
}

const STORAGE_KEY = "chimbo_notifications"

const ICON_MAP = {
  safety: ShieldAlert,
  production: Pickaxe,
  sales: TrendingUp,
  fuel: Fuel,
  voice: Mic,
  alert: AlertTriangle,
  system: Zap,
}

const COLOR_MAP = {
  safety: "text-rose-500 bg-rose-500/10",
  production: "text-orange-500 bg-orange-500/10",
  sales: "text-emerald-500 bg-emerald-500/10",
  fuel: "text-blue-500 bg-blue-500/10",
  voice: "text-violet-500 bg-violet-500/10",
  alert: "text-yellow-500 bg-yellow-500/10",
  system: "text-slate-500 bg-slate-500/10",
}

function getStoredNotifications(): ChimboNotification[] {
  if (typeof window === "undefined") return []
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")
  } catch { return [] }
}

function saveNotifications(notifs: ChimboNotification[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notifs))
}

/** Call this from any module to push a notification */
export function pushChimboNotification(notif: Omit<ChimboNotification, "id" | "read" | "time">) {
  const existing = getStoredNotifications()
  const newNotif: ChimboNotification = {
    ...notif,
    id: "notif_" + Date.now() + "_" + Math.random().toString(36).slice(2),
    read: false,
    time: new Date().toISOString(),
  }
  saveNotifications([newNotif, ...existing].slice(0, 50)) // keep max 50
  if (typeof navigator !== "undefined") navigator.vibrate?.([100, 50, 100])
  window.dispatchEvent(new CustomEvent("chimbo_notification", { detail: newNotif }))
}

export function ChimboNotificationBell() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<ChimboNotification[]>([])

  const reload = useCallback(() => {
    setNotifications(getStoredNotifications())
  }, [])

  useEffect(() => {
    reload()
    // Listen for new notifications from other modules
    const handler = () => reload()
    window.addEventListener("chimbo_notification", handler)
    // Refresh every 30s to pick up changes
    const interval = setInterval(reload, 30_000)
    return () => {
      window.removeEventListener("chimbo_notification", handler)
      clearInterval(interval)
    }
  }, [reload])



  const unreadCount = notifications.filter((n) => !n.read).length
  const urgentCount = notifications.filter((n) => !n.read && n.urgent).length

  const markAllRead = () => {
    const updated = notifications.map((n) => ({ ...n, read: true }))
    setNotifications(updated)
    saveNotifications(updated)
  }

  const markRead = (id: string) => {
    const updated = notifications.map((n) => n.id === id ? { ...n, read: true } : n)
    setNotifications(updated)
    saveNotifications(updated)
  }

  const deleteNotif = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const updated = notifications.filter((n) => n.id !== id)
    setNotifications(updated)
    saveNotifications(updated)
  }

  const timeAgo = (iso: string) => {
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
    if (diff < 60) return "Sasa hivi"
    if (diff < 3600) return `Dakika ${Math.floor(diff / 60)} iliyopita`
    if (diff < 86400) return `Masaa ${Math.floor(diff / 3600)} iliyopita`
    return `Siku ${Math.floor(diff / 86400)} iliyopita`
  }

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={() => { setOpen(!open); if (!open && unreadCount > 0) {} }}
        className={cn(
          "relative h-12 w-12 rounded-[1.5rem] flex items-center justify-center transition-all active:scale-95",
          urgentCount > 0
            ? "bg-rose-500 text-white shadow-xl shadow-rose-500/40 animate-pulse"
            : unreadCount > 0
              ? "bg-amber-500 text-slate-950 shadow-xl shadow-amber-500/30"
              : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 shadow-sm"
        )}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-slate-950 text-white text-[9px] font-black rounded-full flex items-center justify-center leading-none">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-slate-950/30 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Panel */}
          <div className="absolute right-0 top-14 z-50 w-[340px] max-h-[80vh] bg-white dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-[2rem] shadow-2xl shadow-slate-950/20 overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-950">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Arifa za Mgodi</p>
                <h3 className="text-base font-black text-slate-900 dark:text-white uppercase italic tracking-tight">
                  Ujumbe Wako
                  {unreadCount > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-amber-500 text-slate-950 text-[9px] font-black rounded-full">
                      {unreadCount} Mpya
                    </span>
                  )}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="h-7 px-2 rounded-lg text-[8px] font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-emerald-500 transition-colors"
                  >
                    Soma Zote
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="h-8 w-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Notification List */}
            <div className="overflow-y-auto flex-1 divide-y divide-slate-50 dark:divide-slate-900">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500/50" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hakuna Arifa</p>
                </div>
              ) : (
                notifications.map((notif) => {
                  const Icon = ICON_MAP[notif.type] || Bell
                  const colors = COLOR_MAP[notif.type] || "text-slate-500 bg-slate-500/10"
                  return (
                    <div
                      key={notif.id}
                      onClick={() => markRead(notif.id)}
                      className={cn(
                        "flex gap-3 p-4 cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-900/50 relative",
                        !notif.read && "bg-amber-50/50 dark:bg-amber-500/5"
                      )}
                    >
                      {/* Unread indicator */}
                      {!notif.read && (
                        <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-amber-500" />
                      )}

                      {/* Icon */}
                      <div className={cn("w-10 h-10 rounded-[1rem] flex-shrink-0 flex items-center justify-center", colors)}>
                        <Icon className="w-5 h-5" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 pr-4">
                        <p className={cn(
                          "text-[11px] font-black uppercase tracking-tight leading-tight",
                          notif.urgent ? "text-rose-600 dark:text-rose-400" : "text-slate-900 dark:text-white"
                        )}>
                          {notif.title}
                        </p>
                        <p className="text-[10px] font-medium text-slate-500 mt-0.5 leading-snug line-clamp-2">{notif.body}</p>
                        <p className="text-[8px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest mt-1.5">{timeAgo(notif.time)}</p>
                      </div>

                      {/* Delete */}
                      <button
                        onClick={(e) => deleteNotif(notif.id, e)}
                        className="absolute bottom-3 right-3 w-6 h-6 rounded-lg flex items-center justify-center text-slate-200 dark:text-slate-700 hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )
                })
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                <button
                  onClick={() => {
                    const updated: ChimboNotification[] = []
                    setNotifications(updated)
                    saveNotifications(updated)
                  }}
                  className="w-full text-[9px] font-black text-rose-400 uppercase tracking-widest hover:text-rose-500 transition-colors"
                >
                  Futa Arifa Zote
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
