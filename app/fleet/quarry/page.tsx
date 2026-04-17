import { getSupabaseServerClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  PlusCircle, 
  ClipboardCheck, 
  Truck, 
  FileText, 
  ShieldCheck, 
  AlertTriangle,
  TrendingUp,
  History,
  Activity,
  UserCheck,
  ChevronRight,
  Download
} from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { QuarryReportButton } from "@/components/quarry/quarry-reports"

export default async function QuarryControlHub() {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  // 1. Fetch Recent Inspections (QF-01)
  const { data: inspections } = await supabase
    .from("equipment_inspections")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5)

  // 2. Fetch Recent Payloads (QF-02)
  const { data: payloads } = await supabase
    .from("equipment_payloads")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5)

  // 3. Stats calculation
  const stats = {
     inspectionsTotal: inspections?.length || 0,
     payloadsTotal: payloads?.length || 0,
     pendingSignatures: (inspections?.filter(i => !i.amogtech_signature || !i.tcplc_signature).length || 0) +
                        (payloads?.filter(p => !p.amogtech_signature || !p.tcplc_signature).length || 0)
  }

  return (
    <div className="flex-1 overflow-auto p-4 md:p-8 space-y-10 bg-slate-50/20 dark:bg-slate-950/20 pb-20 font-inter">
      <DashboardHeader 
        title="Quarry Control Hub" 
        description="Strategic monitoring and forensic governance for heavy machinery and production velocity."
      />

      {/* 1. Global KPIs */}
      <div className="grid md:grid-cols-4 gap-8 max-w-7xl mx-auto">
         <Card className="border-0 shadow-2xl rounded-[3rem] p-10 bg-white group hover:bg-slate-950 transition-all duration-500">
            <Activity className="w-10 h-10 text-blue-600 mb-6 group-hover:scale-110 transition-transform" />
            <p className="text-[10px] font-black uppercase opacity-40 group-hover:text-blue-400 tracking-widest">Active Fleet</p>
            <p className="text-4xl font-black mt-2 group-hover:text-white transition-all tracking-tighter">Operational</p>
            <div className="mt-4 flex gap-2">
               <Badge className="bg-emerald-500/10 text-emerald-600 border-0 text-[8px] font-black uppercase">Health 98%</Badge>
            </div>
         </Card>

         <Card className="border-0 shadow-2xl rounded-[3rem] p-10 bg-white group hover:bg-slate-950 transition-all duration-500">
            <TrendingUp className="w-10 h-10 text-emerald-600 mb-6 group-hover:scale-110 transition-transform" />
            <p className="text-[10px] font-black uppercase opacity-40 group-hover:text-emerald-400 tracking-widest">Daily Velocity</p>
            <p className="text-4xl font-black mt-2 group-hover:text-white transition-all tracking-tighter">0 MT</p>
            <span className="text-[10px] font-bold text-slate-400">Production Yield</span>
         </Card>

         <Card className="border-0 shadow-2xl rounded-[3rem] p-10 bg-blue-600 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rotate-45 translate-x-12 -translate-y-12" />
            <ShieldCheck className="w-10 h-10 mb-6 opacity-40" />
            <p className="text-[10px] font-black uppercase tracking-widest text-blue-200">Governance Lag</p>
            <p className="text-5xl font-black mt-2 tracking-tighter">{stats.pendingSignatures}</p>
            <p className="text-[10px] font-bold opacity-60 mt-2">Missing Authorizations</p>
         </Card>

         <div className="space-y-4 flex flex-col justify-center">
            <Link href="/fleet/quarry/checklist" className="flex-1">
               <Button className="w-full h-full bg-orange-600 hover:bg-orange-500 text-white rounded-[2rem] flex flex-col items-center justify-center gap-2 p-6 transition-all group shadow-xl border-0">
                  <ClipboardCheck className="w-8 h-8 text-white transition-colors" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-white">New Inspection</span>
               </Button>
            </Link>
            <Link href="/fleet/quarry/payload" className="flex-1">
               <Button className="w-full h-full bg-slate-950 text-white hover:bg-emerald-600 rounded-[2rem] flex flex-col items-center justify-center gap-2 p-6 transition-all group shadow-xl shadow-slate-950/20">
                  <Truck className="w-8 h-8 text-emerald-500 group-hover:text-white transition-colors" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Payload Registry</span>
               </Button>
            </Link>
         </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-10 max-w-7xl mx-auto">
         {/* 2. Recent Inspections List */}
         <Card className="border-0 shadow-4xl rounded-[4rem] overflow-hidden bg-white">
            <CardHeader className="p-12 border-b border-slate-100 bg-slate-50/50 flex flex-row items-center justify-between">
               <div>
                  <div className="flex items-center gap-2 mb-2">
                     <Badge className="bg-blue-600 text-[8px] font-black py-0.5 uppercase">QF-01</Badge>
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Safety Stream</span>
                  </div>
                  <CardTitle className="text-2xl font-black uppercase tracking-tighter italic">Machine Health Logs 👉</CardTitle>
               </div>
               <Link href="/fleet/quarry/checklist/history">
                  <Button variant="ghost" className="h-10 w-10 p-0 rounded-full border border-slate-200 hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                     <History className="w-4 h-4" />
                  </Button>
               </Link>
            </CardHeader>
            <CardContent className="p-0">
               <table className="w-full">
                  <tbody className="divide-y divide-slate-50">
                     {inspections?.map(i => (
                        <tr key={i.id} className="group hover:bg-slate-50 transition-all">
                           <td className="p-8">
                              <div className="flex items-center gap-6">
                                 <div className={`p-4 rounded-[1.5rem] ${i.checklist_items.some((item: any) => item.status === 'not_ok' || item.status === 'critical') ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                    {i.checklist_items.some((item: any) => item.status === 'not_ok' || item.status === 'critical') ? <AlertTriangle className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
                                 </div>
                                 <div>
                                    <p className="text-md font-black uppercase text-slate-800 tracking-tighter">{i.machine_name}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(i.inspection_date).toLocaleDateString()} | {i.shift}</p>
                                 </div>
                              </div>
                           </td>
                           <td className="p-8 text-right">
                              <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all">
                                 <QuarryReportButton type="checklist" data={i} />
                                 <Button variant="outline" className="h-10 w-10 p-0 rounded-xl border-2 hover:bg-slate-950 hover:text-white transition-all">
                                    <ChevronRight className="w-4 h-4" />
                                 </Button>
                              </div>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </CardContent>
         </Card>

         {/* 3. Recent Payloads List */}
         <Card className="border-0 shadow-4xl rounded-[4rem] overflow-hidden bg-white">
            <CardHeader className="p-12 border-b border-slate-100 bg-slate-50/50 flex flex-row items-center justify-between">
               <div>
                  <div className="flex items-center gap-2 mb-2">
                     <Badge className="bg-emerald-600 text-[8px] font-black py-0.5 uppercase">QF-02</Badge>
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Production Stream</span>
                  </div>
                  <CardTitle className="text-2xl font-black uppercase tracking-tighter italic">Execution Registry 👉</CardTitle>
               </div>
               <Link href="/fleet/quarry/payload/history">
                  <Button variant="ghost" className="h-10 w-10 p-0 rounded-full border border-slate-200 hover:bg-emerald-600 hover:text-white transition-all shadow-sm">
                     <History className="w-4 h-4" />
                  </Button>
               </Link>
            </CardHeader>
            <CardContent className="p-0">
               <table className="w-full">
                  <tbody className="divide-y divide-slate-50">
                     {payloads?.map(p => (
                        <tr key={p.id} className="group hover:bg-slate-50 transition-all">
                           <td className="p-8">
                              <div className="flex items-center gap-6">
                                 <div className="p-4 rounded-[1.5rem] bg-blue-50 text-blue-600">
                                    <TrendingUp className="w-6 h-6" />
                                 </div>
                                 <div>
                                    <p className="text-md font-black uppercase text-slate-800 tracking-tighter">{p.machine_name} | {p.total_tonnage} MT</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(p.payload_date).toLocaleDateString()} | {p.trips.length} Trips</p>
                                 </div>
                              </div>
                           </td>
                           <td className="p-8 text-right">
                              <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all">
                                 <QuarryReportButton type="payload" data={p} />
                                 <Button variant="outline" className="h-10 w-10 p-0 rounded-xl border-2 hover:bg-slate-950 hover:text-white transition-all">
                                    <ChevronRight className="w-4 h-4" />
                                 </Button>
                              </div>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </CardContent>
         </Card>
      </div>
    </div>
  )
}
