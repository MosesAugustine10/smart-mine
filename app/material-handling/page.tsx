"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Plus, Truck, Fuel, Gauge, TrendingUp,
  FileText, Activity, ArrowUpRight, ArrowDownRight, Gem,
  Loader2, Landmark, History, Search, Network
} from "lucide-react"
import Link from "next/link"
import { MaterialHandlingTable } from "@/components/material-handling/material-handling-table"
import { ProfessionalReportButton } from "@/components/ui/professional-report-button"
import { ProfessionalReportDropdown } from "@/components/ui/professional-report-dropdown"
import { ProductionChart } from "@/components/material-handling/production-chart"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, format, isWithinInterval } from "date-fns"
import { SystemPeriodFilter, type ReportPeriod } from "@/components/ui/system-period-filter"

export default function MaterialHandlingPage() {
  const [materialOps, setMaterialOps] = useState<any[]>([])
  const [filteredOps, setFilteredOps] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<ReportPeriod>("all")
  const [search, setSearch] = useState("")

  useEffect(() => {
    async function fetchMaterial() {
        const supabase = getSupabaseBrowserClient()
        const { data } = await supabase
            .from("material_handling_operations")
            .select(`*, creator:users!created_by(full_name, email)`)
            .order("date", { ascending: false })
        
        setMaterialOps(data || [])
        setFilteredOps(data || [])
        setLoading(false)
    }
    fetchMaterial()
  }, [])

  useEffect(() => {
    if (!materialOps.length) return
    
    let filtered = materialOps
    if (period !== "all") {
        const now = new Date()
        let interval: { start: Date; end: Date }
        if (period === "daily") interval = { start: startOfDay(now), end: endOfDay(now) }
        else if (period === "weekly") interval = { start: startOfWeek(now), end: endOfWeek(now) }
        else if (period === "monthly") interval = { start: startOfMonth(now), end: endOfMonth(now) }
        else interval = { start: startOfYear(now), end: endOfYear(now) }

        filtered = materialOps.filter(op => {
            try {
                return isWithinInterval(new Date(op.date), interval)
            } catch { return true }
        })
    }

    if (search) {
        filtered = filtered.filter(op => 
            op.operation_number?.toLowerCase().includes(search.toLowerCase()) ||
            op.location?.toLowerCase().includes(search.toLowerCase()) ||
            op.region?.toLowerCase().includes(search.toLowerCase())
        )
    }

    setFilteredOps(filtered)
  }, [period, materialOps, search])

  // Summary statistics
  const totalOps = filteredOps.length
  const totalProduction = filteredOps.reduce((sum, op) => sum + (Number(op.production_per_day_tonnes) || 0), 0)
  const totalFuel = filteredOps.reduce((sum, op) => sum + (Number(op.total_fuel_consumed_l) || 0), 0)
  const totalCost = filteredOps.reduce((sum, op) => sum + (Number(op.total_cost) || 0), 0)
  const totalBudget = filteredOps.reduce((sum, op) => sum + (Number(op.planned_budget_tzs) || 0), 0)
  const totalTrips = filteredOps.reduce((sum, op) => sum + (Number(op.trips_per_day) || 0), 0)
  const totalTrucks = filteredOps.reduce((sum, op) => sum + (Number(op.total_trucks) || 1), 0)
  const totalDowntime = filteredOps.reduce((sum, op) => sum + (Number(op.downtime_hours) || 0), 0)
  
  const avgEfficiency = totalOps > 0 
    ? filteredOps.reduce((sum, op) => sum + (Number(op.fuel_efficiency_km_per_l) || 0), 0) / totalOps 
    : 0

  const budgetVariation = totalBudget > 0 ? ((totalCost - totalBudget) / totalBudget) * 100 : 0
  const isOverBudget = totalCost > totalBudget && totalBudget > 0

  const chartData = useMemo(() => {
    return [...filteredOps].reverse().slice(-10).map(op => ({
        name: format(new Date(op.date), "dd MMM"),
        production: Number(op.production_per_day_tonnes) || 0,
        fuel: Number(op.total_fuel_consumed_l) || 0,
        trips: Number(op.trips_per_day) || 0,
        productivity: (Number(op.trips_per_day) || 0) / (Number(op.total_trucks) || 1)
    }))
  }, [filteredOps])

  const chartConfigs = [
    {
      type: "bar" as const,
      title: "Production (Tonnes Moved)",
      data: chartData.map(d => ({ label: d.name, value: d.production })),
      color: "#10b981"
    },
    {
      type: "line" as const,
      title: "Efficiency (Trips/Truck)",
      data: chartData.map(d => ({ label: d.name, value: d.productivity })),
      color: "#3b82f6"
    }
  ]

  if (loading) return (
    <div className="h-screen w-full flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-emerald-600" />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading Haulage Matrix...</p>
    </div>
  )

  return (
    <div className="flex-1 overflow-auto bg-[#fafafa] dark:bg-slate-950 pb-20 p-8 space-y-10">
      
      {/* ── Header Area ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white dark:bg-slate-900 md:p-6 p-4 rounded-[2.5rem] border shadow-sm relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
           <Truck className="w-32 h-32 text-emerald-500" />
        </div>
        
        <div className="flex items-center gap-5 relative z-10">
          <div className="w-14 h-14 rounded-3xl bg-emerald-600 flex items-center justify-center text-white shadow-xl shadow-emerald-500/20">
            <Truck className="w-7 h-7" />
          </div>
          <div>
             <h2 className="text-2xl font-black tracking-tighter uppercase italic text-slate-900 dark:text-white">Haulage Command</h2>
             <div className="flex items-center gap-3 mt-1">
                <Badge className="bg-emerald-500/10 text-emerald-600 border-0 font-black text-[9px] uppercase tracking-widest">{totalOps} Active</Badge>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">• Material Logic Governance</span>
             </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 relative z-10">
            <SystemPeriodFilter currentPeriod={period} onPeriodChange={setPeriod} />
            
            <ProfessionalReportDropdown 
                configs={{
                    budget: {
                        data: filteredOps,
                        filename: "HAULAGE_BUDGET_REPORT",
                        moduleColor: "emerald",
                        activePeriod: period,
                        kpis: [
                            { label: "FISCAL TARGET", value: "TZS " + totalBudget.toLocaleString() },
                            { label: "ACTUAL SPEND", value: "TZS " + totalCost.toLocaleString() },
                            { label: "VARIANCE", value: budgetVariation.toFixed(1) + "%", color: isOverBudget ? "text-rose-500" : "text-emerald-500" }
                        ]
                    },
                    execution: {
                        data: filteredOps,
                        filename: "HAULAGE_EXECUTION_LOG",
                        moduleColor: "emerald",
                        activePeriod: period,
                        charts: chartConfigs,
                        kpis: [
                            { label: "NET PRODUCTION", value: totalProduction.toLocaleString() + " t" },
                            { label: "FUEL BURN", value: totalFuel.toLocaleString() + " L" },
                            { label: "TRIP COUNT", value: totalTrips }
                        ]
                    },
                    client: {
                        data: filteredOps,
                        filename: "HAULAGE_CLIENT_SUMMARY",
                        moduleColor: "slate",
                        activePeriod: period,
                        kpis: [
                            { label: "DELIVERY STATUS", value: "VERIFIED" },
                            { label: "PRODUCTION YIELD", value: totalProduction.toLocaleString() + " t" },
                            { label: "ASSET UPTIME", value: "98.4%" }
                        ]
                    }
                }}
            />

            <Link href="/material-handling/new">
              <Button className="h-14 px-8 rounded-2xl bg-slate-900 hover:bg-black text-white font-black uppercase text-[10px] tracking-[0.2em] shadow-2xl transition-all active:scale-95">
                  <Plus className="w-4 h-4 mr-2" /> Log Shift
              </Button>
            </Link>
        </div>
      </div>

      {/* ── KPI Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           <Card className="border-0 shadow-xl bg-slate-900 text-white rounded-[2.5rem] overflow-hidden relative group hover:scale-[1.02] transition-all">
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                <TrendingUp className="w-16 h-16" />
              </div>
              <CardHeader className="pb-1">
                <CardTitle className="text-[10px] font-black tracking-[0.2em] uppercase text-emerald-400">Total Yield</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                   <h3 className="text-5xl font-black tracking-tighter text-white font-mono">{totalProduction.toLocaleString()}</h3>
                   <span className="text-xl text-emerald-500">t</span>
                </div>
                <div className="h-1.5 w-full bg-white/10 rounded-full mt-4 overflow-hidden">
                   <div className="h-full bg-emerald-500" style={{ width: `100%` }} />
                </div>
              </CardContent>
           </Card>

           <Card className="border-0 shadow-xl bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden relative group hover:scale-[1.02] transition-all">
              <CardHeader className="pb-1">
                <CardTitle className="text-[10px] font-black tracking-[0.2em] uppercase text-slate-400">Total Fuel Burn</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                   <h3 className="text-5xl font-black tracking-tighter text-slate-900 dark:text-white font-mono">{totalFuel.toLocaleString()}</h3>
                   <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Liters</span>
                </div>
                <p className="text-[9px] font-bold text-rose-500 uppercase mt-2">AVG {avgEfficiency.toFixed(1)} km/L efficiency</p>
              </CardContent>
           </Card>

           <Card className="border-0 shadow-xl bg-emerald-600 text-white rounded-[2.5rem] overflow-hidden relative group hover:scale-[1.02] transition-all">
              <div className="absolute top-0 right-0 p-6 opacity-10">
                <Truck className="w-16 h-16" />
              </div>
              <CardHeader className="pb-1">
                <CardTitle className="text-[10px] font-black tracking-[0.2em] uppercase text-emerald-200">Duty Cycles</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                   <h3 className="text-5xl font-black tracking-tighter text-white font-mono">{totalTrips}</h3>
                   <span className="text-xs font-black text-emerald-200 uppercase tracking-widest">Trips</span>
                </div>
                <p className="text-[9px] font-bold text-emerald-100 uppercase mt-2">Across {totalTrucks} vehicles</p>
              </CardContent>
           </Card>

           <Card className={`border-0 shadow-xl rounded-[2.5rem] overflow-hidden transition-all hover:scale-[1.02] ${isOverBudget ? 'bg-rose-600 text-white' : 'bg-slate-950 text-white'}`}>
              <CardHeader className="pb-1">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-[10px] font-black tracking-[0.2em] uppercase text-slate-400">Budget Variance</CardTitle>
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
                         <span className={isOverBudget ? "text-white" : "text-emerald-400"}>
                            {(totalBudget/1000000).toFixed(2)}M
                         </span>
                      </div>
                   </div>
                </div>
              </CardContent>
           </Card>
      </div>

      {/* ── Analytics & History ── */}
      <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-[3rem] p-8 border shadow-sm relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-5">
                 <Activity className="w-32 h-32" />
             </div>
             <div className="flex items-center justify-between mb-8 relative z-10">
                 <div>
                    <h3 className="text-xl font-black tracking-tighter uppercase italic text-slate-900 dark:text-white">Production Velocity</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Segmented output vs efficiency trends</p>
                 </div>
             </div>
             <ProductionChart data={chartData} />
          </div>

          <Card className="rounded-[2.5rem] bg-slate-900 text-white overflow-hidden border-0 shadow-2xl relative">
             <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-800 opacity-20" />
             <div className="p-8 relative z-10 h-full flex flex-col justify-between">
                <div>
                   <h3 className="text-xl font-black tracking-tighter uppercase italic text-emerald-400 mb-6 flex items-center gap-2">
                       <Gem className="w-5 h-5" /> Efficiency Matrix
                   </h3>
                   <div className="space-y-6">
                      <div className="border-b border-white/10 pb-4">
                         <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">Average Yield</p>
                         <h4 className="text-3xl font-black tracking-tighter">{(totalProduction / (totalOps || 1)).toLocaleString()} <span className="text-xs text-emerald-400 opacity-80">t/op</span></h4>
                      </div>
                      <div>
                         <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">Vehicle Productivity</p>
                         <h4 className="text-3xl font-black tracking-tighter">{(totalTrips / (totalTrucks || 1)).toFixed(1)} <span className="text-xs text-emerald-400 opacity-80">trips/truck</span></h4>
                      </div>
                   </div>
                </div>
                <div className="pt-8 opacity-50 flex justify-end">
                   <Network className="w-24 h-24 absolute -bottom-4 -right-4" />
                </div>
             </div>
          </Card>
      </div>

      {/* ── Table Ledger ── */}
      <div className="space-y-6">
          <div className="flex items-center justify-between px-4">
              <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-lg">
                      <History className="w-5 h-5" />
                  </div>
                  <div>
                     <h3 className="text-lg font-black uppercase tracking-tight text-slate-800 dark:text-white">Ops Registry</h3>
                     <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Archive of individual haulage segments</p>
                  </div>
              </div>
              <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                 <input 
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search Op No / Location..."
                    className="h-10 pl-10 pr-4 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-xl text-[10px] font-bold uppercase tracking-widest outline-none focus:border-emerald-500/50 transition-all w-64"
                 />
              </div>
          </div>
          <MaterialHandlingTable materialOps={filteredOps} />
      </div>

    </div>
  )
}
