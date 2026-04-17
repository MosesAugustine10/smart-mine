"use client"

import { DashboardHeader } from "@/components/dashboard-header"
import { FuelLogsTable } from "@/components/fleet/fuel-logs-table"
import { ProfessionalReportButton } from "@/components/ui/professional-report-button"
import { Button } from "@/components/ui/button"
import { Plus, Fuel, TrendingUp, DollarSign, Activity, Gauge, Loader2 } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend
} from 'recharts'
import { format } from "date-fns"

export default function FuelLogsPage() {
    const [fuelLogs, setFuelLogs] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchFuel() {
            const supabase = getSupabaseBrowserClient()
            const { data: fuelLogsData } = await supabase
                .from("fuel_logs")
                .select(`
                    *,
                    vehicle:equipment(machine_name, machine_type),
                    driver:user_profiles(full_name)
                `)
                .order("log_date_time", { ascending: false })

            if (fuelLogsData) {
                const logs = fuelLogsData.map((log: any) => ({
                    ...log,
                    vehicle_name: log.vehicle?.machine_name || 'N/A',
                    vehicle_type: log.vehicle?.machine_type || 'N/A'
                }))
                setFuelLogs(logs)
            }
            setLoading(false)
        }
        fetchFuel()
    }, [])

    // Aggregations
    const totalFuel = fuelLogs.reduce((sum, log) => sum + Number(log.quantity || 0), 0)
    const totalCost = fuelLogs.reduce((sum, log) => sum + Number(log.total_cost || 0), 0)
    const avgCostPerLiter = totalFuel > 0 ? totalCost / totalFuel : 0
    const uniqueVehicles = new Set(fuelLogs.map(log => log.vehicle_id)).size
    const today = new Date().toISOString().split('T')[0]
    const todayLogs = fuelLogs.filter(log => log.log_date_time?.startsWith(today)).length

    // Grouping for charts
    const vehicleConsumption = fuelLogs.reduce((acc: any, log) => {
        const v = log.vehicle_name
        acc[v] = (acc[v] || 0) + Number(log.quantity || 0)
        return acc
    }, {})

    const consumptionChart = Object.entries(vehicleConsumption).map(([name, val]) => ({
        label: name,
        value: Number(val)
    }))

    const fuelTrend = fuelLogs.slice(0, 15).reverse().map(log => ({
        label: format(new Date(log.log_date_time), "dd MMM"),
        value: Number(log.quantity)
    }))

    const chartConfigs = [
        { type: "bar" as const, title: "Fuel Consumption per Vehicle (L)", data: consumptionChart, color: "#2563eb" },
        { type: "line" as const, title: "Daily Fuel Trend", data: fuelTrend, color: "#f59e0b" }
    ]

    if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-blue-600" /></div>

    return (
        <div className="flex-1 overflow-auto p-8 space-y-10 bg-slate-50/30 dark:bg-slate-950/30 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <DashboardHeader 
                    title="Fleet Fuel Analytics" 
                    description="Forensic tracking of fuel disbursement and consumption costs" 
                />
                <div className="flex items-center gap-3">
                    <ProfessionalReportButton 
                        data={fuelLogs}
                        filename="FUEL_ANALYTICS_REPORT"
                        title="Fleet Fuel Consumption & Cost Audit"
                        moduleColor="blue"
                        charts={chartConfigs}
                        kpis={[
                            { label: "TOTAL VOLUME", value: totalFuel.toFixed(1) + " L" },
                            { label: "FISCAL OUTLAY", value: "TZS " + totalCost.toLocaleString() },
                            { label: "AVG COST/L", value: "TZS " + avgCostPerLiter.toFixed(0) }
                        ]}
                    />
                    <Link href="/fleet/fuel-logs/new">
                        <Button className="h-12 px-8 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-blue-500/20 transition-all hover:scale-[1.02]">
                            <Plus className="w-4 h-4 mr-2" />
                            Record Disbursement
                        </Button>
                    </Link>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <div className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-600">
                             <Fuel className="w-6 h-6" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Volume</span>
                    </div>
                    <p className="text-3xl font-black tracking-tighter text-slate-900">{totalFuel.toFixed(2)}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Liters Disbursed</p>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-600">
                             <DollarSign className="w-6 h-6" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Fiscal Outlay</span>
                    </div>
                    <p className="text-3xl font-black tracking-tighter text-slate-900">{totalCost.toLocaleString()}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">TZS Cumulative</p>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-600">
                             <TrendingUp className="w-6 h-6" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Avg Cost/L</span>
                    </div>
                    <p className="text-3xl font-black tracking-tighter text-slate-900">{avgCostPerLiter.toFixed(2)}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">TZS Baseline</p>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-slate-900 text-white rounded-2xl">
                             <Activity className="w-6 h-6" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Activity Level</span>
                    </div>
                    <p className="text-3xl font-black tracking-tighter text-slate-900">{todayLogs}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Transactions Today</p>
                </div>
            </div>

            {/* Dashboard Visuals */}
            <div className="grid gap-6 lg:grid-cols-2">
                <div className="bg-white p-6 rounded-[2.5rem] border-2 border-slate-100">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 font-mono">Vehicle Fuel Consumption</h3>
                    <div className="h-64">
                         <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={consumptionChart}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                                <XAxis dataKey="label" fontSize={10} fontWeight={800} axisLine={false} tickLine={false} />
                                <YAxis fontSize={10} fontWeight={800} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} />
                                <Bar dataKey="value" fill="#2563eb" radius={[6, 6, 0, 0]} />
                            </BarChart>
                         </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[2.5rem] border-2 border-slate-100">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 font-mono">Daily Fuel Usage Trend</h3>
                    <div className="h-64">
                         <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={fuelTrend}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                                <XAxis dataKey="label" fontSize={10} fontWeight={800} axisLine={false} tickLine={false} />
                                <YAxis fontSize={10} fontWeight={800} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} />
                                <Line type="monotone" dataKey="value" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} />
                            </LineChart>
                         </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <FuelLogsTable fuelLogs={fuelLogs} />
        </div>
    )
}
