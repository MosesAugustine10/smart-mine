"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Radio, MapPin, Activity, Settings, MessageSquare, Calculator, Cloud, Ruler, Compass } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { ProfessionalSignature } from "@/components/professional-signature"

interface GeophysicsExecutionFormProps {
  operationId?: string
}

export function GeophysicsExecutionForm({ operationId }: GeophysicsExecutionFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    geophysicist_name: "",
    survey_id: operationId || "",
    date: new Date().toISOString().split("T")[0],
    daily_line_km: 0,
    daily_stations: 0,
    weather: "sunny",
    challenges: "",
    $notes: "",

    // Internal costs
    planned_line_km: 100, // Default for calc
    survey_cost_per_km: 50000,
    labor_cost_daily: 200000,

    // OUTPUTS
    cumulative_line_km: 0,
    survey_progress_percent: 0,
    actual_cost_per_km: 0
  })

  const [signatures, setSignatures] = useState({
    scientist: null as string | null,
    official: null as string | null
  })

  // Auto-calculate outputs
  useEffect(() => {
    const cumulative = formData.daily_line_km // Assuming this is daily log
    const progress = formData.planned_line_km > 0 ? (cumulative / formData.planned_line_km) * 100 : 0
    const totalDailyCost = (formData.daily_line_km * formData.survey_cost_per_km) + formData.labor_cost_daily
    const actualCostPerKm = formData.daily_line_km > 0 ? totalDailyCost / formData.daily_line_km : 0

    setFormData(prev => ({
      ...prev,
      cumulative_line_km: Number(cumulative.toFixed(2)),
      survey_progress_percent: Number(progress.toFixed(1)),
      actual_cost_per_km: Number(actualCostPerKm.toFixed(2))
    }))
  }, [formData.daily_line_km, formData.planned_line_km, formData.survey_cost_per_km, formData.labor_cost_daily])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = getSupabaseBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()

      const payload = {
        ...formData,
        company_id: user?.id,
        scientist_signature: signatures.scientist,
        official_signature: signatures.official,
        status: "completed",
        current_phase: "execution",
        created_by: user?.id
      }

      const { error } = await supabase.from("geophysics_executions").insert(payload)
      if (error) throw error

      toast({ title: "GEOPHYSICS LOG TRANSMITTED", description: "Field data archived and synced." })
      router.push("/geophysics")
      router.refresh()
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 pb-24">
      <Card className="border-0 shadow-2xl rounded-[3rem] overflow-hidden border-t-8 border-t-violet-600">
        <CardHeader className="bg-slate-900 text-white p-10">
          <CardTitle className="text-3xl font-black uppercase tracking-tighter italic">✦ GEOPHYSICS SURVEY ✦ (DURING EXECUTION) ✦</CardTitle>
        </CardHeader>
        
        <CardContent className="p-10 bg-slate-50/50">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            
            {/* FIELD REGISTRY */}
            <div className="space-y-6 col-span-full">
              <div className="flex items-center gap-2 mb-2">
                <Compass className="w-5 h-5 text-violet-600" />
                <h3 className="font-black text-xs uppercase tracking-widest text-slate-500">Field Registry</h3>
              </div>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2 col-span-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">geophysicist name</Label>
                  <Input value={formData.geophysicist_name} onChange={e => setFormData({...formData, geophysicist_name: e.target.value})} className="h-12 border-2 rounded-xl" placeholder="Lead Scientist" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">survey id</Label>
                  <Input value={formData.survey_id} onChange={e => setFormData({...formData, survey_id: e.target.value})} className="h-12 border-2 rounded-xl font-bold" placeholder="SRV-XXX" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">date</Label>
                  <Input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="h-12 border-2 rounded-xl font-bold" />
                </div>
              </div>
            </div>

            {/* ACQUISITION METRICS */}
            <div className="space-y-6 col-span-2">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-5 h-5 text-violet-600" />
                <h3 className="font-black text-xs uppercase tracking-widest text-slate-500">Acquisition Metrics</h3>
              </div>
              <div className="grid gap-4 md:grid-cols-3 bg-white p-8 rounded-[2rem] border-2 border-slate-100 shadow-sm">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">daily line km</Label>
                  <Input type="number" step="0.1" value={formData.daily_line_km} onChange={e => setFormData({...formData, daily_line_km: parseFloat(e.target.value) || 0})} className="h-12 border-2 rounded-xl font-black text-violet-600" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">daily stations</Label>
                  <Input type="number" value={formData.daily_stations} onChange={e => setFormData({...formData, daily_stations: parseInt(e.target.value) || 0})} className="h-12 border-2 rounded-xl font-bold" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">weather</Label>
                  <Select value={formData.weather} onValueChange={v => setFormData({...formData, weather: v})}>
                    <SelectTrigger className="h-12 border-2 rounded-xl">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sunny">Sunny / Clear</SelectItem>
                      <SelectItem value="cloudy">Overcast / Cloudy</SelectItem>
                      <SelectItem value="rainy">Rainy / Interrupted</SelectItem>
                      <SelectItem value="stormy">Electrical Storm</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* LOGISTICS CONTEXT */}
            <div className="space-y-6">
               <div className="flex items-center gap-2 mb-2">
                <Cloud className="w-5 h-5 text-slate-400" />
                <h3 className="font-black text-xs uppercase tracking-widest text-slate-500">Logistics Context</h3>
              </div>
              <div className="bg-white p-8 rounded-[2rem] border-2 border-slate-100 shadow-sm space-y-4">
                 <div className="flex justify-between items-center">
                    <Label className="text-[10px] font-black uppercase opacity-60">planned total km</Label>
                    <Input type="number" value={formData.planned_line_km} onChange={e => setFormData({...formData, planned_line_km: parseFloat(e.target.value) || 0})} className="w-20 h-10 border-2 rounded-lg text-right font-bold" />
                 </div>
                 <div className="flex justify-between items-center text-xs">
                    <span className="opacity-40 uppercase font-black">Daily OpEx TZS</span>
                    <span className="font-black text-violet-600">{(formData.labor_cost_daily).toLocaleString()}</span>
                 </div>
              </div>
            </div>

            {/* OUTPUTS */}
            <div className="col-span-full bg-violet-950 rounded-[3rem] p-12 text-white relative overflow-hidden ring-4 ring-violet-500/20">
               <div className="relative z-10 grid gap-12 md:grid-cols-3">
                  <div className="text-center">
                     <p className="text-[10px] font-black uppercase tracking-tight opacity-40 mb-3">cumulative line km</p>
                     <p className="text-5xl font-black">{formData.cumulative_line_km.toLocaleString()} km</p>
                     <p className="text-[11px] font-bold opacity-30 uppercase mt-2">Survey Coverage</p>
                  </div>
                  <div className="text-center">
                     <p className="text-[10px] font-black uppercase tracking-tight opacity-40 mb-3">survey progress(%)</p>
                     <p className="text-5xl font-black text-amber-500">{formData.survey_progress_percent}%</p>
                     <div className="w-full bg-white/10 h-1.5 rounded-full mt-4 overflow-hidden">
                        <div className="bg-amber-500 h-full transition-all duration-1000" style={{ width: `${Math.min(formData.survey_progress_percent, 100)}%` }} />
                     </div>
                  </div>
                  <div className="text-center">
                     <p className="text-[10px] font-black uppercase tracking-tight opacity-40 mb-3">actual cost/km</p>
                     <p className="text-5xl font-black text-blue-400">TZS {formData.actual_cost_per_km.toLocaleString()}</p>
                     <p className="text-[11px] font-bold opacity-30 uppercase mt-2">Unit Efficiency</p>
                  </div>
               </div>
               <Calculator className="absolute -bottom-20 -left-20 w-80 h-80 opacity-[0.03] text-white pointer-events-none -z-10" />
            </div>

            {/* CHALLENGES & NOTES */}
            <div className="col-span-full space-y-6">
                <div className="flex items-center gap-2 mb-2">
                 <MessageSquare className="w-5 h-5 text-slate-400" />
                 <h3 className="font-black text-xs uppercase tracking-widest text-slate-500">Challenges & Field Notes</h3>
               </div>
               <div className="grid gap-6 md:grid-cols-2">
                 <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">challenges</Label>
                   <textarea value={formData.challenges} onChange={e => setFormData({...formData, challenges: e.target.value})} className="w-full h-32 p-4 border-2 rounded-2xl bg-white focus:ring-2 ring-violet-500 outline-none transition-all" />
                 </div>
                 <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">$notes</Label>
                   <textarea value={formData.$notes} onChange={e => setFormData({...formData, $notes: e.target.value})} className="w-full h-32 p-4 border-2 rounded-2xl bg-white focus:ring-2 ring-violet-500 outline-none transition-all font-mono text-sm" />
                 </div>
               </div>
            </div>

            {/* AUTHORIZATION */}
            <div className="grid gap-8 md:grid-cols-2 pt-8 border-t-2 border-slate-200 col-span-full">
               <div className="flex flex-col items-center gap-4 bg-white p-8 rounded-3xl border-2 border-slate-100">
                  <ProfessionalSignature 
                    onSign={sig => setSignatures({...signatures, scientist: sig})} 
                    title="Scientist Signature" 
                    required 
                  />
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-40">Lead Geophysicist</Label>
               </div>
               <div className="flex flex-col items-center gap-4 bg-white p-8 rounded-3xl border-2 border-slate-100">
                  <ProfessionalSignature 
                    onSign={sig => setSignatures({...signatures, official: sig})} 
                    title="Verified By" 
                  />
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-40">Section Head / QA</Label>
               </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="col-span-full flex gap-4 pt-8">
               <Button type="submit" disabled={loading} className="flex-1 h-20 bg-violet-600 hover:bg-violet-700 rounded-3xl text-xl font-black uppercase tracking-widest shadow-2xl shadow-violet-500/20 transition-all active:scale-95">
                  {loading ? <Loader2 className="w-8 h-8 animate-spin" /> : "Authorize Data Transmission"}
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