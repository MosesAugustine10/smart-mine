import { getSupabaseServerClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard-header"
import { VehicleTable } from "@/components/fleet/vehicle-table"
import { FleetReportButton } from "@/components/fleet/fleet-reports"
import { Button } from "@/components/ui/button"
import { Plus, Truck, Activity, ShieldCheck, AlertTriangle, TrendingUp } from "lucide-react"
import Link from "next/link"
import { Vehicle } from "@/lib/types"

export const dynamic = "force-dynamic"

export default async function VehiclesPage() {
    const supabase = await getSupabaseServerClient()

    const { data: vehiclesData } = await supabase
        .from("vehicles")
        .select("*")
        .order("vehicle_number", { ascending: true })

    const vehicles: Vehicle[] = vehiclesData || []

    // Aggregations
    const totalVehicles = vehicles.length
    const operational = vehicles.filter(v => v.status === 'operational').length
    const maintenance = vehicles.filter(v => v.status === 'maintenance').length
    const breakdown = vehicles.filter(v => v.status === 'breakdown').length

    return (
        <div className="flex-1 overflow-auto p-8 space-y-10 bg-slate-50/30 dark:bg-slate-950/30 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <DashboardHeader 
                    title="Vehicle & Equipment Registry" 
                    description="List of mining vehicles and arrival/readiness status" 
                />
                <div className="flex items-center gap-3">
                    <FleetReportButton vehicles={vehicles} type="fleet_status" />
                    <Link href="/fleet/vehicles/new">
                        <Button className="h-12 px-8 rounded-2xl bg-slate-900 hover:bg-black text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-slate-900/20 transition-all hover:scale-[1.02]">
                            <Plus className="w-4 h-4 mr-2" />
                            Commission New Asset
                        </Button>
                    </Link>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <div className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-sm relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-slate-900 text-white rounded-2xl">
                             <Truck className="w-6 h-6" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Entire Fleet</span>
                    </div>
                    <p className="text-4xl font-black tracking-tighter text-slate-900">{totalVehicles}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-1 italic tracking-widest">Active Commissions</p>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-sm relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-600">
                             <Activity className="w-6 h-6" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Operational Readiness</span>
                    </div>
                    <p className="text-4xl font-black tracking-tighter text-emerald-600">{operational}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-1 italic tracking-widest">Mission Ready</p>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-sm relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-600">
                             <ShieldCheck className="w-6 h-6" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Scheduled Outlay</span>
                    </div>
                    <p className="text-4xl font-black tracking-tighter text-amber-600">{maintenance}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-1 italic tracking-widest">Upkeep Cycles</p>
                </div>

                <div className={`p-8 rounded-[2.5rem] border-2 shadow-sm relative overflow-hidden ${breakdown > 0 ? 'bg-red-50 border-red-100 animate-pulse' : 'bg-white border-slate-100'}`}>
                    <div className="flex items-center justify-between mb-4">
                        <div className={`p-3 rounded-2xl ${breakdown > 0 ? 'bg-red-600 text-white' : 'bg-red-500/10 text-red-600'}`}>
                             <AlertTriangle className="w-6 h-6" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Technical Debt</span>
                    </div>
                    <p className={`text-4xl font-black tracking-tighter ${breakdown > 0 ? 'text-red-600' : 'text-slate-900'}`}>{breakdown}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-1 italic tracking-widest">Asset Breakdowns</p>
                </div>
            </div>

            <VehicleTable vehicles={vehicles} />
        </div>
    )
}
