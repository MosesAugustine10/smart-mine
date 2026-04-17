import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { 
  Truck, Fuel, Wrench, Package, 
  MapPin, Activity, AlertTriangle, BatteryCharging, ShieldCheck, Cog
} from "lucide-react"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { ModuleHelpNotebook } from "@/components/module-help-notebook"

export const dynamic = "force-dynamic"

export default async function FleetDashboard() {
  const supabase = await getSupabaseServerClient()

  // Fetch some quick stats if tables exist, or default to 0
  const fetchCount = async (table: string) => {
    try {
      const { count } = await supabase.from(table).select("*", { count: "exact", head: true })
      return count || 0
    } catch {
      return 0
    }
  }

  const [vehicles, maintenance, fuel, quarry] = await Promise.all([
    fetchCount("vehicles"),
    fetchCount("maintenance_logs"),
    fetchCount("fuel_logs"),
    fetchCount("quarry_logs") // payload/checklist
  ])

  return (
    <>
      <DashboardHeader 
        title="Vehicle Registry & Tracking" 
        description="List of all vehicles, fuel logs, maintenance, and GPS tracking." 
      />
      
      <div className="flex-1 overflow-auto p-8 space-y-8 bg-slate-50/50 dark:bg-slate-950/20">
        
        {/* KPI Grid */}
        <div className="grid gap-6 md:grid-cols-4">
          <Card className="border-0 shadow-lg bg-emerald-600 text-white rounded-[2rem]">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-widest opacity-80 flex items-center gap-2">
                <Truck className="w-4 h-4" /> Active Fleet
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-extrabold">{vehicles}</div>
              <p className="text-[10px] uppercase font-bold mt-2 opacity-80">Registered Equipment</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg rounded-[2rem]">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <Fuel className="w-4 h-4 text-amber-500" /> Fuel Logs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">{fuel}</div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold mt-2">Bunkering Records (Jaza Mafuta)</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg rounded-[2rem]">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <Wrench className="w-4 h-4 text-rose-500" /> Maintenance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">{maintenance}</div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold mt-2">Work Orders (Oda za Kazi)</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg rounded-[2rem]">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-500" /> Payload
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">{quarry}</div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold mt-2">Dispatch & Quarry Logs</p>
            </CardContent>
          </Card>
        </div>

        {/* Modules Access */}
        <h3 className="text-lg font-black uppercase tracking-tight text-slate-800 dark:text-white mt-10">Control Modules</h3>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link href="/fleet/vehicles">
            <Card className="border-2 hover:border-emerald-500 transition-all rounded-[2rem] h-full cursor-pointer group">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Truck className="w-6 h-6 text-emerald-600" />
                </div>
                <h4 className="font-bold text-slate-800 dark:text-white">Vehicle Registry</h4>
                <p className="text-xs text-muted-foreground mt-2">Manage Heavy Equipment, Light Vehicles, and Drill Rigs.</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/fleet/fuel-logs">
            <Card className="border-2 hover:border-amber-500 transition-all rounded-[2rem] h-full cursor-pointer group">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Fuel className="w-6 h-6 text-amber-600" />
                </div>
                <h4 className="font-bold text-slate-800 dark:text-white">Fuel Management</h4>
                <p className="text-xs text-muted-foreground mt-2">Track fuel dispensation, efficiency anomalies, and inventory.</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/fleet/maintenance">
            <Card className="border-2 hover:border-rose-500 transition-all rounded-[2rem] h-full cursor-pointer group">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Wrench className="w-6 h-6 text-rose-600" />
                </div>
                <h4 className="font-bold text-slate-800 dark:text-white">Maintenance Hub</h4>
                <p className="text-xs text-muted-foreground mt-2">Log preventive care, unscheduled breakdowns, and part usage.</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/fleet/quarry">
            <Card className="border-2 hover:border-blue-500 transition-all rounded-[2rem] h-full cursor-pointer group">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
                <h4 className="font-bold text-slate-800 dark:text-white">Payload & Routing</h4>
                <p className="text-xs text-muted-foreground mt-2">Checklists, dispatch sheets, and payload load-outs.</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/fleet/geofences">
            <Card className="border-2 hover:border-indigo-600 border-dashed transition-all rounded-[2rem] h-full cursor-pointer group bg-indigo-50/10">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <ShieldCheck className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-bold text-slate-800 dark:text-white">Geofence Registry</h4>
                <p className="text-xs text-muted-foreground mt-2">Define virtual boundaries and restricted operational zones.</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/map">
            <Card className="border-2 border-indigo-500 bg-indigo-50/10 hover:bg-indigo-500 hover:text-white transition-all rounded-[2rem] h-full cursor-pointer group">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-xl bg-indigo-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <MapPin className="h-6 w-6 text-white" />
                </div>
                <h4 className="font-bold">Live Command Center</h4>
                <p className="text-xs opacity-80 mt-2">Real-time GPS tracking and geofence monitoring for all assets.</p>
              </CardContent>
            </Card>
          </Link>
        </div>

      </div>
    </>
  )
}
