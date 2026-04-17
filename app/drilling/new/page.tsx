"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { DashboardHeader } from "@/components/dashboard-header"
import { DrillingBudgetForm } from "@/components/drilling/drilling-budget-form"
import { DrillingExecutionForm } from "@/components/drilling/drilling-execution-form"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Activity, DollarSign } from "lucide-react"

export default function NewDrillingPage() {
  const searchParams = useSearchParams()
  const opId = searchParams.get("opId")

  const [nextNumber, setNextNumber] = useState("DRL-0001")
  const [initialData, setInitialData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const supabase = getSupabaseBrowserClient()
      
      if (opId) {
        const { data } = await supabase.from("drilling_operations").select("*").eq("id", opId).single()
        if (data) {
           setInitialData(data)
           setNextNumber(data.drill_number)
        }
      } else {
        const { data: lastDrill } = await supabase
          .from("drilling_operations")
          .select("drill_number")
          .order("created_at", { ascending: false })
          .limit(1)
          .single()

        if (lastDrill?.drill_number) {
          const lastNum = parseInt(lastDrill.drill_number.split("-")[1] || "0")
          setNextNumber(`DRL-${String(lastNum + 1).padStart(4, "0")}`)
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
        title={opId ? "Review Drilling Operation" : "Initialize Drilling Operation"} 
        description={opId ? "Evaluate budget, approve design, and monitor execution" : "Phase Configuration: Targets & Budget Allocation"} 
      />
      
      <div className="flex-1 overflow-auto p-4 sm:p-8">
        <div className="max-w-5xl mx-auto">
          
          <Tabs defaultValue="plan" className="w-full">
            <div className="flex justify-center mb-8">
                <TabsList className="bg-slate-100/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 h-10 rounded-lg shadow-sm w-fit">
                    <TabsTrigger value="plan" className="px-4 h-full rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-blue-600 data-[state=active]:shadow-sm text-[10px] font-bold uppercase tracking-widest gap-2 transition-all">
                        <DollarSign className="w-3 h-3" />
                        P1: Planning & Approval
                    </TabsTrigger>
                    <TabsTrigger value="log" className="px-4 h-full rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-blue-600 data-[state=active]:shadow-sm text-[10px] font-bold uppercase tracking-widest gap-2 transition-all">
                        <Activity className="w-3 h-3" />
                        P2: Execution Log
                    </TabsTrigger>
                </TabsList>
            </div>

            <TabsContent value="plan" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <DrillingBudgetForm initialData={initialData} drillNumber={nextNumber} />
            </TabsContent>

            <TabsContent value="log" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <DrillingExecutionForm />
            </TabsContent>
          </Tabs>

        </div>
      </div>
    </div>
  )
}
