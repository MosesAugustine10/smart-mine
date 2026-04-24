"use client"

import { DashboardHeader } from "@/components/dashboard-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Plus, Radio, Activity, MapPin, Calendar, Users, 
  CheckCircle, Clock, AlertCircle, Download, 
  TrendingUp, Target, Layers, Compass, FileText, 
  RefreshCw, Home, BarChart3, ClipboardList, 
  Sparkles, Gauge, Zap, Globe, DollarSign
} from "lucide-react"
import Link from "next/link"
import { GeophysicsTable } from "@/components/geophysics/geophysics-table"
import { ProfessionalReportButton } from "@/components/ui/professional-report-button"
import { TimeFrameSwitcher } from "@/components/material-handling/time-frame-switcher"
import { useTranslation } from "@/components/language-context"
import { useState, useEffect } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Loader2 } from "lucide-react"

// Remove server-side export for client components

export default function GeophysicsDashboardPage({ searchParams }: any) {
  const { t } = useTranslation()
  const [surveys, setSurveys] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('monthly')

  // In Client components, searchParams is already resolved or handled by useSearchParams hook
  // But we can just use the prop directly if it's passed.
  useEffect(() => {
    if (searchParams?.period) setPeriod(searchParams.period)
  }, [searchParams])

  useEffect(() => {
    async function fetchGeophysics() {
        const supabase = getSupabaseBrowserClient()
        const { data } = await supabase
            .from("geophysics_surveys")
            .select("*")
            .order("created_at", { ascending: false })
        
        if (data) setSurveys(data)
        setLoading(false)
    }
    fetchGeophysics()
  }, [])

  // KPIs
  const totalSurveys = surveys.length
  const activeSurveys = surveys.filter(s => s.status === 'in_progress').length
  const completedSurveys = surveys.filter(s => s.status === 'completed').length
  
  const totalPlannedBudget = surveys.reduce((sum, s) => sum + (Number(s.planned_budget_tzs) || 0), 0)
  const totalActualCost = surveys.reduce((sum, s) => sum + (Number(s.actual_cost_tzs) || 0), 0)
  
  const budgetUtilization = totalPlannedBudget > 0 ? (totalActualCost / totalPlannedBudget) * 100 : 0
  const completionRate = totalSurveys > 0 ? (completedSurveys / totalSurveys) * 100 : 0

    if (loading) return (
        <div className="h-screen w-full flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-purple-600" />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading Geophysics Registry...</p>
        </div>
    )

    return (
    <>
      <DashboardHeader 
        title={t('geophysics' as any) || "Geophysics Center"} 
        description="Enterprise-grade acquisition tracking and data management" 
      />
      <div className="mx-6 mt-4 mb-2 flex flex-wrap gap-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 border shadow-sm">
        <div className="w-full text-xs font-black uppercase tracking-widest text-slate-500 mb-1">Global Reporting Actions</div>
        <ProfessionalReportButton 
              data={surveys} 
              filename="GEOPHYSICS_OPERATIONS_BUDGET_REPORT" 
              title="Budget & Financial Estimations Report" 
              moduleColor="purple"
              buttonLabel="BUDGET DOWNLOAD REPORT"
              headers={['date', 'region', 'planned_budget_tzs', 'total_cost', 'status']}
            />
            <ProfessionalReportButton 
              data={surveys} 
              filename="GEOPHYSICS_OPERATIONS_SITE_REPORT" 
              title="Site Execution & Operations Report" 
              moduleColor="purple"
              buttonLabel="SITE DOWNLOAD REPORT"
            />
      </div>
      
      <div className="flex-1 overflow-auto p-8 space-y-8 bg-slate-50/30 dark:bg-slate-950/30">
        
        {/* Top Actions & Filters */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-1.5 rounded-full shadow-sm border">
                <TimeFrameSwitcher baseUrl="/geophysics" />
            </div>
            <div className="flex items-center gap-3">
                
            
            
                <Link href="/geophysics/new">
                    <Button className="bg-gradient-to-r from-purple-700 to-indigo-800 hover:from-purple-800 hover:to-indigo-900 shadow-lg h-11 px-6 rounded-full font-bold">
                        <Plus className="mr-2 h-5 w-5" /> 
                        Launch New Survey
                    </Button>
                </Link>
            </div>
        </div>

        {/* Premium KPI Grid - 5 Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-600 to-purple-800 text-white rounded-[2.5rem] hover:scale-[1.02] transition-all relative overflow-hidden">
                <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-bold uppercase tracking-widest opacity-80">Campaigns Total</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-4xl font-extrabold">{totalSurveys}</div>
                    <div className="flex items-center gap-2 mt-4 text-[10px] bg-white/10 p-2 rounded-lg">
                        <Radio className="w-3 h-3 text-purple-200" />
                        <span>{activeSurveys} Active In Field</span>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-0 shadow-lg rounded-[2.5rem] hover:scale-[1.02] transition-all relative overflow-hidden bg-white dark:bg-slate-900">
                <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Budget Variance</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className={`text-3xl font-extrabold ${totalActualCost > totalPlannedBudget ? 'text-red-500' : 'text-emerald-500'}`}>
                        {Math.abs(100 - budgetUtilization).toFixed(1)}%
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-2">{totalActualCost > totalPlannedBudget ? 'OVER BUDGET' : 'UNDER BUDGET'}</p>
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full mt-4 overflow-hidden">
                        <div 
                            className={`h-full ${totalActualCost > totalPlannedBudget ? 'bg-red-500' : 'bg-emerald-500'}`} 
                            style={{ width: `${Math.min(budgetUtilization, 100)}%` }}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card className="border-0 shadow-lg rounded-[2.5rem] hover:scale-[1.02] transition-all relative overflow-hidden bg-white dark:bg-slate-900">
                <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Actual Spend</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">
                        {totalActualCost.toLocaleString()} <span className="text-xs font-normal">TZS</span>
                    </div>
                    <div className="flex items-center gap-1 mt-4 text-[10px] text-emerald-600 font-bold">
                        <TrendingUp className="w-3 h-3" />
                        <span>AGGREGATE FIELD COST</span>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-0 shadow-lg rounded-[2.5rem] hover:scale-[1.02] transition-all relative overflow-hidden bg-white dark:bg-slate-900">
                <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Completion</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-extrabold text-indigo-600">{completionRate.toFixed(1)}%</div>
                    <div className="grid grid-cols-3 gap-1 mt-5">
                        <div className={`h-1.5 rounded-full ${completionRate > 30 ? 'bg-indigo-600' : 'bg-slate-200'}`} />
                        <div className={`h-1.5 rounded-full ${completionRate > 60 ? 'bg-indigo-600' : 'bg-slate-200'}`} />
                        <div className={`h-1.5 rounded-full ${completionRate > 90 ? 'bg-indigo-600' : 'bg-slate-200'}`} />
                    </div>
                </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-slate-900 text-white rounded-[2.5rem] hover:scale-[1.02] transition-all relative overflow-hidden">
                <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-bold uppercase tracking-widest opacity-80">Health Check</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                    <div>
                        <div className="text-xl font-bold">OPTIMAL</div>
                        <p className="text-[10px] opacity-60">Field Logistics</p>
                    </div>
                    <Zap className="w-10 h-10 text-yellow-500 fill-yellow-500" />
                </CardContent>
            </Card>
        </div>

        {/* Survey Ledger Table */}
        <div className="space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2 px-1">
                <Layers className="w-5 h-5 text-purple-600" />
                Active Acquisition Ledger
            </h3>
            <GeophysicsTable surveys={surveys} />
        </div>

      </div>
    </>
  )
}
