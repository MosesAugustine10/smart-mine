"use client"

import { useState, useEffect, useCallback } from "react"
import { 
  Download, Shield, Clock, Database, RefreshCw, CheckCircle2, 
  AlertCircle, Calendar, HardDrive, Zap, Archive, FileJson, 
  FileSpreadsheet, Layers, Wifi, WifiOff, CloudOff
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { useOffline } from "@/components/offline-provider"
import { exportAsJSON, exportAsXLSX, buildBackupFilename, BACKUP_TABLES, type FullBackup } from "@/lib/backup/exporter"

interface BackupHistoryEntry {
  id: string
  timestamp: string
  type: "full_json" | "full_xlsx" | "module_json" | "scheduled"
  tables: string[]
  recordCount: number
  filename: string
}

const STORAGE_KEY = "smp_backup_history"
const SCHEDULE_KEY = "smp_backup_schedule"

type ScheduleInterval = "never" | "daily" | "weekly"

export default function BackupPage() {
  const { toast } = useToast()
  const { isOnline, pendingCount } = useOffline()
  const [loadingFull, setLoadingFull] = useState(false)
  const [loadingXLSX, setLoadingXLSX] = useState(false)
  const [loadingTable, setLoadingTable] = useState<string | null>(null)
  const [history, setHistory] = useState<BackupHistoryEntry[]>([])
  const [schedule, setSchedule] = useState<ScheduleInterval>("never")
  const [lastScheduled, setLastScheduled] = useState<string | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) setHistory(JSON.parse(saved))
    const sched = localStorage.getItem(SCHEDULE_KEY)
    if (sched) {
      const parsed = JSON.parse(sched)
      setSchedule(parsed.interval || "never")
      setLastScheduled(parsed.lastRun || null)
    }
  }, [])

  const addToHistory = useCallback((entry: Omit<BackupHistoryEntry, "id">) => {
    const newEntry: BackupHistoryEntry = { ...entry, id: Date.now().toString() }
    setHistory(prev => {
      const updated = [newEntry, ...prev].slice(0, 20)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      return updated
    })
  }, [])

  const fetchBackupData = async (table = "all"): Promise<FullBackup | null> => {
    const res = await fetch(`/api/backup?table=${table}`)
    if (!res.ok) throw new Error("Backup API error")
    return res.json()
  }

  const handleFullJSONBackup = async () => {
    setLoadingFull(true)
    try {
      const data = await fetchBackupData("all")
      if (!data) throw new Error("No data returned")
      const filename = buildBackupFilename("SmartMinePro_FullBackup")
      exportAsJSON(data, filename)
      addToHistory({ timestamp: new Date().toISOString(), type: "full_json", tables: data.tables.map(t => t.table), recordCount: data.totalRecords, filename: `${filename}.json` })
      toast({ title: "Backup Complete", description: `${data.totalRecords} records exported as JSON.` })
    } catch (err: any) {
      toast({ title: "Backup Failed", description: err.message, variant: "destructive" })
    } finally {
      setLoadingFull(false)
    }
  }

  const handleFullXLSXBackup = async () => {
    setLoadingXLSX(true)
    try {
      const data = await fetchBackupData("all")
      if (!data) throw new Error("No data returned")
      const filename = buildBackupFilename("SmartMinePro_FullBackup")
      exportAsXLSX(data, filename)
      addToHistory({ timestamp: new Date().toISOString(), type: "full_xlsx", tables: data.tables.map(t => t.table), recordCount: data.totalRecords, filename: `${filename}.xlsx` })
      toast({ title: "XLSX Backup Complete", description: `${data.totalRecords} records exported as spreadsheet.` })
    } catch (err: any) {
      toast({ title: "Backup Failed", description: err.message, variant: "destructive" })
    } finally {
      setLoadingXLSX(false)
    }
  }

  const handleModuleBackup = async (tableKey: string, label: string) => {
    setLoadingTable(tableKey)
    try {
      const data = await fetchBackupData(tableKey)
      if (!data) throw new Error("No data returned")
      const filename = buildBackupFilename(`SmartMinePro_${label.replace(/ /g, "_")}`)
      exportAsJSON(data, filename)
      addToHistory({ timestamp: new Date().toISOString(), type: "module_json", tables: [tableKey], recordCount: data.totalRecords, filename: `${filename}.json` })
      toast({ title: `${label} Backup Done`, description: `${data.totalRecords} records exported.` })
    } catch (err: any) {
      toast({ title: "Backup Failed", description: err.message, variant: "destructive" })
    } finally {
      setLoadingTable(null)
    }
  }

  const updateSchedule = (interval: ScheduleInterval) => {
    setSchedule(interval)
    const data = { interval, lastRun: lastScheduled }
    localStorage.setItem(SCHEDULE_KEY, JSON.stringify(data))
    toast({ 
      title: interval === "never" ? "Auto-Backup Disabled" : `Auto-Backup Set to ${interval}`, 
      description: interval !== "never" ? "The app will auto-backup when open at the scheduled time." : undefined
    })
  }

  // Check if scheduled backup is due
  useEffect(() => {
    if (schedule === "never" || !isOnline) return
    const now = new Date()
    const last = lastScheduled ? new Date(lastScheduled) : null
    const hoursSinceLast = last ? (now.getTime() - last.getTime()) / (1000 * 60 * 60) : Infinity
    const threshold = schedule === "daily" ? 24 : 168 // 24h or 168h (7 days)
    
    if (hoursSinceLast >= threshold) {
      const run = async () => {
        try {
          const data = await fetchBackupData("all")
          if (!data) return
          const filename = buildBackupFilename("SmartMinePro_AutoBackup")
          exportAsJSON(data, filename)
          const now = new Date().toISOString()
          setLastScheduled(now)
          localStorage.setItem(SCHEDULE_KEY, JSON.stringify({ interval: schedule, lastRun: now }))
          addToHistory({ timestamp: now, type: "scheduled", tables: data.tables.map(t => t.table), recordCount: data.totalRecords, filename: `${filename}.json` })
          toast({ title: "Auto-Backup Completed", description: `Scheduled backup: ${data.totalRecords} records saved.` })
        } catch { /* Silent fail for auto-backup */ }
      }
      run()
    }
  }, [schedule, isOnline])

  const moduleColors: Record<string, string> = {
    orange: "text-orange-600 bg-orange-500/10 border-orange-200",
    blue: "text-blue-600 bg-blue-500/10 border-blue-200",
    emerald: "text-emerald-600 bg-emerald-500/10 border-emerald-200",
    red: "text-red-600 bg-red-500/10 border-red-200",
    purple: "text-purple-600 bg-purple-500/10 border-purple-200",
    violet: "text-violet-600 bg-violet-500/10 border-violet-200",
    yellow: "text-yellow-600 bg-yellow-500/10 border-yellow-200",
    amber: "text-amber-600 bg-amber-500/10 border-amber-200",
    slate: "text-slate-600 bg-slate-500/10 border-slate-200",
    teal: "text-teal-600 bg-teal-500/10 border-teal-200",
    cyan: "text-cyan-600 bg-cyan-500/10 border-cyan-200",
  }

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20">
      
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-slate-950 flex items-center justify-center">
              <Archive className="w-5 h-5 text-white" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Enterprise Data Protection</span>
          </div>
          <h1 className="text-4xl font-black uppercase tracking-tighter">Backup & Recovery</h1>
          <p className="text-slate-500 font-medium mt-1">Forensic data protection for all operational records</p>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 text-sm font-black uppercase tracking-widest ${isOnline ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
          {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
          {isOnline ? "Online" : "Offline"}
        </div>
      </div>

      {/* Offline Queue Status */}
      {pendingCount > 0 && (
        <div className="flex items-center gap-4 p-6 bg-amber-50 border-2 border-amber-200 rounded-[2rem]">
          <CloudOff className="w-8 h-8 text-amber-600 shrink-0" />
          <div>
            <p className="font-black text-amber-800 uppercase tracking-wider text-sm">{pendingCount} Record{pendingCount > 1 ? "s" : ""} Pending Sync</p>
            <p className="text-amber-600 text-xs font-medium mt-0.5">These records are saved locally. Export online for complete backup.</p>
          </div>
        </div>
      )}

      {/* Full Backup Section */}
      <div className="bg-slate-950 text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-blue-600/10 rounded-full blur-[80px]" />
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
              <Database className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-widest">Full System Backup</h2>
              <p className="text-white/40 text-xs font-medium uppercase tracking-wider">All {BACKUP_TABLES.length} operational modules</p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* JSON Export */}
            <button
              onClick={handleFullJSONBackup}
              disabled={loadingFull || !isOnline}
              className="group flex items-center gap-5 p-8 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-[2rem] transition-all disabled:opacity-40 disabled:cursor-not-allowed text-left"
            >
              <div className="w-14 h-14 rounded-2xl bg-blue-500/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                {loadingFull ? <RefreshCw className="w-7 h-7 text-blue-400 animate-spin" /> : <FileJson className="w-7 h-7 text-blue-400" />}
              </div>
              <div>
                <p className="font-black text-lg uppercase tracking-tight">JSON Export</p>
                <p className="text-white/40 text-xs mt-1">Machine-readable • All modules • Structured</p>
              </div>
            </button>

            {/* XLSX Export */}
            <button
              onClick={handleFullXLSXBackup}
              disabled={loadingXLSX || !isOnline}
              className="group flex items-center gap-5 p-8 bg-white/5 hover:bg-emerald-500/10 border border-white/10 hover:border-emerald-500/30 rounded-[2rem] transition-all disabled:opacity-40 disabled:cursor-not-allowed text-left"
            >
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                {loadingXLSX ? <RefreshCw className="w-7 h-7 text-emerald-400 animate-spin" /> : <FileSpreadsheet className="w-7 h-7 text-emerald-400" />}
              </div>
              <div>
                <p className="font-black text-lg uppercase tracking-tight">Excel Export</p>
                <p className="text-white/40 text-xs mt-1">Human-readable • Multi-sheet workbook • Reports</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Per-Module Backup */}
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Layers className="w-5 h-5 text-slate-400" />
          <h2 className="text-sm font-black uppercase tracking-[0.4em] text-slate-600">Module-Specific Export</h2>
          <div className="h-px flex-1 bg-slate-100" />
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {BACKUP_TABLES.map(({ key, label, color }) => (
            <button
              key={key}
              onClick={() => handleModuleBackup(key, label)}
              disabled={loadingTable === key || !isOnline}
              className={`group flex items-center justify-between p-6 bg-white border-2 rounded-[2rem] hover:shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed ${moduleColors[color]}`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 ${moduleColors[color]}`}>
                  <HardDrive className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="font-black text-sm uppercase tracking-tight text-slate-800">{label}</p>
                  <p className="text-[10px] text-slate-400 font-medium">{key}</p>
                </div>
              </div>
              {loadingTable === key 
                ? <RefreshCw className="w-4 h-4 animate-spin shrink-0 text-slate-400" />
                : <Download className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-slate-800 transition-colors" />
              }
            </button>
          ))}
        </div>
      </div>

      {/* Scheduled Auto-Backup */}
      <div className="bg-white border-2 border-slate-100 p-10 rounded-[3rem] shadow-sm">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border-2 border-indigo-200 flex items-center justify-center">
            <Calendar className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-xl font-black uppercase tracking-widest text-slate-900">Scheduled Auto-Backup</h2>
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mt-0.5">
              {lastScheduled ? `Last run: ${new Date(lastScheduled).toLocaleString()}` : "Never run"}
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {(["never", "daily", "weekly"] as ScheduleInterval[]).map((opt) => (
            <button
              key={opt}
              onClick={() => updateSchedule(opt)}
              className={`p-6 rounded-[1.5rem] border-2 text-left transition-all ${
                schedule === opt
                  ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                  : "bg-slate-50 border-slate-200 text-slate-600 hover:border-indigo-300"
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                {opt === "never" && <Zap className="w-5 h-5" />}
                {opt === "daily" && <Clock className="w-5 h-5" />}
                {opt === "weekly" && <Calendar className="w-5 h-5" />}
                <p className="font-black text-sm uppercase tracking-wider">
                  {opt === "never" ? "Disabled" : opt === "daily" ? "Daily" : "Weekly"}
                </p>
              </div>
              <p className={`text-xs font-medium ${schedule === opt ? "text-white/70" : "text-slate-400"}`}>
                {opt === "never" && "Manual export only"}
                {opt === "daily" && "Every 24 hours when app is open"}
                {opt === "weekly" && "Every 7 days when app is open"}
              </p>
              {schedule === opt && (
                <div className="mt-3 flex items-center gap-1 text-white/80 text-[10px] font-black uppercase">
                  <CheckCircle2 className="w-3 h-3" /> Active
                </div>
              )}
            </button>
          ))}
        </div>

        <div className="mt-6 p-4 bg-slate-50 rounded-2xl border border-slate-200">
          <p className="text-[11px] text-slate-500 font-medium">
            ⚡ <strong>Pro Tip:</strong> Browser-based scheduling requires the app to be open. For server-side cron backups that run automatically, deploy the Supabase Edge Function from{" "}
            <code className="bg-slate-200 px-1.5 py-0.5 rounded text-slate-700 font-mono">supabase/functions/scheduled-backup/</code>
          </p>
        </div>
      </div>

      {/* Backup History */}
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Shield className="w-5 h-5 text-slate-400" />
          <h2 className="text-sm font-black uppercase tracking-[0.4em] text-slate-600">Backup History</h2>
          <div className="h-px flex-1 bg-slate-100" />
          {history.length > 0 && (
            <button onClick={() => { setHistory([]); localStorage.removeItem(STORAGE_KEY) }} className="text-[10px] font-black uppercase text-slate-400 hover:text-red-500 transition-colors tracking-widest">
              Clear History
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <div className="text-center py-16 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
            <Archive className="w-10 h-10 text-slate-300 mx-auto mb-4" />
            <p className="font-black text-slate-400 uppercase tracking-widest text-sm">No backup history yet</p>
            <p className="text-slate-400 text-xs mt-2">Run a backup above to start your audit trail</p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((entry) => (
              <div key={entry.id} className="flex items-center gap-5 p-5 bg-white border-2 border-slate-100 rounded-[1.5rem] hover:border-slate-200 transition-colors">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  entry.type === "full_json" ? "bg-blue-50 text-blue-600" :
                  entry.type === "full_xlsx" ? "bg-emerald-50 text-emerald-600" :
                  entry.type === "scheduled" ? "bg-indigo-50 text-indigo-600" :
                  "bg-slate-50 text-slate-600"
                }`}>
                  {entry.type === "full_xlsx" ? <FileSpreadsheet className="w-5 h-5" /> : <FileJson className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-sm text-slate-800 truncate">{entry.filename}</p>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                    {entry.recordCount.toLocaleString()} records · {entry.tables.length} tables · {entry.type.replace("_", " ").toUpperCase()}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {new Date(entry.timestamp).toLocaleDateString()}
                  </p>
                  <p className="text-[10px] text-slate-300 mt-0.5">
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </p>
                </div>
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
