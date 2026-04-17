"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, ShieldAlert, AlertTriangle, UserCheck, ShieldCheck, CheckCircle2, MessageSquare, Calculator, Calendar, MapPin, Activity, Settings } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { PhotoUploadField } from "@/components/photo-upload-field"
import { ProfessionalSignature } from "@/components/professional-signature"
import { useGpsCapture } from "@/lib/hooks/use-gps-capture"

export function SafetyForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const { latitude, longitude, captureLocation, isCapturing, captured } = useGpsCapture()

  const [formData, setFormData] = useState({
    reported_by: "",
    incident_date: new Date().toISOString().split("T")[0],
    type: "near miss", // injury, near miss, property damage
    location: "",
    severity: "low", // low, medium, high, critical
    description: "",
    corrective_action: "",
    status: "open", // open, closed, under investigation

    // OUTPUTS
    risk_level: "LOW",
    days_since_last_incident: 0,
    safety_performance_index: 100, // %
    site_photos: [] as string[]
  })

  const [signatures, setSignatures] = useState({
    reporter: null as string | null,
    official: null as string | null
  })

  // Auto-calculate outputs (simulated for now based on severity)
  useEffect(() => {
    let risk = "LOW"
    if (formData.severity === "high" || formData.severity === "critical") risk = "EXTREME"
    else if (formData.severity === "medium") risk = "ELEVATED"

    // Simulate SPI (Safety Performance Index)
    const spi = formData.severity === "critical" ? 45 : (formData.severity === "high" ? 70 : 95)

    setFormData(prev => ({
      ...prev,
      risk_level: risk,
      safety_performance_index: spi
    }))
  }, [formData.severity])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = getSupabaseBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()

      const payload = {
        ...formData,
        company_id: user?.id,
        reporter_signature: signatures.reporter,
        official_signature: signatures.official,
        created_by: user?.id,
        latitude: latitude,
        longitude: longitude
      }

      const { error } = await supabase.from("safety_incidents").insert(payload)
      if (error) throw error

      toast({ title: "INCIDENT Process AUTHORIZED", description: "Strategic safety log committed." })
      router.push("/safety")
      router.refresh()
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 pb-24">
      <Card className="border-0 shadow-2xl rounded-[3rem] overflow-hidden border-t-8 border-t-red-600">
        <CardHeader className="bg-slate-900 text-white p-10">
          <CardTitle className="text-3xl font-black uppercase tracking-tighter italic">✦ SAFETY MODULE ✦ (INCIDENT REPORT) ✦</CardTitle>
        </CardHeader>
        
        <CardContent className="p-10 bg-slate-50/50">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            
            {/* REPORTER List */}
            <div className="space-y-6 col-span-full">
              <div className="flex items-center gap-2 mb-2">
                <UserCheck className="w-5 h-5 text-red-600" />
                <h3 className="font-black text-xs uppercase tracking-widest text-slate-500">Reporter List</h3>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">reported by</Label>
                  <Input value={formData.reported_by} onChange={e => setFormData({...formData, reported_by: e.target.value})} className="h-12 border-2 rounded-xl font-bold" placeholder="Personnel Name" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">incident date</Label>
                  <Input type="date" value={formData.incident_date} onChange={e => setFormData({...formData, incident_date: e.target.value})} className="h-12 border-2 rounded-xl font-bold" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">type</Label>
                  <Select value={formData.type} onValueChange={v => setFormData({...formData, type: v})}>
                    <SelectTrigger className="h-12 border-2 rounded-xl">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="injury">Injury (LTI/MTI)</SelectItem>
                      <SelectItem value="near miss">Near Miss</SelectItem>
                      <SelectItem value="property damage">Property Damage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* EVENT CONTEXT */}
            <div className="space-y-6 col-span-2">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-5 h-5 text-red-600" />
                <h3 className="font-black text-xs uppercase tracking-widest text-slate-500">Event Context</h3>
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

              <div className="grid gap-4 md:grid-cols-2 bg-white p-8 rounded-[2rem] border-2 border-slate-100 shadow-sm">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">location</Label>
                  <Input value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="h-12 border-2 rounded-xl font-black text-red-600" placeholder="Block / Sector" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">severity</Label>
                  <Select value={formData.severity} onValueChange={v => setFormData({...formData, severity: v})}>
                    <SelectTrigger className={`h-12 border-2 rounded-xl font-black ${formData.severity === 'critical' ? 'text-red-600' : ''}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical (Red-Zone)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* STATUS CONTROL */}
            <div className="space-y-6">
               <div className="flex items-center gap-2 mb-2">
                <Settings className="w-5 h-5 text-slate-400" />
                <h3 className="font-black text-xs uppercase tracking-widest text-slate-500">Status Control</h3>
              </div>
              <div className="bg-white p-8 rounded-[2rem] border-2 border-slate-100 shadow-sm">
                 <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">status</Label>
                   <Select value={formData.status} onValueChange={v => setFormData({...formData, status: v})}>
                      <SelectTrigger className="h-12 border-2 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open Case</SelectItem>
                        <SelectItem value="under investigation">In Investigation</SelectItem>
                        <SelectItem value="closed">Closed / Resolved</SelectItem>
                      </SelectContent>
                   </Select>
                 </div>
              </div>
            </div>

            {/* OUTPUTS */}
            <div className="col-span-full bg-red-950 rounded-[3rem] p-12 text-white relative overflow-hidden ring-4 ring-red-500/20">
               <div className="relative z-10 grid gap-12 md:grid-cols-3">
                  <div className="text-center">
                     <p className="text-[10px] font-black uppercase tracking-tight opacity-40 mb-3">risk level</p>
                     <p className={`text-5xl font-black ${formData.risk_level === 'EXTREME' ? 'text-red-500 animate-pulse' : 'text-amber-500'}`}>{formData.risk_level}</p>
                     <p className="text-[11px] font-bold opacity-30 uppercase mt-2">Threat Assessment</p>
                  </div>
                  <div className="text-center">
                     <p className="text-[10px] font-black uppercase tracking-tight opacity-40 mb-3">days since last incident</p>
                     <p className="text-5xl font-black text-blue-400">{formData.days_since_last_incident}</p>
                     <p className="text-[11px] font-bold opacity-30 uppercase mt-2">Safety Record</p>
                  </div>
                  <div className="text-center">
                     <p className="text-[10px] font-black uppercase tracking-tight opacity-40 mb-3">safety performance index</p>
                     <div className="flex flex-col items-center">
                        <p className="text-5xl font-black text-emerald-400">{formData.safety_performance_index}%</p>
                        <div className="w-32 bg-white/10 h-1.5 rounded-full mt-4 overflow-hidden">
                           <div className="bg-emerald-400 h-full transition-all duration-1000" style={{ width: `${formData.safety_performance_index}%` }} />
                        </div>
                     </div>
                  </div>
               </div>
               <Calculator className="absolute -bottom-20 -left-20 w-80 h-80 opacity-[0.03] text-white pointer-events-none -z-10" />
            </div>

            {/* NARRATIVE & RESOLUTION */}
            <div className="col-span-full space-y-6">
                <div className="flex items-center gap-2 mb-2">
                 <MessageSquare className="w-5 h-5 text-slate-400" />
                 <h3 className="font-black text-xs uppercase tracking-widest text-slate-500">Narrative & Resolution</h3>
               </div>
               <div className="grid gap-6 md:grid-cols-2">
                 <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">description</Label>
                   <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full h-32 p-4 border-2 rounded-2xl bg-white focus:ring-2 ring-red-500 outline-none transition-all" placeholder="Full Details..." />
                 </div>
                 <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">corrective action</Label>
                   <textarea value={formData.corrective_action} onChange={e => setFormData({...formData, corrective_action: e.target.value})} className="w-full h-32 p-4 border-2 rounded-2xl bg-white focus:ring-2 ring-emerald-500 outline-none transition-all" placeholder="Proposed Rectification..." />
                 </div>
               </div>
            </div>

            {/* AUTHORIZATION */}
            <div className="col-span-full space-y-8 pt-8 border-t-2 border-slate-200">
               <div className="flex items-center gap-4">
                  <ShieldCheck className="w-5 h-5 text-red-600" />
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">Incident Verification & Authorization</h3>
               </div>
               
               <div className="grid gap-8 md:grid-cols-2">
                  <div className="flex flex-col items-center gap-4 bg-white p-8 rounded-3xl border-2 border-slate-100 shadow-sm">
                     <ProfessionalSignature 
                       onSign={sig => setSignatures({...signatures, reporter: sig})} 
                       title="Reporter Signature" 
                       required 
                     />
                     <Label className="text-[10px] font-black uppercase tracking-widest opacity-40">Person Reporting (Saini ya mtoa taarifa)</Label>
                  </div>
                  <div className="flex flex-col items-center gap-4 bg-white p-8 rounded-3xl border-2 border-slate-100 shadow-sm">
                     <ProfessionalSignature 
                       onSign={sig => setSignatures({...signatures, official: sig})} 
                       title="Verified By" 
                     />
                     <Label className="text-[10px] font-black uppercase tracking-widest opacity-40">Safety Officer (Saini ya afisa usalama)</Label>
                  </div>
               </div>
            </div>

            {/* PHOTO UPLOAD (OPTIONAL) */}
            <div className="col-span-full bg-white p-10 rounded-[3rem] border-2 border-slate-100 shadow-sm">
                <PhotoUploadField 
                    onPhotosChange={(urls) => setFormData({...formData, site_photos: urls})} 
                    label="Incident Visual Evidence (Optional)"
                    maxPhotos={5}
                />
            </div>

            {/* ACTION BUTTONS */}
            <div className="col-span-full flex gap-4 pt-8">
               <Button type="submit" disabled={loading} className="flex-1 h-20 bg-red-600 hover:bg-red-700 rounded-3xl text-xl font-black uppercase tracking-widest shadow-2xl shadow-red-500/20 transition-all active:scale-95">
                  {loading ? <Loader2 className="w-8 h-8 animate-spin" /> : "Authorize Strategic Safety Process"}
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
