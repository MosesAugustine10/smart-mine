// components/blasting/blasting-trends-chart.tsx
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, Activity, BarChart3, DollarSign } from "lucide-react"

interface MonthlyData {
  tonnage: number;
  cost: number;
  count: number;
  monthName: string;
}

interface BlastingTrendsChartProps {
  operations: any[]
}

export function BlastingTrendsChart({ operations }: BlastingTrendsChartProps) {
  // Group by month with proper typing
  const monthlyData: { [key: string]: MonthlyData } = {}

  operations.forEach(op => {
    const date = new Date(op.design_date || op.execution_date || op.created_at)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const monthName = date.toLocaleString('default', { month: 'short', year: 'numeric' })

    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { tonnage: 0, cost: 0, count: 0, monthName }
    }
    monthlyData[monthKey].tonnage += (op.tonnage_t_actual || op.tonnage_t_planned || 0)
    monthlyData[monthKey].cost += (op.actual_cost_tzs || op.planned_budget_tzs || 0)
    monthlyData[monthKey].count += 1
  })

  const sortedMonths = Object.keys(monthlyData).sort()
  const maxTonnage = Math.max(...sortedMonths.map(m => monthlyData[m].tonnage), 1)
  const maxCost = Math.max(...sortedMonths.map(m => monthlyData[m].cost), 1)

  const formatNumber = (num: number) => {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toFixed(0)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('sw-TZ', {
      style: 'currency',
      currency: 'TZS',
      maximumFractionDigits: 0
    }).format(amount || 0)
  }

  if (sortedMonths.length === 0) {
    return (
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-orange-500" />
            Monthly Performance Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No data available</p>
            <p className="text-xs mt-1">Complete blasts to see trends</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-orange-500" />
          Monthly Performance Trends
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">

        {/* Tonnage Trend */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-emerald-500" />
            <span className="text-xs font-bold uppercase tracking-wider">Tonnage Trend</span>
          </div>
          <div className="space-y-2">
            {sortedMonths.map(month => {
              const data = monthlyData[month]
              const percent = maxTonnage > 0 ? (data.tonnage / maxTonnage) * 100 : 0
              return (
                <div key={month} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium">{data.monthName}</span>
                    <span className="font-bold">{formatNumber(data.tonnage)} t</span>
                  </div>
                  <div className="h-6 bg-slate-100 dark:bg-slate-800 rounded-md overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-md flex items-center justify-end px-2 text-[10px] text-white font-bold"
                      style={{ width: `${percent}%` }}
                    >
                      {percent > 20 && `${data.tonnage.toFixed(0)}t`}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Cost Trend */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-red-500" />
            <span className="text-xs font-bold uppercase tracking-wider">Cost Trend</span>
          </div>
          <div className="space-y-2">
            {sortedMonths.map(month => {
              const data = monthlyData[month]
              const percent = maxCost > 0 ? (data.cost / maxCost) * 100 : 0
              return (
                <div key={month} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium">{data.monthName}</span>
                    <span className="font-bold">{formatCurrency(data.cost)}</span>
                  </div>
                  <div className="h-6 bg-slate-100 dark:bg-slate-800 rounded-md overflow-hidden">
                    <div
                      className="h-full bg-red-500 rounded-md flex items-center justify-end px-2 text-[10px] text-white font-bold"
                      style={{ width: `${percent}%` }}
                    >
                      {percent > 20 && `${(data.cost / 1000000).toFixed(1)}M`}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t">
          <div className="text-center p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <p className="text-[10px] text-muted-foreground">Avg Monthly Tonnage</p>
            <p className="font-bold text-sm">
              {formatNumber(sortedMonths.reduce((sum, m) => sum + monthlyData[m].tonnage, 0) / sortedMonths.length)} t
            </p>
          </div>
          <div className="text-center p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <p className="text-[10px] text-muted-foreground">Total Operations</p>
            <p className="font-bold text-sm">{operations.length} blasts</p>
          </div>
        </div>

      </CardContent>
    </Card>
  )
}