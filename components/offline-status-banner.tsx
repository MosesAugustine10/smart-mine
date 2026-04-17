"use client"

import { useEffect, useState } from "react"
import { useOffline } from "@/components/offline-provider"
import { Wifi, WifiOff, RefreshCw, CheckCircle2, AlertCircle, CloudOff, Cloud } from "lucide-react"

export function OfflineStatusBanner() {
  const { isOnline, pendingCount, syncStatus, lastSyncResult, triggerSync } =
    useOffline()
  const [visible, setVisible] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    if (!isOnline || pendingCount > 0) {
      setVisible(true)
      setShowSuccess(false)
    } else if (syncStatus === "success" && lastSyncResult && lastSyncResult.synced > 0) {
      setShowSuccess(true)
      setVisible(true)
      // Auto-dismiss success banner after 5 seconds
      const timer = setTimeout(() => {
        setVisible(false)
        setShowSuccess(false)
      }, 5000)
      return () => clearTimeout(timer)
    } else {
      setVisible(false)
    }
  }, [isOnline, pendingCount, syncStatus, lastSyncResult])

  if (!visible) return null

  // --- Offline State ---
  if (!isOnline) {
    return (
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 duration-300">
        <div className="flex items-center gap-4 bg-slate-950 text-white px-6 py-4 rounded-[2rem] shadow-2xl border border-white/10 backdrop-blur-xl w-max max-w-[90vw]">
          <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 shrink-0">
            <CloudOff className="w-5 h-5" />
          </div>
          <div>
            <p className="font-black text-sm uppercase tracking-widest text-amber-300">Offline Mode Active</p>
            <p className="text-[11px] text-white/50 font-medium mt-0.5">
              {pendingCount > 0
                ? `${pendingCount} record${pendingCount > 1 ? "s" : ""} queued for sync`
                : "Changes saved locally — will sync on reconnect"}
            </p>
          </div>
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0 ml-2" />
        </div>
      </div>
    )
  }

  // --- Syncing State ---
  if (syncStatus === "syncing") {
    return (
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 duration-300">
        <div className="flex items-center gap-4 bg-indigo-950 text-white px-6 py-4 rounded-[2rem] shadow-2xl border border-indigo-500/30 backdrop-blur-xl w-max max-w-[90vw]">
          <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 shrink-0">
            <RefreshCw className="w-5 h-5 animate-spin" />
          </div>
          <div>
            <p className="font-black text-sm uppercase tracking-widest text-indigo-300">Synchronizing</p>
            <p className="text-[11px] text-white/50 font-medium mt-0.5">
              Transmitting {pendingCount} queued record{pendingCount !== 1 ? "s" : ""} to Supabase...
            </p>
          </div>
        </div>
      </div>
    )
  }

  // --- Pending (online but queue not yet synced) ---
  if (pendingCount > 0 && isOnline) {
    return (
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 duration-300">
        <div className="flex items-center gap-4 bg-slate-950 text-white px-6 py-4 rounded-[2rem] shadow-2xl border border-white/10 backdrop-blur-xl w-max max-w-[90vw]">
          <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-400 shrink-0">
            <Cloud className="w-5 h-5" />
          </div>
          <div>
            <p className="font-black text-sm uppercase tracking-widest text-blue-300">
              {pendingCount} Record{pendingCount !== 1 ? "s" : ""} Pending Sync
            </p>
            <p className="text-[11px] text-white/50 font-medium mt-0.5">
              Connection restored — uploading queued data
            </p>
          </div>
          <button
            onClick={triggerSync}
            className="ml-2 flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-colors shrink-0"
          >
            <RefreshCw className="w-3 h-3" />
            Sync Now
          </button>
        </div>
      </div>
    )
  }

  // --- Success State ---
  if (showSuccess && lastSyncResult) {
    return (
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 duration-300">
        <div className="flex items-center gap-4 bg-emerald-950 text-white px-6 py-4 rounded-[2rem] shadow-2xl border border-emerald-500/30 backdrop-blur-xl w-max max-w-[90vw]">
          <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="font-black text-sm uppercase tracking-widest text-emerald-300">Sync Complete</p>
            <p className="text-[11px] text-white/50 font-medium mt-0.5">
              {lastSyncResult.synced} record{lastSyncResult.synced !== 1 ? "s" : ""} successfully uploaded to Supabase
              {lastSyncResult.failed > 0 && ` · ${lastSyncResult.failed} failed`}
            </p>
          </div>
          <Wifi className="w-5 h-5 text-emerald-400 shrink-0 ml-2" />
        </div>
      </div>
    )
  }

  return null
}
