// app/material-handling/new/page.tsx - FIXED
"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { DashboardHeader } from "@/components/dashboard-header"
import { MaterialHandlingBudgetForm } from "@/components/material-handling/material-handling-budget-form"
import { MaterialHandlingExecutionForm } from "@/components/material-handling/material-handling-execution-form"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DollarSign, Truck } from "lucide-react"

function MaterialHandlingContent() {
  const searchParams = useSearchParams()
  const opId = searchParams.get("opId") || ""
  const [nextNumber, setNextNumber] = useState("MH-0001")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchNextNumber = async () => {
      const supabase = getSupabaseBrowserClient()
      const { data: lastOp } = await supabase
        .from("material_handling_operations")
        .select("operation_number")
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      if (lastOp?.operation_number) {
        const lastNum = parseInt(lastOp.operation_number.split("-")[1])
        if (!isNaN(lastNum)) {
          setNextNumber(`MH-${String(lastNum + 1).padStart(4, "0")}`)
        }
      }
      setLoading(false)
    }
    fetchNextNumber()
  }, [])

  if (loading) return null

  return (
    <div className="flex-1 overflow-auto p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <Tabs defaultValue={opId ? "execution" : "plan"} className="w-full">
          <div className="flex justify-center mb-10">
            <TabsList className="bg-white dark:bg-slate-900 border-2 p-1 h-20 rounded-[2rem] shadow-xl w-full max-w-2xl">
              <TabsTrigger value="plan" className="flex-1 h-full rounded-[1.7rem] data-[state=active]:bg-emerald-600 data-[state=active]:text-white font-black text-xs uppercase tracking-widest gap-3">
                <DollarSign className="w-5 h-5" />
                Phase 1: Budgeting
              </TabsTrigger>
              <TabsTrigger value="execution" className="flex-1 h-full rounded-[1.7rem] data-[state=active]:bg-slate-900 data-[state=active]:text-white font-black text-xs uppercase tracking-widest gap-3">
                <Truck className="w-5 h-5" />
                Phase 2: Shift Log
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="plan" className="animate-in fade-in slide-in-from-bottom-5 duration-500">
            <MaterialHandlingBudgetForm operationNumber={nextNumber} />
          </TabsContent>

          <TabsContent value="execution" className="animate-in fade-in slide-in-from-bottom-5 duration-500">
            <MaterialHandlingExecutionForm operationId={opId} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default function NewMaterialHandlingPage() {
  return (
    <div className="flex flex-col h-full bg-slate-50/50 dark:bg-slate-950/20">
      <DashboardHeader
        title="Initialize Load & Haul Phase"
        description="Choose between strategic budgeting or tactical shift execution logging"
      />
      <Suspense fallback={<div className="p-8 text-center font-bold">Synchronizing Parameters...</div>}>
        <MaterialHandlingContent />
      </Suspense>
    </div>
  )
}