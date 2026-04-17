import { getSupabaseServerClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Plus, 
  FileText, 
  DollarSign, 
  TrendingUp, 
  Clock, 
  Search,
  ChevronRight,
  Filter,
  ArrowUpRight,
  Download
} from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { InvoiceTableClient } from "@/components/billing/invoice-table-client"

export default async function InvoiceListPage() {
  const supabase = await getSupabaseServerClient()
  const { data: invoices } = await supabase
    .from("invoices")
    .select("*")
    .order("created_at", { ascending: false })

  const stats = {
     totalBilled: invoices?.reduce((sum, i) => sum + (i.total_amount || 0), 0) || 0,
     pending: invoices?.filter(i => i.status === 'ISSUED').length || 0,
     paid: invoices?.filter(i => i.status === 'PAID').length || 0
  }

  return (
    <div className="flex-1 overflow-auto p-4 md:p-8 space-y-10 bg-slate-50/20 dark:bg-slate-950/20 pb-20 font-inter">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 max-w-7xl mx-auto">
        <DashboardHeader 
          title="Consulting Billing Hub" 
          description="Centralized invoice management and multi-module revenue reconciliation."
        />
        <Link href="/billing/invoices/new">
           <Button className="h-16 px-10 rounded-[2rem] bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-xs tracking-widest shadow-2xl shadow-blue-500/20 transition-all hover:scale-[1.05] active:scale-95 flex gap-3">
              <Plus className="w-5 h-5" />
              Generate Professional Invoice
           </Button>
        </Link>
      </div>

      {/* 1. Financial KPIs */}
      <div className="grid md:grid-cols-4 gap-8 max-w-7xl mx-auto">
         <Card className="border-0 shadow-2xl rounded-[3rem] p-10 bg-white group hover:bg-slate-950 transition-all duration-500">
            <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-600 mb-6 group-hover:bg-blue-600 group-hover:text-white transition-all">
               <DollarSign className="w-8 h-8" />
            </div>
            <p className="text-[10px] font-black uppercase opacity-40 group-hover:text-blue-400 tracking-widest">Total Booked (TZS)</p>
            <p className="text-4xl font-black mt-2 group-hover:text-white transition-all tracking-tighter">{stats.totalBilled.toLocaleString()}</p>
         </Card>

         <Card className="border-0 shadow-2xl rounded-[3rem] p-10 bg-white group hover:bg-slate-950 transition-all duration-500">
            <div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-600 mb-6 group-hover:bg-amber-600 group-hover:text-white transition-all">
               <Clock className="w-8 h-8" />
            </div>
            <p className="text-[10px] font-black uppercase opacity-40 group-hover:text-amber-400 tracking-widest">Awaiting Liquidity</p>
            <p className="text-4xl font-black mt-2 group-hover:text-white transition-all tracking-tighter">{stats.pending}</p>
         </Card>

         <Card className="border-0 shadow-2xl rounded-[3rem] p-10 bg-white group hover:bg-slate-950 transition-all duration-500">
            <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-600 mb-6 group-hover:bg-emerald-600 group-hover:text-white transition-all">
               <TrendingUp className="w-8 h-8" />
            </div>
            <p className="text-[10px] font-black uppercase opacity-40 group-hover:text-emerald-400 tracking-widest">Success Rate</p>
            <p className="text-4xl font-black mt-2 group-hover:text-white transition-all tracking-tighter">94%</p>
         </Card>

         <Card className="border-0 shadow-2xl rounded-[3rem] p-10 bg-slate-950 text-white flex flex-col justify-center">
            <p className="text-[10px] font-black uppercase opacity-40 tracking-widest mb-4">Strategic Insight</p>
            <p className="text-sm font-bold leading-relaxed text-slate-400 italic">"Consolidated billing from Blasting, Drilling, and Quarry operations is currently fully synchronized."</p>
         </Card>
      </div>

      {/* 2. Global Invoice Registry */}
      <Card className="border-0 shadow-4xl rounded-[4rem] overflow-hidden bg-white max-w-7xl mx-auto">
        <CardHeader className="p-12 border-b border-slate-100 bg-slate-50/50 flex flex-row items-center justify-between">
           <div>
              <CardTitle className="text-3xl font-black uppercase tracking-tighter italic">Enterprise Billing Ledger</CardTitle>
              <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Forensic Financial Record Registry</p>
           </div>
           <div className="flex gap-4">
              <Button variant="outline" className="h-12 px-6 rounded-2xl border-2 font-black uppercase text-[10px] tracking-widest gap-2">
                 <Filter className="w-4 h-4" /> Filter Records
              </Button>
           </div>
        </CardHeader>
        <CardContent className="p-0">
           <InvoiceTableClient invoices={invoices || []} />
        </CardContent>
      </Card>
    </div>
  )
}
