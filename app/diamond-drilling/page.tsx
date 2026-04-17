"use client"

import { DashboardHeader } from "@/components/dashboard-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Plus, Diamond, TrendingUp, DollarSign, Activity, Gauge,
  FileText, Calendar, Target, Gem, AlertTriangle
} from "lucide-react"
import Link from "next/link"
import { DiamondDrillingTable } from "@/components/diamond-drilling/diamond-drilling-table"
import { ProfessionalReportButton } from "@/components/ui/professional-report-button"
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
    <>
      <DashboardHeader title={t('diamond_ops' as any) || t('drilling')} description="Manage core drilling, budgets, and integrated analytical reports" />
      <div className="mx-6 mt-4 mb-2 flex flex-wrap gap-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 border shadow-sm">
        <div className="w-full text-xs font-black uppercase tracking-widest text-slate-500 mb-1">Global Reporting Actions</div>
        <ProfessionalReportButton 
              data={diamondOps} 
              filename="DIAMOND_DRILLING_BUDGET_REPORT" 
              title="Budget & Financial Estimations Report" 
              moduleColor="indigo"
              buttonLabel="BUDGET DOWNLOAD REPORT"
              headers={['date', 'region', 'planned_budget_tzs', 'total_cost', 'status']}
            />
            <ProfessionalReportButton 
              data={diamondOps} 
              filename="DIAMOND_DRILLING_SITE_REPORT" 
              title="Site Execution & Operations Report" 
              moduleColor="indigo"
              buttonLabel="SITE DOWNLOAD REPORT"
              charts={chartConfigs}
              kpis={[
                { label: "AVG RECOVERY", value: avgRecovery.toFixed(1) + "%" },
                { label: "TOTAL CORE", value: totalCore.toFixed(1) + "m" },
                { label: "SAMPLES", value: totalSamples }
              ]}
            />
      </div>
      
      <div className="flex-1 overflow-auto p-6 space-y-6">
        
        {/* Performance Overview Section */}
        <div className="bg-white dark:bg-gray-950 rounded-xl border shadow-sm p-6 relative overflow-hidden">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 relative z-10">
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                Exploration Core Portfolio
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Real-time financial and geological dashboard
              </p>
            </div>
            
            <div className="flex items-center gap-3">
                {overBudgetOps > 0 && (
                   <div className="flex items-center gap-2 bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-400 px-3 py-1.5 rounded-lg border border-rose-200 shadow-sm">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-sm font-semibold">{overBudgetOps} Projects Over Budget</span>
                   </div>
                )}
                <span className="text-sm bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 px-3 py-1.5 rounded-lg border border-violet-200 font-medium">
                  {new Date().toLocaleDateString()}
                </span>
            </div>
          </div>

          {/* Main KPI Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 mb-6 relative z-10">
            
            <Card className="border-l-4 border-l-violet-500 hover:shadow-lg transition-shadow bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Operations</CardTitle>
                <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg">
                  <Diamond className="h-4 w-4 text-violet-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalOps}</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1 font-semibold text-emerald-600">
                  <Calendar className="h-3 w-3" />
                  {activeOps} active now
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-shadow bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Hole Depth</CardTitle>
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalDepth.toLocaleString()}</div>
                <p className="text-[10px] text-muted-foreground">meters cumulatively</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-pink-500 hover:shadow-lg transition-shadow bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Core Recovered</CardTitle>
                <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-lg">
                  <Gem className="h-4 w-4 text-pink-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalCore.toLocaleString()}</div>
                <p className="text-[10px] text-muted-foreground">meters of physical core</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-emerald-500 hover:shadow-lg transition-shadow bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Net Recovery</CardTitle>
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                  <Target className="h-4 w-4 text-emerald-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{avgRecovery.toFixed(1)}%</div>
                <p className="text-[10px] text-muted-foreground">global recovery average</p>
              </CardContent>
            </Card>

            <Card className="xl:col-span-2 border-l-4 border-l-orange-500 hover:shadow-lg transition-shadow bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm shadow-md ring-1 ring-orange-500/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-1.5"><DollarSign className="w-4 h-4 text-orange-600"/> Corporate Budget Control</CardTitle>
              </CardHeader>
              <CardContent>
                 <div className="flex gap-4">
                    <div className="border-r pr-4 border-slate-200 dark:border-slate-800">
                      <div className="text-[10px] text-muted-foreground font-semibold mb-1 uppercase tracking-wider">Approved Target</div>
                      <div className="text-xl font-bold text-slate-700 dark:text-slate-300">{(totalBudget / 1000000).toFixed(2)}M</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-muted-foreground font-semibold mb-1 uppercase tracking-wider">Burn Rate (Actual)</div>
                      <div className={`text-xl font-bold ${totalCost > totalBudget && totalBudget > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {(totalCost / 1000000).toFixed(2)}M
                      </div>
                    </div>
                 </div>
              </CardContent>
            </Card>
          </div>

          {/* Secondary Stats Row */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 relative z-10">
            <Card className="bg-gradient-to-br from-indigo-50/80 to-indigo-100/50 dark:from-indigo-950/40 dark:to-indigo-900/20 border border-indigo-100 dark:border-indigo-900">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2 border-b border-indigo-200/50 pb-2">
                  <p className="text-sm font-bold text-indigo-900 dark:text-indigo-300">Structural Integrity Matrix</p>
                  <Gauge className="h-4 w-4 text-indigo-500" />
                </div>
                <div className="space-y-2 mt-4">
                  <div className="flex items-center justify-between group">
                    <span className="text-xs text-muted-foreground font-medium group-hover:text-emerald-600 transition-colors">HQ Structure (≥95%)</span>
                    <span className="text-sm font-bold text-emerald-600">{excellentRecovery}</span>
                  </div>
                  <div className="flex items-center justify-between group">
                    <span className="text-xs text-muted-foreground font-medium group-hover:text-amber-600 transition-colors">PQ Structure (85-94%)</span>
                    <span className="text-sm font-bold text-amber-600">{goodRecovery}</span>
                  </div>
                  <div className="flex items-center justify-between group">
                    <span className="text-xs text-muted-foreground font-medium group-hover:text-rose-600 transition-colors">Fractured {'<'}85%</span>
                    <span className="text-sm font-bold text-rose-600">{poorRecovery}</span>
                  </div>
                </div>
                <div className="mt-4 h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
                  <div className="h-full bg-emerald-500 transition-all hover:opacity-80" style={{ width: `${(excellentRecovery / totalOps * 100) || 0}%` }} title={`HQ: ${Math.round((excellentRecovery/totalOps)*100)}%`} />
                  <div className="h-full bg-amber-500 transition-all hover:opacity-80" style={{ width: `${(goodRecovery / totalOps * 100) || 0}%` }} title={`PQ: ${Math.round((goodRecovery/totalOps)*100)}%`} />
                  <div className="h-full bg-rose-500 transition-all hover:opacity-80" style={{ width: `${(poorRecovery / totalOps * 100) || 0}%` }} title={`Fractured: ${Math.round((poorRecovery/totalOps)*100)}%`} />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-violet-50/80 to-violet-100/50 dark:from-violet-950/40 dark:to-violet-900/20 border border-violet-100 dark:border-violet-900">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2 border-b border-violet-200/50 pb-2">
                  <p className="text-sm font-bold text-violet-900 dark:text-violet-300">Geographic Execution</p>
                  <Diamond className="h-4 w-4 text-violet-500" />
                </div>
                <div className="flex justify-between items-end mt-4">
                  <div>
                    <div className="text-3xl font-black text-violet-700 dark:text-violet-400">{uniqueRegions}</div>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-1">Active Blocks</p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-[10px] text-muted-foreground/80 font-bold uppercase">Largest Density</p>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200 border-b border-violet-200/50 pb-1">
                      {Object.entries(regionSummary)
                        .sort(([,a], [,b]) => b.depth - a.depth)[0]?.[0] || 'N/A'}
                    </p>
                    <p className="text-[10px] text-muted-foreground/80 font-bold uppercase mt-2">Optimal Core Target</p>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      {Object.entries(regionSummary)
                        .sort(([,a], [,b]) => (b.recovery/b.count) - (a.recovery/a.count))[0]?.[0] || 'N/A'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50/80 to-blue-100/50 dark:from-blue-950/40 dark:to-blue-900/20 border border-blue-100 dark:border-blue-900 md:col-span-2 lg:col-span-1">
              <CardContent className="p-4 h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2 border-b border-blue-200/50 pb-2">
                    <p className="text-sm font-bold text-blue-900 dark:text-blue-300">Velocity Metrics</p>
                    <Activity className="h-4 w-4 text-blue-500" />
                  </div>
                  <div className="mt-4">
                    <div className="text-3xl font-black text-blue-600 dark:text-blue-400">{avgPenetration.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground font-medium mt-1">meters per hour</p>
                  </div>
                </div>
                
                <div className="mt-4">
                  <div className="flex justify-between text-[10px] uppercase font-bold text-muted-foreground mb-1">
                     <span>Friction Trace</span>
                     <span>{Math.min(avgPenetration * 15, 100).toFixed(0)}% optimal</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-200/80 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner flex">
                     <div className="h-full bg-blue-500" style={{ width: `${Math.min(avgPenetration * 15, 100)}%` }}></div>
                     <div className="h-full bg-blue-400/50 flex-1"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recovery Rate Analysis Chart */}
          <div className="mt-6 bg-slate-50 dark:bg-slate-900/40 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 relative z-10">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 mb-6 flex items-center gap-2">
                <Target className="w-4 h-4 text-violet-500" />
                Core Recovery Quality (%)
            </h3>
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={recoveryChartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                        <XAxis dataKey="label" fontSize={10} fontWeight={800} axisLine={false} tickLine={false} />
                        <YAxis fontSize={10} fontWeight={800} axisLine={false} tickLine={false} unit="%" />
                        <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }}
                            cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                        />
                        <Bar dataKey="value" radius={[6, 6, 0, 0]} name="Recovery (%)">
                            {recoveryChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.value < 85 ? '#ef4444' : entry.value < 95 ? '#f59e0b' : '#8b5cf6'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
          </div>
          
          {/* Subtle Background aesthetic */}
          <div className="absolute top-0 right-0 p-16 opacity-5 pointer-events-none z-0">
             <Diamond className="w-96 h-96 text-primary mix-blend-multiply dark:mix-blend-color-dodge rotate-12" strokeWidth={0.5} />
          </div>
        </div>

        {/* Global Action Belt */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-gray-950 rounded-xl border p-4 shadow-sm sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl border border-indigo-200 dark:border-indigo-800 shadow-inner">
              <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-tight">Core Drilling Ledger</h3>
              <p className="text-xs text-muted-foreground mt-0.5 font-medium">
                {diamondOps.length} shafts logged via Cloud architecture
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            
            
            
            
            <Link href="/diamond-drilling/new">
              <Button className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-md transition-all hover:scale-[1.02]">
                <Plus className="mr-2 h-4 w-4" /> 
                Log Diamond Shaft
              </Button>
            </Link>
          </div>
        </div>

        {/* Diamond Drilling Data Grid */}
        <DiamondDrillingTable diamondOps={diamondOps} />
      </div>
    </>
  )
}
