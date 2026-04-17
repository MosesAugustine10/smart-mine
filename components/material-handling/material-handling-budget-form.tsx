"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, DollarSign, Target, MapPin, Calendar, Truck, Fuel, Settings, Calculator } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface MaterialHandlingBudgetFormProps {
  operationNumber?: string
}

export function MaterialHandlingBudgetForm({ operationNumber }: MaterialHandlingBudgetFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    operation_number: operationNumber || `MH-${Date.now().toString().slice(-6)}`,
    region: "",
    location: "",
    planned_start_date: new Date().toISOString().split("T")[0],
    planned_end_date: new Date().toISOString().split("T")[0],
    planned_tonnage: 0,
    estimated_fuel_consumption: 0,
    estimated_distance_km: 0,

    // COST PART
    fuel_cost: 0,
    labor: 0,
    machine_maintenance_cost: 0,
    other_cost: 0,

    // OUTPUTS
    estimated_total_cost: 0,
    estimated_cost_tonne: 0,
    planned_efficiency: 0 // t/l or similar
  })

  // Auto-calculate outputs
  useEffect(() => {
    const totalCost = formData.fuel_cost + formData.labor + formData.machine_maintenance_cost + formData.other_cost
    const costPerTonne = formData.planned_tonnage > 0 ? totalCost / formData.planned_tonnage : 0
    const efficiency = formData.estimated_fuel_consumption > 0 ? formData.planned_tonnage / formData.estimated_fuel_consumption : 0

    setFormData(prev => ({
      ...prev,
      estimated_total_cost: Number(totalCost.toFixed(2)),
      estimated_cost_tonne: Number(costPerTonne.toFixed(2)),
      planned_efficiency: Number(efficiency.toFixed(2))
    }))
  }, [
    formData.fuel_cost, formData.labor, formData.machine_maintenance_cost, 
    formData.other_cost, formData.planned_tonnage, formData.estimated_fuel_consumption
  ])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = getSupabaseBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()

      const { error } = await supabase.from("material_handling_operations").insert({
        ...formData,
        company_id: user?.id,
        status: "planned",
        current_phase: "design"
      })

      if (error) throw error

      toast({
        title: "MATERIAL HANDLING PLAN AUTHORIZED",
        description: `Operation ${formData.operation_number} has been archived in the fleet registry.`
      })

      router.push("/material-handling")
      router.refresh()
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 pb-20">
      <Card className="border-0 shadow-2xl rounded-[2.5rem] overflow-hidden border-t-8 border-t-emerald-600">
        <CardHeader className="bg-slate-900 text-white p-8">
          <CardTitle className="text-3xl font-black uppercase tracking-tighter italic">✦ MATERIAL HANDLING MODULE ✦ (PLANNING DESIGN PHASE) ✦</CardTitle>
        </CardHeader>
        
        <CardContent className="p-8 bg-slate-50/50">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            
            {/* BASIC INFO */}
            <div className="space-y-4 col-span-full">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5 text-emerald-600" />
                <h3 className="font-black text-xs uppercase tracking-widest text-slate-500">Operation Registry</h3>
              </div>
              <div className="grid gap-4 md:grid-cols-5">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">operation number</Label>
                  <Input value={formData.operation_number} disabled className="h-12 border-2 rounded-xl font-bold bg-slate-100" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">region</Label>
                  <Input value={formData.region} onChange={e => setFormData({...formData, region: e.target.value})} className="h-12 border-2 rounded-xl" placeholder="Geita, Kahama etc" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">location</Label>
                  <Input value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="h-12 border-2 rounded-xl" placeholder="Stockpile 4, Pit A" />
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
                <Truck className="w-5 h-5 text-emerald-600" />
                <h3 className="font-black text-xs uppercase tracking-widest text-slate-500">Fleet Targets</h3>
              </div>
              <div className="grid gap-4 md:grid-cols-3 bg-white p-6 rounded-3xl border-2 border-slate-100 shadow-sm">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">planned tonnage</Label>
                  <Input type="number" value={formData.planned_tonnage} onChange={e => setFormData({...formData, planned_tonnage: parseFloat(e.target.value) || 0})} className="h-12 border-2 rounded-xl font-black text-emerald-600" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">estimated fuel consumption (l)</Label>
                  <Input type="number" value={formData.estimated_fuel_consumption} onChange={e => setFormData({...formData, estimated_fuel_consumption: parseFloat(e.target.value) || 0})} className="h-12 border-2 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">estimated distance (km)</Label>
                  <Input type="number" step="0.1" value={formData.estimated_distance_km} onChange={e => setFormData({...formData, estimated_distance_km: parseFloat(e.target.value) || 0})} className="h-12 border-2 rounded-xl" />
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
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">fuel cost</Label>
                  <Input type="number" value={formData.fuel_cost} onChange={e => setFormData({...formData, fuel_cost: parseFloat(e.target.value) || 0})} className="h-12 border-2 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">labor</Label>
                  <Input type="number" value={formData.labor} onChange={e => setFormData({...formData, labor: parseFloat(e.target.value) || 0})} className="h-12 border-2 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">machine maintenance cost</Label>
                  <Input type="number" value={formData.machine_maintenance_cost} onChange={e => setFormData({...formData, machine_maintenance_cost: parseFloat(e.target.value) || 0})} className="h-12 border-2 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">other cost</Label>
                  <Input type="number" value={formData.other_cost} onChange={e => setFormData({...formData, other_cost: parseFloat(e.target.value) || 0})} className="h-12 border-2 rounded-xl" />
                </div>
              </div>
            </div>

            {/* OUTPUTS */}
            <div className="col-span-full bg-emerald-950 rounded-[2.5rem] p-10 text-white relative overflow-hidden">
               <div className="relative z-10 grid gap-8 md:grid-cols-3">
                  <div className="text-center md:text-left">
                     <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">estimated total cost</p>
                     <p className="text-4xl font-black text-emerald-400">TZS {formData.estimated_total_cost.toLocaleString()}</p>
                     <p className="text-[11px] font-bold opacity-30 uppercase mt-1">Total strategic budget</p>
                  </div>
                  <div className="text-center md:text-left">
                     <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">estimated cost/tonne</p>
                     <p className="text-4xl font-black text-blue-400">TZS {formData.estimated_cost_tonne.toLocaleString()}</p>
                     <p className="text-[11px] font-bold opacity-30 uppercase mt-1">per unit efficiency</p>
                  </div>
                  <div className="text-center md:text-left">
                     <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">planned efficiency</p>
                     <p className="text-4xl font-black text-amber-400">{formData.planned_efficiency.toLocaleString()}</p>
                     <p className="text-[11px] font-bold opacity-30 uppercase mt-1">tonnes per liter</p>
                  </div>
               </div>
               <Calculator className="absolute -bottom-10 -right-10 w-64 h-64 opacity-5 text-white pointer-events-none -z-10" />
            </div>

            {/* ACTION BUTTONS */}
            <div className="col-span-full flex gap-4 pt-4">
               <Button type="submit" disabled={loading} className="flex-1 h-20 bg-emerald-600 hover:bg-emerald-700 rounded-2xl text-xl font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20 transition-all active:scale-95">
                  {loading ? <Loader2 className="w-8 h-8 animate-spin" /> : "Authorize Fleet Operation"}
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
