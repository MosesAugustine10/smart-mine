"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { DashboardHeader } from "@/components/dashboard-header"
import { BlastingDesignForm } from "@/components/blasting/blasting-design-form"
import { BlastingExecutionForm } from "@/components/blasting/blasting-execution-form"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Target, Zap } from "lucide-react"

export default function NewBlastingPage() {
  const searchParams = useSearchParams()
  const opId = searchParams.get("opId")

  const [nextNumber, setNextNumber] = useState("BLAST-0001")
  const [initialData, setInitialData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const supabase = getSupabaseBrowserClient()
      
      if (opId) {
        const { data } = await supabase.from("blasting_operations").select("*").eq("id", opId).single()
        if (data) {
           setInitialData(data)
           setNextNumber(data.blast_number)
        }
      } else {
        const { data: lastBlast } = await supabase
          .from("blasting_executions")
          .select("blast_number")
          .order("created_at", { ascending: false })
          .limit(1)
          .single()

        if (lastBlast?.blast_number) {
          const lastNum = parseInt(lastBlast.blast_number.split("-")[1] || "0")
          setNextNumber(`BLAST-${String(lastNum + 1).padStart(4, "0")}`)
        }
      }
      setLoading(false)
    }
    fetchData()
  }, [opId])

  if (loading) return null

  return (
    <div className="flex flex-col h-full bg-slate-50/30 dark:bg-slate-950/20">
      <DashboardHeader 
        title={opId ? "Review Blasting Operation" : "Initialize Blasting Operation"} 
        description={opId ? "Evaluate budget, approve design, and monitor execution" : "Phase Configuration: Pattern Design & Budget Allocation"} 
      />
      
      <div className="flex-1 overflow-auto p-4 sm:p-8">
        <div className="max-w-5xl mx-auto">
          
          <Tabs defaultValue="design" className="w-full">
            <div className="flex justify-center mb-8">
                <TabsList className="bg-slate-100/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 h-10 rounded-lg shadow-sm w-fit">
                    <TabsTrigger value="design" className="px-4 h-full rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-amber-600 data-[state=active]:shadow-sm text-[10px] font-bold uppercase tracking-widest gap-2 transition-all">
                        <Target className="w-3 h-3" />
                        Phase 1: Budget {"&"} Planning (Bajeti na Mipango)
                    </TabsTrigger>
                    <TabsTrigger value="log" className="px-4 h-full rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-amber-600 data-[state=active]:shadow-sm text-[10px] font-bold uppercase tracking-widest gap-2 transition-all">
                        <Zap className="w-3 h-3" />
                        Phase 2: Execution Record (Taarifa ya mlipuko)
                    </TabsTrigger>
                </TabsList>
            </div>

            <TabsContent value="design" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <BlastingDesignForm initialData={initialData} blastNumber={nextNumber} />
            </TabsContent>

            <TabsContent value="log" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <BlastingExecutionForm />
            </TabsContent>
          </Tabs>

        </div>
      </div>
    </div>
  )
}
