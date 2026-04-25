"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Truck, Drill, Bomb, Diamond, Shield, Fuel, Clock, Beaker, FlaskConical, Building2, TrendingUp, ArrowUpRight, Activity, Receipt, CreditCard, Landmark, Loader2, Gauge, Zap, BarChart3, AlertTriangle, Plus } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DashboardCharts } from "@/components/dashboard-charts"
import { PredictiveMaintenance } from "@/components/predictive-maintenance"
import Link from "next/link"
import { useTranslation } from "@/components/language-context"
import { useState, useEffect, useMemo } from "react"
import { useAuth } from "@/components/auth-provider"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { SystemPeriodFilter, type ReportPeriod } from "@/components/ui/system-period-filter"
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, format } from "date-fns"

export default function AdminDashboard() {
  const { t } = useTranslation()
  const { profile, user, loading: authLoading } = useAuth()
  const [stats, setStats] = useState<any>(null)
  const [chartData, setChartData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<ReportPeriod>("all")

  useEffect(() => {
    async function fetchData() {
      if (authLoading) return
      if (!profile || !user) {
        setLoading(false)
        return
      }

      setLoading(true)
      const supabase = getSupabaseBrowserClient()
      const cid = profile?.company_id

      const now = new Date()
      let dateFilter: any = null
      if (period !== "all") {
        let interval: { start: Date; end: Date }
        if (period === "daily") interval = { start: startOfDay(now), end: endOfDay(now) }
        else if (period === "weekly") interval = { start: startOfWeek(now), end: endOfWeek(now) }
        else if (period === "monthly") interval = { start: startOfMonth(now), end: endOfMonth(now) }
        else interval = { start: startOfYear(now), end: endOfYear(now) }
        dateFilter = interval
      }

      async function getCount(table: string, dateCol: string = "created_at") {
        let q = supabase.from(table).select("*", { count: "exact", head: true })
        if (cid) q = q.eq("company_id", cid)
        if (dateFilter) q = q.gte(dateCol, dateFilter.start.toISOString()).lte(dateCol, dateFilter.end.toISOString())
        const { count } = await q
        return count || 0
      }

      async function getSum(table: string, column: string, dateCol: string = "created_at") {
        let q = supabase.from(table).select(column)
        if (cid) q = q.eq("company_id", cid)
        if (dateFilter) q = q.gte(dateCol, dateFilter.start.toISOString()).lte(dateCol, dateFilter.end.toISOString())
        const { data } = await q
        return data?.reduce((sum: number, row: any) => sum + (Number(row[column]) || 0), 0) || 0
      }

      try {
        const [
          blasting, drilling, material, diamond,
          vehicles, safety,
          fuel, fuelCost, downtime, production,
          charts
        ] = await Promise.all([
          getCount("blasting_operations", "date"),
          getCount("drilling_operations", "date"),
          getCount("material_handling_operations", "date"),
          getCount("diamond_drilling_operations", "date"),
          getCount("vehicles"),
          getCount("safety_incidents", "incident_date"),
          getSum("fuel_logs", "fuel_quantity_liters", "date"),
          getSum("fuel_logs", "total_cost", "date"),
          getSum("maintenance_logs", "downtime_minutes"),
          getSum("material_handling_operations", "production_per_day_tonnes", "date"),
          (async () => {
             let q = supabase.from("material_handling_operations").select("production_per_day_tonnes, fuel_efficiency_km_per_l, date")
             if (cid) q = q.eq("company_id", cid)
             const { data } = await q.order("date", { ascending: false }).limit(14)
             return data || []
          })()
        ])

        setStats({
          blasting, drilling, material, diamond,
          totalVehicles: vehicles,
          safetyIncidents: safety,
          totalFuel: fuel, totalFuelCost: fuelCost, totalDowntime: downtime, totalProduction: production
        })
        setChartData(charts)
        setLoading(false)
      } catch (err) {
        console.error("Dashboard data fetch error:", err)
        setLoading(false)
      }
    }

    const fallbackTimer = setTimeout(() => {
      console.warn("AdminDashboard: fetch timeout reached.")
      setLoading(false)
    }, 5000)

    fetchData().finally(() => clearTimeout(fallbackTimer))
  }, [authLoading, profile, user, period])

  if (loading && !stats) return (
    <div className="h-screen w-full flex flex-col items-center justify-center space-y-4 bg-slate-50 dark:bg-slate-950">
      <Loader2 className="w-16 h-16 animate-spin text-emerald-600" />
      <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400">Syncing Intelligence...</p>
    </div>
  )

  if (!profile) return (
      <div className="p-8 max-w-screen-xl mx-auto space-y-10">
        <div className="p-12 border-4 border-dashed rounded-[3.5rem] border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center space-y-6">
          <Shield className="w-24 h-24 text-amber-500" />
          <h2 className="text-4xl font-black uppercase tracking-tighter italic">Access Restricted</h2>
        </div>
      </div>
  )

  const {
    blasting = 0, drilling = 0, material = 0, diamond = 0,
    totalVehicles = 0,
    safetyIncidents = 0,
    totalFuel = 0, totalFuelCost = 0, totalDowntime = 0, totalProduction = 0
  } = stats || {}

  const totalOps = blasting + drilling + material + diamond
  const avgEfficiency = chartData.length > 0
    ? (chartData.reduce((s: number, r: any) => s + (Number(r.fuel_efficiency_km_per_l) || 0), 0) / chartData.length).toFixed(2)
    : "0.00"

  return (
    <div className="p-8 sm:p-12 space-y-12 max-w-[1700px] mx-auto min-h-screen bg-slate-50/50 dark:bg-slate-950/50 pb-24">

      {/* ── Dashboard Header ── */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 pb-8 border-b-2 border-slate-200/60 dark:border-slate-800/60">
        <div className="space-y-1">
          <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic flex items-center gap-4">
             <div className="bg-emerald-600 p-3 rounded-2xl text-white shadow-xl shadow-emerald-500/20">
                <BarChart3 className="w-8 h-8" />
             </div>
             Command Center
          </h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] pl-1">
            Enterprise Intelligence Grid | Authorized: {profile?.first_name} | {format(new Date(), "HH:mm:ss")}
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
           <SystemPeriodFilter currentPeriod={period} onPeriodChange={setPeriod} />
           
           <div className="flex items-center gap-6 bg-white dark:bg-slate-900 p-5 rounded-[2.5rem] border-2 border-white dark:border-slate-800 shadow-2xl relative">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500" />
              <div className="flex flex-col items-center px-6 border-r-2 border-slate-100 dark:border-slate-800">
                 <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Total Ops</p>
                 <p className="text-3xl font-black text-slate-800 dark:text-white">{totalOps}</p>
              </div>
              <div className="flex flex-col items-center px-6">
                 <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Safety</p>
                 <p className={`text-3xl font-black ${safetyIncidents > 0 ? 'text-red-600 animate-pulse' : 'text-emerald-600'}`}>
                   {safetyIncidents > 0 ? 'RISK' : 'OK'}
                 </p>
              </div>
           </div>
        </div>
      </div>

      {/* ── KPI Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <Card className="border-0 shadow-2xl rounded-[3rem] bg-slate-900 text-white relative overflow-hidden group hover:scale-[1.02] transition-all">
           <CardContent className="p-8">
              <Activity className="absolute -top-10 -right-10 w-48 h-48 opacity-10 text-white transform rotate-12" />
              <div className="space-y-6">
                <p className="text-xs font-black uppercase tracking-widest text-emerald-400">Net Production Yield</p>
                <h3 className="text-6xl font-black tracking-tight italic">
                   {totalProduction.toLocaleString()} 
                   <span className="text-sm font-bold opacity-40 ml-2">Tonnes</span>
                </h3>
                <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                    <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest">Global Flow Tracker</p>
                    <TrendingUp className="text-emerald-400 w-6 h-6" />
                </div>
              </div>
           </CardContent>
        </Card>

        <Card className="border-0 shadow-2xl rounded-[3rem] bg-blue-700 text-white relative overflow-hidden group hover:scale-[1.02] transition-all">
           <CardContent className="p-8">
              <Fuel className="absolute -top-10 -right-10 w-48 h-48 opacity-20 text-white" />
              <div className="space-y-6">
                <p className="text-xs font-black uppercase tracking-widest text-blue-200">Total Fuel Spent</p>
                <h3 className="text-4xl font-black tracking-tight">
                   TZS {totalFuelCost.toLocaleString()}
                </h3>
                <div className="pt-4">
                    <Progress value={Math.min((totalFuel/10000)*100, 100)} className="h-2 bg-blue-950 border-0" />
                    <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest mt-3">{totalFuel.toLocaleString()} Liters Dispatched</p>
                </div>
              </div>
           </CardContent>
        </Card>

        <Card className="border-0 shadow-2xl rounded-[3rem] bg-white dark:bg-slate-900 relative overflow-hidden group hover:scale-[1.02] transition-all">
           <CardContent className="p-8">
              <Gauge className="absolute -top-10 -right-10 w-48 h-48 opacity-5 text-slate-800 dark:text-white" />
              <div className="space-y-6">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Avg Efficiency Rating</p>
                <h3 className="text-6xl font-black tracking-tight text-slate-900 dark:text-white italic">
                   {avgEfficiency}
                   <span className="text-sm font-bold opacity-30 ml-2 uppercase">KM/L</span>
                </h3>
                <div className="pt-4 flex justify-between items-center text-emerald-600">
                    <div className="flex gap-1.5 items-end h-8">
                       <div className="w-2 h-4 bg-emerald-500 rounded-full" />
                       <div className="w-2 h-7 bg-emerald-500 rounded-full" />
                       <div className="w-2 h-8 bg-emerald-500 rounded-full" />
                       <div className="w-2 h-5 bg-emerald-500 rounded-full" />
                    </div>
                    <Badge className="bg-emerald-50 text-emerald-600 border-0 font-black uppercase text-[9px] px-3">Performance Goal</Badge>
                </div>
              </div>
           </CardContent>
        </Card>

        <Card className="border-0 shadow-2xl rounded-[3rem] bg-amber-500 text-white relative overflow-hidden group hover:scale-[1.02] transition-all">
           <CardContent className="p-8">
              <Clock className="absolute -top-10 -right-10 w-48 h-48 opacity-20 text-white" />
              <div className="space-y-6">
                <p className="text-xs font-black uppercase tracking-widest text-amber-100">Historical System Downtime</p>
                <h3 className="text-6xl font-black tracking-tight italic">
                   {(totalDowntime / 60).toFixed(1)}
                   <span className="text-sm font-bold opacity-60 ml-2 uppercase tracking-tighter">Hours</span>
                </h3>
                <div className="pt-4 bg-black/10 p-4 rounded-3xl flex items-center gap-4">
                    <Zap className="w-6 h-6 text-amber-200 fill-current" />
                    <p className="text-[10px] font-black uppercase tracking-widest">Operational Latency Detected</p>
                </div>
              </div>
           </CardContent>
        </Card>
      </div>

      {/* ── Charts & Diagnostics ── */}
      <div className="grid lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-10">
             <DashboardCharts
                data={{
                   blasting: [],
                   drilling: [],
                   material: chartData,
                   fuel: []
                }}
             />
          </div>
          
          <div className="space-y-10">


             <PredictiveMaintenance />
          </div>
      </div>

      {/* ── Module Grid ── */}
      <div className="space-y-10">
         <div className="flex items-center gap-4">
            <h2 className="text-2xl font-black uppercase italic tracking-tighter text-slate-400">Operation Control Logic</h2>
            <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
         </div>
         
         <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-6">
            {[
               { name: "Blasting", icon: Bomb, val: blasting, href: "/blasting", color: "bg-orange-500" },
               { name: "Drilling", icon: Drill, val: drilling, href: "/drilling", color: "bg-blue-600" },
               { name: "Haulage", icon: Truck, val: material, href: "/material-handling", color: "bg-emerald-600" },
               { name: "Core Log", icon: Diamond, val: diamond, href: "/diamond-drilling", color: "bg-purple-600" },
               { name: "Inventory", icon: Landmark, val: "ACTIVE", href: "/inventory", color: "bg-slate-800" },
               { name: "Safety", icon: Shield, val: safetyIncidents, href: "/safety", color: safetyIncidents > 0 ? "bg-red-600" : "bg-emerald-600" },
               { name: "Invoices", icon: Receipt, val: "REVENUE", href: "/invoices", color: "bg-indigo-600" },
               { name: "Fleet", icon: Truck, val: totalVehicles, href: "/fleet", color: "bg-slate-700" },
            ].map(m => (
               <Link href={m.href} key={m.name} className="group">
                  <Card className="border-0 shadow-xl group-hover:bg-slate-900 group-hover:text-white transition-all cursor-pointer rounded-[2.5rem] overflow-hidden">
                     <CardContent className="p-8 text-center space-y-4">
                        <div className={`mx-auto w-14 h-14 ${m.color} text-white rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                           <m.icon className="w-7 h-7" />
                        </div>
                        <div>
                           <p className="text-lg font-black uppercase tracking-tighter leading-none">{m.name}</p>
                           <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-2">{m.val} UNLOCKS</p>
                        </div>
                     </CardContent>
                  </Card>
               </Link>
            ))}
         </div>
      </div>

    </div>
  )
}
