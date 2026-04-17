import { DashboardHeader } from "@/components/dashboard-header"
import { SafetyForm } from "@/components/safety/safety-form"
import { Button } from "@/components/ui/button"
import { ChevronLeft, Info } from "lucide-react"
import Link from "next/link"

export default function NewIncidentPage() {
  return (
    <div className="flex-1 overflow-auto bg-slate-50/30 dark:bg-slate-950/30">
        <div className="p-8 space-y-8 max-w-5xl mx-auto">
            <div className="flex items-center justify-between">
                <Link href="/safety">
                    <Button variant="ghost" className="h-10 px-4 rounded-xl font-bold uppercase text-[10px] tracking-widest border-2 hover:bg-white transition-all">
                        <ChevronLeft className="w-4 h-4 mr-2" />
                        Back to Registry
                    </Button>
                </Link>
                <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border-2 border-amber-500/20 rounded-xl text-amber-700">
                    <Info className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Compliance Protocol Active</span>
                </div>
            </div>

            <DashboardHeader 
                title="Initiate Incident Report" 
                description="Secure forensic logging of safety events for corporate governance." 
            />

            <SafetyForm />
        </div>
    </div>
  )
}
