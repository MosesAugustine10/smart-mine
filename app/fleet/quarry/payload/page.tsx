import { getSupabaseServerClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard-header"
import { EquipmentPayloadForm } from "@/components/quarry/equipment-payload-form"
import { Button } from "@/components/ui/button"
import { ChevronLeft, TrendingUp } from "lucide-react"
import Link from "next/link"

export default async function EquipmentPayloadPage() {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  // 1. Fetch Heavy Equipment (Vehicles Registry)
  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("id, vehicle_number, vehicle_type")
    .eq("status", "operational")
    .order("vehicle_number")

  // 2. Fetch Active Profile & Contractor Identity
  const { data: profile } = await supabase
    .from("user_profiles")
    .select(`
      full_name,
      company:companies(name)
    `)
    .eq("id", user?.id)
    .single()

  // 3. Fetch Project Client (Dynamic Naming)
  const { data: project } = await supabase
    .from("projects")
    .select("client_name")
    .eq("status", "ACTIVE")
    .limit(1)
    .single()

  return (
    <div className="flex-1 overflow-auto p-4 md:p-8 space-y-10 bg-slate-50/20 dark:bg-slate-950/20 pb-20 font-inter">
      <div className="flex items-center justify-between max-w-6xl mx-auto">
        <Link href="/fleet/quarry">
          <Button variant="ghost" className="h-10 px-4 rounded-xl font-black uppercase text-[10px] tracking-widest border-2 hover:bg-white transition-all">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Control Hub
          </Button>
        </Link>
        <div className="flex items-center gap-3 px-6 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full">
           <TrendingUp className="w-4 h-4 text-blue-600" />
           <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 italic">Production Protocol: QF-02</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        <EquipmentPayloadForm 
          machines={vehicles || []} 
          contractorName={(profile?.company as any)?.name || "Contractor"}
          clientName={project?.client_name || "Client"}
        />
      </div>
    </div>
  )
}
