"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Plus, Truck, Fuel, Gauge, TrendingUp,
  FileText, Activity, ArrowUpRight, ArrowDownRight, Gem,
  Loader2, Landmark, History, Search
} from "lucide-react"
import Link from "next/link"
import { MaterialHandlingTable } from "@/components/material-handling/material-handling-table"
import { ProfessionalReportButton } from "@/components/ui/professional-report-button"
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
    <div className="flex-1 overflow-auto p-8 space-y-10 bg-slate-50/30 dark:bg-slate-950/30 pb-20">
      
      {/* ── Header Area ── */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
          <div className="space-y-1">
              <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                      <Truck className="w-6 h-6" />
                  </div>
                  Haulage & Material
              </h1>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Enterprise material flow & logistics governance</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
              <SystemPeriodFilter currentPeriod={period} onPeriodChange={setPeriod} />
              
              <div className="flex items-center gap-2">
                <ProfessionalReportButton 
                    data={filteredOps} 
                    filename="HAULAGE_EXECUTIVE_REPORT" 
                    title="Haulage & Material Handling Executive Report" 
                    moduleColor="emerald"
                    activePeriod={period}
                    buttonLabel="Executive Report"
                    charts={chartConfigs}
                    kpis={[
                      { label: "NET PRODUCTION", value: totalProduction.toLocaleString() + " t" },
                      { label: "NET TRIPS", value: totalTrips },
                      { label: "FUEL BURN", value: totalFuel.toLocaleString() + " L" }
                    ]}
                />
              </div>

              <Link href="/material-handling/new">
                <Button className="h-12 px-6 rounded-2xl bg-slate-900 hover:bg-black text-white font-black uppercase text-[10px] tracking-widest shadow-xl transition-all">
                    <Plus className="w-4 h-4 mr-2" /> Log Shift
                </Button>
              </Link>
          </div>
      </div>

      {/* ── KPI Grid ── */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
          <Card className="border-0 shadow-lg bg-white overflow-hidden relative group transition-all hover:scale-[1.02]">
            <CardContent className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <Badge className="bg-emerald-100 text-emerald-700 border-0 font-black text-[9px] uppercase tracking-widest">Yield</Badge>
              </div>
              <h3 className="text-4xl font-black text-slate-800">{totalProduction.toLocaleString()}</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-4">Net Tonnes Moved</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white overflow-hidden relative group transition-all hover:scale-[1.02]">
            <CardContent className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-red-50 rounded-2xl text-red-600">
                  <Fuel className="w-6 h-6" />
                </div>
                <Badge className="bg-red-100 text-red-700 border-0 font-black text-[9px] uppercase tracking-widest">{avgEfficiency.toFixed(1)} km/L</Badge>
              </div>
              <h3 className="text-4xl font-black text-slate-800">{totalFuel.toLocaleString()}</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-4">Total Fuel Consumed (L)</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white overflow-hidden relative group transition-all hover:scale-[1.02]">
            <CardContent className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
                  <Activity className="w-6 h-6" />
                </div>
                <Badge className="bg-blue-100 text-blue-700 border-0 font-black text-[9px] uppercase tracking-widest">Duty Cycles</Badge>
              </div>
              <h3 className="text-4xl font-black text-slate-800">{totalTrips}</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-4">Total Shift Trips</p>
            </CardContent>
          </Card>

          <Card className={`col-span-1 xl:col-span-2 border-0 shadow-xl overflow-hidden relative text-white transition-all hover:scale-[1.02] ${isOverBudget ? 'bg-red-600' : 'bg-slate-900'}`}>
            <CardContent className="p-8">
               <div className="flex justify-between items-center mb-6">
                  <div className="p-3 bg-white/10 rounded-2xl">
                    <Landmark className="w-6 h-6" />
                  </div>
                  <Badge className="bg-white/20 text-white border-0 font-black text-[9px] uppercase tracking-widest">Budget Variance: {Math.abs(budgetVariation).toFixed(1)}%</Badge>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-3xl font-black">TZS {totalCost.toLocaleString()}</h3>
                    <p className="text-[10px] font-black opacity-60 uppercase tracking-widest mt-2">Spend Actual</p>
                  </div>
                  <div className="text-right">
                    <h3 className="text-3xl font-black">{totalBudget.toLocaleString()}</h3>
                    <p className="text-[10px] font-black opacity-60 uppercase tracking-widest mt-2">Planned Budget</p>
                  </div>
               </div>
            </CardContent>
          </Card>
      </div>

      {/* ── Analytics & History ── */}
      <div className="grid lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 border-0 shadow-2xl rounded-[3rem] bg-white dark:bg-slate-900 p-8">
             <CardHeader className="p-0 mb-6">
                <CardTitle className="text-xl font-black uppercase italic tracking-tighter">Production Velocity</CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase tracking-widest">Segmented output vs efficiency trends</CardDescription>
             </CardHeader>
             <ProductionChart data={chartData} />
          </Card>

          <Card className="border-0 shadow-2xl rounded-[3rem] bg-emerald-600 text-white p-8 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-10 translate-x-10" />
             <Gem className="w-16 h-16 text-white/10 mb-6" />
             <h3 className="text-2xl font-black uppercase italic tracking-tighter mb-4 leading-none">Efficiency Data</h3>
             <div className="space-y-4">
                <div className="p-4 bg-white/10 rounded-2xl border border-white/5">
                   <p className="text-[10px] font-black opacity-60 uppercase tracking-widest">Yield per Operation</p>
                   <p className="text-2xl font-black">{(totalProduction / (totalOps || 1)).toLocaleString()} <span className="text-xs font-medium">t</span></p>
                </div>
                <div className="p-4 bg-white/10 rounded-2xl border border-white/5">
                   <p className="text-[10px] font-black opacity-60 uppercase tracking-widest">Vehicle Productivity</p>
                   <p className="text-2xl font-black">{(totalTrips / (totalTrucks || 1)).toFixed(1)} <span className="text-xs font-medium">trips/truck</span></p>
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
