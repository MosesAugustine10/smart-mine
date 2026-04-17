import { getSupabaseServerClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard-header"
import { EquipmentChecklistForm } from "@/components/quarry/equipment-checklist-form"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ShieldCheck } from "lucide-react"
import Link from "next/link"

export default async function EquipmentChecklistPage() {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  // 1. Fetch Machines (New Vehicles Table)
  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("id, vehicle_number, vehicle_type")
    .eq("status", "operational")
    .order("vehicle_number")

  // 2. Fetch Active Profile & Company Info
  const { data: profile } = await supabase
    .from("user_profiles")
    .select(`
      full_name,
      company:companies(name)
    `)
    .eq("id", user?.id)
    .single()

  // 3. Fetch Project Client (Dynamic Naming)
  // For now, we take the first active project or a default
  const { data: project } = await supabase
    .from("projects")
    .select("client_name")
    .eq("status", "ACTIVE")
    .limit(1)
    .single()

  return (
    <div className="flex-1 overflow-auto p-4 md:p-8 space-y-10 bg-slate-50/30 dark:bg-slate-950/30 pb-20 font-inter">
      <div className="flex items-center justify-between max-w-6xl mx-auto">
        <Link href="/fleet/quarry">
          <Button variant="ghost" className="h-10 px-4 rounded-xl font-bold uppercase text-[10px] tracking-widest border-2 hover:bg-white transition-all">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Control Hub
          </Button>
        </Link>
        <div className="flex items-center gap-2 px-6 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
           <ShieldCheck className="w-4 h-4 text-emerald-600" />
           <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Active Safety Protocol: QF-01</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto">
        <EquipmentChecklistForm 
          machines={vehicles || []} 
          contractorName={(profile?.company as any)?.name || "Contractor"}
          clientName={project?.client_name || "Client"}
        />
      </div>
    </div>
  )
}
