"use client"

import { DashboardHeader } from "@/components/dashboard-header"
import { MaintenanceTable } from "@/components/fleet/maintenance-table"
import { ProfessionalReportButton } from "@/components/ui/professional-report-button"
import { Button } from "@/components/ui/button"
import { Plus, Wrench, ShieldAlert, CheckCircle2, AlertTriangle, TrendingDown, Loader2, Activity } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts'

export default function MaintenanceLogsPage() {
    const [maintenanceLogs, setMaintenanceLogs] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const today = new Date().toISOString().split('T')[0]

    useEffect(() => {
        async function fetchMaintenance() {
            const supabase = getSupabaseBrowserClient()
            const { data: maintenanceLogsData } = await supabase
                .from("maintenance_logs")
                .select(`
                    *,
                    vehicle:equipment(machine_name, machine_type)
                `)
                .order("maintenance_date", { ascending: false })

            if (maintenanceLogsData) {
                const logs = maintenanceLogsData.map((log: any) => ({
                    ...log,
                    vehicle_name: log.vehicle?.machine_name || 'N/A',
                    vehicle_type: log.vehicle?.machine_type || 'N/A'
                }))
                setMaintenanceLogs(logs)
            }
            setLoading(false)
        }
        fetchMaintenance()
    }, [])

    // Aggregations
    const totalCost = maintenanceLogs.reduce((sum, log) => sum + Number(log.cost || 0), 0)
    const upcomingServices = maintenanceLogs.filter(log => log.next_service_date && log.next_service_date >= today).length
    const overdueServices = maintenanceLogs.filter(log => log.next_service_date && log.next_service_date < today).length
    const avgCostPerLog = maintenanceLogs.length > 0 ? totalCost / maintenanceLogs.length : 0

    // Grouping for charts
    const vehicleStats = maintenanceLogs.reduce((acc: any, log) => {
        const v = log.vehicle_name
        if (!acc[v]) acc[v] = { cost: 0, count: 0 }
        acc[v].cost += Number(log.cost || 0)
        acc[v].count += 1
        return acc
    }, {})

    const costChart = Object.entries(vehicleStats).map(([name, stats]: any) => ({
        label: name,
        value: stats.cost
    }))

    const freqChart = Object.entries(vehicleStats).map(([name, stats]: any) => ({
        label: name,
        value: stats.count
    }))

    const chartConfigs = [
        { type: "bar" as const, title: "Maintenance Cost per Equipment (TZS)", data: costChart, color: "#f59e0b" },
        { type: "bar" as const, title: "Service Frequency Count", data: freqChart, color: "#3b82f6" }
    ]

    if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-amber-600" /></div>

    return (
        <div className="flex-1 overflow-auto p-8 space-y-10 bg-slate-50/30 dark:bg-slate-950/30 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <DashboardHeader 
                    title="Fleet Reliability Hub" 
                    description="Enterprise maintenance tracking and predictive reliability management" 
                />
                <div className="flex items-center gap-3">
                    <ProfessionalReportButton 
                        data={maintenanceLogs}
                        filename="FLEET_MAINTENANCE_REPORT"
                        title="Strategic Fleet Maintenance & Reliability Audit"
                        moduleColor="amber"
                        charts={chartConfigs}
                        kpis={[
                            { label: "CUMULATIVE COST", value: "TZS " + totalCost.toLocaleString() },
                            { label: "PENDING CYCLES", value: upcomingServices },
                            { label: "AVG COST / SERVICE", value: "TZS " + avgCostPerLog.toFixed(0) }
                        ]}
                    />
                    <Link href="/fleet/maintenance/new">
                        <Button className="h-12 px-8 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-amber-500/20 transition-all hover:scale-[1.02]">
                            <Plus className="w-4 h-4 mr-2" />
                            Record Maintenance
                        </Button>
                    </Link>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <div className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-sm relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-600">
                             <Wrench className="w-6 h-6" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Records</span>
                    </div>
                    <p className="text-3xl font-black tracking-tighter text-slate-900">{maintenanceLogs.length}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Maintenance Indices</p>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-sm relative overflow-hidden">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-600">
                             <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Scheduled Service</span>
                    </div>
                    <p className="text-3xl font-black tracking-tighter text-slate-900">{upcomingServices}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Pending Cycles</p>
                </div>

                <div className={`p-8 rounded-[2.5rem] border-2 shadow-sm relative overflow-hidden ${overdueServices > 0 ? 'bg-red-50 border-red-100' : 'bg-white border-slate-100'}`}>
                    <div className="flex items-center justify-between mb-4">
                        <div className={`p-3 rounded-2xl ${overdueServices > 0 ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-100 text-slate-400'}`}>
                             <ShieldAlert className="w-6 h-6" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Overdue Alerts</span>
                    </div>
                    <p className={`text-3xl font-black tracking-tighter ${overdueServices > 0 ? 'text-red-600' : 'text-slate-900'}`}>{overdueServices}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Immediate Action Required</p>
                </div>

                <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden text-white">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-white/10 rounded-2xl text-amber-400">
                             <TrendingDown className="w-6 h-6" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Cumulative Outlay</span>
                    </div>
                    <p className="text-3xl font-black tracking-tighter">TZS {totalCost.toLocaleString()}</p>
                    <p className="text-[10px] font-bold opacity-40 uppercase mt-1">Fleet Upkeep Cost</p>
                </div>
            </div>

            {/* Maintenance Analytics Visuals */}
            <div className="grid gap-6 lg:grid-cols-2">
                <div className="bg-white p-6 rounded-[2.5rem] border-2 border-slate-100 shadow-sm">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                        <TrendingDown className="w-4 h-4" /> Total Maintenance Costs (TZS)
                    </h3>
                    <div className="h-64">
                         <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={costChart}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                                <XAxis dataKey="label" fontSize={10} fontWeight={800} axisLine={false} tickLine={false} />
                                <YAxis fontSize={10} fontWeight={800} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} />
                                <Bar dataKey="value" fill="#f59e0b" radius={[6, 6, 0, 0]} name="Cost (TZS)" />
                            </BarChart>
                         </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[2.5rem] border-2 border-slate-100 shadow-sm">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                        <Activity className="w-4 h-4" /> Equipment Service Count
                    </h3>
                    <div className="h-64">
                         <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={freqChart}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                                <XAxis dataKey="label" fontSize={10} fontWeight={800} axisLine={false} tickLine={false} />
                                <YAxis fontSize={10} fontWeight={800} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} />
                                <Bar dataKey="value" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Service Count" />
                            </BarChart>
                         </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <MaintenanceTable maintenanceLogs={maintenanceLogs} />
        </div>
    )
}
