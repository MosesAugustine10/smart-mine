import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ShieldCheck, MapPin, Globe, Plus, AlertTriangle } from "lucide-react"

export default function GeofenceRegistryPage() {
  return (
    <div className="flex-1 overflow-auto p-4 md:p-8 space-y-8 bg-slate-50/20 dark:bg-slate-950/20 pb-20 font-inter">
      <DashboardHeader 
        title="Geofence Registry (Mipaka ya Mgodi)" 
        description="Define and manage virtual boundaries, restricted zones, and operational speed limits."
      />

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="border-0 shadow-xl rounded-[2.5rem] bg-indigo-600 text-white p-8 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-10">
              <ShieldCheck className="w-20 h-20" />
           </div>
           <CardTitle className="text-[10px] font-black uppercase tracking-widest opacity-60">Active Zones</CardTitle>
           <p className="text-5xl font-black mt-4">0</p>
           <p className="text-[10px] font-bold opacity-60 mt-4 uppercase">Protected Operational Clusters</p>
        </Card>

        <Card className="border-0 shadow-xl rounded-[2.5rem] bg-white p-8 group hover:bg-slate-950 transition-all duration-500">
           <AlertTriangle className="w-10 h-10 text-amber-500 mb-6 group-hover:scale-110 transition-transform" />
           <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-amber-400">Total Incursions</CardTitle>
           <p className="text-4xl font-black mt-2 group-hover:text-white transition-all tracking-tighter">0</p>
           <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase">Violation Alerts Recorded</p>
        </Card>

        <div className="flex flex-col gap-4">
           <Link href="/map" className="flex-1">
              <Button className="w-full h-full bg-slate-950 text-white hover:bg-indigo-600 rounded-[2rem] flex flex-col items-center justify-center gap-2 p-6 transition-all group shadow-xl">
                 <MapPin className="w-8 h-8 text-indigo-400 group-hover:text-white transition-colors" />
                 <span className="text-[10px] font-black uppercase tracking-widest text-white">Manage on Live Map 👉</span>
              </Button>
           </Link>
           <Link href="/map?draw=true" className="flex-1">
              <Button className="w-full h-full bg-white border-2 border-slate-100 text-slate-900 hover:bg-slate-50 rounded-[2rem] flex flex-col items-center justify-center gap-2 p-6 transition-all group shadow-xl">
                 <Plus className="w-8 h-8 text-emerald-500" />
                 <span className="text-[10px] font-black uppercase tracking-widest">Draw New Boundary (Chora Mpakani)</span>
              </Button>
           </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto py-20 text-center space-y-6">
         <div className="mx-auto w-24 h-24 rounded-full bg-slate-100 items-center justify-center flex">
            <Globe className="w-10 h-10 text-slate-300" />
         </div>
         <h3 className="text-xl font-black uppercase tracking-tight text-slate-800 dark:text-white">No Boundaries Defined (Bado Hakuna Mipaka)</h3>
         <p className="text-sm text-slate-500 max-w-md mx-auto">Virtual fences are essential for safety and asset tracking. Go to the Command Center to define your first operational zone.</p>
         <Link href="/map">
            <Button className="h-14 px-8 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase text-xs tracking-widest shadow-xl">
                Open Command Center (Fungua Ramani)
            </Button>
         </Link>
      </div>
    </div>
  )
}
