"use client"

import { useState, useEffect } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { DashboardHeader } from "@/components/dashboard-header"
import { GeophysicsBudgetForm } from "@/components/geophysics/geophysics-budget-form"
import { GeophysicsLogForm } from "@/components/geophysics/geophysics-log-form"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Radio, DollarSign, Activity, FileText } from "lucide-react"

export default function NewGeophysicsPage() {
  const [nextNumber, setNextNumber] = useState("GS-0001")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchNextNumber = async () => {
      const supabase = getSupabaseBrowserClient()
      const { data: lastOp } = await supabase
        .from("geophysics_surveys")
        .select("survey_id")
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      if (lastOp?.survey_id) {
        const lastNum = parseInt(lastOp.survey_id.split("-")[1] || "0")
        setNextNumber(`GS-${String(lastNum + 1).padStart(4, "0")}`)
      }
      setLoading(false)
    }
    fetchNextNumber()
  }, [])

  if (loading) return null

  return (
    <div className="flex flex-col h-full bg-slate-50/20 dark:bg-slate-900/10">
      <DashboardHeader 
        title="Geophysical Campaign Hub" 
        description="Phase 1: Configure survey methodology and authorize financial allocation" 
      />
      
      <div className="flex-1 overflow-auto p-10">
        <div className="max-w-6xl mx-auto">
          
          <Tabs defaultValue="plan" className="w-full">
            <div className="flex justify-center mb-12">
                <TabsList className="bg-white dark:bg-slate-900 border-2 p-1.5 h-24 rounded-[3rem] shadow-2xl w-full max-w-2xl border-purple-500/10">
                    <TabsTrigger value="plan" className="flex-1 h-full rounded-[2.5rem] data-[state=active]:bg-purple-700 data-[state=active]:text-white font-black text-xs uppercase tracking-widest gap-4 transition-all duration-300">
                        <DollarSign className="w-6 h-6" />
                        Phase 1: Budget & Plan
                    </TabsTrigger>
                    <TabsTrigger value="log" className="flex-1 h-full rounded-[2.5rem] data-[state=active]:bg-slate-900 data-[state=active]:text-white font-black text-xs uppercase tracking-widest gap-4 transition-all duration-300">
                        <Radio className="w-6 h-6" />
                        Phase 2: Field Log
                    </TabsTrigger>
                </TabsList>
            </div>

            <TabsContent value="plan" className="animate-in fade-in zoom-in-95 duration-500">
                <GeophysicsBudgetForm surveyId={nextNumber} />
            </TabsContent>

            <TabsContent value="log" className="animate-in fade-in zoom-in-95 duration-500">
                <GeophysicsLogForm />
            </TabsContent>
          </Tabs>

        </div>
      </div>
    </div>
  )
}
