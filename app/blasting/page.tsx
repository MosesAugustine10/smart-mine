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
import { BlastingBudgetVsActual } from "@/components/blasting/budget-vs-actual-chart"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
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
    <div className="flex-1 overflow-auto p-8 space-y-10 bg-slate-50/30 dark:bg-slate-950/30 pb-20">
      
      {/* ── Header ── */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
          <div className="space-y-1">
              <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-orange-600 flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
                      <Bomb className="w-6 h-6" />
                  </div>
                  Blasting Command
              </h1>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Forensic blast planning & execution governance</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
              <SystemPeriodFilter currentPeriod={period} onPeriodChange={setPeriod} />
              <ProfessionalReportButton 
                  data={filteredOps} 
                  filename="BLASTING_EXECUTIVE_REPORT" 
                  title="Blasting Ops Executive Report" 
                  moduleColor="orange"
                  activePeriod={period}
                  charts={chartConfigs}
                  kpis={[
                    { label: "TOTAL TONNAGE", value: totalTonnage.toLocaleString() + " t" },
                    { label: "EXPLOSIVE WEIGHT", value: totalExplosiveWeight.toLocaleString() + " kg" },
                    { label: "AVG POWDER FACTOR", value: (totalExplosiveWeight / (totalTonnage || 1)).toFixed(3) + " kg/t" }
                  ]}
              />
              <Link href="/blasting/new">
                <Button className="h-12 px-6 rounded-2xl bg-slate-900 hover:bg-black text-white font-black uppercase text-[10px] tracking-widest shadow-xl transition-all">
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
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
           <Card className="border-0 shadow-lg bg-white overflow-hidden relative group transition-all hover:scale-[1.02]">
            <CardContent className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-orange-50 rounded-2xl text-orange-600">
                  <Bomb className="w-6 h-6" />
                </div>
                <Badge className="bg-orange-100 text-orange-700 border-0 font-black text-[9px] uppercase tracking-widest">{totalOps} Blasts</Badge>
              </div>
              <h3 className="text-4xl font-black text-slate-800">{totalTonnage.toLocaleString()}</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-4">Total Tonnage Yield (t)</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white overflow-hidden relative group transition-all hover:scale-[1.02]">
            <CardContent className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-red-50 rounded-2xl text-red-600">
                  <Activity className="w-6 h-6" />
                </div>
                <Badge className="bg-red-100 text-red-700 border-0 font-black text-[9px] uppercase tracking-widest">Heavy Load</Badge>
              </div>
              <h3 className="text-4xl font-black text-slate-800">{totalExplosiveWeight.toLocaleString()}</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-4">Total Explosives (kg)</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white overflow-hidden relative group transition-all hover:scale-[1.02]">
            <CardContent className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
                  <DollarSign className="w-6 h-6" />
                </div>
                <Badge className="bg-emerald-100 text-emerald-700 border-0 font-black text-[9px] uppercase tracking-widest">OpEx</Badge>
              </div>
              <h3 className="text-3xl font-black text-slate-800">{(totalCost/1000000).toFixed(2)}M</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-4">Actual Shift Expenditure</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white overflow-hidden relative group transition-all hover:scale-[1.02]">
            <CardContent className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-purple-50 rounded-2xl text-purple-600">
                  <Gauge className="w-6 h-6" />
                </div>
                <Badge className="bg-purple-100 text-purple-700 border-0 font-black text-[9px] uppercase tracking-widest">Vibration</Badge>
              </div>
              <h3 className="text-4xl font-black text-slate-800">{avgVibration.toFixed(2)}</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-4">Avg Vibration (mm/s)</p>
            </CardContent>
          </Card>

          <Card className="col-span-1 xl:col-span-2 border-0 shadow-xl bg-slate-900 text-white p-8 rounded-[2.5rem] relative overflow-hidden transition-all hover:scale-[1.02]">
             <div className="flex justify-between items-center mb-6">
                <div className="p-3 bg-white/10 rounded-2xl">
                    <TrendingUp className="w-6 h-6" />
                </div>
                <Badge className="bg-white/20 text-white border-0 font-black text-[9px] uppercase tracking-widest">Efficiency Scan</Badge>
             </div>
             <h3 className="text-3xl font-black uppercase tracking-tighter italic">{(totalExplosiveWeight / (totalTonnage || 1)).toFixed(3)} kg/t</h3>
             <p className="text-[10px] font-black opacity-60 uppercase tracking-widest mt-2">Aggregated Powder Factor</p>
             <Landmark className="absolute -bottom-6 -right-6 w-32 h-32 opacity-5" />
          </Card>
      </div>

      {/* ── Visual Analytics ── */}
      <div className="grid gap-8 lg:grid-cols-2">
           <Card className="border-0 shadow-2xl rounded-[3rem] bg-white dark:bg-slate-900 p-8">
                <h3 className="text-xl font-black uppercase italic tracking-tighter mb-6 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-orange-600" />
                    Powder Factor Load
                </h3>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                            <XAxis dataKey="label" fontSize={10} fontWeight={800} axisLine={false} tickLine={false} />
                            <YAxis fontSize={10} fontWeight={800} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                            <ReferenceLine y={0.5} stroke="#ef4444" strokeDasharray="3 3" />
                            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.value > 0.5 ? '#ef4444' : '#ea580c'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
           </Card>

           <Card className="border-0 shadow-2xl rounded-[3rem] bg-white dark:bg-slate-900 p-8">
                <h3 className="text-xl font-black uppercase italic tracking-tighter mb-6 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-600" />
                    Rock Yield Velocity
                </h3>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                            <XAxis dataKey="label" fontSize={10} fontWeight={800} axisLine={false} tickLine={false} />
                            <YAxis fontSize={10} fontWeight={800} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ border: 'none', borderRadius: '12px' }} />
                            <Bar dataKey="tonnage" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
           </Card>
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
