"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Activity, Fuel, Settings, MessageSquare, Calculator, Target } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useOffline } from "@/components/offline-provider"
import { recordBulkUsage } from "@/lib/inventory-sync"
import { RegionSelect } from "@/components/ui/region-select"
import { useTranslation } from "@/components/language-context"
import { PhotoUploadField } from "@/components/photo-upload-field"
import { ProfessionalSignature } from "@/components/professional-signature"
import { useGpsCapture } from "@/lib/hooks/use-gps-capture"
import { MapPin } from "lucide-react"

interface DrillingExecutionFormProps {
  drillId?: string
}

export function DrillingExecutionForm({ drillId }: DrillingExecutionFormProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const { toast } = useToast()
  const { offlineWrite } = useOffline()
  const [loading, setLoading] = useState(false)
  const { latitude, longitude, captureLocation, isCapturing, captured } = useGpsCapture()
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    driller_name: "",
    drill_number: drillId || "",
    date_time: new Date().toISOString().slice(0, 16),
    region: "",
    location: "",
    actual_holes: 0,
    actual_depth: 0,
    burden: 0,
    spacing: 0,
    planned_depth: 0,
    rig_id: "",
    bit_type_used: "",
    bit_condition: "",

    // MECHANICAL DATA
    rop: 0, // m/hr
    weight_on_bit: 0, // n
    rotation_speed: 0, // rpm
    torque: 0, // nm
    flush_pressure: 0, // bar

    // CONSUMPTION
    fuel_used: 0, // l
    hammer_oil_used: 0, // l
    water_used: 0, // l

    // COSTS (Internal for calculation)
    labor_cost: 0,
    accessories_cost: 0,
    fuel_price_per_l: 3000, // Default TZS

    // OUTPUTS
    total_meters_drilled: 0,
    total_actual_cost: 0,
    cost_per_meter: 0,
    drilling_efficiency: 0, // %
    challenges: "",
    notes: "",
    site_photos: [] as string[]
  })
  
  const [signatures, setSignatures] = useState({
    driller: null as string | null,
    official: null as string | null
  })

  // Auto-calculate outputs
  useEffect(() => {
    const totalMeters = formData.actual_holes * formData.actual_depth
    const fuelCost = formData.fuel_used * formData.fuel_price_per_l
    const totalCost = fuelCost + formData.labor_cost + formData.accessories_cost
    const costPerMeter = totalMeters > 0 ? totalCost / totalMeters : 0
    
    // Efficiency: Actual Depth / Planned Depth * 100
    const efficiency = formData.planned_depth > 0 
      ? (formData.actual_depth / formData.planned_depth) * 100 
      : 0

    setFormData(prev => ({
      ...prev,
      total_meters_drilled: Number(totalMeters.toFixed(2)),
      total_actual_cost: Number(totalCost.toFixed(2)),
      cost_per_meter: Number(costPerMeter.toFixed(2)),
      drilling_efficiency: Number(efficiency.toFixed(1))
    }))
  }, [
    formData.actual_holes, formData.actual_depth, formData.fuel_used, 
    formData.labor_cost, formData.accessories_cost, formData.planned_depth
  ])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const supabase = getSupabaseBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()

      const payload = {
        ...formData,
        company_id: user?.id,
        driller_signature: signatures.driller,
        official_signature: signatures.official,
        status: "executed",
        current_phase: "execution",
        latitude: latitude,
        longitude: longitude
      }

      // OFFLINE-FIRST LOGIC
      const { queued, error: offlineError } = await offlineWrite('drilling_operations', 'insert', payload)
      if (offlineError) throw new Error(offlineError)

      if (queued) {
          toast({ 
            title: "Offline Vault Active", 
            description: "Production log queued. Synchronization will initiate when data signal restores.",
            variant: "default" 
          })
          router.push("/drilling")
          return
      }

      // ONLINE SYNC
      const { error: insertError } = await supabase.from("drilling_operations").insert(payload)
      if (insertError) throw insertError

      // AUTOMATIC INVENTORY SYNC (Fuel, Oil)
      await recordBulkUsage({
        module: 'DRILLING',
        referenceId: formData.drill_number,
        items: [
          { itemCode: 'FUEL-DRL', quantity: formData.fuel_used },
          { itemCode: 'OIL-HAMMER', quantity: formData.hammer_oil_used }
        ].filter(i => i.quantity > 0)
      })

      toast({ title: "DRILLING LOG AUTHORIZED", description: "Production metrics and inventory synced successfully." })
      router.push("/drilling")
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 pb-24">
      <Card className="border-0 shadow-2xl rounded-[3rem] overflow-hidden border-t-8 border-t-amber-500">
        <CardHeader className="bg-slate-900 text-white p-10">
          <CardTitle className="text-3xl font-black uppercase tracking-tighter italic">✦ DRILLING MODULE ✦ (DURING PHASE/EXCUTION FORM) ✦</CardTitle>
        </CardHeader>
        
        <CardContent className="p-10 bg-slate-50/50">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            
            {/* BASIC INFO */}
            <div className="space-y-6 col-span-full">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5 text-amber-600" />
                <h3 className="font-black text-xs uppercase tracking-widest text-slate-500">Operational Registry</h3>
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

              <div className="grid gap-4 md:grid-cols-5">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">driller name</Label>
                  <Input value={formData.driller_name} onChange={e => setFormData({...formData, driller_name: e.target.value})} className="h-12 border-2 rounded-xl" placeholder="Full Name" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">drill number</Label>
                  <Input value={formData.drill_number} disabled className="h-12 border-2 rounded-xl font-bold bg-slate-100" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">{t('date')}</Label>
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
                  <Input value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="h-12 border-2 rounded-xl" />
                </div>
              </div>
            </div>

            {/* ACTUAL PRODUCTION DATA */}
            <div className="space-y-6 col-span-2">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-5 h-5 text-amber-600" />
                <h3 className="font-black text-xs uppercase tracking-widest text-slate-500">Actual Production</h3>
              </div>
              <div className="grid gap-4 md:grid-cols-3 bg-white p-8 rounded-[2rem] border-2 border-slate-100 shadow-sm">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">actual holes</Label>
                  <Input type="number" value={formData.actual_holes} onChange={e => setFormData({...formData, actual_holes: parseInt(e.target.value) || 0})} className="h-12 border-2 rounded-xl text-amber-600 font-black" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">actual depth</Label>
                  <Input type="number" step="0.1" value={formData.actual_depth} onChange={e => setFormData({...formData, actual_depth: parseFloat(e.target.value) || 0})} className="h-12 border-2 rounded-xl font-bold" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">planned depth</Label>
                  <Input type="number" step="0.1" value={formData.planned_depth} onChange={e => setFormData({...formData, planned_depth: parseFloat(e.target.value) || 0})} className="h-12 border-2 rounded-xl opacity-60" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">burden</Label>
                  <Input type="number" step="0.1" value={formData.burden} onChange={e => setFormData({...formData, burden: parseFloat(e.target.value) || 0})} className="h-12 border-2 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">spacing</Label>
                  <Input type="number" step="0.1" value={formData.spacing} onChange={e => setFormData({...formData, spacing: parseFloat(e.target.value) || 0})} className="h-12 border-2 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">rig id</Label>
                  <Input value={formData.rig_id} disabled className="h-12 border-2 rounded-xl bg-slate-100 font-mono" />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">bit type used</Label>
                  <Input value={formData.bit_type_used} onChange={e => setFormData({...formData, bit_type_used: e.target.value})} className="h-12 border-2 rounded-xl" />
                </div>
                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">bit condition</Label>
                   <Input value={formData.bit_condition} onChange={e => setFormData({...formData, bit_condition: e.target.value})} className="h-12 border-2 rounded-xl" placeholder="Good, Worn, Failed" />
                </div>
              </div>
            </div>

            {/* MECHANICAL DATA */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <Settings className="w-5 h-5 text-blue-600" />
                <h3 className="font-black text-xs uppercase tracking-widest text-slate-500">MECHANICAL DATA</h3>
              </div>
              <div className="grid gap-4 bg-white p-8 rounded-[2rem] border-2 border-slate-100 shadow-sm">
                <div className="flex justify-between items-center">
                  <Label className="text-[10px] font-black uppercase opacity-60">rop (m/hr)</Label>
                  <Input type="number" value={formData.rop} onChange={e => setFormData({...formData, rop: parseFloat(e.target.value) || 0})} className="w-24 h-10 border-2 rounded-lg text-right font-bold" />
                </div>
                <div className="flex justify-between items-center">
                  <Label className="text-[10px] font-black uppercase opacity-60">weight on bit (n)</Label>
                  <Input type="number" value={formData.weight_on_bit} onChange={e => setFormData({...formData, weight_on_bit: parseFloat(e.target.value) || 0})} className="w-24 h-10 border-2 rounded-lg text-right" />
                </div>
                <div className="flex justify-between items-center">
                  <Label className="text-[10px] font-black uppercase opacity-60">rotation speed (rpm)</Label>
                  <Input type="number" value={formData.rotation_speed} onChange={e => setFormData({...formData, rotation_speed: parseFloat(e.target.value) || 0})} className="w-24 h-10 border-2 rounded-lg text-right" />
                </div>
                <div className="flex justify-between items-center">
                  <Label className="text-[10px] font-black uppercase opacity-60">torque (nm)</Label>
                  <Input type="number" value={formData.torque} onChange={e => setFormData({...formData, torque: parseFloat(e.target.value) || 0})} className="w-24 h-10 border-2 rounded-lg text-right" />
                </div>
                <div className="flex justify-between items-center border-t pt-2">
                  <Label className="text-[10px] font-black uppercase opacity-60">flush pressure (bar)</Label>
                  <Input type="number" value={formData.flush_pressure} onChange={e => setFormData({...formData, flush_pressure: parseFloat(e.target.value) || 0})} className="w-24 h-10 border-2 rounded-lg text-right font-black text-blue-600" />
                </div>
              </div>
            </div>

            {/* CONSUMPTION */}
            <div className="space-y-6 col-span-full">
              <div className="flex items-center gap-2 mb-2">
                <Fuel className="w-5 h-5 text-orange-600" />
                <h3 className="font-black text-xs uppercase tracking-widest text-slate-500">CONSUMPTION</h3>
              </div>
              <div className="grid gap-8 md:grid-cols-3 bg-white p-8 rounded-[2rem] border-2 border-slate-100 shadow-sm">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">fuel used (l)</Label>
                  <Input type="number" value={formData.fuel_used} onChange={e => setFormData({...formData, fuel_used: parseFloat(e.target.value) || 0})} className="h-12 border-2 rounded-xl text-orange-600 font-black" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">hammer oil used (l)</Label>
                  <Input type="number" value={formData.hammer_oil_used} onChange={e => setFormData({...formData, hammer_oil_used: parseFloat(e.target.value) || 0})} className="h-12 border-2 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">water used (l)</Label>
                  <Input type="number" value={formData.water_used} onChange={e => setFormData({...formData, water_used: parseFloat(e.target.value) || 0})} className="h-12 border-2 rounded-xl" />
                </div>
              </div>
            </div>

            {/* OUTPUTS */}
            <div className="col-span-full bg-slate-900 rounded-[3rem] p-12 text-white relative overflow-hidden ring-4 ring-amber-500/20">
               <div className="relative z-10 grid gap-12 md:grid-cols-4">
                  <div className="text-center">
                     <p className="text-[10px] font-black uppercase tracking-tight opacity-40 mb-3">total meters drilled</p>
                     <p className="text-5xl font-black">{formData.total_meters_drilled.toLocaleString()}</p>
                     <p className="text-[11px] font-bold opacity-30 uppercase mt-2">Linear Meters</p>
                  </div>
                  <div className="text-center">
                     <p className="text-[10px] font-black uppercase tracking-tight opacity-40 mb-3">total actual cost</p>
                     <p className="text-5xl font-black text-amber-500">{formData.total_actual_cost.toLocaleString()}</p>
                     <p className="text-[11px] font-bold opacity-30 uppercase mt-2">TZS Total</p>
                  </div>
                  <div className="text-center">
                     <p className="text-[10px] font-black uppercase tracking-tight opacity-40 mb-3">cost per meter</p>
                     <p className="text-5xl font-black text-emerald-500">{formData.cost_per_meter.toLocaleString()}</p>
                     <p className="text-[11px] font-bold opacity-30 uppercase mt-2">TZS / Meter</p>
                  </div>
                  <div className="text-center">
                     <p className="text-[10px] font-black uppercase tracking-tight opacity-40 mb-3">drilling efficiency (%)</p>
                     <p className="text-5xl font-black text-blue-400">{formData.drilling_efficiency}%</p>
                     <div className="w-full bg-white/10 h-1.5 rounded-full mt-4 overflow-hidden">
                        <div className="bg-blue-400 h-full transition-all duration-1000" style={{ width: `${Math.min(formData.drilling_efficiency, 100)}%` }} />
                     </div>
                  </div>
               </div>
               <Calculator className="absolute -bottom-20 -left-20 w-80 h-80 opacity-[0.03] text-white pointer-events-none -z-10" />
            </div>

            {/* CHALLENGES & NOTES */}
            <div className="col-span-full space-y-6">
               <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="w-5 h-5 text-slate-400" />
                <h3 className="font-black text-xs uppercase tracking-widest text-slate-500">Challenges & Observations</h3>
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Challenges / Vikwazo</Label>
                  <textarea value={formData.challenges} onChange={e => setFormData({...formData, challenges: e.target.value})} className="w-full h-32 p-4 border-2 rounded-2xl bg-white focus:ring-2 ring-amber-500 outline-none transition-all" placeholder="Mechanical issues, ground conditions etc..." />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Notes / Maelezo</Label>
                  <textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full h-32 p-4 border-2 rounded-2xl bg-white focus:ring-2 ring-amber-500 outline-none transition-all font-mono text-sm" placeholder="Additional engineering notes..." />
                </div>
              </div>
            </div>

            {/* PHOTO UPLOAD (OPTIONAL) */}
            <div className="col-span-full bg-white p-8 rounded-[2rem] border-2 border-slate-100 shadow-sm mt-4">
               <PhotoUploadField 
                   onPhotosChange={(urls) => setFormData({...formData, site_photos: urls})} 
                   label="Drill Site Photos (Visual Inspection Logs)"
                   maxPhotos={5}
               />
            </div>

            {/* AUTHORIZATION */}
            <div className="col-span-full grid gap-8 md:grid-cols-2 pt-8 border-t-2 border-slate-200">
                <div className="flex flex-col items-center gap-4 bg-white p-8 rounded-3xl border-2 border-slate-100 shadow-sm">
                   <ProfessionalSignature 
                     onSign={sig => setSignatures({...signatures, driller: sig})} 
                     title="Driller Signature" 
                     required 
                   />
                   <Label className="text-[10px] font-black uppercase tracking-widest opacity-40">Certified Driller (Saini ya mchimba choroko)</Label>
                </div>
                <div className="flex flex-col items-center gap-4 bg-white p-8 rounded-3xl border-2 border-slate-100 shadow-sm">
                   <ProfessionalSignature 
                     onSign={sig => setSignatures({...signatures, official: sig})} 
                     title="Verified By" 
                   />
                   <Label className="text-[10px] font-black uppercase tracking-widest opacity-40">Shift Supervisor (Saini ya msimamizi)</Label>
                </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="col-span-full flex gap-4 pt-8">
               <Button type="submit" disabled={loading} className="flex-1 h-20 bg-amber-600 hover:bg-amber-700 rounded-3xl text-xl font-black uppercase tracking-widest shadow-2xl shadow-amber-500/20 transition-all active:scale-95">
                  {loading ? <Loader2 className="w-8 h-8 animate-spin" /> : "Authorize Production & Sync Stock"}
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
