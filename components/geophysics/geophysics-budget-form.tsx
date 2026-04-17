"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Radio, Target, MapPin, DollarSign, Calculator, Calendar, Ruler } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface GeophysicsBudgetFormProps {
  surveyId?: string
}

export function GeophysicsBudgetForm({ surveyId }: GeophysicsBudgetFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    survey_id: surveyId || `SURV-${Date.now().toString().slice(-4)}`,
    location: "",
    region: "",
    method: "magnetic", // magnetic, gravity, ip, resistivity
    planned_line_km: 0,
    planned_stations: 0,

    // COST PART
    survey_cost_per_km: 0,
    labor_cost: 0,
    equipment_rental: 0,
    other_cost: 0,

    // OUTPUTS
    estimated_total_line_km: 0,
    estimated_total_cost: 0,
    planned_cost_per_km: 0
  })

  // Auto-calculate outputs
  useEffect(() => {
    const totalLineKm = formData.planned_line_km
    const surveyDirectCost = totalLineKm * formData.survey_cost_per_km
    const totalCost = surveyDirectCost + formData.labor_cost + formData.equipment_rental + formData.other_cost
    const costPerKm = totalLineKm > 0 ? totalCost / totalLineKm : 0

    setFormData(prev => ({
      ...prev,
      estimated_total_line_km: Number(totalLineKm.toFixed(2)),
      estimated_total_cost: Number(totalCost.toFixed(2)),
      planned_cost_per_km: Number(costPerKm.toFixed(2))
    }))
  }, [
    formData.planned_line_km, formData.survey_cost_per_km, 
    formData.labor_cost, formData.equipment_rental, formData.other_cost
  ])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = getSupabaseBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()

      const { error } = await supabase.from("geophysics_surveys").insert({
        ...formData,
        company_id: user?.id,
        status: "planned",
        current_phase: "design",
        created_by: user?.id
      })

      if (error) throw error

      toast({
        title: "SURVEY CAMPAIGN AUTHORIZED",
        description: `Geophysical survey ${formData.survey_id} has been registered.`
      })

      router.push("/geophysics")
      router.refresh()
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 pb-20">
      <Card className="border-0 shadow-2xl rounded-[3rem] overflow-hidden border-t-8 border-t-indigo-600">
        <CardHeader className="bg-slate-900 text-white p-10">
          <CardTitle className="text-3xl font-black uppercase tracking-tighter italic">✦ GEOPHYSICS SURVEY ✦ (PLANNING) ✦</CardTitle>
        </CardHeader>
        
        <CardContent className="p-10 bg-slate-50/50">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            
            {/* REGISTRY */}
            <div className="space-y-6 col-span-full">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5 text-indigo-600" />
                <h3 className="font-black text-xs uppercase tracking-widest text-slate-500">Survey Registry</h3>
              </div>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">survey id</Label>
                  <Input value={formData.survey_id} readOnly className="h-12 border-2 rounded-xl font-bold bg-slate-100" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">location</Label>
                  <Input value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="h-12 border-2 rounded-xl" />
                </div>
                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">region</Label>
                   <Input value={formData.region} onChange={e => setFormData({...formData, region: e.target.value})} className="h-12 border-2 rounded-xl" />
                </div>
                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">method</Label>
                   <Select value={formData.method} onValueChange={v => setFormData({...formData, method: v})}>
                    <SelectTrigger className="h-12 border-2 rounded-xl">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="magnetic">Magnetic</SelectItem>
                      <SelectItem value="gravity">Gravity</SelectItem>
                      <SelectItem value="ip">Induced Polarization (IP)</SelectItem>
                      <SelectItem value="resistivity">Resistivity</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* DESIGN PARAMETERS */}
            <div className="space-y-6 col-span-2">
              <div className="flex items-center gap-2 mb-2">
                <Ruler className="w-5 h-5 text-indigo-600" />
                <h3 className="font-black text-xs uppercase tracking-widest text-slate-500">Survey Parameters</h3>
              </div>
              <div className="grid gap-4 md:grid-cols-2 bg-white p-8 rounded-[2rem] border-2 border-slate-100 shadow-sm">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">planned line km</Label>
                  <Input type="number" step="0.1" value={formData.planned_line_km} onChange={e => setFormData({...formData, planned_line_km: parseFloat(e.target.value) || 0})} className="h-12 border-2 rounded-xl font-black text-indigo-600" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">planned stations</Label>
                  <Input type="number" value={formData.planned_stations} onChange={e => setFormData({...formData, planned_stations: parseInt(e.target.value) || 0})} className="h-12 border-2 rounded-xl font-bold" />
                </div>
              </div>
            </div>

            {/* COST PART */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-indigo-600" />
                <h3 className="font-black text-xs uppercase tracking-widest text-slate-500">COST PART</h3>
              </div>
              <div className="grid gap-4 bg-white p-8 rounded-[2rem] border-2 border-slate-100 shadow-sm">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">survey cost/km</Label>
                  <Input type="number" value={formData.survey_cost_per_km} onChange={e => setFormData({...formData, survey_cost_per_km: parseFloat(e.target.value) || 0})} className="h-12 border-2 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">labor cost</Label>
                  <Input type="number" value={formData.labor_cost} onChange={e => setFormData({...formData, labor_cost: parseFloat(e.target.value) || 0})} className="h-12 border-2 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">equipment rental</Label>
                  <Input type="number" value={formData.equipment_rental} onChange={e => setFormData({...formData, equipment_rental: parseFloat(e.target.value) || 0})} className="h-12 border-2 rounded-xl" />
                </div>
                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">other cost</Label>
                   <Input type="number" value={formData.other_cost} onChange={e => setFormData({...formData, other_cost: parseFloat(e.target.value) || 0})} className="h-12 border-2 rounded-xl" />
                </div>
              </div>
            </div>

            {/* OUTPUTS */}
            <div className="col-span-full bg-slate-900 rounded-[3rem] p-12 text-white relative overflow-hidden ring-4 ring-indigo-500/20">
               <div className="relative z-10 grid gap-12 md:grid-cols-3">
                  <div className="text-center">
                     <p className="text-[10px] font-black uppercase tracking-tight opacity-40 mb-3">estimated total line km</p>
                     <p className="text-5xl font-black text-indigo-400">{formData.estimated_total_line_km.toLocaleString()} km</p>
                     <p className="text-[11px] font-bold opacity-30 uppercase mt-2">Coverage Projection</p>
                  </div>
                  <div className="text-center">
                     <p className="text-[10px] font-black uppercase tracking-tight opacity-40 mb-3">estimated total cost</p>
                     <p className="text-5xl font-black text-emerald-400">TZS {formData.estimated_total_cost.toLocaleString()}</p>
                     <p className="text-[11px] font-bold opacity-30 uppercase mt-2">Strategic Budget</p>
                  </div>
                  <div className="text-center">
                     <p className="text-[10px] font-black uppercase tracking-tight opacity-40 mb-3">planned cost/km</p>
                     <p className="text-5xl font-black text-amber-500">TZS {formData.planned_cost_per_km.toLocaleString()}</p>
                     <p className="text-[11px] font-bold opacity-30 uppercase mt-2">Unit Efficiency</p>
                  </div>
               </div>
               <Calculator className="absolute -bottom-20 -right-20 w-80 h-80 opacity-[0.03] text-white pointer-events-none -z-10" />
            </div>

            {/* ACTION BUTTONS */}
            <div className="col-span-full flex gap-4 pt-8">
               <Button type="submit" disabled={loading} className="flex-1 h-20 bg-indigo-600 hover:bg-indigo-700 rounded-3xl text-xl font-black uppercase tracking-widest shadow-2xl shadow-indigo-500/20 transition-all active:scale-95">
                  {loading ? <Loader2 className="w-8 h-8 animate-spin" /> : "Authorize Survey Protocol"}
               </Button>
               <Button type="button" variant="outline" onClick={() => router.back()} className="h-20 px-12 rounded-3xl font-bold uppercase tracking-widest border-2 hover:bg-slate-100">
                  Discard
               </Button>
            </div>

          </div>
        </CardContent>
      </Card>
    </form>
  )
}
