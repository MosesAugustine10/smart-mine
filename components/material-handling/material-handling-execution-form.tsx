"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Truck, Activity, MapPin, Calendar, Clock, CheckCircle2, MessageSquare, Calculator, Fuel, TrendingUp, Shield } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { ProfessionalSignature } from "@/components/professional-signature"

interface MaterialHandlingExecutionFormProps {
  operationId?: string
}

export function MaterialHandlingExecutionForm({ operationId }: MaterialHandlingExecutionFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    operation_number: operationId || "",
    region: "",
    location: "",
    date: new Date().toISOString().split("T")[0],
    day: new Date().toLocaleDateString('en-GB', { weekday: 'long' }),
    operator_names: "",
    machines: "",
    truck_capacity: 0, // tonnes
    trips_per_day: 0,
    total_trucks: 0,
    total_fuel_consumed: 0, // l
    total_distance: 0, // km
    downtime: 0, // hrs
    downtime_reason: "",
    challenges: "",
    $notes: "",

    // Internal costs for calculation
    fuel_price_per_l: 3000,
    labor_cost: 0,
    maintenance_cost: 0,
    revenue_per_tonne: 5000, // Default estimate

    // OUTPUTS
    total_production: 0, // tonnes
    total_fuel_cost: 0,
    fuel_efficiency: 0, // km/l
    actual_cost_per_tonne: 0,
    total_revenue: 0
  })

  const [signatures, setSignatures] = useState({
    operator: null as string | null,
    official: null as string | null
  })

  // Auto-calculate outputs
  useEffect(() => {
    const totalProd = formData.total_trucks * formData.trips_per_day * formData.truck_capacity
    const fuelCost = formData.total_fuel_consumed * formData.fuel_price_per_l
    const totalCost = fuelCost + formData.labor_cost + formData.maintenance_cost
    const efficiency = formData.total_fuel_consumed > 0 ? formData.total_distance / formData.total_fuel_consumed : 0
    const costPerTonne = totalProd > 0 ? totalCost / totalProd : 0
    const revenue = totalProd * formData.revenue_per_tonne

    setFormData(prev => ({
      ...prev,
      total_production: Number(totalProd.toFixed(2)),
      total_fuel_cost: Number(fuelCost.toFixed(2)),
      fuel_efficiency: Number(efficiency.toFixed(2)),
      actual_cost_per_tonne: Number(costPerTonne.toFixed(2)),
      total_revenue: Number(revenue.toFixed(2))
    }))
  }, [
    formData.total_trucks, formData.trips_per_day, formData.truck_capacity, 
    formData.total_fuel_consumed, formData.total_distance, formData.labor_cost, 
    formData.maintenance_cost, formData.revenue_per_tonne
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
        operator_signature: signatures.operator,
        official_signature: signatures.official,
        status: "completed",
        current_phase: "execution",
        created_by: user?.id
      }

      const { error } = await supabase.from("material_handling_operations").insert(payload)
      if (error) throw error

      toast({
        title: "FLEET EXECUTION AUTHORIZED",
        description: `Production data for ${formData.operation_number} has been committed.`
      })

      router.push("/material-handling")
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 pb-24">
      <Card className="border-0 shadow-2xl rounded-[3rem] overflow-hidden border-t-8 border-t-emerald-500">
        <CardHeader className="bg-slate-900 text-white p-10">
          <CardTitle className="text-3xl font-black uppercase tracking-tighter italic">✦ MATERIAL HANDLING MODULE ✦ (DURING EXECUTION FORM) ✦</CardTitle>
        </CardHeader>
        
        <CardContent className="p-10 bg-slate-50/50">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            
            {/* SITE & LOGISTICS */}
            <div className="space-y-6 col-span-full">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-5 h-5 text-emerald-600" />
                <h3 className="font-black text-xs uppercase tracking-widest text-slate-500">Site Logistics</h3>
              </div>
              <div className="grid gap-4 md:grid-cols-5">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">operation number</Label>
                  <Input value={formData.operation_number} disabled className="h-12 border-2 rounded-xl font-bold bg-slate-100" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">region</Label>
                  <Input value={formData.region} onChange={e => setFormData({...formData, region: e.target.value})} className="h-12 border-2 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">location</Label>
                  <Input value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="h-12 border-2 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">date</Label>
                  <Input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="h-12 border-2 rounded-xl font-bold" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">day</Label>
                  <Input value={formData.day} onChange={e => setFormData({...formData, day: e.target.value})} className="h-12 border-2 rounded-xl bg-slate-100" />
                </div>
              </div>
            </div>

            {/* FLEET DATA */}
            <div className="space-y-6 col-span-2">
              <div className="flex items-center gap-2 mb-2">
                <Truck className="w-5 h-5 text-emerald-600" />
                <h3 className="font-black text-xs uppercase tracking-widest text-slate-500">Fleet Data</h3>
              </div>
              <div className="grid gap-4 md:grid-cols-3 bg-white p-8 rounded-[2rem] border-2 border-slate-100 shadow-sm">
                <div className="space-y-2 col-span-full">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">operator names</Label>
                  <Input value={formData.operator_names} onChange={e => setFormData({...formData, operator_names: e.target.value})} className="h-12 border-2 rounded-xl" placeholder="List all operators..." />
                </div>
                <div className="space-y-2 col-span-full">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">machines</Label>
                  <Input value={formData.machines} onChange={e => setFormData({...formData, machines: e.target.value})} className="h-12 border-2 rounded-xl" placeholder="CAT 777, Loader L350 etc" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">truck capacity (tonnes)</Label>
                  <Input type="number" value={formData.truck_capacity} onChange={e => setFormData({...formData, truck_capacity: parseFloat(e.target.value) || 0})} className="h-12 border-2 rounded-xl font-bold" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">trips per day</Label>
                  <Input type="number" value={formData.trips_per_day} onChange={e => setFormData({...formData, trips_per_day: parseInt(e.target.value) || 0})} className="h-12 border-2 rounded-xl font-bold" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">total trucks</Label>
                  <Input type="number" value={formData.total_trucks} onChange={e => setFormData({...formData, total_trucks: parseInt(e.target.value) || 0})} className="h-12 border-2 rounded-xl font-black text-emerald-600" />
                </div>
              </div>
            </div>

            {/* CONSUMPTION & PERFORMANCE */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <Fuel className="w-5 h-5 text-orange-600" />
                <h3 className="font-black text-xs uppercase tracking-widest text-slate-500">Consumables</h3>
              </div>
              <div className="grid gap-4 bg-white p-8 rounded-[2rem] border-2 border-slate-100 shadow-sm">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">total fuel consumed (l)</Label>
                  <Input type="number" value={formData.total_fuel_consumed} onChange={e => setFormData({...formData, total_fuel_consumed: parseFloat(e.target.value) || 0})} className="h-12 border-2 rounded-xl font-black text-orange-600" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">total distance (km)</Label>
                  <Input type="number" step="0.1" value={formData.total_distance} onChange={e => setFormData({...formData, total_distance: parseFloat(e.target.value) || 0})} className="h-12 border-2 rounded-xl" />
                </div>
                <div className="grid grid-cols-2 gap-2 border-t pt-4 mt-2">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">downtime (hrs)</Label>
                    <Input type="number" step="0.1" value={formData.downtime} onChange={e => setFormData({...formData, downtime: parseFloat(e.target.value) || 0})} className="h-10 border-2 rounded-lg text-red-600 font-bold" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">reason</Label>
                    <Input value={formData.downtime_reason} onChange={e => setFormData({...formData, downtime_reason: e.target.value})} className="h-10 border-2 rounded-lg text-xs" />
                  </div>
                </div>
              </div>
            </div>

            {/* OUTPUTS */}
            <div className="col-span-full bg-slate-900 rounded-[3rem] p-12 text-white relative overflow-hidden ring-4 ring-emerald-500/20">
               <div className="relative z-10 grid gap-12 md:grid-cols-5">
                  <div className="text-center">
                     <p className="text-[10px] font-black uppercase tracking-tight opacity-40 mb-3">total production (tonnes)</p>
                     <p className="text-4xl font-black text-emerald-400">{formData.total_production.toLocaleString()}</p>
                     <p className="text-[11px] font-bold opacity-30 uppercase mt-2">Payload Yield</p>
                  </div>
                  <div className="text-center">
                     <p className="text-[10px] font-black uppercase tracking-tight opacity-40 mb-3">total fuel cost</p>
                     <p className="text-4xl font-black text-orange-400">{formData.total_fuel_cost.toLocaleString()}</p>
                     <p className="text-[11px] font-bold opacity-30 uppercase mt-2">TZS Spent</p>
                  </div>
                  <div className="text-center">
                     <p className="text-[10px] font-black uppercase tracking-tight opacity-40 mb-3">fuel efficiency (km/l)</p>
                     <p className="text-4xl font-black text-blue-400">{formData.fuel_efficiency}</p>
                     <p className="text-[11px] font-bold opacity-30 uppercase mt-2">KM per L</p>
                  </div>
                  <div className="text-center">
                     <p className="text-[10px] font-black uppercase tracking-tight opacity-40 mb-3">actual cost per tonne</p>
                     <p className="text-4xl font-black text-amber-500">{formData.actual_cost_per_tonne}</p>
                     <p className="text-[11px] font-bold opacity-30 uppercase mt-2">TZS / Tonne</p>
                  </div>
                  <div className="text-center">
                     <p className="text-[10px] font-black uppercase tracking-tight opacity-40 mb-3">total revenue</p>
                     <p className="text-4xl font-black text-emerald-500">{formData.total_revenue.toLocaleString()}</p>
                     <p className="text-[11px] font-bold opacity-30 uppercase mt-2">Estimated TZS</p>
                  </div>
               </div>
               <Calculator className="absolute -bottom-20 -right-20 w-80 h-80 opacity-[0.03] text-white pointer-events-none -z-10" />
            </div>

            {/* CHALLENGES & NOTES */}
            <div className="col-span-full space-y-6">
                <div className="flex items-center gap-2 mb-2">
                 <MessageSquare className="w-5 h-5 text-slate-400" />
                 <h3 className="font-black text-xs uppercase tracking-widest text-slate-500">Challenges & Tactical Notes</h3>
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

            {/* AUTHORIZATION */}
            <div className="col-span-full space-y-8 pt-8 border-t-2 border-slate-200">
               <div className="flex items-center gap-4">
                  <Shield className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">Authorization & Production Release</h3>
               </div>
               
               <div className="grid gap-8 md:grid-cols-2">
                  <div className="flex flex-col items-center gap-4 bg-white p-8 rounded-3xl border-2 border-slate-100 shadow-sm">
                     <ProfessionalSignature 
                       onSign={sig => setSignatures({...signatures, operator: sig})} 
                       title="Operator Signature" 
                       required 
                     />
                     <Label className="text-[10px] font-black uppercase tracking-widest opacity-40">Certified Operator (Saini ya mwendeshaji)</Label>
                  </div>
                  <div className="flex flex-col items-center gap-4 bg-white p-8 rounded-3xl border-2 border-slate-100 shadow-sm">
                     <ProfessionalSignature 
                       onSign={sig => setSignatures({...signatures, official: sig})} 
                       title="Verified By" 
                     />
                     <Label className="text-[10px] font-black uppercase tracking-widest opacity-40">Section Supervisor (Saini ya msimamizi)</Label>
                  </div>
               </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="col-span-full flex gap-4 pt-8">
               <Button type="submit" disabled={loading} className="flex-1 h-20 bg-emerald-600 hover:bg-emerald-700 rounded-3xl text-xl font-black uppercase tracking-widest shadow-2xl shadow-emerald-500/20 transition-all active:scale-95">
                  {loading ? <Loader2 className="w-8 h-8 animate-spin" /> : "Authorize Production Release"}
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

function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
    return <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ring-1 ring-inset ${className}`}>{children}</span>
}

function Trash2({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
    )
}

function PlusCircle({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
    )
}
