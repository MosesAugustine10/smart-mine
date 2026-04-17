"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Loader2, Radio, Activity, Ruler, UserCheck, ShieldCheck, FileCheck, CheckCircle2, CloudRain, Users, Settings } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { DigitalSignature } from "@/components/digital-signature"
import { ProfessionalSignature } from "@/components/professional-signature"
import { PhotoUploadField } from "@/components/photo-upload-field"
import { useOffline } from "@/components/offline-provider"

const equipmentOptions = [
  "IP Transmitter", "IP Receiver", "Magnetometer", "Gradiometer",
  "Resistivity Meter", "EM Meter", "Seismograph", "GPS",
  "Data Logger", "Field Computer", "Power Generator", "Cables"
]

interface GeophysicsLogFormProps {
  operationId?: string // Link to a plan
}

export function GeophysicsLogForm({ operationId }: GeophysicsLogFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { offlineWrite } = useOffline()
  const [loading, setLoading] = useState(false)
  const [fetchingPlan, setFetchingPlan] = useState(!!operationId)

  const [formData, setFormData] = useState({
    survey_id: "",
    project_name: "",
    team_members: "",
    equipment: [] as string[],
    line_spacing: "",
    station_spacing: "",
    grid_reference: "",
    weather: "Clear",
    notes: "",
    actual_cost_tzs: "0",
    status: "in_progress",
    photo_urls: [] as string[],
    
    // Existing Plan Context
    planned_budget_tzs: 0
  })

  const [signatures, setSignatures] = useState({
    operator: null as any,
    supervisor: null as any,
    manager: null as any
  })

  useEffect(() => {
    if (operationId) {
      const fetchPlan = async () => {
        const supabase = getSupabaseBrowserClient()
        const { data: plan } = await supabase
          .from("geophysics_surveys")
          .select("*")
          .eq("id", operationId)
          .single()
        
        if (plan) {
          setFormData(prev => ({
            ...prev,
            survey_id: plan.survey_id,
            project_name: plan.project_name,
            planned_budget_tzs: plan.planned_budget_tzs,
            photo_urls: plan.photo_urls || []
          }))
        }
        setFetchingPlan(false)
      }
      fetchPlan()
    }
  }, [operationId])

  const toggleEquipment = (item: string) => {
    setFormData(prev => ({
      ...prev,
      equipment: prev.equipment.includes(item) ? prev.equipment.filter(e => e !== item) : [...prev.equipment, item]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = getSupabaseBrowserClient()
      
      const payload = {
        ...formData,
        equipment: formData.equipment.join(','),
        line_spacing: Number.parseFloat(formData.line_spacing) || 0,
        station_spacing: Number.parseFloat(formData.station_spacing) || 0,
        actual_cost_tzs: Number.parseFloat(formData.actual_cost_tzs),
        surveyor_signature: signatures.operator,
        geophysicist_signature: signatures.supervisor,
        manager_signature: signatures.manager,
        status: "completed"
      }

      const { queued } = await offlineWrite("geophysics_surveys", operationId ? "update" : "insert", operationId ? { id: operationId, ...payload } : payload)
      if (queued) {
        toast({ title: "Saved Offline", description: "Survey log queued. Will sync automatically when online." })
        router.push("/geophysics")
        return
      }

      const dbClient = getSupabaseBrowserClient()
      const { error } = operationId 
        ? await dbClient.from("geophysics_surveys").update(payload).eq("id", operationId)
        : await dbClient.from("geophysics_surveys").insert(payload)

      if (error) throw error
      toast({ title: "Survey Data Transmitted", description: `Field logs for ${formData.survey_id} are now secured in the registry.` })
      router.push("/geophysics")
      router.refresh()
    } catch (err: any) {
      toast({ title: "Transmission Failed", description: err.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  if (fetchingPlan) return <div className="flex justify-center p-20"><Loader2 className="w-10 h-10 animate-spin text-purple-600" /></div>

  const isOverBudget = Number.parseFloat(formData.actual_cost_tzs) > formData.planned_budget_tzs && formData.planned_budget_tzs > 0

  return (
    <Card className="border-0 shadow-3xl rounded-[3rem] overflow-hidden border-b-8 border-b-purple-600">
      <CardHeader className="bg-slate-950 text-white p-10 relative">
        <div className="flex justify-between items-center relative z-10">
            <div>
                <CardTitle className="text-4xl font-black uppercase tracking-tight">Field Acquisition Log</CardTitle>
                <p className="opacity-70 font-semibold mt-1">Phase 2: Signal Integrity {"&"} Instrument Calibration</p>
                <div className="mt-6 inline-flex items-center gap-2 bg-purple-500/20 border border-purple-500/40 px-4 py-2 rounded-full">
                    <Settings className="w-4 h-4 text-purple-400" />
                    <span className="text-xs uppercase font-black tracking-widest text-purple-100">Survey ID: #{formData.survey_id}</span>
                </div>
            </div>
            <Radio className="w-20 h-20 opacity-10 animate-pulse" />
        </div>
      </CardHeader>
      <CardContent className="p-10 bg-slate-50/20">
        <form onSubmit={handleSubmit} className="space-y-12">
          
          {/* Budget Insight */}
          <div className={`p-8 rounded-[2.5rem] border-2 transition-all flex items-center justify-between ${isOverBudget ? 'bg-red-500/10 border-red-200' : 'bg-green-500/10 border-green-200'}`}>
             <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isOverBudget ? 'bg-red-600' : 'bg-emerald-600'} text-white shadow-lg`}>
                    <Activity className="w-6 h-6" />
                </div>
                <div>
                    <Label className="text-[10px] font-black uppercase opacity-60">Expenditure Status</Label>
                    <p className={`text-xl font-black uppercase ${isOverBudget ? 'text-red-700' : 'text-emerald-700'}`}>{isOverBudget ? 'Threshold Violated' : 'Within Budgetary Bounds'}</p>
                </div>
             </div>
             <div className="text-right">
                <Label className="text-[10px] font-black uppercase opacity-60">Field Actuals (TZS)</Label>
                <Input type="number" value={formData.actual_cost_tzs} onChange={e => setFormData({...formData, actual_cost_tzs: e.target.value})} className="h-12 font-black text-2xl text-right bg-transparent border-0 ring-0 focus-visible:ring-0" />
             </div>
          </div>

          <div className="grid gap-10 md:grid-cols-2">
            <div className="space-y-8">
                <div className="space-y-4">
                    <Label className="font-black text-xs uppercase tracking-[0.2em] flex items-center gap-2"><Users className="w-4 h-4 text-purple-600" /> Crew Configuration</Label>
                    <Textarea value={formData.team_members} onChange={e => setFormData({...formData, team_members: e.target.value})} placeholder="Input field assistants, technicians and line cutters..." className="min-h-[140px] rounded-3xl border-2 shadow-inner" required />
                </div>
                <div className="space-y-4">
                    <Label className="font-black text-xs uppercase tracking-[0.2em]">Instrument Inventory</Label>
                    <div className="flex flex-wrap gap-2">
                        {equipmentOptions.map(item => (
                            <Badge key={item} variant={formData.equipment.includes(item) ? 'default' : 'outline'} className={`cursor-pointer h-10 px-4 rounded-full text-[10px] uppercase font-black transition-all ${formData.equipment.includes(item) ? 'bg-purple-600' : 'hover:bg-purple-50'}`} onClick={() => toggleEquipment(item)}>
                                {item}
                            </Badge>
                        ))}
                    </div>
                </div>
            </div>

            <div className="space-y-8 bg-white p-10 rounded-[3rem] border-2 border-slate-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Ruler className="w-32 h-32" />
                </div>
                <div className="grid grid-cols-2 gap-8 relative z-10">
                    <div className="space-y-2">
                        <Label className="font-black text-[10px] uppercase text-purple-700 font-black">Line Spacing (m)</Label>
                        <Input type="number" value={formData.line_spacing} onChange={e => setFormData({...formData, line_spacing: e.target.value})} className="h-14 font-black text-2xl bg-slate-50 border-2" />
                    </div>
                    <div className="space-y-2">
                        <Label className="font-black text-[10px] uppercase text-purple-700 font-black">Station (m)</Label>
                        <Input type="number" value={formData.station_spacing} onChange={e => setFormData({...formData, station_spacing: e.target.value})} className="h-14 font-black text-2xl bg-slate-50 border-2" />
                    </div>
                </div>
                <div className="space-y-2 relative z-10">
                    <Label className="font-black text-[10px] uppercase opacity-40">Weather Conditions</Label>
                    <div className="flex items-center gap-4 pt-2">
                         <div className="flex-1">
                            <Select value={formData.weather} onValueChange={v => setFormData({...formData, weather: v})}>
                                <SelectTrigger className="h-14 border-2 bg-slate-50">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Clear">Clear & Sunny</SelectItem>
                                    <SelectItem value="Cloudy">Partly Cloudy</SelectItem>
                                    <SelectItem value="Rainy">Precipitation (Log Delay)</SelectItem>
                                    <SelectItem value="Stormy">Severe Storm (Aborted)</SelectItem>
                                </SelectContent>
                            </Select>
                         </div>
                         <div className="bg-purple-50 p-4 rounded-xl">
                            <CloudRain className="w-6 h-6 text-purple-600" />
                         </div>
                    </div>
                </div>
                <div className="space-y-2 pt-4 relative z-10">
                    <Label className="font-black text-[10px] uppercase opacity-40 italic">Geological Notes</Label>
                    <Textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Describe outcrop features, signal interference or structural trends..." className="min-h-[140px] rounded-2xl border-2" />
                </div>
            </div>
          </div>

          {/* Survey Field Photos */}
          <div className="bg-white p-10 rounded-[3rem] border-2 border-slate-100 shadow-xl shadow-slate-200/20">
             <PhotoUploadField 
               onPhotosChange={urls => setFormData({...formData, photo_urls: urls})} 
               label="Instrument Setup & Station Evidence (Photos)"
               maxPhotos={6}
             />
          </div>

          {/* Authorization 3-TIER */}
          <div className="col-span-full space-y-8 pt-8 border-t-2 border-slate-200">
             <div className="flex items-center gap-4">
                <ShieldCheck className="w-5 h-5 text-purple-600" />
                <h3 className="text-sm font-black uppercase tracking-[0.4em] text-slate-900">Enterprise Registry Validation</h3>
             </div>
             
             <div className="grid gap-8 md:grid-cols-3">
                <div className="flex flex-col items-center gap-4 bg-white p-8 rounded-3xl border-2 border-slate-100 shadow-sm transition-all hover:border-purple-600/30">
                    <ProfessionalSignature onSign={sig => setSignatures({...signatures, operator: sig})} title="Field Surveyor Authorization" required />
                    <Label className="font-black text-[10px] uppercase opacity-40">Field Lead (Saini ya mpimaji)</Label>
                </div>
                <div className="flex flex-col items-center gap-4 bg-white p-8 rounded-3xl border-2 border-slate-100 shadow-sm transition-all hover:border-purple-600/30">
                    <ProfessionalSignature onSign={sig => setSignatures({...signatures, supervisor: sig})} title="Geophysicist Verification" />
                    <Label className="font-black text-[10px] uppercase opacity-40">Chief Geophysicist (Saini ya mtaalamu)</Label>
                </div>
                <div className="flex flex-col items-center gap-4 bg-white p-8 rounded-3xl border-2 border-slate-100 shadow-sm transition-all hover:border-purple-600/30">
                    <ProfessionalSignature onSign={sig => setSignatures({...signatures, manager: sig})} title="Executive Board Authorization" />
                    <Label className="font-black text-[10px] uppercase opacity-40">General Manager (Saini ya meneja)</Label>
                </div>
             </div>
          </div>

          {/* Controls */}
          <div className="flex gap-6 pt-10 border-t-4 border-slate-100">
            <Button type="submit" disabled={loading} size="lg" className="flex-1 h-24 bg-purple-700 hover:bg-purple-900 rounded-[2rem] text-2xl font-black uppercase tracking-tight shadow-2xl shadow-purple-500/40 transition-all hover:scale-[1.02] active:scale-95">
                {loading ? <Loader2 className="w-10 h-10 animate-spin" /> : "Verify & Transmit Registry"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()} className="h-24 px-12 rounded-[2rem] font-bold uppercase text-[10px] tracking-widest border-2">
                Abort
            </Button>
          </div>

        </form>
      </CardContent>
    </Card>
  )
}
