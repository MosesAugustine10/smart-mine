"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from "recharts"
import { TrendingUp, Target, Zap } from "lucide-react"

interface BudgetVsActualProps {
  plannedCost?: number
  actualCost?: number
  plannedExplosive?: number
  actualExplosive?: number
  plannedHoles?: number
  actualHoles?: number
  // Alternate: pass raw operations and let the component derive values
  operations?: Array<{
    planned_budget_tzs?: number
    actual_cost_tzs?: number
    required_explosive_kg_planned?: number
    actual_explosive_kg?: number
    number_of_holes?: number
    bags_of_anfo_actual?: number
  }>
}

export function BlastingBudgetVsActual({ 
  plannedCost: _plannedCost, 
  actualCost: _actualCost, 
  plannedExplosive: _plannedExplosive, 
  actualExplosive: _actualExplosive, 
  plannedHoles: _plannedHoles, 
  actualHoles: _actualHoles,
  operations = []
}: BudgetVsActualProps) {
  // If raw operations array was passed, derive aggregated values from it
  const plannedCost = _plannedCost ?? operations.reduce((s, o) => s + (o.planned_budget_tzs ?? 0), 0)
  const actualCost = _actualCost ?? operations.reduce((s, o) => s + (o.actual_cost_tzs ?? 0), 0)
  const plannedExplosive = _plannedExplosive ?? operations.reduce((s, o) => s + (o.required_explosive_kg_planned ?? 0), 0)
  const actualExplosive = _actualExplosive ?? operations.reduce((s, o) => s + (o.actual_explosive_kg ?? 0), 0)
  const plannedHoles = _plannedHoles ?? operations.reduce((s, o) => s + (o.number_of_holes ?? 0), 0)
  const actualHoles = _actualHoles ?? operations.reduce((s, o) => s + (o.bags_of_anfo_actual ?? 0), 0)
  
  const costData = [
    {
      name: "Total Cost (TZS)",
      Plan: plannedCost,
      Actual: actualCost,
    }
  ]

  const resourceData = [
    {
      name: "Explosives (kg)",
      Plan: plannedExplosive,
      Actual: actualExplosive,
    },
    {
      name: "Drill Holes",
      Plan: plannedHoles,
      Actual: actualHoles,
    }
  ]

  return (
    <Card className="border shadow-sm">
      <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-emerald-500" />
          Net Corporate Budget: Planning vs Execution Phase
        </CardTitle>
        <CardDescription className="text-xs">
          Comparison of Phase 1 (Budget Design) vs Phase 2 (Site Execution)
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Phase Cards */}
          <div className="flex flex-col gap-4">
            <div className="p-4 border rounded-xl bg-blue-50/30 border-blue-100 flex items-start gap-3">
              <div className="bg-blue-100 p-2 rounded-lg"><Target className="w-4 h-4 text-blue-600" /></div>
              <div>
                <h4 className="font-bold text-sm text-blue-800">Planning Phase (Budget)</h4>
                <div className="mt-2 text-xs font-medium text-slate-600 space-y-1">
                  <p>Budgeted Cost: TZS {plannedCost.toLocaleString()}</p>
                  <p>Budgeted Explosives: {plannedExplosive.toLocaleString()} kg</p>
                  <p>Planned Holes: {plannedHoles}</p>
                </div>
              </div>
            </div>

            <div className="p-4 border rounded-xl bg-orange-50/30 border-orange-100 flex items-start gap-3">
              <div className="bg-orange-100 p-2 rounded-lg"><Zap className="w-4 h-4 text-orange-600" /></div>
              <div>
                <h4 className="font-bold text-sm text-orange-800">Execution Phase (Actual Site)</h4>
                <div className="mt-2 text-xs font-medium text-slate-600 space-y-1">
                  <p>Actual Cost: TZS {actualCost.toLocaleString()}</p>
                  <p>Actual Explosives: {actualExplosive.toLocaleString()} kg</p>
                  <p>Drilled Holes: {actualHoles}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="space-y-6">
            <div className="h-[120px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={costData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tickFormatter={(value) => `TZS ${(value/1000000).toFixed(1)}M`} />
                  <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 10, fontWeight: 'bold'}} />
                  <RechartsTooltip cursor={{fill: 'transparent'}} contentStyle={{fontSize: "12px", borderRadius: "8px"}} />
                  <Legend iconSize={10} wrapperStyle={{fontSize: '10px', paddingTop: '10px'}} />
                  <Bar dataKey="Plan" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="Actual" fill="#f97316" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="h-[150px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={resourceData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{fontSize: 10, fontWeight: 'bold'}} />
                  <YAxis tickFormatter={(value) => `${value}`} width={40} tick={{fontSize: 10}} />
                  <RechartsTooltip cursor={{fill: 'transparent'}} contentStyle={{fontSize: "12px", borderRadius: "8px"}} />
                  <Bar dataKey="Plan" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="Actual" fill="#f97316" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      </CardContent>
    </Card>
  )
}

// Alias export for backward compatibility
export { BlastingBudgetVsActual as BudgetVsActualChart }
