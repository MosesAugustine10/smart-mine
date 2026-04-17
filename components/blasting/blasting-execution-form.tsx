"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { ProfessionalSignature } from "@/components/professional-signature"
import { RegionSelect } from "@/components/ui/region-select"
import { useTranslation } from "@/components/language-context"
import { PhotoUploadField } from "@/components/photo-upload-field"
import { useGpsCapture } from "@/lib/hooks/use-gps-capture"
import { MapPin, CheckCircle2, Bomb, Loader2, Activity, Calculator, Lock } from "lucide-react"

export function BlastingExecutionForm() {
  const { t } = useTranslation()
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const { latitude, longitude, captureLocation, isCapturing, captured } = useGpsCapture()
  const [designs, setDesigns] = useState<any[]>([])
  
  const [formData, setFormData] = useState({
    blaster_name: "",
    blast_number: "", // Selected from design
    date_time: new Date().toISOString().slice(0, 16),
    region: "",
    bench_no: "",
    actual_holes: 0,
    spacing: 0,
    burden: 0,
    hole_length: 0,
    
    // NEW FIELDS
    actual_bags_anfo: 0,
    actual_boxes_explosives: 0,
    
    explosives_used_kg: 0,
    vibration: 0,
    airblast: 0,
    distance_from_structure: 0,
    detonators: 0,
    boosters: 0,
    actual_cost: 0,
    challenges: "",
    notes: "",

    // OUTPUTS
    volume_blasted: 0,
    tonnage: 0,
    total_cost: 0,
    cost_per_tonne: 0,
    site_photos: [] as string[]
  })

  const [signatures, setSignatures] = useState({
    blaster: null as string | null,
    official: null as string | null,
    manager: null as string | null
  })

  useEffect(() => {
    const fetchApprovedDesigns = async () => {
      const supabase = getSupabaseBrowserClient()
      const { data } = await supabase
        .from("blasting_operations")
        .select("*")
        .eq("status", "approved")
        .in("current_phase", ["design", "execution"]) // Fetch approved ones
      if (data) setDesigns(data)
    }
    fetchApprovedDesigns()
  }, [])

  // Auto-calculate outputs
  useEffect(() => {
    const volume = formData.actual_holes * formData.spacing * formData.burden * formData.hole_length
    const tonnage = volume * 2.65
    const costPerTonne = tonnage > 0 ? formData.actual_cost / tonnage : 0
    
    // Calculate KG from bags/boxes if provided
    const weightFromBags = (formData.actual_bags_anfo * 25) + (formData.actual_boxes_explosives * 25)
    
    setFormData(prev => ({
      ...prev,
      volume_blasted: Number(volume.toFixed(2)),
      tonnage: Number(tonnage.toFixed(2)),
      total_cost: formData.actual_cost, // total cost is actual cost
      cost_per_tonne: Number(costPerTonne.toFixed(2)),
      explosives_used_kg: weightFromBags > 0 ? weightFromBags : prev.explosives_used_kg
    }))
  }, [formData.actual_holes, formData.spacing, formData.burden, formData.hole_length, formData.actual_cost, formData.actual_bags_anfo, formData.actual_boxes_explosives])

  const handleSelectDesign = (id: string) => {
    const design = designs.find(d => d.id === id)
    if (design) {
      setFormData(prev => ({
        ...prev,
        blast_number: design.blast_number,
        region: design.region || "",
        spacing: design.spacing || 0,
        burden: design.burden || 0,
        hole_length: design.hole_depth || 0,
        actual_holes: design.planned_holes || 0
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.blast_number) {
      toast({ title: "Authorization Error", description: "You must select an approved blast design.", variant: "destructive" })
      return
    }
    if (!signatures.blaster) {
      toast({ title: "Signature Required", description: "Blaster signature required to log execution.", variant: "destructive" })
      return
    }

    setLoading(true)
    try {
      const supabase = getSupabaseBrowserClient()
      const payload = {
        ...formData,
        blaster_signature: signatures.blaster,
        witness_signature: signatures.official,
        manager_signature: signatures.manager,
        current_phase: "execution",
        execution_date: formData.date_time.split('T')[0],
        execution_time: formData.date_time.split('T')[1],
        latitude: latitude,
        longitude: longitude
      }

      const { error } = await supabase
        .from("blasting_operations")
        .update(payload)
        .eq("blast_number", formData.blast_number)

      if (error) throw error

      toast({ title: "EXECUTION LOGGED", description: "Blasting execution data has been successfully synchronized." })
      router.push("/blasting")
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 pb-20">
      <Card className="border-0 shadow-2xl rounded-[2.5rem] overflow-hidden border-t-8 border-t-red-600">
        <CardHeader className="bg-slate-900 text-white p-8">
          <CardTitle className="text-3xl font-black uppercase tracking-tighter italic">✦ PHASE 2: BLASTING EXECUTION RECORD ✦</CardTitle>
        </CardHeader>
        
        <CardContent className="p-8 bg-slate-50/50">
          <div className="grid gap-10">
            
            {/* BASIC INFO */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2 border-b-2 border-slate-200 pb-2">
                <Bomb className="w-5 h-5 text-red-600" />
                <h3 className="font-black text-xs uppercase tracking-widest text-slate-800">Execution Details</h3>
              </div>

              {/* GPS CAPTURE BUTTON */}
              <div className="flex items-center gap-4 mb-6">
                <Button 
                  type="button"
                  onClick={captureLocation}
                  disabled={isCapturing}
                  variant="outline"
                  className={`h-12 px-6 rounded-xl border-2 font-black text-xs uppercase tracking-widest transition-all ${captured ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-200 hover:border-amber-500"}`}
                >
                  {isCapturing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <MapPin className={`w-4 h-4 mr-2 ${captured ? "text-emerald-500" : "text-amber-500"}`} />}
                  {captured ? "✓ Location Captured" : "Capture Current GPS Location"}
                </Button>
                {captured && (
                  <p className="text-[10px] font-bold text-slate-500 italic">
                    Coordinates fixed: {latitude?.toFixed(5)}, {longitude?.toFixed(5)}
                  </p>
                )}
              </div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 bg-white p-6 rounded-3xl border-2 border-slate-100">
                <div className="space-y-2 lg:col-span-1">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">blast number <span className="text-red-500">(Approved Only)</span></Label>
                  <Select onValueChange={handleSelectDesign}>
                    <SelectTrigger className="h-12 border-2 border-emerald-500 bg-emerald-50 text-emerald-900 font-bold rounded-xl"><SelectValue placeholder="Select Approved Design" /></SelectTrigger>
                    <SelectContent>
                      {designs.length === 0 ? (
                        <SelectItem value="none" disabled>NO APPROVED BUDGETS</SelectItem>
                      ) : (
                        designs.map(d => (
                          <SelectItem key={d.id} value={d.id}>{d.blast_number}</SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">blaster name</Label>
                  <Input value={formData.blaster_name} onChange={e => setFormData({...formData, blaster_name: e.target.value})} className="h-12 border-2 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">date$ time</Label>
                  <Input type="datetime-local" value={formData.date_time} onChange={e => setFormData({...formData, date_time: e.target.value})} className="h-12 border-2 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">{t('region')}</Label>
                  <RegionSelect 
                    value={formData.region} 
                    onChange={v => setFormData({...formData, region: v})} 
                    placeholder={t('select_region')}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">{t('location')}</Label>
                  <Input value={formData.bench_no} onChange={e => setFormData({...formData, bench_no: e.target.value})} className="h-12 border-2 rounded-xl" />
                </div>
              </div>
            </div>

            {/* OPERATIONAL PARAMETERS */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2 border-b-2 border-slate-200 pb-2">
                <Activity className="w-5 h-5 text-red-600" />
                <h3 className="font-black text-xs uppercase tracking-widest text-slate-800">Operational Parameters (Vigezo vya Kazi)</h3>
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 bg-white p-6 rounded-3xl border-2 border-slate-100">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 text-blue-600">actual holes (Matundu Halisi)</Label>
                  <Input type="number" value={formData.actual_holes} onChange={e => setFormData({...formData, actual_holes: parseInt(e.target.value) || 0})} className="h-12 border-2 rounded-xl font-bold" />
                </div>
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 text-orange-600">BAGS OF ANFO (@25KG)</Label>
                    <Input type="number" value={formData.actual_bags_anfo} onChange={e => setFormData({...formData, actual_bags_anfo: parseInt(e.target.value) || 0})} className="h-12 border-2 rounded-xl font-black text-orange-600 bg-orange-50 border-orange-200" />
                </div>
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 text-orange-600">BOXES OF EXPLOSIVES (@25KG)</Label>
                    <Input type="number" value={formData.actual_boxes_explosives} onChange={e => setFormData({...formData, actual_boxes_explosives: parseInt(e.target.value) || 0})} className="h-12 border-2 rounded-xl font-black text-orange-600 bg-orange-50 border-orange-200" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 text-orange-600 italic">Total explosives used (kg)</Label>
                  <Input type="number" step="0.1" value={formData.explosives_used_kg} onChange={e => setFormData({...formData, explosives_used_kg: parseFloat(e.target.value) || 0})} className="h-12 border-2 rounded-xl font-bold bg-slate-100 italic" />
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 text-blue-600">spacing (m)</Label>
                  <Input type="number" step="0.1" value={formData.spacing} onChange={e => setFormData({...formData, spacing: parseFloat(e.target.value) || 0})} className="h-12 border-2 rounded-xl font-bold" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 text-blue-600">burden (m)</Label>
                  <Input type="number" step="0.1" value={formData.burden} onChange={e => setFormData({...formData, burden: parseFloat(e.target.value) || 0})} className="h-12 border-2 rounded-xl font-bold" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 text-blue-600">hole length (m)</Label>
                  <Input type="number" step="0.1" value={formData.hole_length} onChange={e => setFormData({...formData, hole_length: parseFloat(e.target.value) || 0})} className="h-12 border-2 rounded-xl font-bold" />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 text-rose-600">vibration (mm/s)</Label>
                  <Input type="number" step="0.01" value={formData.vibration} onChange={e => setFormData({...formData, vibration: parseFloat(e.target.value) || 0})} className="h-12 border-2 rounded-xl font-bold" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 text-rose-600">airblast (dB)</Label>
                  <Input type="number" step="0.1" value={formData.airblast} onChange={e => setFormData({...formData, airblast: parseFloat(e.target.value) || 0})} className="h-12 border-2 rounded-xl font-bold" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 text-rose-600">dist. from structure (m)</Label>
                  <Input type="number" step="1" value={formData.distance_from_structure} onChange={e => setFormData({...formData, distance_from_structure: parseFloat(e.target.value) || 0})} className="h-12 border-2 rounded-xl font-bold" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">detonators (Pieces)</Label>
                  <Input type="number" value={formData.detonators} onChange={e => setFormData({...formData, detonators: parseInt(e.target.value) || 0})} className="h-12 border-2 rounded-xl font-bold" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">boosters (Pieces)</Label>
                  <Input type="number" value={formData.boosters} onChange={e => setFormData({...formData, boosters: parseInt(e.target.value) || 0})} className="h-12 border-2 rounded-xl font-bold" />
                </div>
                <div className="space-y-2 lg:col-span-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 text-emerald-600">actual cost (TZS) (Gharama Halisi)</Label>
                  <Input type="number" value={formData.actual_cost} onChange={e => setFormData({...formData, actual_cost: parseFloat(e.target.value) || 0})} className="h-12 border-2 rounded-xl font-black text-emerald-700 bg-emerald-50 border-emerald-200 text-lg" />
                </div>
              </div>
            </div>

            {/* CHALLENGES & NOTES */}
            {/* ... rest of the form ... */}
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">challenges (Changamoto)</Label>
                <Textarea value={formData.challenges} onChange={e => setFormData({...formData, challenges: e.target.value})} className="min-h-24 border-2 rounded-2xl p-4 bg-white" placeholder="Any misfires or ground issues?" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Notes (Maoni ya ziada)</Label>
                <Textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="min-h-24 border-2 rounded-2xl p-4 bg-white" placeholder="Additional observations..." />
              </div>
            </div>

            {/* OUTPUTS */}
            <div className="bg-red-950 rounded-[2.5rem] p-10 text-white relative overflow-hidden">
               <div className="relative z-10 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
                  <div className="text-center lg:text-left bg-white/5 p-6 rounded-2xl border border-white/10">
                     <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">volume blasted (M³)</p>
                     <p className="text-4xl font-black text-rose-300">{formData.volume_blasted.toLocaleString()}</p>
                     <p className="text-[10px] font-bold opacity-40 uppercase">m³</p>
                  </div>
                  <div className="text-center lg:text-left bg-white/5 p-6 rounded-2xl border border-white/10">
                     <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">tonnage (Tani)</p>
                     <p className="text-4xl font-black">{formData.tonnage.toLocaleString()}</p>
                     <p className="text-[10px] font-bold opacity-40 uppercase">Tonnes</p>
                  </div>
                  <div className="text-center lg:text-left bg-emerald-500/10 p-6 rounded-2xl border border-emerald-500/20">
                     <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2 text-emerald-200">total cost (Jumla)</p>
                     <p className="text-4xl font-black text-emerald-400">{formData.total_cost.toLocaleString()}</p>
                     <p className="text-[10px] font-bold opacity-40 uppercase text-emerald-200">TZS Total</p>
                  </div>
                  <div className="text-center lg:text-left bg-white/5 p-6 rounded-2xl border border-white/10">
                     <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">cost per tonne</p>
                     <p className="text-4xl font-black">{formData.cost_per_tonne.toLocaleString()}</p>
                     <p className="text-[10px] font-bold opacity-40 uppercase">TZS / Tonne</p>
                  </div>
               </div>
               <Calculator className="absolute -bottom-10 -right-10 w-64 h-64 opacity-5 text-white pointer-events-none -z-10" />
            </div>

            {/* PHOTO UPLOAD (OPTIONAL) */}
            <div className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-sm">
                <PhotoUploadField 
                    onPhotosChange={(urls) => setFormData({...formData, site_photos: urls})} 
                    label="Blast Site Photos (Picha za mlipuko - Hiari)"
                    maxPhotos={5}
                />
            </div>

            {/* AUTHORIZATION */}
            <div className="col-span-full space-y-8 pt-8 border-t-2 border-slate-200">
               <div className="flex items-center gap-4">
                  <Lock className="w-5 h-5 text-red-600" />
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">Authorization & Registry Validation</h3>
               </div>
               
               <div className="grid gap-8 md:grid-cols-3">
                  <div className="flex flex-col items-center gap-4 bg-white p-8 rounded-3xl border-2 border-slate-100 shadow-sm transition-all hover:border-red-600/20">
                     <ProfessionalSignature 
                       onSign={sig => setSignatures({...signatures, blaster: sig})} 
                       title={t('signature')} 
                       required 
                     />
                     <Label className="text-[10px] font-black uppercase tracking-widest opacity-40 text-center uppercase">Blaster Signature (Saini ya mlipuaji)</Label>
                  </div>
                  <div className="flex flex-col items-center gap-4 bg-white p-8 rounded-3xl border-2 border-slate-100 shadow-sm transition-all hover:border-red-600/20">
                     <ProfessionalSignature 
                       onSign={sig => setSignatures({...signatures, official: sig})} 
                       title={t('verified')} 
                     />
                     <Label className="text-[10px] font-black uppercase tracking-widest opacity-40 text-center uppercase">Witness / Supervisor (Saini ya shahidi)</Label>
                  </div>
                  <div className="flex flex-col items-center gap-4 bg-white p-8 rounded-3xl border-2 border-slate-100 shadow-sm transition-all hover:border-red-600/20">
                     <ProfessionalSignature 
                       onSign={sig => setSignatures({...signatures, manager: sig})} 
                       title="Manager Approval" 
                     />
                     <Label className="text-[10px] font-black uppercase tracking-widest opacity-40 text-center uppercase">Operations Manager (Saini ya meneja)</Label>
                  </div>
               </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex gap-4 pt-4">
               {designs.length === 0 ? (
                 <Button disabled type="button" className="flex-1 h-20 bg-slate-200 text-slate-400 rounded-2xl text-xl font-black uppercase tracking-widest">
                    <Lock className="w-5 h-5 mr-3" /> Awaiting Budget Approvals
                 </Button>
               ) : (
                 <Button type="submit" disabled={loading} className="flex-1 h-20 bg-red-700 hover:bg-red-800 rounded-2xl text-xl font-black uppercase tracking-widest shadow-xl shadow-red-500/20 transition-all active:scale-95">
                    {loading ? <Loader2 className="w-8 h-8 animate-spin" /> : "Authorize Execution Log"}
                 </Button>
               )}
            </div>

          </div>
        </CardContent>
      </Card>
    </form>
  )
}