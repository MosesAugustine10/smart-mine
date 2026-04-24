"use client"

import { useState, useEffect, useMemo } from "react"
import { format, isWithinInterval, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns"
import { DashboardHeader } from "@/components/dashboard-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Plus, Bomb, DollarSign, TrendingUp, Activity, Gauge, Volume2,
  FileText, AlertTriangle, Loader2, History, Search, Landmark
} from "lucide-react"
import Link from "next/link"
import { BlastingTable } from "@/components/blasting/blasting-table"
import { ProfessionalReportButton } from "@/components/ui/professional-report-button"
import { ProfessionalReportDropdown } from "@/components/ui/professional-report-dropdown"
import { BlastingBudgetVsActual } from "@/components/blasting/budget-vs-actual-chart"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { ModuleHelpNotebook } from "@/components/module-help-notebook"
import { SystemPeriodFilter, type ReportPeriod } from "@/components/ui/system-period-filter"
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine
} from 'recharts'
import { Badge } from "@/components/ui/badge"

export default function BlastingPage() {
  const [blastingOps, setBlastingOps] = useState<any[]>([])
  const [filteredOps, setFilteredOps] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<ReportPeriod>("all")
  const [search, setSearch] = useState("")

  useEffect(() => {
    async function fetchBlasting() {
        const supabase = getSupabaseBrowserClient()
        const { data } = await supabase
            .from("blasting_operations")
            .select("*")
            .order("date", { ascending: false })
            .order("time", { ascending: false })
        
        setBlastingOps(data || [])
        setFilteredOps(data || [])
        setLoading(false)
    }
    fetchBlasting()
  }, [])

  useEffect(() => {
    if (!blastingOps.length) return
    
    let filtered = blastingOps
    if (period !== "all") {
        const now = new Date()
        let interval: { start: Date; end: Date }
        if (period === "daily") interval = { start: startOfDay(now), end: endOfDay(now) }
        else if (period === "weekly") interval = { start: startOfWeek(now), end: endOfWeek(now) }
        else if (period === "monthly") interval = { start: startOfMonth(now), end: endOfMonth(now) }
        else interval = { start: startOfYear(now), end: endOfYear(now) }

        filtered = blastingOps.filter(op => {
            try {
                return isWithinInterval(new Date(op.date), interval)
            } catch { return true }
        })
    }

    if (search) {
        filtered = filtered.filter(op => 
            op.blast_number?.toLowerCase().includes(search.toLowerCase()) ||
            op.blaster_name?.toLowerCase().includes(search.toLowerCase()) ||
            op.location?.toLowerCase().includes(search.toLowerCase())
        )
    }

    setFilteredOps(filtered)
  }, [period, blastingOps, search])

  // Summary statistics
  const totalOps = filteredOps.length
  const totalExplosiveWeight = filteredOps.reduce((s, op) => s + (Number(op.total_explosive_weight_kg) || 0), 0)
  const totalCost = filteredOps.reduce((s, op) => s + (Number(op.total_cost) || 0), 0)
  const totalTonnage = filteredOps.reduce((s, op) => s + (Number(op.tonnage_t) || 0), 0)
  const avgVibration = totalOps > 0 ? filteredOps.reduce((s, op) => s + (Number(op.vibration_mm_s) || 0), 0) / totalOps : 0
  const avgAirblast = totalOps > 0 ? filteredOps.reduce((s, op) => s + (Number(op.airblast_db) || 0), 0) / totalOps : 0

  const highVibrationCount = filteredOps.filter(op => (op.vibration_mm_s || 0) > 5).length
  const highAirblastCount = filteredOps.filter(op => (op.airblast_db || 0) > 120).length

  const chartData = useMemo(() => {
    return [...filteredOps].reverse().slice(-10).map(op => ({
        label: op.blast_number || format(new Date(op.date), "dd MMM"),
        value: Number(op.powder_factor_kg_per_t) || 0,
        tonnage: Number(op.tonnage_t) || 0
    }))
  }, [filteredOps])

  const chartConfigs = [
    {
      type: "bar" as const,
      title: "Explosive Efficiency (Powder Factor)",
      data: chartData.map(d => ({ label: d.label, value: d.value })),
      color: "#ea580c"
    },
    {
      type: "bar" as const,
      title: "Blasted Tonnage Yield",
      data: chartData.map(d => ({ label: d.label, value: d.tonnage })),
      color: "#3b82f6"
    }
  ]

  if (loading) return (
    <div className="h-screen w-full flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-orange-600" />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Synchronizing Blast Dynamics...</p>
    </div>
  )

  return (
    <div className="flex-1 overflow-auto bg-[#fafafa] dark:bg-slate-950 pb-20 p-8 space-y-10">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white dark:bg-slate-900 md:p-6 p-4 rounded-[2.5rem] border shadow-sm relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
           <Bomb className="w-32 h-32 text-orange-500" />
        </div>
        
        <div className="flex items-center gap-5 relative z-10">
          <div className="w-14 h-14 rounded-3xl bg-orange-600 flex items-center justify-center text-white shadow-xl shadow-orange-500/20">
            <Bomb className="w-7 h-7" />
          </div>
          <div>
             <h2 className="text-2xl font-black tracking-tighter uppercase italic text-slate-900 dark:text-white">Blasting Command</h2>
             <div className="flex items-center gap-3 mt-1">
                <Badge className="bg-orange-500/10 text-orange-600 border-0 font-black text-[9px] uppercase tracking-widest">{totalOps} Active</Badge>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">• Operations Governance</span>
             </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto relative z-10">
            <SystemPeriodFilter currentPeriod={period} onPeriodChange={setPeriod} />
            <ProfessionalReportDropdown 
                configs={{
                    budget: {
                        data: filteredOps,
                        filename: "BLASTING_BUDGET_REPORT",
                        moduleColor: "orange",
                        activePeriod: period,
                        kpis: [
                            { label: "PLANNED BUDGET", value: "TZS " + (totalTonnage * 2500).toLocaleString() }, // Simulated budget
                            { label: "ACTUAL SPEND", value: "TZS " + totalCost.toLocaleString() },
                            { label: "VARIANCE", value: (((totalCost - (totalTonnage * 2500)) / (totalTonnage * 2500 || 1)) * 100).toFixed(1) + "%" }
                        ]
                    },
                    execution: {
                        data: filteredOps,
                        filename: "BLASTING_EXECUTION_LOG",
                        moduleColor: "orange",
                        activePeriod: period,
                        charts: chartConfigs,
                        kpis: [
                            { label: "TOTAL YIELD", value: totalTonnage.toLocaleString() + " t" },
                            { label: "AVG VIBRATION", value: avgVibration.toFixed(2) + " mm/s" },
                            { label: "EFFICIENCY", value: (totalExplosiveWeight / (totalTonnage || 1)).toFixed(3) + " kg/t" }
                        ]
                    },
                    client: {
                        data: filteredOps,
                        filename: "BLASTING_CLIENT_SUMMARY",
                        moduleColor: "slate",
                        activePeriod: period,
                        kpis: [
                            { label: "PROJECT STATUS", value: "ON TRACK" },
                            { label: "SAFETY RATING", value: highVibrationCount > 0 ? "REVIEW" : "100%" },
                            { label: "VOLUME MOVED", value: totalTonnage.toLocaleString() + " t" }
                        ]
                    }
                }}
            />
            <ModuleHelpNotebook moduleTitle="Blasting" />
            <Link href="/blasting/new">
              <Button className="h-14 px-8 rounded-2xl bg-slate-900 hover:bg-black text-white font-black uppercase text-[10px] tracking-[0.2em] shadow-2xl transition-all active:scale-95">
                  <Plus className="w-4 h-4 mr-2" /> New Blast
              </Button>
            </Link>
        </div>
      </div>

      {/* ── Alerts ── */}
      {(highVibrationCount > 0 || highAirblastCount > 0) && (
        <div className="bg-red-50 dark:bg-red-950/30 border-2 border-red-100 dark:border-red-900 rounded-[2rem] p-6 flex items-center gap-6 animate-pulse">
            <div className="w-14 h-14 bg-red-600 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-red-500/20">
                <AlertTriangle className="w-8 h-8" />
            </div>
            <div>
                <h4 className="text-red-900 dark:text-red-400 font-black uppercase tracking-tighter text-xl leading-none mb-1">Safety Threshold Breach</h4>
                <p className="text-xs font-bold text-red-600 dark:text-red-500 uppercase tracking-widest">
                    {highVibrationCount} instances of Critical Vibration (&gt;5mm/s) • {highAirblastCount} Airblast violations (&gt;120dB)
                </p>
            </div>
        </div>
      )}

      {/* ── KPI Grid ── */}
      {/* ── KPI Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
           <Card className="border-0 shadow-xl bg-slate-900 text-white rounded-[2.5rem] overflow-hidden relative group hover:scale-[1.02] transition-all">
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                <Bomb className="w-16 h-16" />
              </div>
              <CardHeader className="pb-1">
                <CardTitle className="text-[10px] font-black tracking-[0.2em] uppercase text-orange-400">Total Yield</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                   <h3 className="text-5xl font-black tracking-tighter text-white font-mono">{totalTonnage.toLocaleString()}</h3>
                   <span className="text-xl text-orange-500">t</span>
                </div>
                <div className="h-1.5 w-full bg-white/10 rounded-full mt-4 overflow-hidden">
                   <div className="h-full bg-orange-500" style={{ width: `100%` }} />
                </div>
              </CardContent>
           </Card>

           <Card className="border-0 shadow-xl bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden relative group hover:scale-[1.02] transition-all">
              <CardHeader className="pb-1">
                <CardTitle className="text-[10px] font-black tracking-[0.2em] uppercase text-slate-400">Heavy Load</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                   <h3 className="text-5xl font-black tracking-tighter text-slate-900 dark:text-white font-mono">{totalExplosiveWeight.toLocaleString()}</h3>
                   <span className="text-xs font-black text-slate-400 uppercase tracking-widest">kg</span>
                </div>
                <p className="text-[9px] font-bold text-orange-500 uppercase mt-2">Total Explosives Used</p>
              </CardContent>
           </Card>

           <Card className="border-0 shadow-xl bg-purple-600 text-white rounded-[2.5rem] overflow-hidden relative group hover:scale-[1.02] transition-all">
              <div className="absolute top-0 right-0 p-6 opacity-10">
                <Gauge className="w-16 h-16" />
              </div>
              <CardHeader className="pb-1">
                <CardTitle className="text-[10px] font-black tracking-[0.2em] uppercase text-purple-200">Seismic Trace</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                   <h3 className="text-5xl font-black tracking-tighter text-white font-mono">{avgVibration.toFixed(2)}</h3>
                   <span className="text-xs font-black text-purple-200 uppercase tracking-widest">mm/s</span>
                </div>
                <p className="text-[9px] font-bold text-purple-100 uppercase mt-2">Avg Peak Vibration</p>
              </CardContent>
           </Card>
           
           <Card className="border-0 shadow-xl bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden relative group hover:scale-[1.02] transition-all">
              <CardHeader className="pb-1">
                <CardTitle className="text-[10px] font-black tracking-[0.2em] uppercase text-slate-400">Yield Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                   <div>
                      <h3 className="text-3xl font-black tracking-tighter">{(totalCost/1000000).toFixed(2)}M</h3>
                      <div className="text-[9px] font-bold uppercase tracking-widest opacity-60 mt-1">Shift Expediture TZS</div>
                   </div>
                </div>
              </CardContent>
           </Card>

           <Card className="border-0 shadow-xl rounded-[2.5rem] overflow-hidden transition-all hover:scale-[1.02] bg-emerald-600 text-white">
              <CardHeader className="pb-1">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-[10px] font-black tracking-[0.2em] uppercase text-emerald-200">Powder Factor</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                 <div className="flex items-baseline gap-2">
                   <h3 className="text-4xl font-black tracking-tighter text-white">{(totalExplosiveWeight / (totalTonnage || 1)).toFixed(3)}</h3>
                   <span className="text-xs font-black text-emerald-200 uppercase tracking-widest">kg/t</span>
                </div>
                <p className="text-[9px] font-bold text-emerald-100 uppercase mt-2">Aggregated Efficiency Scan</p>
              </CardContent>
           </Card>
      </div>

      {/* ── Visual Analytics ── */}
      <div className="grid gap-8 lg:grid-cols-2">
           <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-8 border shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                   <TrendingUp className="w-32 h-32" />
                </div>
                <div className="mb-8 relative z-10">
                   <h3 className="text-xl font-black tracking-tighter uppercase italic text-slate-900 dark:text-white">Powder Factor Load</h3>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Explosive density across operations</p>
                </div>
                <div className="h-64 w-full relative z-10">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.05} stroke="#ea580c" />
                            <XAxis dataKey="label" fontSize={10} fontWeight={900} axisLine={false} tickLine={false} />
                            <YAxis fontSize={10} fontWeight={900} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.2)', padding: '20px' }} cursor={{ fill: 'rgba(234, 88, 12, 0.05)' }} />
                            <ReferenceLine y={0.5} stroke="#ef4444" strokeDasharray="3 3" />
                            <Bar dataKey="value" radius={[12, 12, 4, 4]} barSize={40}>
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.value > 0.5 ? '#ef4444' : '#ea580c'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
           </div>

           <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-8 border shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                   <Activity className="w-32 h-32" />
                </div>
                <div className="mb-8 relative z-10">
                   <h3 className="text-xl font-black tracking-tighter uppercase italic text-slate-900 dark:text-white">Rock Yield Velocity</h3>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total output volume per blast</p>
                </div>
                <div className="h-64 w-full relative z-10">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.05} stroke="#3b82f6" />
                            <XAxis dataKey="label" fontSize={10} fontWeight={900} axisLine={false} tickLine={false} />
                            <YAxis fontSize={10} fontWeight={900} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ border: 'none', borderRadius: '24px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.2)', padding: '20px' }} cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }} />
                            <Bar dataKey="tonnage" fill="#3b82f6" radius={[12, 12, 4, 4]} barSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
           </div>
      </div>

      {/* ── Table ── */}
      <div className="space-y-6">
          <div className="flex items-center justify-between px-4">
              <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-lg">
                      <History className="w-5 h-5" />
                  </div>
                  <div>
                     <h3 className="text-lg font-black uppercase tracking-tight text-slate-800 dark:text-white">Blasting Registry</h3>
                     <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Immutable archive of field blasting events</p>
                  </div>
              </div>
              <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                 <input 
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search Blast No / Location..."
                    className="h-12 pl-10 pr-4 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-xl text-[10px] font-bold uppercase tracking-widest outline-none focus:border-orange-500/50 transition-all w-72 shadow-sm"
                 />
              </div>
          </div>
          <BlastingTable blastingOps={filteredOps} />
      </div>

    </div>
  )
}
