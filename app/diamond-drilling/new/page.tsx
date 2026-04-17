"use client"

import { useState, useEffect } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { DashboardHeader } from "@/components/dashboard-header"
import { DiamondDrillingBudgetForm } from "@/components/diamond-drilling/diamond-drilling-budget-form"
import { DiamondExecutionForm } from "@/components/diamond-drilling/diamond-execution-form"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Gem, DollarSign } from "lucide-react"

export default function NewDiamondDrillingPage() {
  const [nextNumber, setNextNumber] = useState("DD-0001")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchNextNumber = async () => {
      const supabase = getSupabaseBrowserClient()
      const { data: lastDrill } = await supabase
        .from("diamond_drilling_executions")
        .select("drill_number")
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      if (lastDrill?.drill_number) {
        const lastNum = parseInt(lastDrill.drill_number.split("-")[1] || "0")
        setNextNumber(`DD-${String(lastNum + 1).padStart(4, "0")}`)
      }
      setLoading(false)
    }
    fetchNextNumber()
  }, [])

  if (loading) return null

  return (
    <div className="flex flex-col h-full bg-slate-50/30 dark:bg-slate-950/20">
      <DashboardHeader 
        title="Initialize Diamond Drilling Phase" 
        description="Phase 1: Configure core campaign targets and financial pipeline" 
      />
      
      <div className="flex-1 overflow-auto p-10">
        <div className="max-w-6xl mx-auto">
          
          <Tabs defaultValue="plan" className="w-full">
            <div className="flex justify-center mb-12">
                <TabsList className="bg-white dark:bg-slate-900 border-2 p-1.5 h-24 rounded-[3rem] shadow-2xl w-full max-w-2xl border-emerald-500/10">
                    <TabsTrigger value="plan" className="flex-1 h-full rounded-[2.5rem] data-[state=active]:bg-emerald-700 data-[state=active]:text-white font-black text-xs uppercase tracking-widest gap-4 transition-all duration-300">
                        <DollarSign className="w-6 h-6" />
                        Phase 1: Campaign Budget
                    </TabsTrigger>
                    <TabsTrigger value="log" className="flex-1 h-full rounded-[2.5rem] data-[state=active]:bg-slate-900 data-[state=active]:text-white font-black text-xs uppercase tracking-widest gap-4 transition-all duration-300">
                        <Gem className="w-6 h-6" />
                        Phase 2: Core Log
                    </TabsTrigger>
                </TabsList>
            </div>

            <TabsContent value="plan" className="animate-in fade-in zoom-in-95 duration-500">
                <DiamondDrillingBudgetForm drillNumber={nextNumber} />
            </TabsContent>

            <TabsContent value="log" className="animate-in fade-in zoom-in-95 duration-500">
                <DiamondExecutionForm />
            </TabsContent>
          </Tabs>

        </div>
      </div>
    </div>
  )
}
