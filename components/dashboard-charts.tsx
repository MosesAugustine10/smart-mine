"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts"

interface DashboardChartsProps {
  data: {
    blasting: any[]
    drilling: any[]
    material: any[]
    fuel: any[]
  }
}



const usageData = [
    { name: 'Fuel', value: 450, color: '#3b82f6' },
    { name: 'Explosives', value: 300, color: '#f59e0b' },
    { name: 'Spare Parts', value: 200, color: '#10b981' },
    { name: 'Drilling Bits', value: 150, color: '#8b5cf6' },
    { name: 'Labor', value: 400, color: '#ec4899' },
]

export function DashboardCharts({ data }: DashboardChartsProps) {
  const chartData = data.material || []

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      {/* Production Trend */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Production Trend (tonnes/day)
          </CardTitle>
          <p className="text-xs text-slate-400">Last 30 days</p>
        </CardHeader>
        <CardContent className="h-56 pr-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="prodGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  fontSize: 11,
                  borderRadius: 8,
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
                }}
              />
              <Area
                type="monotone"
                dataKey="production_per_day_tonnes"
                name="Tonnes/day"
                stroke="#f59e0b"
                strokeWidth={2}
                fill="url(#prodGrad)"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Fuel Efficiency */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Fuel Efficiency (km/L)
          </CardTitle>
          <p className="text-xs text-slate-400">Fleet average over time</p>
        </CardHeader>
        <CardContent className="h-56 pr-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  fontSize: 11,
                  borderRadius: 8,
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
                }}
              />
              <Bar
                dataKey="fuel_efficiency_km_per_l"
                name="km/L"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
                maxBarSize={28}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      {/* Usage by Category */}
      <Card className="lg:col-span-2">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">
                Resource Usage by Category
            </CardTitle>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Aggregate operational consumption breakdown</p>
          </div>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={usageData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
              >
                {usageData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }}
              />
              <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase' }} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
