"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { 
  Loader2, 
  Fuel, 
  Droplets, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Info,
  ShieldCheck,
  ClipboardCheck,
  Truck,
  User,
  Calendar,
  Save,
  ChevronRight
} from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { ProfessionalSignature } from "@/components/professional-signature"
import { useLanguage } from "@/components/language-provider"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

interface Machine {
  id: string
  vehicle_number: string
  vehicle_type: string
}

interface EquipmentChecklistFormProps {
  machines: Machine[];
  contractorName?: string;
  clientName?: string;
  projectId?: string;
}

const CHECKLIST_ITEMS = [
  { en: "Walk around the machine", sw: "Zunguka mashine", category: "Safety" },
  { en: "Check for any damage, loose nuts, pins, leakage", sw: "Kagua tofauti zilizopo (kugongwa mashine nk.)", category: "Safety" },
  { en: "Engine coolant level", sw: "Maji kwenye rejeta (radiator)", category: "Fluids" },
  { en: "Engine oil level", sw: "Oili ya injini", category: "Fluids" },
  { en: "Transmission oil level", sw: "Oili ya gea box", category: "Fluids" },
  { en: "Diesel Level", sw: "Ujazo wa dizeli", category: "Fuel" },
  { en: "Air filter", sw: "Filtra za upepo", category: "Maintenance" },
  { en: "Check tyres air, damage", sw: "Angalia upepo wa matairi", category: "Safety" },
  { en: "Start engine", sw: "Washa mashine", category: "Operation" },
  { en: "Check Cabin (mirrors, gauges, first aid, belt)", sw: "Angalia vitu vyote kwenye Cabin", category: "Safety" },
  { en: "Brake air pressure", sw: "Upepo wa breki", category: "Brakes" },
  { en: "Engine oil Temperature", sw: "Joto la oili ya injini", category: "Gauges" },
  { en: "Coolant temperature", sw: "Joto la maji", category: "Gauges" },
  { en: "Check horn", sw: "Kagua honi", category: "Safety" },
  { en: "Back-up alarm", sw: "Honi ya kurudi nyuma", category: "Safety" },
  { en: "Lights", sw: "Kagua taa", category: "Safety" },
  { en: "Wipers", sw: "Kagua waipa", category: "Safety" },
  { en: "Check steering system", sw: "Kagua mfumo wa usukani", category: "Operation" },
  { en: "Check brake systems", sw: "Kagua mfumo wa breki", category: "Brakes" },
  { en: "Check track chains", sw: "Kagua cheni za track", category: "Undercarriage" },
  { en: "Check track rollers", sw: "Kagua rola za track", category: "Undercarriage" },
  { en: "Check sprockets", sw: "Kagua sproketi", category: "Undercarriage" },
  { en: "Check idlers", sw: "Kagua idla", category: "Undercarriage" },
  { en: "Check fire extinguisher", sw: "Kagua kizimia moto", category: "Safety" },
]

