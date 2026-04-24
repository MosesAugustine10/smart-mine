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
import { ProfessionalReportDropdown } from "@/components/ui/professional-report-dropdown"
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
    <div className="flex-1 overflow-auto bg-[#fafafa] dark:bg-slate-950 pb-20 p-8 space-y-10">
      
      {/* ── Header Area ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white dark:bg-slate-900 md:p-6 p-4 rounded-[2.5rem] border shadow-sm relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
           <Drill className="w-32 h-32 text-blue-500" />
        </div>
        
        <div className="flex items-center gap-5 relative z-10">
          <div className="w-14 h-14 rounded-3xl bg-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-500/20">
            <Drill className="w-7 h-7" />
          </div>
          <div>
             <h2 className="text-2xl font-black tracking-tighter uppercase italic text-slate-900 dark:text-white">Drilling Portfolio</h2>
             <div className="flex items-center gap-3 mt-1">
                <Badge className="bg-blue-500/10 text-blue-600 border-0 font-black text-[9px] uppercase tracking-widest">{totalOps} Active</Badge>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">• Exploration & Field Execution</span>
             </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 relative z-10">
            <SystemPeriodFilter currentPeriod={period} onPeriodChange={setPeriod} />
            
            <ProfessionalReportDropdown 
                configs={{
                    budget: {
                        data: filteredOps,
                        filename: "DRILLING_BUDGET_REPORT",
                        moduleColor: "blue",
                        activePeriod: period,
                        kpis: [
                            { label: "FISCAL TARGET", value: "TZS " + totalBudget.toLocaleString() },
                            { label: "ACTUAL SPEND", value: "TZS " + totalCost.toLocaleString() },
                            { label: "VARIANCE", value: totalBudget > 0 ? (((totalCost - totalBudget) / totalBudget) * 100).toFixed(1) + "%" : "0%" }
                        ]
                    },
                    execution: {
                        data: filteredOps,
                        filename: "DRILLING_EXECUTION_LOG",
                        moduleColor: "blue",
                        activePeriod: period,
                        charts: chartConfigs,
                        kpis: [
                            { label: "TOTAL METERS", value: totalDepth.toFixed(1) + " m" },
                            { label: "AVG PENETRATION", value: avgPenetrationRate.toFixed(2) + " m/min" },
                            { label: "SESSIONS", value: totalOps }
                        ]
                    },
                    client: {
                        data: filteredOps,
                        filename: "DRILLING_CLIENT_SUMMARY",
                        moduleColor: "slate",
                        activePeriod: period,
                        kpis: [
                            { label: "ASSET STATUS", value: "OPERATIONAL" },
                            { label: "METERS DRIVEN", value: totalDepth.toFixed(1) + " m" },
                            { label: "COMPLIANCE", value: "100%" }
                        ]
                    }
                }}
            />
            <ModuleHelpNotebook moduleTitle="Drilling" />
            <Link href="/drilling/new">
              <Button className="h-14 px-8 rounded-2xl bg-slate-900 hover:bg-black text-white font-black uppercase text-[10px] tracking-[0.2em] shadow-2xl transition-all active:scale-95">
                  <Plus className="w-4 h-4 mr-2" /> Log Drill
              </Button>
            </Link>
        </div>
      </div>

      {/* ── KPI Grid ── */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
           <Card className="border-0 shadow-xl bg-slate-900 text-white rounded-[2.5rem] overflow-hidden relative group hover:scale-[1.02] transition-all">
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                <ArrowDownToLine className="w-16 h-16" />
              </div>
              <CardHeader className="pb-1">
                <CardTitle className="text-[10px] font-black tracking-[0.2em] uppercase text-blue-400">Total Depth</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                   <h3 className="text-5xl font-black tracking-tighter text-white font-mono">{totalDepth.toLocaleString(undefined, { maximumFractionDigits: 1 })}</h3>
                   <span className="text-xl text-blue-500">m</span>
                </div>
                <div className="h-1.5 w-full bg-white/10 rounded-full mt-4 overflow-hidden">
                   <div className="h-full bg-blue-500" style={{ width: `100%` }} />
                </div>
              </CardContent>
           </Card>

           <Card className="border-0 shadow-xl bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden relative group hover:scale-[1.02] transition-all">
              <CardHeader className="pb-1">
                <CardTitle className="text-[10px] font-black tracking-[0.2em] uppercase text-slate-400">Total Fuel Consumption</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                   <h3 className="text-5xl font-black tracking-tighter text-slate-900 dark:text-white font-mono">{totalFuel.toLocaleString(undefined, { maximumFractionDigits: 1 })}</h3>
                   <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Liters</span>
                </div>
                <p className="text-[9px] font-bold text-blue-500 uppercase mt-2">AVG {avgPenetrationRate.toFixed(2)} m/min penetration</p>
              </CardContent>
           </Card>

           <Card className="border-0 shadow-xl bg-blue-600 text-white rounded-[2.5rem] overflow-hidden relative group hover:scale-[1.02] transition-all">
              <div className="absolute top-0 right-0 p-6 opacity-10">
                <Activity className="w-16 h-16" />
              </div>
              <CardHeader className="pb-1">
                <CardTitle className="text-[10px] font-black tracking-[0.2em] uppercase text-blue-200">Total Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                   <h3 className="text-5xl font-black tracking-tighter text-white font-mono">{totalOps}</h3>
                   <span className="text-xs font-black text-blue-200 uppercase tracking-widest">Logs</span>
                </div>
              </CardContent>
           </Card>

           <Card className={`col-span-1 xl:col-span-2 border-0 shadow-xl rounded-[2.5rem] overflow-hidden transition-all hover:scale-[1.02] ${overBudgetTotal > 0 ? 'bg-rose-600 text-white' : 'bg-slate-950 text-white'}`}>
              <CardHeader className="pb-1">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-[10px] font-black tracking-[0.2em] uppercase text-slate-400">Budget Pulse</CardTitle>
                  <Landmark className="w-4 h-4 text-emerald-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                   <div>
                      <div className="text-[9px] font-bold uppercase tracking-widest opacity-60">Actual Spend (TZS)</div>
                      <h3 className="text-3xl font-black tracking-tighter">{(totalCost/1000000).toFixed(2)}M</h3>
                   </div>
                   <div className="pt-2 border-t border-white/10">
                      <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                         <span className="opacity-60">Target M</span>
                         <span className={overBudgetTotal > 0 ? "text-white" : "text-emerald-400"}>
                            {(totalBudget/1000000).toFixed(2)}M
                         </span>
                      </div>
                   </div>
                </div>
              </CardContent>
           </Card>
      </div>

      {/* ── Visual Analytics ── */}
      <div className="grid gap-8 lg:grid-cols-2">
           <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-8 border shadow-sm relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-5">
                   <Activity className="w-32 h-32" />
               </div>
               <div className="mb-8 relative z-10">
                   <h3 className="text-xl font-black tracking-tighter uppercase italic text-slate-900 dark:text-white">Penetration Velocity</h3>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Actual driven meters over time</p>
               </div>
               <div className="h-[300px] w-full relative z-10">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.05} stroke="#3b82f6" />
                            <XAxis dataKey="date" fontSize={10} fontWeight={900} axisLine={false} tickLine={false} />
                            <YAxis fontSize={10} fontWeight={900} axisLine={false} tickLine={false} />
                            <Tooltip 
                                contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.2)', padding: '20px' }}
                                cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }}
                            />
                            <Bar dataKey="actual" fill="#3b82f6" radius={[12, 12, 4, 4]} barSize={40} name="Actual (m)" />
                        </BarChart>
                    </ResponsiveContainer>
               </div>
           </div>

           <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-8 border shadow-sm relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-5">
                   <Gauge className="w-32 h-32" />
               </div>
               <div className="mb-8 relative z-10">
                   <h3 className="text-xl font-black tracking-tighter uppercase italic text-slate-900 dark:text-white">Efficiency Delta</h3>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Performance trend analysis</p>
               </div>
               <div className="h-[300px] w-full relative z-10">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.05} stroke="#8b5cf6" />
                            <XAxis dataKey="date" fontSize={10} fontWeight={900} axisLine={false} tickLine={false} />
                            <YAxis fontSize={10} fontWeight={900} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.2)' }} />
                            <Line type="monotone" dataKey="actual" stroke="#8b5cf6" strokeWidth={5} dot={{ r: 5, fill: '#fff', strokeWidth: 3 }} activeDot={{ r: 8 }} />
                        </LineChart>
                    </ResponsiveContainer>
               </div>
           </div>
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
