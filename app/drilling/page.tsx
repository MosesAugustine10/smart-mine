"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Plus, DollarSign, Activity, Gauge,
  FileText, Drill, AlertTriangle, Loader2, History, Landmark, Search, ArrowDownToLine
} from "lucide-react"
import Link from "next/link"
import { DrillingTable } from "@/components/drilling/drilling-table"
import { ProfessionalReportButton } from "@/components/ui/professional-report-button"
import { useTranslation } from "@/components/language-context"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { ModuleHelpNotebook } from "@/components/module-help-notebook"
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, format, isWithinInterval } from "date-fns"
import { SystemPeriodFilter, type ReportPeriod } from "@/components/ui/system-period-filter"
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line
} from 'recharts'
import { Badge } from "@/components/ui/badge"

export default function DrillingPage() {
  const { t } = useTranslation()
  const [drillingOps, setDrillingOps] = useState<any[]>([])
  const [filteredOps, setFilteredOps] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<ReportPeriod>("all")
  const [search, setSearch] = useState("")

  useEffect(() => {
    async function fetchDrilling() {
        const supabase = getSupabaseBrowserClient()
        const { data } = await supabase
            .from("drilling_operations")
            .select("*")
            .order("date", { ascending: false })
        
        setDrillingOps(data || [])
        setFilteredOps(data || [])
        setLoading(false)
    }
    fetchDrilling()
  }, [])

  useEffect(() => {
    if (!drillingOps.length) return
    
    let filtered = drillingOps
    if (period !== "all") {
        const now = new Date()
        let interval: { start: Date; end: Date }
        if (period === "daily") interval = { start: startOfDay(now), end: endOfDay(now) }
        else if (period === "weekly") interval = { start: startOfWeek(now), end: endOfWeek(now) }
        else if (period === "monthly") interval = { start: startOfMonth(now), end: endOfMonth(now) }
        else interval = { start: startOfYear(now), end: endOfYear(now) }

        filtered = drillingOps.filter(op => {
            try {
                return isWithinInterval(new Date(op.date), interval)
            } catch { return true }
        })
    }

    if (search) {
        filtered = filtered.filter(op => 
            op.drill_number?.toLowerCase().includes(search.toLowerCase()) ||
            op.driller_name?.toLowerCase().includes(search.toLowerCase()) ||
            op.region?.toLowerCase().includes(search.toLowerCase())
        )
    }

    setFilteredOps(filtered)
  }, [period, drillingOps, search])

  // Global KPIs Calculation
  const totalOps = filteredOps.length
  const totalDepth = filteredOps.reduce((sum, op) => sum + (Number(op.drilling_required_m) || 0), 0)
  const totalCost = filteredOps.reduce((sum, op) => sum + (Number(op.total_drilling_cost) || 0), 0)
  const totalBudget = filteredOps.reduce((sum, op) => sum + (Number(op.planned_budget_tzs) || 0), 0)
  const totalFuel = filteredOps.reduce((sum, op) => sum + (Number(op.fuel_consumption_l) || 0), 0)
  const avgPenetrationRate = totalOps > 0 
    ? filteredOps.reduce((sum, op) => sum + (Number(op.penetration_rate_m_per_min) || 0), 0) / totalOps 
    : 0

  const overBudgetTotal = filteredOps.filter(op => 
      (Number(op.planned_budget_tzs) > 0) && (Number(op.total_drilling_cost) > Number(op.planned_budget_tzs))
  ).length

  const chartData = useMemo(() => {
      return [...filteredOps].reverse().slice(-10).map(op => ({
          date: format(new Date(op.date), "dd MMM"),
          planned: Math.round(Number(op.drilling_required_m || 0) * 1.1),
          actual: Number(op.drilling_required_m || 0)
      }))
  }, [filteredOps])

  const chartConfigs = [{
      type: "bar" as const,
      title: "Drilling Progress (Meters)",
      data: chartData.map(d => ({ label: d.date, value: d.actual })),
      color: "#3b82f6"
  }]

  if (loading) return (
    <div className="h-screen w-full flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing Drilling Portfolio...</p>
    </div>
  )

  return (
    <div className="flex-1 overflow-auto p-8 space-y-10 bg-slate-50/30 dark:bg-slate-950/30 pb-20">
      
      {/* ── Header ── */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
          <div className="space-y-1">
              <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                      <Drill className="w-6 h-6" />
                  </div>
                  Drilling Portfolio
              </h1>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Exploration analytics & field execution control</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
              <SystemPeriodFilter currentPeriod={period} onPeriodChange={setPeriod} />
              <ProfessionalReportButton 
                  data={filteredOps} 
                  filename="DRILLING_EXECUTIVE_REPORT" 
                  title="Drilling Ops Executive Report" 
                  moduleColor="blue"
                  activePeriod={period}
                  charts={chartConfigs}
                  kpis={[
                    { label: "TOTAL METERS", value: totalDepth.toFixed(1) },
                    { label: "AVG PENETRATION", value: avgPenetrationRate.toFixed(2) },
                    { label: "TOTAL FUEL", value: totalFuel.toFixed(1) }
                  ]}
              />
              <ModuleHelpNotebook moduleTitle="Drilling" />
              <Link href="/drilling/new">
                <Button className="h-12 px-6 rounded-2xl bg-slate-900 hover:bg-black text-white font-black uppercase text-[10px] tracking-widest shadow-xl transition-all">
                    <Plus className="w-4 h-4 mr-2" /> Log Drill
                </Button>
              </Link>
          </div>
      </div>

      {/* ── KPI Grid ── */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
           <Card className="border-0 shadow-lg bg-white overflow-hidden relative group transition-all hover:scale-[1.02]">
            <CardContent className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
                  <ArrowDownToLine className="w-6 h-6" />
                </div>
                <Badge className="bg-blue-100 text-blue-700 border-0 font-black text-[9px] uppercase tracking-widest">Depth</Badge>
              </div>
              <h3 className="text-4xl font-black text-slate-800">{totalDepth.toLocaleString(undefined, { maximumFractionDigits: 1 })}</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-4">Calculated Meters Drilled</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white overflow-hidden relative group transition-all hover:scale-[1.02]">
            <CardContent className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-purple-50 rounded-2xl text-purple-600">
                  <Gauge className="w-6 h-6" />
                </div>
                <Badge className="bg-purple-100 text-purple-700 border-0 font-black text-[9px] uppercase tracking-widest">{avgPenetrationRate.toFixed(2)} m/min</Badge>
              </div>
              <h3 className="text-4xl font-black text-slate-800">{totalFuel.toLocaleString(undefined, { maximumFractionDigits: 1 })}</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-4">Fuel Consumption (L)</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white overflow-hidden relative group transition-all hover:scale-[1.02]">
            <CardContent className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
                  <Activity className="w-6 h-6" />
                </div>
                <Badge className="bg-emerald-100 text-emerald-700 border-0 font-black text-[9px] uppercase tracking-widest">Activity</Badge>
              </div>
              <h3 className="text-4xl font-black text-slate-800">{totalOps}</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-4">Total Logged Sessions</p>
            </CardContent>
          </Card>

          <Card className={`col-span-1 xl:col-span-2 border-0 shadow-xl overflow-hidden relative text-white transition-all hover:scale-[1.02] ${overBudgetTotal > 0 ? "bg-red-600" : "bg-slate-900"}`}>
            <CardContent className="p-8">
               <div className="flex justify-between items-center mb-6">
                  <div className="p-3 bg-white/10 rounded-2xl">
                    <Landmark className="w-6 h-6" />
                  </div>
                  {overBudgetTotal > 0 && <Badge className="bg-white/20 text-white border-0 font-black text-[9px] uppercase tracking-widest flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> {overBudgetTotal} Over Budget</Badge>}
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-3xl font-black">TZS {(totalCost / 1000000).toFixed(2)}M</h3>
                    <p className="text-[10px] font-black opacity-60 uppercase tracking-widest mt-2">Aggregated Spend</p>
                  </div>
                  <div className="text-right">
                    <h3 className="text-3xl font-black">TZS {(totalBudget / 1000000).toFixed(2)}M</h3>
                    <p className="text-[10px] font-black opacity-60 uppercase tracking-widest mt-2">Planned Threshold</p>
                  </div>
               </div>
            </CardContent>
          </Card>
      </div>

      {/* ── Visual Analytics ── */}
      <div className="grid gap-8 lg:grid-cols-2">
           <Card className="border-0 shadow-2xl rounded-[3rem] bg-white dark:bg-slate-900 p-8">
               <h3 className="text-xl font-black uppercase italic tracking-tighter mb-6 flex items-center gap-2">
                   <Activity className="w-5 h-5 text-blue-600" />
                   Penetration Velocity (m)
               </h3>
               <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                            <XAxis dataKey="date" fontSize={10} fontWeight={800} axisLine={false} tickLine={false} />
                            <YAxis fontSize={10} fontWeight={800} axisLine={false} tickLine={false} />
                            <Tooltip 
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                            />
                            <Bar dataKey="actual" fill="#2563eb" radius={[6, 6, 0, 0]} name="Actual (m)" />
                        </BarChart>
                    </ResponsiveContainer>
               </div>
           </Card>

           <Card className="border-0 shadow-2xl rounded-[3rem] bg-white dark:bg-slate-900 p-8">
               <h3 className="text-xl font-black uppercase italic tracking-tighter mb-6 flex items-center gap-2">
                   <Gauge className="w-5 h-5 text-purple-600" />
                   Efficiency Delta
               </h3>
               <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                            <XAxis dataKey="date" fontSize={10} fontWeight={800} axisLine={false} tickLine={false} />
                            <YAxis fontSize={10} fontWeight={800} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                            <Line type="monotone" dataKey="actual" stroke="#8b5cf6" strokeWidth={5} dot={{ r: 5, fill: '#fff', strokeWidth: 3 }} activeDot={{ r: 8 }} />
                        </LineChart>
                    </ResponsiveContainer>
               </div>
           </Card>
      </div>

      {/* ── Table ── */}
      <div className="space-y-6">
          <div className="flex items-center justify-between px-4">
              <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg">
                      <History className="w-5 h-5" />
                  </div>
                  <div>
                     <h3 className="text-lg font-black uppercase tracking-tight text-slate-800 dark:text-white">Field Registry</h3>
                     <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Historical Drilling Performance Ledger</p>
                  </div>
              </div>
              <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                 <input 
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search Unit / Driller..."
                    className="h-12 pl-10 pr-4 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-xl text-[10px] font-bold uppercase tracking-widest outline-none focus:border-blue-500/50 transition-all w-72 shadow-sm"
                 />
              </div>
          </div>
          <DrillingTable drillingOps={filteredOps} />
      </div>

    </div>
  )
}