export function EquipmentChecklistForm({ machines, contractorName = "Contractor", clientName = "Client", projectId }: EquipmentChecklistFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { language } = useLanguage()
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    machine_id: "",
    inspection_date: new Date().toISOString().split('T')[0],
    shift: "DAY",
    fuel_amount: "",
    hydraulic_oil: "",
    hour_meter_start: "",
    hour_meter_stop: "",
    bin_tip_start: "",
    bin_tip_stop: "",
    total_hours_manual: "",
    total_trips_manual: "",
    checklist: CHECKLIST_ITEMS.map(item => ({
      ...item,
      status: "ok" as 'ok' | 'not_ok' | 'na' | 'critical'
    })),
    operator_comments: "",
    supervisor_comments: "",
    amogtech_supervisor: "",
    tcplc_supervisor: ""
  })

  const [signatures, setSignatures] = useState({
    operator: null as string | null,
    contractor: null as string | null,
    client: null as string | null
  })

  const handleChecklistChange = (index: number, status: 'ok' | 'not_ok' | 'na' | 'critical') => {
    const newChecklist = [...formData.checklist]
    newChecklist[index].status = status
    setFormData({ ...formData, checklist: newChecklist })
  }

  const completionStats = {
    total: formData.checklist.length,
    ok: formData.checklist.filter(i => i.status === 'ok').length,
    issues: formData.checklist.filter(i => i.status === 'not_ok' || i.status === 'critical').length,
    critical: formData.checklist.filter(i => i.status === 'critical').length,
  }

  const healthScore = Math.round((completionStats.ok / completionStats.total) * 100)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!signatures.operator) {
      toast({ title: "Signature Required", description: "Operator must sign the forensic record before submission.", variant: "destructive" })
      return
    }

    setLoading(true)
    try {
      const supabase = getSupabaseBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("company_id, full_name")
        .eq("id", user?.id)
        .single()

      const machine = machines.find(m => m.id === formData.machine_id)

      const payload = {
        company_id: profile?.company_id,
        inspection_date: formData.inspection_date,
        shift: formData.shift,
        machine_name: machine?.vehicle_number,
        fuel_amount_liters: parseFloat(formData.fuel_amount) || 0,
        hydraulic_oil_liters: parseFloat(formData.hydraulic_oil) || 0,
        hour_meter_start: parseFloat(formData.hour_meter_start) || 0,
        hour_meter_stop: parseFloat(formData.hour_meter_stop) || 0,
        bin_tip_start: parseInt(formData.bin_tip_start) || 0,
        bin_tip_stop: parseInt(formData.bin_tip_stop) || 0,
        total_hours_manual: parseFloat(formData.total_hours_manual) || 0,
        total_trips_manual: parseInt(formData.total_trips_manual) || 0,
        checklist_items: formData.checklist,
        operator_comments: formData.operator_comments,
        operator_name: profile?.full_name,
        operator_signature: signatures.operator,
        supervisor_comments: formData.supervisor_comments,
        amogtech_supervisor_name: formData.amogtech_supervisor,
        amogtech_signature: signatures.contractor,
        tcplc_supervisor_name: formData.tcplc_supervisor,
        tcplc_signature: signatures.client,
        operator_id: user?.id
      }

      const { error } = await supabase.from("equipment_inspections").insert(payload)
      if (error) throw error

      toast({ title: "Inspection Archived", description: "Safety record has been committed to the corporate ledger." })
      router.push("/fleet/quarry/checklist/history")
    } catch (err: any) {
      toast({ title: "Submission Failed", description: err.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const t = (en: string, sw: string) => language === 'sw' ? sw : en

  return (
    <form onSubmit={handleSubmit} className="space-y-10 pb-20 font-inter">
      {/* 1. Header & Identity */}
      <Card className="border-0 shadow-3xl rounded-[3.5rem] overflow-hidden border-t-8 border-t-blue-600">
        <CardHeader className="bg-slate-950 text-white p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
          <div className="flex justify-between items-center relative z-10">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Badge className="bg-blue-600 text-white border-0 py-1 px-4 rounded-full font-black tracking-widest text-[10px]">QF-01</Badge>
                <span className="text-blue-400 font-black uppercase tracking-widest text-[10px]">Safety Protocol</span>
              </div>
              <CardTitle className="text-5xl font-black uppercase tracking-tighter leading-none">Equipment Inspection</CardTitle>
              <p className="opacity-70 font-bold italic text-slate-400">Master of the Rocks — Quarry Forensic Readiness</p>
            </div>
            <ShieldCheck className="w-24 h-24 text-blue-500 opacity-20 animate-pulse" />
          </div>
        </CardHeader>

        <CardContent className="p-12 bg-slate-50/50">
          <div className="grid md:grid-cols-4 gap-8">
            {/* Health KPI */}
            <div className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-sm flex flex-col justify-center text-center space-y-2">
              <span className="text-[10px] font-black uppercase opacity-40">Health Readiness</span>
              <div className="text-4xl font-black text-blue-600">{healthScore}%</div>
              <Progress value={healthScore} className="h-1.5" />
            </div>

            <div className="space-y-4 md:col-span-3">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase opacity-40 flex items-center gap-2">
                    <Calendar className="w-3 h-3" /> Date / Tarehe
                  </Label>
                  <Input type="date" value={formData.inspection_date} onChange={e => setFormData({...formData, inspection_date: e.target.value})} className="h-14 border-2 rounded-2xl font-bold" required />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase opacity-40">Shift / Zamu</Label>
                  <Select value={formData.shift} onValueChange={v => setFormData({...formData, shift: v})}>
                    <SelectTrigger className="h-14 border-2 rounded-2xl font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DAY">☀️ DAY SHIFT</SelectItem>
                      <SelectItem value="NIGHT">🌙 NIGHT SHIFT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase opacity-40 flex items-center gap-2">
                    <Truck className="w-3 h-3" /> Machine / Mashine
                  </Label>
                  <Select value={formData.machine_id} onValueChange={v => setFormData({...formData, machine_id: v})} required>
                    <SelectTrigger className="h-14 border-2 rounded-2xl font-bold">
                      <SelectValue placeholder="Identification" />
                    </SelectTrigger>
                    <SelectContent>
                      {machines.map(m => (
                        <SelectItem key={m.id} value={m.id}>{m.vehicle_number} ({m.vehicle_type})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Technical Readings */}
      <div className="grid md:grid-cols-3 gap-8">
        <Card className="md:col-span-2 border-0 shadow-2xl rounded-[3rem] overflow-hidden">
          <CardHeader className="p-10 bg-white border-b border-slate-100">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-600">
                  <Droplets className="w-6 h-6" />
               </div>
               <div>
                  <CardTitle className="text-xl font-black uppercase tracking-tight">Consumable Thresholds</CardTitle>
                  <p className="text-xs font-bold text-slate-400">Technical fluid quantum & fuel logging</p>
               </div>
            </div>
          </CardHeader>
          <CardContent className="p-10 bg-white grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
               <div className="space-y-2">
                 <Label className="text-[10px] font-black uppercase opacity-40">Fuel Amount (Liters)</Label>
                 <div className="relative">
                    <Fuel className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
                    <Input type="number" step="0.01" value={formData.fuel_amount} onChange={e => setFormData({...formData, fuel_amount: e.target.value})} className="h-14 pl-12 border-2 rounded-2xl font-black text-xl" placeholder="0.00" />
                 </div>
               </div>
               <div className="space-y-2">
                 <Label className="text-[10px] font-black uppercase opacity-40">Hydraulic Oil Ad-hoc (L)</Label>
                 <Input type="number" step="0.1" value={formData.hydraulic_oil} onChange={e => setFormData({...formData, hydraulic_oil: e.target.value})} className="h-14 border-2 rounded-2xl font-black text-xl" placeholder="0.0" />
               </div>
            </div>
            <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 flex flex-col justify-center">
               <div className="flex items-start gap-4 mb-4">
                  <Info className="w-5 h-5 text-blue-500 shrink-0 mt-1" />
                  <p className="text-xs font-semibold leading-relaxed text-slate-500">Ensure levels are measured on flat ground before starting the primary ignition cycle.</p>
               </div>
               <div className="text-[10px] font-black uppercase tracking-widest text-slate-300">Mandatory Technical Audit</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-2xl rounded-[3rem] overflow-hidden bg-slate-900 text-white">
          <CardHeader className="p-10 pb-2">
             <Clock className="w-8 h-8 text-blue-400 mb-4" />
             <CardTitle className="text-xl font-black uppercase tracking-tight">Odometer Registry</CardTitle>
          </CardHeader>
          <CardContent className="p-10 space-y-6">
             <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase opacity-40 text-blue-300">Start Reading</Label>
                <Input type="number" value={formData.hour_meter_start} onChange={e => setFormData({...formData, hour_meter_start: e.target.value})} className="h-14 bg-white/5 border-0 rounded-2xl font-black text-2xl text-white placeholder:text-white/10" placeholder="000.0" />
             </div>
             <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase opacity-40 text-blue-300">Stop Reading</Label>
                <Input type="number" value={formData.hour_meter_stop} onChange={e => setFormData({...formData, hour_meter_stop: e.target.value})} className="h-14 bg-white/5 border-0 rounded-2xl font-black text-2xl text-white placeholder:text-white/10" placeholder="000.0" />
             </div>
             <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                <span className="text-[10px] font-black uppercase text-blue-400">Total Utilization</span>
                <span className="text-2xl font-black">{(parseFloat(formData.hour_meter_stop) - parseFloat(formData.hour_meter_start) || 0).toFixed(1)} HRS</span>
             </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Forensic Checklist Table */}
      <Card className="border-0 shadow-2xl rounded-[4rem] overflow-hidden">
        <CardHeader className="p-12 bg-slate-950 text-white flex flex-row justify-between items-center">
          <div>
            <CardTitle className="text-3xl font-black uppercase tracking-tighter">Safety {"&"} Operational Checklist</CardTitle>
            <p className="text-xs font-bold text-blue-400 mt-2 italic">Detailed point-by-point machine health verification</p>
          </div>
          <div className="flex gap-4">
             <div className="text-center">
                <div className="text-2xl font-black text-emerald-400">{completionStats.ok}</div>
                <div className="text-[8px] font-black uppercase opacity-50 tracking-widest">OK</div>
             </div>
             <div className="text-center">
                <div className="text-2xl font-black text-red-400">{completionStats.issues}</div>
                <div className="text-[8px] font-black uppercase opacity-50 tracking-widest">Fails</div>
             </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-100">
                <tr>
                  <th className="p-6 text-left text-[10px] font-black uppercase opacity-40 tracking-widest w-16">#</th>
                  <th className="p-6 text-left text-[10px] font-black uppercase opacity-40 tracking-widest">Parameter / Kipengele</th>
                  <th className="px-4 text-center text-[10px] font-black uppercase opacity-40 tracking-widest">OK</th>
                  <th className="px-4 text-center text-[10px] font-black uppercase opacity-40 tracking-widest">FAIL</th>
                  <th className="px-4 text-center text-[10px] font-black uppercase opacity-40 tracking-widest text-red-500">CRIT</th>
                  <th className="px-4 text-center text-[10px] font-black uppercase opacity-40 tracking-widest">N/A</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {formData.checklist.map((item, index) => (
                  <tr key={index} className="hover:bg-slate-50 transition-colors group">
                    <td className="p-6 text-sm font-black text-slate-300">{index + 1}</td>
                    <td className="p-6">
                       <p className="text-sm font-black text-slate-800">{item.en}</p>
                       <p className="text-xs font-bold text-slate-400 italic">{item.sw}</p>
                       <Badge variant="outline" className="mt-2 text-[8px] border-slate-200 text-slate-400 uppercase font-black">{item.category}</Badge>
                    </td>
                    <td className="px-4 text-center">
                       <input type="radio" checked={item.status === 'ok'} onChange={() => handleChecklistChange(index, 'ok')} className="w-6 h-6 accent-emerald-500 cursor-pointer" />
                    </td>
                    <td className="px-4 text-center">
                       <input type="radio" checked={item.status === 'not_ok'} onChange={() => handleChecklistChange(index, 'not_ok')} className="w-6 h-6 accent-amber-500 cursor-pointer" />
                    </td>
                    <td className="px-4 text-center">
                       <input type="radio" checked={item.status === 'critical'} onChange={() => handleChecklistChange(index, 'critical')} className="w-6 h-6 accent-red-600 cursor-pointer" />
                    </td>
                    <td className="px-4 text-center">
                       <input type="radio" checked={item.status === 'na'} onChange={() => handleChecklistChange(index, 'na')} className="w-6 h-6 accent-slate-400 cursor-pointer" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 4. Governance Chain */}
      <div className="space-y-8 bg-slate-100 p-12 rounded-[4.5rem] border-2 border-slate-200">
        <div className="grid md:grid-cols-2 gap-10">
           <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase opacity-40">Operator Observations</Label>
              <Textarea value={formData.operator_comments} onChange={e => setFormData({...formData, operator_comments: e.target.value})} className="min-h-[150px] border-2 rounded-3xl bg-white p-6 font-semibold" placeholder="Detail any technical abnormalities noticed..." />
           </div>
           <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase opacity-40">Supervisor Instructions</Label>
              <Textarea value={formData.supervisor_comments} onChange={e => setFormData({...formData, supervisor_comments: e.target.value})} className="min-h-[150px] border-2 rounded-3xl bg-white p-6 font-semibold" placeholder="Management remarks or stop-work orders..." />
           </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 pt-10 border-t-2 border-slate-200">
           <div className="flex flex-col items-center gap-4">
              <ProfessionalSignature onSign={sig => setSignatures({...signatures, operator: sig})} title="Operator Authorization" required />
              <div className="text-center">
                 <Label className="font-black text-[10px] uppercase opacity-40 tracking-widest">Primary Operator</Label>
                 <p className="text-[8px] font-bold text-blue-500 mt-1 uppercase italic">Driver / Driller</p>
              </div>
           </div>
           <div className="flex flex-col items-center gap-4">
              <Input value={formData.amogtech_supervisor} onChange={e => setFormData({...formData, amogtech_supervisor: e.target.value})} placeholder="Supervisor Name" className="text-center font-bold border-2 rounded-xl mb-2" />
              <ProfessionalSignature onSign={sig => setSignatures({...signatures, contractor: sig})} title={`${contractorName} Supervisor`} />
              <Label className="font-black text-[10px] uppercase opacity-40 tracking-widest">{contractorName} (C1)</Label>
           </div>
           <div className="flex flex-col items-center gap-4">
              <Input value={formData.tcplc_supervisor} onChange={e => setFormData({...formData, tcplc_supervisor: e.target.value})} placeholder="Client Rep Name" className="text-center font-bold border-2 rounded-xl mb-2" />
              <ProfessionalSignature onSign={sig => setSignatures({...signatures, client: sig})} title={`${clientName} Authorization`} />
              <Label className="font-black text-[10px] uppercase opacity-40 tracking-widest">{clientName} (C2)</Label>
           </div>
        </div>
      </div>

      <div className="flex gap-6 pt-10">
        <Button type="submit" disabled={loading} className="flex-1 h-28 bg-blue-600 hover:bg-blue-700 text-white rounded-[3rem] text-3xl font-black uppercase tracking-tighter shadow-3xl shadow-blue-500/20 transition-all flex items-center justify-center gap-4 group">
          {loading ? <Loader2 className="w-10 h-10 animate-spin" /> : (
            <>
              Commit Forensic Record
              <ChevronRight className="w-10 h-10 group-hover:translate-x-4 transition-transform" />
            </>
          )}
        </Button>
      </div>

      {healthScore < 50 && (
         <div className="p-8 bg-red-600 rounded-[2.5rem] text-white flex items-center gap-6 animate-bounce">
            <AlertTriangle className="w-12 h-12 shrink-0" />
            <div>
               <p className="text-xl font-black uppercase tracking-tight">Machine Health Critical!</p>
               <p className="text-sm font-bold opacity-80">Safety protocol suggests grounding this asset immediately based on inspection failures.</p>
            </div>
         </div>
      )}
    </form>
  )
}
