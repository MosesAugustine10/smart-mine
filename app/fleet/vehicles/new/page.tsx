import { DashboardHeader } from "@/components/dashboard-header"
import { VehicleForm } from "@/components/fleet/vehicle-form"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"

export default function NewVehiclePage() {
  return (
    <div className="flex-1 overflow-auto p-8 space-y-10 bg-slate-50/30 dark:bg-slate-950/30 pb-20 font-inter">
        <div className="flex items-center justify-between">
            <Link href="/fleet/vehicles">
                <Button variant="ghost" className="h-10 px-4 rounded-xl font-bold uppercase text-[10px] tracking-widest border-2 hover:bg-white transition-all">
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Abort Commissioning
                </Button>
            </Link>
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-slate-900 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Security Clearance Level 4</span>
            </div>
        </div>

        <div className="max-w-5xl mx-auto">
            <VehicleForm />
        </div>
    </div>
  )
}
