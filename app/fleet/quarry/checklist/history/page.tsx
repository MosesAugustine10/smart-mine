import { getSupabaseServerClient } from "@/lib/supabase/server"
import { ChecklistHistoryTable } from "@/components/quarry/checklist-history-table"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ChevronLeft, ClipboardCheck, History } from "lucide-react"

export default async function ChecklistHistoryPage() {
  const supabase = await getSupabaseServerClient()
  
  const { data: inspections, error } = await supabase
    .from("equipment_inspections")
    .select("*")
    .order("inspection_date", { ascending: false })

  if (error) {
    console.error("Checklist history error:", error)
  }

  return (
    <div className="flex flex-col gap-10 p-6 md:p-12 max-w-7xl mx-auto pb-40">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
            <div className="flex items-center gap-2 text-blue-600 font-black uppercase text-[10px] tracking-[0.3em]">
               <ClipboardCheck className="w-4 h-4" /> Quarry Fleet Management
            </div>
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-slate-900 flex items-baseline gap-4">
               Checklist <span className="text-blue-600 italic">History</span>
            </h1>
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest pl-1">Authorized Inspection Logs {"&"} Safety Compliance Archive</p>
        </div>
        <Button asChild variant="outline" className="h-16 px-8 rounded-2xl border-2 font-black uppercase tracking-widest text-xs shadow-lg transition-transform hover:scale-105">
           <Link href="/fleet/quarry">
             <ChevronLeft className="w-5 h-5 mr-3" /> Dashboard
           </Link>
        </Button>
      </div>

      <div className="relative group">
         <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[2.5rem] blur opacity-10 group-hover:opacity-20 transition-opacity" />
         <ChecklistHistoryTable inspections={inspections || []} />
      </div>

      <div className="grid md:grid-cols-3 gap-8 mt-10">
          <div className="p-8 rounded-[2rem] bg-white border-2 border-slate-100 shadow-xl flex flex-col items-center text-center">
             <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4">
                <History className="w-8 h-8 text-blue-600" />
             </div>
             <h3 className="font-black uppercase tracking-tighter text-xl">Full Audit Trail</h3>
             <p className="text-xs text-slate-400 font-medium mt-2">Every inspection is timestamped and cryptographically linked to the inspector profile.</p>
          </div>
          <div className="p-8 rounded-[2rem] bg-white border-2 border-slate-100 shadow-xl flex flex-col items-center text-center">
             <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
                <ClipboardCheck className="w-8 h-8 text-emerald-600" />
             </div>
             <h3 className="font-black uppercase tracking-tighter text-xl">Safety Compliance</h3>
             <p className="text-xs text-slate-400 font-medium mt-2">Automated flagging of critical mechanical issues for maintenance priority.</p>
          </div>
          <div className="p-8 rounded-[2rem] bg-white border-2 border-slate-100 shadow-xl flex flex-col items-center text-center">
             <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center mb-4">
                <History className="w-8 h-8 text-indigo-600" />
             </div>
             <h3 className="font-black uppercase tracking-tighter text-xl">Cloud Storage</h3>
             <p className="text-xs text-slate-400 font-medium mt-2">All data is backed up with 99.9% availability for executive oversight anytime.</p>
          </div>
      </div>
    </div>
  )
}
