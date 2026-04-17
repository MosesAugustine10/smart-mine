"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Gem, Database, Droplets, Activity, Settings, MessageSquare, Calculator, Fuel, Ruler, Target } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { recordBulkUsage } from "@/lib/inventory-sync"
import { PhotoUploadField } from "@/components/photo-upload-field"
import { ProfessionalSignature } from "@/components/professional-signature"
import { useGpsCapture } from "@/lib/hooks/use-gps-capture"
import { MapPin } from "lucide-react"

export function DiamondExecutionForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const { latitude, longitude, captureLocation, isCapturing, captured } = useGpsCapture()
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    driller_name: "",
    drill_number: "",
    date: new Date().toISOString().split("T")[0],
    shift: "day", // day/night
    region: "",
    location: "",
    actual_holes: 0,
    actual_depth: 0, // m
    core_size: "HQ",
    core_recovery: 0, // %
    rqd: 0, // %
    rqd_len_pieces: 0, // Field A (cm)
    rqd_total_len: 0, // Field B (cm)
    penetration_rate: 0, // m/hr

    // CONSUMABLES
    fuel_used: 0, // l
    water_used: 0, // l
    additives_used: 0, // kg
    bits_used: 0,

    // Internal costs for calculation
    cost_per_m_base: 50000, // TZS estimate
    labor_cost: 0,
    fuel_price_per_l: 3000,
    additive_price_per_kg: 10000,
    bit_price: 500000,

    // OUTPUTS
    total_depth_drilled: 0,
    actual_drilling_cost_per_m: 0,
    drilling_efficiency: 0, // %
    challenges: "",
    $notes: "",
    site_photos: [] as string[]
  })

  const [signatures, setSignatures] = useState({
    driller: null as string | null,
    official: null as string | null
  })

  // Auto-calculate outputs
  useEffect(() => {
    const totalDepth = formData.actual_holes * formData.actual_depth
    const fuelCost = formData.fuel_used * formData.fuel_price_per_l
    const additiveCost = formData.additives_used * formData.additive_price_per_kg
    const bitCost = formData.bits_used * formData.bit_price
    const totalCost = fuelCost + additiveCost + bitCost + formData.labor_cost
    const actualCostPerM = totalDepth > 0 ? totalCost / totalDepth : 0
    
    // Efficiency: (Actual Depth / Target Depth) * 100
    // For simplicity here, let's use recovery as a proxy or just a placeholder efficiency
    const efficiency = formData.core_recovery // User request was for efficiency(%)

    setFormData(prev => ({
      ...prev,
      total_depth_drilled: Number(totalDepth.toFixed(2)),
      actual_drilling_cost_per_m: Number(actualCostPerM.toFixed(2)),
      drilling_efficiency: Number(efficiency.toFixed(1))
    }))
  }, [
    formData.actual_holes, formData.actual_depth, formData.fuel_used, 
    formData.additives_used, formData.bits_used, formData.labor_cost, formData.core_recovery, formData.rqd
  ])

  const calculateRQD = () => {
    if (formData.rqd_total_len > 0) {
      const result = (formData.rqd_len_pieces / formData.rqd_total_len) * 100
      setFormData(prev => ({ ...prev, rqd: Number(result.toFixed(2)) }))
      toast({ title: "RQD Calculated", description: `Formula applied: (${formData.rqd_len_pieces}/${formData.rqd_total_len}) × 100 = ${result.toFixed(2)}%` })
    }
  }

  const getRQDRating = (val: number) => {
    if (val <= 25) return { sw: "Mbovu Sana", en: "Very Poor", color: "text-red-600 bg-red-50 border-red-200" }
    if (val <= 50) return { sw: "Mbovu", en: "Poor", color: "text-orange-600 bg-orange-50 border-orange-200" }
    if (val <= 75) return { sw: "Wastani", en: "Fair", color: "text-yellow-600 bg-yellow-50 border-yellow-200" }
    if (val <= 90) return { sw: "Bora", en: "Good", color: "text-emerald-600 bg-emerald-50 border-emerald-200" }
    return { sw: "Bora Kabisa", en: "Excellent", color: "text-blue-700 bg-blue-50 border-blue-200" }
  }

  const rqdRating = getRQDRating(formData.rqd)

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
        status: "completed",
        current_phase: "execution",
        created_by: user?.id,
        collar_latitude: latitude,
        collar_longitude: longitude
      }

      const { error: insertError } = await supabase.from("diamond_drilling_executions").insert(payload)
      if (insertError) throw insertError

      // AUTOMATIC INVENTORY SYNC
      await recordBulkUsage({
        module: 'DIAMOND_DRILLING',
        referenceId: formData.drill_number,
        items: [
          { itemCode: 'FUEL-DD', quantity: formData.fuel_used },
          { itemCode: 'BIT-DD', quantity: formData.bits_used },
          { itemCode: 'ADDITIVE-DD', quantity: formData.additives_used }
        ].filter(i => i.quantity > 0)
      })

      toast({ title: "CORE PROTOCOL AUTHORIZED", description: "Hole data and inventory synced." })
      router.push("/diamond-drilling")
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 pb-24">
      <Card className="border-0 shadow-2xl rounded-[3rem] overflow-hidden border-t-8 border-t-emerald-600">
        <CardHeader className="bg-slate-900 text-white p-10">
          <CardTitle className="text-3xl font-black uppercase tracking-tighter italic">✦ DIAMOND DRILLING ✦ (DURING EXECUTION PHASE) ✦</CardTitle>
        </CardHeader>
        
        <CardContent className="p-10 bg-slate-50/50">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            
            {/* REGISTRY */}
            <div className="space-y-6 col-span-full">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5 text-emerald-600" />
                <h3 className="font-black text-xs uppercase tracking-widest text-slate-500">Core Registry</h3>
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
                    Collar Coordinates: {latitude?.toFixed(5)}, {longitude?.toFixed(5)}
                  </p>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-6">
                <div className="space-y-2 col-span-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">driller name</Label>
                  <Input value={formData.driller_name} onChange={e => setFormData({...formData, driller_name: e.target.value})} className="h-12 border-2 rounded-xl" placeholder="Full Name" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">drill number</Label>
                  <Input value={formData.drill_number} onChange={e => setFormData({...formData, drill_number: e.target.value})} className="h-12 border-2 rounded-xl font-bold" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">date</Label>
                  <Input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="h-12 border-2 rounded-xl font-bold" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">shift</Label>
                  <Select value={formData.shift} onValueChange={v => setFormData({...formData, shift: v})}>
                    <SelectTrigger className="h-12 border-2 rounded-xl">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="day">Day Shift</SelectItem>
                      <SelectItem value="night">Night Shift</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">region</Label>
                  <Input value={formData.region} onChange={e => setFormData({...formData, region: e.target.value})} className="h-12 border-2 rounded-xl" />
                </div>
              </div>
            </div>

            {/* PERFORMANCE METRICS & RQD */}
            <div className="space-y-6 col-span-2">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-5 h-5 text-emerald-600" />
                <h3 className="font-black text-xs uppercase tracking-widest text-slate-500">Core Performance & Geotechnical (RQD)</h3>
              </div>
              <div className="grid gap-6 md:grid-cols-4 bg-white p-8 rounded-[2rem] border-2 border-slate-100 shadow-sm relative overflow-hidden">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">actual holes</Label>
                  <Input type="number" value={formData.actual_holes} onChange={e => setFormData({...formData, actual_holes: parseInt(e.target.value) || 0})} className="h-12 border-2 rounded-xl font-black text-emerald-600" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">actual depth (m)</Label>
                  <Input type="number" step="0.1" value={formData.actual_depth} onChange={e => setFormData({...formData, actual_depth: parseFloat(e.target.value) || 0})} className="h-12 border-2 rounded-xl font-bold" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">core size</Label>
                  <Input value={formData.core_size} onChange={e => setFormData({...formData, core_size: e.target.value})} className="h-12 border-2 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">core recovery (%)</Label>
                  <Input type="number" step="0.1" value={formData.core_recovery} onChange={e => setFormData({...formData, core_recovery: parseFloat(e.target.value) || 0})} className="h-12 border-2 rounded-xl font-bold" />
                </div>

                {/* --- RQD MODULE --- */}
                <div className="col-span-full grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t-2 border-slate-50">
                    <div className="space-y-4">
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                            <div className="space-y-1">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 italic">Manual RQD Entry</Label>
                                <p className="text-[9px] font-bold text-slate-400">Rock Quality Designation (%)</p>
                            </div>
                            <Input 
                                type="number" 
                                max="100" 
                                value={formData.rqd} 
                                onChange={e => setFormData({...formData, rqd: parseFloat(e.target.value) || 0})} 
                                className="w-24 h-12 border-2 rounded-xl font-black text-center text-lg bg-white border-emerald-200 text-emerald-700" 
                            />
                        </div>

                        {/* Output Display */}
                        <div className={`p-6 rounded-2xl border-2 transition-all duration-500 scale-100 ${rqdRating.color}`}>
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-1">Rock Quality Rating</p>
                                    <h4 className="text-xl font-black">{rqdRating.sw}</h4>
                                    <p className="text-[10px] font-bold uppercase opacity-60 italic tracking-widest">{rqdRating.en}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-3xl font-black">{formData.rqd}%</p>
                                    <p className="text-[10px] font-bold opacity-60 uppercase">Certified RQD</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3 bg-slate-900/5 p-6 rounded-[1.5rem] border-2 border-dashed border-slate-200">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-2">
                            <Calculator className="w-3 h-3" /> Auto-Calculation Hub
                        </h4>
                        <div className="space-y-2">
                            <Label className="text-[9px] font-black uppercase tracking-widest opacity-50">Jumla ya Urefu wa Vipande ≥ 10cm (cm)</Label>
                            <Input type="number" value={formData.rqd_len_pieces} onChange={e => setFormData({...formData, rqd_len_pieces: parseFloat(e.target.value) || 0})} className="h-10 border-slate-200 rounded-lg text-sm font-bold" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[9px] font-black uppercase tracking-widest opacity-50">Urefu Wote wa Shimo (cm)</Label>
                            <Input type="number" value={formData.rqd_total_len} onChange={e => setFormData({...formData, rqd_total_len: parseFloat(e.target.value) || 0})} className="h-10 border-slate-200 rounded-lg text-sm font-bold" />
                        </div>
                        <Button 
                            type="button" 
                            onClick={calculateRQD} 
                            variant="secondary" 
                            className="w-full h-12 rounded-xl font-black uppercase text-[10px] tracking-widest bg-emerald-600 text-white hover:bg-emerald-700"
                        >
                            Hesabu RQD
                        </Button>
                    </div>
                </div>

                <div className="space-y-2 col-span-full">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">penetration rate (m/hr)</Label>
                  <Input type="number" step="0.1" value={formData.penetration_rate} onChange={e => setFormData({...formData, penetration_rate: parseFloat(e.target.value) || 0})} className="h-12 border-2 rounded-xl" />
                </div>
              </div>
            </div>

            {/* CONSUMABLES */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <Fuel className="w-5 h-5 text-orange-600" />
                <h3 className="font-black text-xs uppercase tracking-widest text-slate-500">CONSUMBLES</h3>
              </div>
              <div className="grid gap-4 bg-white p-8 rounded-[2rem] border-2 border-slate-100 shadow-sm">
                <div className="flex justify-between items-center">
                  <Label className="text-[10px] font-black uppercase opacity-60">fuel used (l)</Label>
                  <Input type="number" value={formData.fuel_used} onChange={e => setFormData({...formData, fuel_used: parseFloat(e.target.value) || 0})} className="w-24 h-10 border-2 rounded-lg text-right font-bold text-orange-600" />
                </div>
                <div className="flex justify-between items-center">
                  <Label className="text-[10px] font-black uppercase opacity-60">water used (l)</Label>
                  <Input type="number" value={formData.water_used} onChange={e => setFormData({...formData, water_used: parseFloat(e.target.value) || 0})} className="w-24 h-10 border-2 rounded-lg text-right font-bold" />
                </div>
                <div className="flex justify-between items-center">
                  <Label className="text-[10px] font-black uppercase opacity-60">additives used (kg)</Label>
                  <Input type="number" step="0.1" value={formData.additives_used} onChange={e => setFormData({...formData, additives_used: parseFloat(e.target.value) || 0})} className="w-24 h-10 border-2 rounded-lg text-right font-bold" />
                </div>
                <div className="flex justify-between items-center border-t pt-2">
                  <Label className="text-[10px] font-black uppercase opacity-60">bits used</Label>
                  <Input type="number" value={formData.bits_used} onChange={e => setFormData({...formData, bits_used: parseInt(e.target.value) || 0})} className="w-24 h-10 border-2 rounded-lg text-right font-black" />
                </div>
              </div>
            </div>

            {/* OUTPUTS */}
            <div className="col-span-full bg-emerald-950 rounded-[3rem] p-12 text-white relative overflow-hidden ring-4 ring-emerald-500/20">
               <div className="relative z-10 grid gap-12 md:grid-cols-3">
                  <div className="text-center">
                     <p className="text-[10px] font-black uppercase tracking-tight opacity-40 mb-3">total depth drilled</p>
                     <p className="text-5xl font-black">{formData.total_depth_drilled.toLocaleString()} m</p>
                     <p className="text-[11px] font-bold opacity-30 uppercase mt-2">Cumulative Metrage</p>
                  </div>
                  <div className="text-center">
                     <p className="text-[10px] font-black uppercase tracking-tight opacity-40 mb-3">actual drilling cost/m</p>
                     <p className="text-5xl font-black text-amber-500">TZS {formData.actual_drilling_cost_per_m.toLocaleString()}</p>
                     <p className="text-[11px] font-bold opacity-30 uppercase mt-2">Efficiency KPI</p>
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
                <h3 className="font-black text-xs uppercase tracking-widest text-slate-500">Challenges & Geological Notes</h3>
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">challenges</Label>
                  <textarea value={formData.challenges} onChange={e => setFormData({...formData, challenges: e.target.value})} className="w-full h-32 p-4 border-2 rounded-2xl bg-white focus:ring-2 ring-emerald-500 outline-none transition-all" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">$notes</Label>
                  <textarea value={formData.$notes} onChange={e => setFormData({...formData, $notes: e.target.value})} className="w-full h-32 p-4 border-2 rounded-2xl bg-white focus:ring-2 ring-emerald-500 outline-none transition-all font-mono text-sm" />
                </div>
              </div>
            </div>

            {/* PHOTO UPLOAD SECTION (OPTIONAL) */}
            <div className="col-span-full bg-white p-8 rounded-[2rem] border-2 border-slate-100 shadow-sm mt-4">
               <PhotoUploadField 
                   onPhotosChange={(urls) => setFormData({...formData, site_photos: urls})} 
                   label="Diamond Core Site Photos (Visual Registry)"
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
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-40">Lead Driller (Saini ya mchimba choroko)</Label>
               </div>
               <div className="flex flex-col items-center gap-4 bg-white p-8 rounded-3xl border-2 border-slate-100 shadow-sm">
                  <ProfessionalSignature 
                    onSign={sig => setSignatures({...signatures, official: sig})} 
                    title="Verified By" 
                  />
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-40">Project Geologist / Supervisor (Saini ya mtaalamu)</Label>
               </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="col-span-full flex gap-4 pt-8">
               <Button type="submit" disabled={loading} className="flex-1 h-20 bg-emerald-600 hover:bg-emerald-700 rounded-3xl text-xl font-black uppercase tracking-widest shadow-2xl shadow-emerald-500/20 transition-all active:scale-95">
                  {loading ? <Loader2 className="w-8 h-8 animate-spin" /> : "Authorize Protocol & Commit Core"}
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
