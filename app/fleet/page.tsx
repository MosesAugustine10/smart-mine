"use client"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { 
  Truck, Fuel, Wrench, Package, 
  MapPin, Activity, AlertTriangle, BatteryCharging, ShieldCheck, Cog, Loader2
} from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { ProfessionalReportDropdown } from "@/components/ui/professional-report-dropdown"

export default function FleetDashboard() {
  const [data, setData] = useState({
    vehicles: [] as any[],
    maintenance: 0,
    fuel: 0,
    quarry: 0,
    loading: true
  })

  useEffect(() => {
    async function loadStats() {
      const supabase = getSupabaseBrowserClient()
      
      const [vRes, mRes, fRes, qRes] = await Promise.all([
        supabase.from("vehicles").select("*"),
        supabase.from("maintenance_logs").select("*", { count: "exact", head: true }),
        supabase.from("fuel_logs").select("*", { count: "exact", head: true }),
        supabase.from("quarry_logs").select("*", { count: "exact", head: true })
      ])

      setData({
        vehicles: vRes.data || [],
        maintenance: mRes.count || 0,
        fuel: fRes.count || 0,
        quarry: qRes.count || 0,
        loading: false
      })
    }
    loadStats()
  }, [])

  if (data.loading) return (
    <div className="h-screen w-full flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-emerald-600" />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Inventorying Fleet Assets...</p>
    </div>
  )

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 p-8 pb-0">
        <DashboardHeader 
          title="Vehicle Registry & Tracking" 
          description="List of all vehicles, fuel logs, maintenance, and GPS tracking." 
        />
        <ProfessionalReportDropdown 
          configs={{
            budget: {
              data: data.vehicles,
              filename: "FLEET_BUDGET_REPORT",
              moduleColor: "slate",
              kpis: [
                { label: "ASSET VALUATION", value: "TZS 12.4M" },
                { label: "PLANNED MAINTENANCE", value: "TZS 2.5M" }
              ]
            },
            execution: {
              data: data.vehicles,
              filename: "FLEET_EXECUTION_LOG",
              moduleColor: "emerald",
              kpis: [
                { label: "TOTAL ASSETS", value: data.vehicles.length },
                { label: "AVAILABILITY", value: "92%" }
              ]
            },
            client: {
              data: data.vehicles,
              filename: "FLEET_CLIENT_SUMMARY",
              moduleColor: "slate",
              kpis: [
                { label: "SAFETY RATING", value: "GOLD" },
                { label: "FLEET AGE AVG", value: "3.2 Yrs" }
              ]
            }
          }}
        />
      </div>
      
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
              <div className="text-4xl font-extrabold">{data.vehicles.length}</div>
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
              <div className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">{data.fuel}</div>
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
              <div className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">{data.maintenance}</div>
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
              <div className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">{data.quarry}</div>
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
