import { getSupabaseServerClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard-header"
import { FuelLogForm } from "@/components/fleet/fuel-log-form"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"

export default async function NewFuelLogPage() {
    const supabase = await getSupabaseServerClient()

    const { data: vehicles } = await supabase
        .from("vehicles")
        .select("id, vehicle_number, vehicle_type")
        .order("vehicle_number")

    const { data: drivers } = await supabase
        .from("user_profiles")
        .select("id, full_name")
        .in("role", ["DRIVER", "OPERATOR"])
        .eq("is_active", true)
        .order("full_name")

    const formattedVehicles = (vehicles || []).map(v => ({
        id: v.id,
        vehicle_number: v.vehicle_number,
        vehicle_type: v.vehicle_type
    }))

    return (
        <div className="flex-1 overflow-auto p-8 space-y-10 bg-slate-50/30 dark:bg-slate-950/30 pb-20 font-inter">
            <div className="flex items-center justify-between">
                <Link href="/fleet/fuel-logs">
                    <Button variant="ghost" className="h-10 px-4 rounded-xl font-bold uppercase text-[10px] tracking-widest border-2 hover:bg-white transition-all">
                        <ChevronLeft className="w-4 h-4 mr-2" />
                        Abort Disbursement
                    </Button>
                </Link>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Security Clearance Level 2</span>
                </div>
            </div>

            <div className="max-w-5xl mx-auto">
                <FuelLogForm 
                    vehicles={formattedVehicles} 
                    drivers={drivers || []} 
                />
            </div>
        </div>
    )
}
