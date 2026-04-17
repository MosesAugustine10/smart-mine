"use client"

import React from "react"
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Area
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface IncidentTrendsChartProps {
  data: Array<{
    period: string
    incidents: number
    nearMisses: number
    target?: number
  }>
}

export function IncidentTrendsChart({ data }: IncidentTrendsChartProps) {
  return (
    <Card className="border-0 shadow-2xl rounded-[2.5rem] overflow-hidden bg-slate-900 text-white">
      <CardHeader className="border-b border-white/5 p-8">
        <CardTitle className="text-xl font-black uppercase tracking-widest flex items-center gap-2">
          <div className="w-2 h-8 bg-red-600 rounded-full" />
          Governance Velocity Trends
        </CardTitle>
        <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest">Incident and Near Miss Periodical Analytics</p>
      </CardHeader>
      <CardContent className="p-8">
        <div className="h-[350px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <defs>
                <linearGradient id="colorIncidents" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis 
                dataKey="period" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 900 }} 
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 900 }}
                dx={-10}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "16px",
                  boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)"
                }}
                itemStyle={{ color: "#fff", fontSize: "10px", fontWeight: 800, textTransform: "uppercase" }}
              />
              <Legend verticalAlign="top" height={36} content={({ payload }) => (
                <div className="flex justify-end gap-6 mb-8">
                  {payload?.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-60">{entry.value}</span>
                    </div>
                  ))}
                </div>
              )} />
              <Area
                type="monotone"
                dataKey="incidents"
                stroke="#ef4444"
                strokeWidth={4}
                fillOpacity={1}
                fill="url(#colorIncidents)"
                name="Actual Incidents"
              />
              <Line
                type="monotone"
                dataKey="nearMisses"
                stroke="#f59e0b"
                strokeWidth={4}
                dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4, stroke: '#0f172a' }}
                activeDot={{ r: 6, strokeWidth: 0 }}
                name="Proactive Near Misses"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
