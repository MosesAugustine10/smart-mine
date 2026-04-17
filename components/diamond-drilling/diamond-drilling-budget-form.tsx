"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Gem, Target, Ruler, DollarSign, Calculator, Calendar, MapPin } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface DiamondDrillingBudgetFormProps {
  drillNumber?: string
}

export function DiamondDrillingBudgetForm({ drillNumber }: DiamondDrillingBudgetFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    operation_number: drillNumber || `DD-${Date.now().toString().slice(-6)}`,
    region: "",
    location: "",
    planned_start_date: new Date().toISOString().split("T")[0],
    planned_end_date: new Date().toISOString().split("T")[0],
    planned_holes: 0,
    planned_depth: 0,
    core_size: "HQ", // HQ, NQ, PQ, BQ

    // COST PART
    drilling_cost_per_m: 0,
    labor_cost: 0,
    fuel_cost: 0,
    additives_cost: 0,
    other_cost: 0,

    // OUTPUTS
    estimated_total_depth: 0,
    estimated_total_cost: 0,
    planned_cost_per_m: 0
  })

  // Auto-calculate outputs
  useEffect(() => {
    const totalDepth = formData.planned_holes * formData.planned_depth
    const drillingDirectCost = totalDepth * formData.drilling_cost_per_m
    const totalCost = drillingDirectCost + formData.labor_cost + formData.fuel_cost + formData.additives_cost + formData.other_cost
    const costPerM = totalDepth > 0 ? totalCost / totalDepth : 0

    setFormData(prev => ({
      ...prev,
      estimated_total_depth: Number(totalDepth.toFixed(2)),
      estimated_total_cost: Number(totalCost.toFixed(2)),
      planned_cost_per_m: Number(costPerM.toFixed(2))
    }))
  }, [
    formData.planned_holes, formData.planned_depth, formData.drilling_cost_per_m,
    formData.labor_cost, formData.fuel_cost, formData.additives_cost, formData.other_cost
  ])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = getSupabaseBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()

      const { error } = await supabase.from("diamond_drilling_executions").insert({
        ...formData,
        company_id: user?.id,
        status: "planned",
        current_phase: "design",
        created_by: user?.id
      })

      if (error) throw error

      toast({
        title: "DIAMOND DRILLING PLAN AUTHORIZED",
        description: `Campaign ${formData.operation_number} has been archived in the geological registry.`
      })

      router.push("/diamond-drilling")
      router.refresh()
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 pb-20">
      <Card className="border-0 shadow-2xl rounded-[2.5rem] overflow-hidden border-t-8 border-t-emerald-700">
        <CardHeader className="bg-slate-900 text-white p-8">
          <CardTitle className="text-3xl font-black uppercase tracking-tighter italic">✦ DIAMOND DRILLING ✦ (PLANNING PHASE) ✦</CardTitle>
        </CardHeader>
        
        <CardContent className="p-8 bg-slate-50/50">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            
            {/* REGISTRY */}
            <div className="space-y-4 col-span-full">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5 text-emerald-600" />
                <h3 className="font-black text-xs uppercase tracking-widest text-slate-500">Geological Registry</h3>
              </div>
              <div className="grid gap-4 md:grid-cols-5">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">operation number</Label>
                  <Input value={formData.operation_number} disabled className="h-12 border-2 rounded-xl font-bold bg-slate-100" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">region</Label>
                  <Input value={formData.region} onChange={e => setFormData({...formData, region: e.target.value})} className="h-12 border-2 rounded-xl" placeholder="Tanga, Geita etc" />
                </div>
                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">location</Label>
                   <Input value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="h-12 border-2 rounded-xl" placeholder="Prospect A, Block 4" />
                </div>
                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">planned start date</Label>
                   <Input type="date" value={formData.planned_start_date} onChange={e => setFormData({...formData, planned_start_date: e.target.value})} className="h-12 border-2 rounded-xl" />
                </div>
                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">planned end date</Label>
                   <Input type="date" value={formData.planned_end_date} onChange={e => setFormData({...formData, planned_end_date: e.target.value})} className="h-12 border-2 rounded-xl" />
                </div>
              </div>
            </div>

            {/* DESIGN PARAMETERS */}
            <div className="space-y-6 col-span-2">
              <div className="flex items-center gap-2 mb-2">
                <Ruler className="w-5 h-5 text-emerald-600" />
                <h3 className="font-black text-xs uppercase tracking-widest text-slate-500">Design Parameters</h3>
              </div>
              <div className="grid gap-4 md:grid-cols-3 bg-white p-6 rounded-3xl border-2 border-slate-100 shadow-sm">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">planned holes</Label>
                  <Input type="number" value={formData.planned_holes} onChange={e => setFormData({...formData, planned_holes: parseInt(e.target.value) || 0})} className="h-12 border-2 rounded-xl font-black text-emerald-600" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">planned depth (m)</Label>
                  <Input type="number" step="0.1" value={formData.planned_depth} onChange={e => setFormData({...formData, planned_depth: parseFloat(e.target.value) || 0})} className="h-12 border-2 rounded-xl font-bold" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">core size</Label>
                  <Input value={formData.core_size} onChange={e => setFormData({...formData, core_size: e.target.value})} className="h-12 border-2 rounded-xl" placeholder="e.g. HQ (63.5mm)" />
                </div>
              </div>
            </div>

            {/* COST PART */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                <h3 className="font-black text-xs uppercase tracking-widest text-slate-500">COST PART</h3>
              </div>
              <div className="grid gap-4 bg-white p-6 rounded-3xl border-2 border-slate-100 shadow-sm">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">drilling cost/m</Label>
                  <Input type="number" value={formData.drilling_cost_per_m} onChange={e => setFormData({...formData, drilling_cost_per_m: parseFloat(e.target.value) || 0})} className="h-12 border-2 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">labor cost</Label>
                  <Input type="number" value={formData.labor_cost} onChange={e => setFormData({...formData, labor_cost: parseFloat(e.target.value) || 0})} className="h-12 border-2 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">fuel cost</Label>
                  <Input type="number" value={formData.fuel_cost} onChange={e => setFormData({...formData, fuel_cost: parseFloat(e.target.value) || 0})} className="h-12 border-2 rounded-xl" />
                </div>
                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">additives cost</Label>
                   <Input type="number" value={formData.additives_cost} onChange={e => setFormData({...formData, additives_cost: parseFloat(e.target.value) || 0})} className="h-12 border-2 rounded-xl" />
                </div>
                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">other cost</Label>
                   <Input type="number" value={formData.other_cost} onChange={e => setFormData({...formData, other_cost: parseFloat(e.target.value) || 0})} className="h-12 border-2 rounded-xl" />
                </div>
              </div>
            </div>

            {/* OUTPUTS */}
            <div className="col-span-full bg-emerald-950 rounded-[2.5rem] p-10 text-white relative overflow-hidden ring-4 ring-emerald-500/20">
               <div className="relative z-10 grid gap-8 md:grid-cols-3">
                  <div className="text-center md:text-left border-l-4 border-emerald-500 pl-6">
                     <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">estimated total depth</p>
                     <p className="text-4xl font-black text-emerald-400">{formData.estimated_total_depth.toLocaleString()} m</p>
                     <p className="text-[11px] font-bold opacity-30 uppercase mt-1">Linear Metrage</p>
                  </div>
                  <div className="text-center md:text-left border-l-4 border-blue-500 pl-6">
                     <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">estimated total cost</p>
                     <p className="text-4xl font-black text-blue-400">TZS {formData.estimated_total_cost.toLocaleString()}</p>
                     <p className="text-[11px] font-bold opacity-30 uppercase mt-1">Total strategic budget</p>
                  </div>
                  <div className="text-center md:text-left border-l-4 border-amber-500 pl-6">
                     <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">planned cost/m</p>
                     <p className="text-4xl font-black text-amber-400">TZS {formData.planned_cost_per_m.toLocaleString()}</p>
                     <p className="text-[11px] font-bold opacity-30 uppercase mt-1">per unit efficiency</p>
                  </div>
               </div>
               <Calculator className="absolute -bottom-10 -right-10 w-64 h-64 opacity-5 text-white pointer-events-none -z-10" />
            </div>

            {/* ACTION BUTTONS */}
            <div className="col-span-full flex gap-4 pt-4">
               <Button type="submit" disabled={loading} className="flex-1 h-20 bg-emerald-600 hover:bg-emerald-700 rounded-2xl text-xl font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20 transition-all active:scale-95">
                  {loading ? <Loader2 className="w-8 h-8 animate-spin" /> : "Authorize Core Campaign"}
               </Button>
               <Button type="button" variant="outline" onClick={() => router.back()} className="h-20 px-10 rounded-2xl font-bold uppercase tracking-widest border-2">
                  Back
               </Button>
            </div>

          </div>
        </CardContent>
      </Card>
    </form>
  )
}
