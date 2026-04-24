"use client"

import { DashboardHeader } from "@/components/dashboard-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Plus, Diamond, TrendingUp, DollarSign, Activity, Gauge,
  FileText, Calendar, Target, Gem, AlertTriangle, Compass
} from "lucide-react"
import Link from "next/link"
import { DiamondDrillingTable } from "@/components/diamond-drilling/diamond-drilling-table"
import { ProfessionalReportButton } from "@/components/ui/professional-report-button"
import { Badge } from "@/components/ui/badge"
import { useTranslation } from "@/components/language-context"
import { useState, useEffect } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Loader2 } from "lucide-react"
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts'

type RegionSummary = {
  [key: string]: {
    count: number
    depth: number
    core: number
    recovery: number
  }
}

export default function DiamondDrillingPage() {
  const { t } = useTranslation()
  const [diamondOps, setDiamondOps] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchDiamond() {
        const supabase = getSupabaseBrowserClient()
        const { data } = await supabase
            .from("diamond_drilling_operations")
            .select("*")
            .order("date", { ascending: false })
        
        if (data) setDiamondOps(data)
        setLoading(false)
    }
    fetchDiamond()
  }, [])

  // Calculate summary statistics
  const totalOps = diamondOps.length
  
  const totalDepth = diamondOps.reduce(
    (sum, op) => sum + (Number.parseFloat(op.actual_depth_meters) || 0), 
    0
  )
  
  const totalCore = diamondOps.reduce(
    (sum, op) => sum + (Number.parseFloat(op.core_recovered_meters) || 0), 
    0
  )
  
  const totalCost = diamondOps.reduce(
    (sum, op) => sum + (Number.parseFloat(op.total_cost) || 0), 
    0
  )
  
  const totalBudget = diamondOps.reduce(
    (sum, op) => sum + (Number.parseFloat(op.planned_budget_tzs) || 0), 
    0
  )
  
  const overBudgetOps = diamondOps.filter(op => 
       (Number.parseFloat(op.planned_budget_tzs) > 0) && 
       (Number.parseFloat(op.total_cost) > Number.parseFloat(op.planned_budget_tzs))
  ).length
  
  const avgRecovery = totalOps > 0 
    ? diamondOps.reduce((sum, op) => sum + (Number.parseFloat(op.recovery_percentage) || 0), 0) / totalOps 
    : 0

  const avgPenetration = totalOps > 0 
    ? diamondOps.reduce((sum, op) => sum + (Number.parseFloat(op.penetration_rate_m_per_h) || 0), 0) / totalOps 
    : 0

  const totalSamples = diamondOps.filter(op => op.sample_collected).length

  // Group by region
  const regionSummary = diamondOps.reduce((acc: RegionSummary, op) => {
    if (!acc[op.region]) {
      acc[op.region] = { count: 0, depth: 0, core: 0, recovery: 0 }
    }
    acc[op.region].count++
    acc[op.region].depth += op.actual_depth_meters || 0
    acc[op.region].core += op.core_recovered_meters || 0
    acc[op.region].recovery += op.recovery_percentage || 0
    return acc
  }, {})

  const uniqueRegions = Object.keys(regionSummary).length

  // Get active operations
  const activeOps = diamondOps.filter(op => op.status === 'in_progress' || op.status === 'ongoing').length

  // Recovery rate categories
  const excellentRecovery = diamondOps.filter(op => (op.recovery_percentage || 0) >= 95).length
  const goodRecovery = diamondOps.filter(op => (op.recovery_percentage || 0) >= 85 && (op.recovery_percentage || 0) < 95).length
  const poorRecovery = diamondOps.filter(op => (op.recovery_percentage || 0) < 85).length

  const reportColumns = [
    { key: "drill_number", label: "Drill No." },
    { key: "date", label: "Date" },
    { key: "shift", label: "Shift" },
    { key: "region", label: "Region" },
    { key: "location", label: "Location" },
    { key: "hole_number", label: "Hole #" },
    { key: "actual_depth_meters", label: "Depth (m)" },
    { key: "core_recovered_meters", label: "Core (m)" },
    { key: "recovery_percentage", label: "Recovery %" },
    { key: "rqd", label: "RQD %" },
    { key: "penetration_rate_m_per_h", label: "Penetration (m/h)" },
    { key: "planned_budget_tzs", label: "Planned Budget" },
    { key: "total_cost", label: "Actual Cost" },
    { key: "sample_collected", label: "Sample" },
    { key: "status", label: "Status" },
  ]
  
  const reportSummary = {
     Total_Ops: totalOps,
     Total_Core_Meters: totalCore.toFixed(2),
     Average_Recovery: `${avgRecovery.toFixed(2)}%`,
     Net_Corporate_Budget: `TZS ${totalBudget.toLocaleString()}`,
     Net_Actual_Expense: `TZS ${totalCost.toLocaleString()}`,
     Collected_Samples: totalSamples
  }

  const recoveryChartData = diamondOps.slice(0, 15).reverse().map(op => ({
      label: op.hole_number || op.drill_number,
      value: Number(op.recovery_percentage) || 0
  }))

  const chartConfigs = [{
      type: "bar" as const,
      title: "Core Recovery Quality (%)",
      data: recoveryChartData,
      color: "#8b5cf6"
  }]

    if (loading) return (
        <div className="h-screen w-full flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading Core Portfolio...</p>
        </div>
    )

    return (
    <div className="flex-1 overflow-auto bg-slate-50/30 dark:bg-slate-950 pb-20 p-8 space-y-10">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div className="space-y-1">
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                    <Compass className="w-6 h-6" />
                </div>
                Diamond Core Ledger
            </h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Exploration analytics & core quality</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
            <ProfessionalReportButton 
               data={diamondOps} 
               filename="DIAMOND_DRILLING_BUDGET_REPORT" 
               title="Budget & Financial Estimations Report" 
               moduleColor="indigo"
               buttonLabel="BUDGET REPORT"
               headers={['date', 'region', 'planned_budget_tzs', 'total_cost', 'status']}
            />
            <ProfessionalReportButton 
               data={diamondOps} 
               filename="DIAMOND_DRILLING_SITE_REPORT" 
               title="Site Execution & Operations Report" 
               moduleColor="indigo"
               buttonLabel="SITE REPORT"
               charts={chartConfigs}
               kpis={[
                 { label: "AVG RECOVERY", value: avgRecovery.toFixed(1) + "%" },
                 { label: "TOTAL CORE", value: totalCore.toFixed(1) + "m" },
                 { label: "SAMPLES", value: totalSamples }
               ]}
            />
            <Link href="/diamond-drilling/new">
                <Button className="h-12 px-6 rounded-2xl bg-slate-900 hover:bg-black text-white font-black uppercase text-[10px] tracking-widest shadow-xl transition-all">
                    <Plus className="w-4 h-4 mr-2" /> Log Core
                </Button>
            </Link>
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
           <Card className="border-0 shadow-lg bg-white overflow-hidden relative group transition-all hover:scale-[1.02]">
            <CardContent className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
                  <Diamond className="w-6 h-6" />
                </div>
                <Badge className="bg-indigo-100 text-indigo-700 border-0 font-black text-[9px] uppercase tracking-widest">{totalOps} Active</Badge>
              </div>
              <h3 className="text-4xl font-black text-slate-800">{totalCore.toLocaleString()}</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-4">Total Core Meters</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white overflow-hidden relative group transition-all hover:scale-[1.02]">
            <CardContent className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-purple-50 rounded-2xl text-purple-600">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <Badge className="bg-purple-100 text-purple-700 border-0 font-black text-[9px] uppercase tracking-widest">Global</Badge>
              </div>
              <h3 className="text-4xl font-black text-slate-800">{totalDepth.toLocaleString()}</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-4">Calculated Target Depth</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white overflow-hidden relative group transition-all hover:scale-[1.02]">
            <CardContent className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
                  <Target className="w-6 h-6" />
                </div>
                <Badge className="bg-emerald-100 text-emerald-700 border-0 font-black text-[9px] uppercase tracking-widest">Quality</Badge>
              </div>
              <h3 className="text-4xl font-black text-slate-800">{avgRecovery.toFixed(1)}%</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-4">Net Global Recovery</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white overflow-hidden relative group transition-all hover:scale-[1.02]">
            <CardContent className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
                  <Gem className="w-6 h-6" />
                </div>
                <Badge className="bg-blue-100 text-blue-700 border-0 font-black text-[9px] uppercase tracking-widest">Lab</Badge>
              </div>
              <h3 className="text-4xl font-black text-slate-800">{totalSamples}</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-4">Total Collected Samples</p>
            </CardContent>
          </Card>

          <Card className={`col-span-1 xl:col-span-2 border-0 shadow-xl overflow-hidden relative text-white transition-all hover:scale-[1.02] ${overBudgetOps > 0 ? "bg-red-600" : "bg-slate-900"}`}>
            <CardContent className="p-8">
               <div className="flex justify-between items-center mb-6">
                  <div className="p-3 bg-white/10 rounded-2xl">
                    <DollarSign className="w-6 h-6" />
                  </div>
                  {overBudgetOps > 0 && <Badge className="bg-white/20 text-white border-0 font-black text-[9px] uppercase tracking-widest flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> {overBudgetOps} Projects Exceeding Budget</Badge>}
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-3xl font-black text-white">TZS {(totalCost / 1000000).toFixed(2)}M</h3>
                    <p className="text-[10px] font-black opacity-60 uppercase tracking-widest mt-2">Burn Rate (Actual)</p>
                  </div>
                  <div className="text-right">
                    <h3 className="text-3xl font-black text-white">TZS {(totalBudget / 1000000).toFixed(2)}M</h3>
                    <p className="text-[10px] font-black opacity-60 uppercase tracking-widest mt-2">Approved Target</p>
                  </div>
               </div>
               <Gem className="absolute -bottom-6 -right-6 w-32 h-32 opacity-5" />
            </CardContent>
          </Card>
      </div>

          {/* Secondary Stats Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             {/* Chart */}
             <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-[3rem] p-8 border shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                   <Activity className="w-32 h-32" />
                </div>
                <div className="flex items-center justify-between mb-8 relative z-10">
                   <div>
                      <h3 className="text-xl font-black tracking-tighter uppercase italic text-slate-900 dark:text-white">Shaft Quality Matrix</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Real-time recovery performance across holes</p>
                   </div>
                </div>
                <div className="h-[350px] w-full relative z-10">
                   <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={recoveryChartData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.05} stroke="#6366f1" />
                          <XAxis dataKey="label" fontSize={10} fontWeight={900} axisLine={false} tickLine={false} />
                          <YAxis fontSize={10} fontWeight={900} axisLine={false} tickLine={false} unit="%" />
                          <Tooltip 
                              contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.2)', padding: '20px' }}
                              cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }}
                          />
                          <Bar dataKey="value" radius={[12, 12, 4, 4]} barSize={40}>
                              {recoveryChartData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.value < 85 ? '#f43f5e' : entry.value < 95 ? '#f59e0b' : '#6366f1'} />
                              ))}
                          </Bar>
                      </BarChart>
                   </ResponsiveContainer>
                </div>
             </div>

             {/* Metrics Panel */}
             <div className="space-y-6">
                <Card className="rounded-[2.5rem] bg-slate-900 text-white overflow-hidden border-0 shadow-2xl">
                   <CardHeader className="p-8 pb-4">
                      <CardTitle className="text-xs font-black uppercase tracking-widest text-indigo-400 flex items-center justify-between">
                         Structural Integrity
                         <Activity className="w-4 h-4" />
                      </CardTitle>
                   </CardHeader>
                   <CardContent className="p-8 pt-0 space-y-6">
                      {[
                        { label: "Elite (HQ) ≥95%", val: excellentRecovery, color: "bg-indigo-500", icon: Gauge },
                        { label: "Optimal (PQ) 85-94%", val: goodRecovery, color: "bg-amber-500", icon: Gauge },
                        { label: "Alert (<85%)", val: poorRecovery, color: "bg-rose-500", icon: AlertTriangle }
                      ].map((m, i) => (
                        <div key={i} className="flex flex-col gap-2">
                          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-tight">
                             <span className="flex items-center gap-2">
                               <m.icon className={`w-3.5 h-3.5 ${m.color.replace('bg-', 'text-')}`} />
                               {m.label}
                             </span>
                             <span>{m.val}</span>
                          </div>
                          <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                             <div className={`h-full ${m.color}`} style={{ width: `${(m.val / (totalOps || 1)) * 100}%` }} />
                          </div>
                        </div>
                      ))}
                   </CardContent>
                </Card>

                <Card className="rounded-[2.5rem] bg-indigo-600 text-white overflow-hidden border-0 shadow-2xl relative">
                   <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-violet-800 opacity-50" />
                   <CardContent className="p-8 relative z-10 flex flex-col justify-between h-full min-h-[160px]">
                      <div className="flex items-center justify-between mb-4">
                         <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200">Velocity Efficiency</p>
                      </div>
                      <div>
                         <h3 className="text-4xl font-black tracking-tighter">{avgPenetration.toFixed(2)}</h3>
                         <p className="text-[10px] font-bold uppercase tracking-widest mt-1 opacity-80">Meters per hour average</p>
                      </div>
                   </CardContent>
                </Card>
             </div>
          </div>
          
        
        {/* ── DATA REGISTRY ── */}
        <div className="space-y-6 pb-20 pt-4">
            <div className="flex items-center gap-4 px-2">
               <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-lg">
                  <FileText className="w-5 h-5" />
               </div>
               <div>
                  <h3 className="text-xl font-black uppercase tracking-tighter italic text-slate-900 dark:text-white">Field Registry</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Immutable historical core performance ledger</p>
               </div>
            </div>
            <DiamondDrillingTable diamondOps={diamondOps} />
        </div>
    </div>
  )
}
