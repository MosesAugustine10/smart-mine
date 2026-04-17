import { getSupabaseServerClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard-header"
import { InvoiceGenerator } from "@/components/billing/invoice-generator"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ShieldCheck } from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function NewInvoicePage() {
  const supabase = await getSupabaseServerClient()
  
  // 1. Fetch Active Projects
  const { data: projects } = await supabase
    .from("projects")
    .select("id, name, client_name")
    .eq("status", "ACTIVE")
    .order("name")

  return (
    <div className="flex-1 overflow-auto p-4 md:p-8 space-y-10 bg-slate-50/10 dark:bg-slate-950/10 pb-20 font-inter">
      <div className="flex items-center justify-between max-w-6xl mx-auto">
        <Link href="/billing/invoices">
          <Button variant="ghost" className="h-10 px-4 rounded-xl font-black uppercase text-[10px] tracking-widest border-2 hover:bg-white transition-all">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Billing Hub
          </Button>
        </Link>
        <div className="flex items-center gap-2 px-6 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full">
           <ShieldCheck className="w-4 h-4 text-blue-600" />
           <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">Enterprise Fiscal Protocol</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto">
        <InvoiceGenerator projects={projects || []} />
      </div>
    </div>
  )
}
