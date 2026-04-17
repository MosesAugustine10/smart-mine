"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Truck } from "lucide-react"

const alerts = [
  { id: '1', vehicle: 'DTH-042', system: 'Hydraulic Pressure', probability: 82, urgency: 'High' },
  { id: '2', vehicle: 'TR-105', system: 'Engine Temperature', probability: 64, urgency: 'Medium' },
  { id: '3', vehicle: 'EX-009', system: 'Fuel Injection', probability: 41, urgency: 'Low' },
]

export function PredictiveMaintenance() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-slate-800 dark:text-white">
          Predictive Maintenance
        </CardTitle>
        <p className="text-xs text-slate-400">Fleet failure probability alerts</p>
      </CardHeader>
      <CardContent>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {alerts.map((alert) => (
            <div key={alert.id} className="py-3 flex items-center gap-4">
              <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg shrink-0">
                <Truck className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-semibold text-slate-800 dark:text-white">{alert.vehicle}</p>
                  <Badge
                    variant="outline"
                    className={`text-xs shrink-0 ml-2 ${
                      alert.urgency === 'High' ? 'border-red-300 text-red-600'
                      : alert.urgency === 'Medium' ? 'border-amber-300 text-amber-600'
                      : 'border-green-300 text-green-600'
                    }`}
                  >
                    {alert.urgency}
                  </Badge>
                </div>
                <p className="text-xs text-slate-400 mb-2">{alert.system}</p>
                <div className="flex items-center gap-2">
                  <Progress value={alert.probability} className="h-1.5 flex-1" />
                  <span className="text-xs font-medium text-slate-500 shrink-0 w-9 text-right">{alert.probability}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
