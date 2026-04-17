"use client"

import React from "react"
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ZAxis,
  Cell,
  Label
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ShieldCheck, AlertTriangle } from "lucide-react"

interface RiskMatrixChartProps {
  data: Array<{
    id: string
    title: string
    likelihood: number
    severity: number
    riskLevel: string
  }>
}

const RISK_COLORS = {
  low: "#10b981",
  medium: "#f59e0b",
  high: "#f97316",
  extreme: "#ef4444"
}

export function RiskMatrixChart({ data }: RiskMatrixChartProps) {
  // 5x5 Grid Mapping
  const gridBackground = [
      ['#10b981', '#10b981', '#f59e0b', '#f59e0b', '#f97316'],
      ['#10b981', '#10b981', '#f59e0b', '#f59e0b', '#f97316'],
      ['#f59e0b', '#f59e0b', '#f97316', '#f97316', '#ef4444'],
      ['#f59e0b', '#f97316', '#f97316', '#ef4444', '#ef4444'],
      ['#f97316', '#f97316', '#ef4444', '#ef4444', '#ef4444'],
  ]

  return (
    <Card className="border-0 shadow-2xl rounded-[3rem] overflow-hidden bg-white dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800">
      <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b p-8">
        <div className="flex justify-between items-center">
            <div>
                <CardTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2 text-slate-800 dark:text-white">
                  <AlertTriangle className="h-6 w-6 text-amber-500" />
                  Risk Matrix
                </CardTitle>
                <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1 tracking-widest">5x5 Probability vs. Consequence Visualization</p>
            </div>
            <ShieldCheck className="w-8 h-8 opacity-20" />
        </div>
      </CardHeader>
      <CardContent className="p-10">
        <div className="h-[450px] relative">
          
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 40, bottom: 40, left: 40 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis
                type="number"
                dataKey="likelihood"
                name="Likelihood"
                domain={[0.5, 5.5]}
                ticks={[1, 2, 3, 4, 5]}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }}
              >
                <Label value="LIKELIHOOD →" position="insideBottom" offset={-25} style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', fill: '#94a3b8' }} />
              </XAxis>
              <YAxis
                type="number"
                dataKey="severity"
                name="Severity"
                domain={[0.5, 5.5]}
                ticks={[1, 2, 3, 4, 5]}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }}
              >
                <Label value="SEVERITY ↑" angle={-90} position="insideLeft" offset={-25} style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', fill: '#94a3b8' }} />
              </YAxis>
              <ZAxis type="number" dataKey="id" range={[400, 400]} />
              <Tooltip
                cursor={{ strokeDasharray: "3 3" }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload
                    return (
                      <div className="bg-slate-900 text-white border-0 rounded-2xl p-4 shadow-3xl animate-in zoom-in-95">
                        <p className="font-black text-xs uppercase tracking-tight mb-2 text-amber-400">{data.title}</p>
                        <div className="space-y-1">
                            <p className="text-[9px] font-black uppercase tracking-widest opacity-60">Impact Dynamics:</p>
                            <p className="text-[10px] font-bold">Likelihood: <span className="text-white">{data.likelihood}/5</span> • Severity: <span className="text-white">{data.severity}/5</span></p>
                        </div>
                        <div className={`mt-3 px-3 py-1 rounded-full text-center text-[9px] font-black uppercase tracking-widest ${RISK_COLORS[data.riskLevel as keyof typeof RISK_COLORS]}`} style={{ color: '#fff', backgroundColor: RISK_COLORS[data.riskLevel as keyof typeof RISK_COLORS] }}>
                          {data.riskLevel} CRITICALITY
                        </div>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Scatter data={data} shape="circle">
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={RISK_COLORS[entry.riskLevel as keyof typeof RISK_COLORS]} 
                    strokeWidth={4} 
                    stroke="rgba(255,255,255,0.4)"
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
          
          {/* Risk Level Zones Overlay Guide (Simplified labels) */}
          <div className="absolute top-0 right-0 flex flex-col gap-1 pointer-events-none">
             {['EXTREME', 'HIGH', 'MEDIUM', 'LOW'].map((lvl) => (
               <div key={lvl} className="flex items-center justify-end gap-2 opacity-30">
                  <div className={`w-2 h-2 rounded-full`} style={{ backgroundColor: RISK_COLORS[lvl.toLowerCase() as keyof typeof RISK_COLORS] }} />
                  <span className="text-[7px] font-black uppercase tracking-widest">{lvl} ZONE</span>
               </div>
             ))}
          </div>

        </div>
      </CardContent>
    </Card>
  )
}
