// components/blasting/blasting-dashboard.tsx
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Bomb, TrendingUp, TrendingDown, DollarSign, Target,
  Activity, Shield, CheckCircle2, Clock, AlertTriangle,
  Package, MapPin, Users, FileCheck
} from "lucide-react"
import { SignatureStatusWidget } from "./signature-status-widget"
import { BudgetVsActualChart } from "./budget-vs-actual-chart"
import { BlastingTrendsChart } from "./blasting-trends-chart"

interface DashboardStats {
  total: number
  inDesign: number
  inExecution: number
  inAnalysis: number
  completed: number
  totalTonnage: number
  totalCost: number
  avgCostPerTonne: number
  safetyCompliance: number
  signatureCompletion: number
  totalExplosives: number
}

interface BlastingDashboardProps {
  stats: DashboardStats
  operations: any[]
}

export function BlastingDashboard({ stats, operations }: BlastingDashboardProps) {

  const getComplianceColor = (percent: number) => {
    if (percent >= 90) return "text-emerald-600"
    if (percent >= 70) return "text-amber-600"
    return "text-red-600"
  }

  if (stats.total === 0) {
    return (
      <Card className="border-0 shadow-lg bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Bomb className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-bold mb-2">No Blasting Operations Yet</h3>
          <p className="text-muted-foreground text-center mb-6">
            Start by creating your first blast design
          </p>
          <a href="/blasting/design/new">
            <button className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-xl font-bold">
              + New Blast Design
            </button>
          </a>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">

      {/* Phase Progress Bar */}
      <Card className="border-0 shadow-lg bg-white dark:bg-slate-900">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider">Blast Lifecycle Pipeline</h3>
            <Badge variant="outline" className="text-xs">{stats.total} Total Blasts</Badge>
          </div>
          <div className="flex h-4 rounded-full overflow-hidden">
            {stats.inDesign > 0 && (
              <div
                className="bg-blue-500 transition-all"
                style={{ width: `${(stats.inDesign / stats.total) * 100}%` }}
                title={`Design: ${stats.inDesign}`}
              />
            )}
            {stats.inExecution > 0 && (
              <div
                className="bg-amber-500 transition-all"
                style={{ width: `${(stats.inExecution / stats.total) * 100}%` }}
                title={`Execution: ${stats.inExecution}`}
              />
            )}
            {stats.inAnalysis > 0 && (
              <div
                className="bg-purple-500 transition-all"
                style={{ width: `${(stats.inAnalysis / stats.total) * 100}%` }}
                title={`Analysis: ${stats.inAnalysis}`}
              />
            )}
            {stats.completed > 0 && (
              <div
                className="bg-emerald-500 transition-all"
                style={{ width: `${(stats.completed / stats.total) * 100}%` }}
                title={`Completed: ${stats.completed}`}
              />
            )}
          </div>
          <div className="flex justify-between mt-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500" /> Design ({stats.inDesign})</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500" /> Execution ({stats.inExecution})</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-purple-500" /> Analysis ({stats.inAnalysis})</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Completed ({stats.completed})</span>
          </div>
        </CardContent>
      </Card>

      {/* Main KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">

        <Card className="border-l-4 border-l-orange-500 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wider">Total Blasts</CardTitle>
            <Bomb className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-[10px] text-muted-foreground mt-1">
              <span className="text-emerald-600">{stats.completed}</span> completed
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wider">Total Tonnage</CardTitle>
            <Target className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalTonnage >= 1000 ? `${(stats.totalTonnage / 1000).toFixed(1)}K` : stats.totalTonnage.toFixed(0)}
              <span className="text-sm font-normal ml-0.5">t</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Production volume</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wider">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              TZS {(stats.totalCost / 1000000).toFixed(1)}M
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">All operations</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wider">Cost per Tonne</CardTitle>
            <TrendingDown className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.avgCostPerTonne < 10000 ? 'text-emerald-600' : stats.avgCostPerTonne < 20000 ? 'text-amber-600' : 'text-red-600'}`}>
              TZS {stats.avgCostPerTonne.toFixed(0)}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              {stats.avgCostPerTonne < 10000 ? 'Efficient' : stats.avgCostPerTonne < 20000 ? 'Average' : 'High cost'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wider">Safety Compliance</CardTitle>
            <Shield className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getComplianceColor(stats.safetyCompliance)}`}>
              {stats.safetyCompliance.toFixed(0)}%
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Vibration & airblast within limits</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wider">Signatures</CardTitle>
            <FileCheck className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.signatureCompletion.toFixed(0)}%
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Manager approved</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2">
        <BudgetVsActualChart operations={operations} />
        <BlastingTrendsChart operations={operations} />
      </div>

      {/* Signature Status Widget */}
      <SignatureStatusWidget operations={operations} />

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <a href="/blasting/design/new">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-xl text-center hover:shadow-lg transition-all cursor-pointer">
            <Target className="h-5 w-5 mx-auto mb-2" />
            <span className="text-xs font-bold">New Design</span>
          </div>
        </a>
        <a href="/blasting/execution/pending">
          <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white p-4 rounded-xl text-center hover:shadow-lg transition-all cursor-pointer">
            <Activity className="h-5 w-5 mx-auto mb-2" />
            <span className="text-xs font-bold">Execute</span>
          </div>
        </a>
        <a href="/blasting/analysis/pending">
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-xl text-center hover:shadow-lg transition-all cursor-pointer">
            <TrendingUp className="h-5 w-5 mx-auto mb-2" />
            <span className="text-xs font-bold">Analyze</span>
          </div>
        </a>
        <button onClick={() => window.print()}>
          <div className="bg-gradient-to-r from-slate-600 to-slate-700 text-white p-4 rounded-xl text-center hover:shadow-lg transition-all cursor-pointer">
            <FileCheck className="h-5 w-5 mx-auto mb-2" />
            <span className="text-xs font-bold">Export Report</span>
          </div>
        </button>
      </div>

    </div>
  )
}