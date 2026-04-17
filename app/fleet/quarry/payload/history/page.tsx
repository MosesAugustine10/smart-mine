import { getSupabaseServerClient } from "@/lib/supabase/server"
import { PayloadHistoryTable } from "@/components/quarry/payload-history-table"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ChevronLeft, TrendingUp, BarChart3, Database } from "lucide-react"

export default async function PayloadHistoryPage() {
  const supabase = await getSupabaseServerClient()
  
  const { data: logs, error } = await supabase
    .from("equipment_payload_logs")
    .select("*")
    .order("date", { ascending: false })

  if (error) {
    console.error("Payload history error:", error)
  }

  return (
    <div className="flex flex-col gap-10 p-6 md:p-12 max-w-7xl mx-auto pb-40">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-4">
            <div className="flex items-center gap-3 text-emerald-500 font-black uppercase text-[10px] tracking-[0.4em]">
               <TrendingUp className="w-4 h-4 shadow-sm" /> Production Ledger
            </div>
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-slate-900 leading-none">
               Payload <span className="text-emerald-500">History</span>
            </h1>
            <div className="h-1.5 w-32 bg-emerald-500 rounded-full mt-2" />
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em] pl-1">Authorized Data Analytics {"&"} Cumulative Haulage Insights</p>
        </div>
        <Button asChild variant="outline" className="h-20 px-10 rounded-3xl border-2 font-black uppercase tracking-widest text-xs shadow-2xl transition-all hover:bg-slate-900 hover:text-white hover:scale-105">
           <Link href="/fleet/quarry">
             <ChevronLeft className="w-5 h-5 mr-3" /> Dashboard
           </Link>
        </Button>
      </div>

      <div className="relative group">
         <div className="absolute -inset-2 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-[3.5rem] blur opacity-10 group-hover:opacity-25 transition-all duration-500" />
         <PayloadHistoryTable payloadLogs={logs || []} />
      </div>

      <div className="grid md:grid-cols-4 gap-6 mt-12">
          <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-200">
             <BarChart3 className="w-8 h-8 text-emerald-600 mb-4" />
             <h4 className="font-black uppercase tracking-tighter text-lg">Yield Analysis</h4>
             <p className="text-[10px] text-slate-500 font-bold uppercase mt-2 leading-relaxed">Real-time tonnage tracking per asset for production KPIs.</p>
          </div>
          <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-200">
             <Database className="w-8 h-8 text-blue-600 mb-4" />
             <h4 className="font-black uppercase tracking-tighter text-lg">Immutable Logs</h4>
             <p className="text-[10px] text-slate-500 font-bold uppercase mt-2 leading-relaxed">Data entries are locked after supervisor sign-off for audit integrity.</p>
          </div>
          <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-200">
             <TrendingUp className="w-8 h-8 text-indigo-600 mb-4" />
             <h4 className="font-black uppercase tracking-tighter text-lg">Efficiency Map</h4>
             <p className="text-[10px] text-slate-500 font-bold uppercase mt-2 leading-relaxed">Identifying hauling bottlenecks through historical trip frequency.</p>
          </div>
          <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-200">
             <TrendingUp className="w-8 h-8 text-orange-600 mb-4" />
             <h4 className="font-black uppercase tracking-tighter text-lg">Mobile Ready</h4>
             <p className="text-[10px] text-slate-500 font-bold uppercase mt-2 leading-relaxed">Designed for field engineering oversight on any mobile device.</p>
          </div>
      </div>
    </div>
  )
}
