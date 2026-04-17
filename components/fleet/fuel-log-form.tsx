"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ProfessionalSignature } from "@/components/professional-signature"
import { Fuel, Loader2, Gauge, MapPin, Calculator, Calendar, History, ShieldCheck } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { useOffline } from "@/components/offline-provider"

interface Vehicle {
  id: string
  vehicle_number: string
  vehicle_type: string
}

interface Driver {
  id: string
  full_name: string
}

interface FuelLogFormProps {
  vehicles: Vehicle[]
  drivers: Driver[]
}

const fuelTypes = ["Diesel", "Petrol", "Premium Diesel"]

export function FuelLogForm({ vehicles, drivers }: FuelLogFormProps) {
    const router = useRouter()
    const { toast } = useToast()
    const { offlineWrite } = useOffline()
    const [loading, setLoading] = useState(false)
    
    const [formData, setFormData] = useState({
        fleet_vehicle_id: "",
        driver_id: "",
        date: new Date().toISOString().split("T")[0],
        time: new Date().toTimeString().split(" ")[0].substring(0, 5),
        location: "",
        fuel_type: "Diesel",
        quantity_liters: "",
        cost_per_liter: "",
        odometer_reading: "",
        notes: ""
    })

    const [signatures, setSignatures] = useState<{
        reporter: string | null;
        supervisor: string | null;
        manager: string | null;
    }>({
        reporter: null,
        supervisor: null,
        manager: null
    })

    const totalCost = (parseFloat(formData.quantity_liters) || 0) * (parseFloat(formData.cost_per_liter) || 0)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!signatures.reporter) {
            toast({ title: "Archival Blocked", description: "Operator / Driver signature is mandatory for fuel disbursement records.", variant: "destructive" })
            return
        }

        setLoading(true)
        try {
            const supabase = getSupabaseBrowserClient()
            const { data: { user } } = await supabase.auth.getUser()
            
            const payload = {
                company_id: user?.id,
                fleet_vehicle_id: formData.fleet_vehicle_id,
                driver_id: formData.driver_id || null,
                log_date_time: `${formData.date}T${formData.time}:00Z`,
                location: formData.location,
                fuel_type: formData.fuel_type,
                quantity: parseFloat(formData.quantity_liters),
                cost_per_liter: parseFloat(formData.cost_per_liter),
                total_cost: totalCost,
                odometer_reading: parseFloat(formData.odometer_reading),
                notes: formData.notes,
                reporter_signature: signatures.reporter,
                supervisor_signature: signatures.supervisor,
                manager_signature: signatures.manager
            }

            const { queued } = await offlineWrite("fuel_logs", "insert", payload)
            if (queued) {
                toast({ title: "Saved Offline", description: "Fuel log queued. Will sync automatically when online." })
                router.push("/fleet/fuel-logs")
                return
            }

            const { error } = await supabase.from("fuel_logs").insert(payload)
            if (error) throw error

            toast({ title: "Consumption Archived", description: "Fuel disbursement has been indexed into the corporate List." })
            router.push("/fleet/fuel-logs")
            router.refresh()
        } catch (err: any) {
            toast({ title: "Archival Error", description: err.message, variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-10 pb-20">
            <Card className="border-0 shadow-3xl rounded-[3.5rem] overflow-hidden border-t-8 border-t-blue-500">
                <CardHeader className="bg-slate-950 text-white p-12 relative">
                    <div className="flex justify-between items-center relative z-10">
                        <div>
                            <CardTitle className="text-4xl font-black uppercase tracking-tighter">Fuel Disbursement Process</CardTitle>
                            <p className="opacity-70 font-semibold mt-1 italic text-blue-200">Detailed Fleet Consumption Tracking {"&"} Review</p>
                        </div>
                        <Fuel className="w-20 h-20 opacity-10 animate-pulse text-blue-500" />
                    </div>
                </CardHeader>

                <CardContent className="p-12 bg-slate-50/30">
                    <div className="space-y-12">
                        
                        {/* Section 1: Asset Identification */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="h-8 w-1 bg-blue-500 rounded-full" />
                                <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">1. Asset {"&"} Personnel Assignment</h3>
                            </div>
                            <div className="grid md:grid-cols-2 gap-8 ring-1 ring-slate-100 p-1 bg-white/50 rounded-[2.5rem]">
                                <div className="p-8 space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase opacity-40">Select Vehicle / Heavy Equipment *</Label>
                                        <Select value={formData.fleet_vehicle_id} onValueChange={v => setFormData({...formData, fleet_vehicle_id: v})} required>
                                            <SelectTrigger className="h-14 border-2 rounded-2xl font-bold">
                                                <SelectValue placeholder="Identification Number" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {vehicles.map(v => (
                                                    <SelectItem key={v.id} value={v.id}>{v.vehicle_number} ({v.vehicle_type})</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase opacity-40">Operator / Driver Designation</Label>
                                        <Select value={formData.driver_id} onValueChange={v => setFormData({...formData, driver_id: v})}>
                                            <SelectTrigger className="h-14 border-2 rounded-2xl font-bold">
                                                <SelectValue placeholder="Assigned Personnel" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {drivers.map(d => (
                                                    <SelectItem key={d.id} value={d.id}>{d.full_name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="p-8 space-y-4 bg-slate-900 border-l-4 border-blue-500 rounded-r-[2rem] text-white">
                                     <div className="flex items-center gap-3 mb-6">
                                        <Gauge className="w-5 h-5 text-blue-400" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Efficiency Metrics</span>
                                     </div>
                                     <div className="space-y-2">
                                         <Label className="text-[10px] font-black uppercase opacity-40">Odometer / Hour Meter Reading *</Label>
                                         <Input type="number" value={formData.odometer_reading} onChange={e => setFormData({...formData, odometer_reading: e.target.value})} className="h-14 bg-white/5 border-2 border-white/10 rounded-2xl font-black text-2xl text-blue-400" placeholder="0.00" required />
                                     </div>
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Transaction Specifics */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="h-8 w-1 bg-emerald-500 rounded-full" />
                                <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">2. Disbursement Quantum</h3>
                            </div>
                            <div className="bg-white p-10 rounded-[3rem] border-2 border-slate-100 shadow-sm space-y-10">
                                <div className="grid md:grid-cols-3 gap-8">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase opacity-40">Fuel Formulation</Label>
                                        <Select value={formData.fuel_type} onValueChange={v => setFormData({...formData, fuel_type: v})}>
                                            <SelectTrigger className="h-14 border-2 rounded-2xl font-bold italic">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {fuelTypes.map(ft => <SelectItem key={ft} value={ft}>{ft}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase opacity-40">Volume (Liters) *</Label>
                                        <Input type="number" step="0.01" value={formData.quantity_liters} onChange={e => setFormData({...formData, quantity_liters: e.target.value})} className="h-14 border-2 rounded-2xl font-black text-xl" required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase opacity-40">Unit Cost (TZS/L) *</Label>
                                        <Input type="number" step="0.01" value={formData.cost_per_liter} onChange={e => setFormData({...formData, cost_per_liter: e.target.value})} className="h-14 border-2 rounded-2xl font-black text-xl" required />
                                    </div>
                                </div>
                                <div className="grid md:grid-cols-2 gap-8 pt-6 border-t border-slate-50">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase opacity-40">Disbursement Location</Label>
                                        <div className="relative">
                                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <Input value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="h-14 pl-12 border-2 rounded-2xl font-bold" placeholder="E.g., Site Tank Alpha" />
                                        </div>
                                    </div>
                                    <div className="bg-emerald-600 rounded-3xl p-6 flex items-center justify-between text-white shadow-2xl shadow-emerald-500/20">
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Calculated Fiscal Quantum</p>
                                            <p className="text-3xl font-black tracking-tighter">TZS {totalCost.toLocaleString()}</p>
                                        </div>
                                        <Calculator className="w-10 h-10 opacity-30" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Governance Chain */}
                        <div className="col-span-full space-y-8 pt-8 border-t-2 border-slate-200">
                            <div className="flex items-center gap-4">
                                <ShieldCheck className="w-5 h-5 text-blue-600" />
                                <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">3. Authorization & Governance</h3>
                            </div>
                            
                            <div className="grid gap-8 md:grid-cols-3 relative z-10">
                                <div className="flex flex-col items-center gap-4 bg-white p-8 rounded-3xl border-2 border-slate-100 shadow-sm">
                                    <ProfessionalSignature onSign={sig => setSignatures({...signatures, reporter: sig})} title="Operator Authorization" required />
                                    <Label className="font-black text-[10px] uppercase opacity-40 tracking-widest">Disbursement Operator (Saini ya mtoa mafuta)</Label>
                                </div>
                                <div className="flex flex-col items-center gap-4 bg-white p-8 rounded-3xl border-2 border-slate-100 shadow-sm">
                                    <ProfessionalSignature onSign={sig => setSignatures({...signatures, supervisor: sig})} title="Supervisor Review" />
                                    <Label className="font-black text-[10px] uppercase opacity-40 tracking-widest">Fleet Supervisor (Saini ya msimamizi)</Label>
                                </div>
                                <div className="flex flex-col items-center gap-4 bg-white p-8 rounded-3xl border-2 border-slate-100 shadow-sm">
                                    <ProfessionalSignature onSign={sig => setSignatures({...signatures, manager: sig})} title="Manager Authorization" />
                                    <Label className="font-black text-[10px] uppercase opacity-40 tracking-widest">Operations Manager (Saini ya meneja)</Label>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-6 pt-10 border-t-4 border-slate-100">
                            <Button type="submit" disabled={loading} className="flex-1 h-24 bg-blue-600 hover:bg-blue-700 text-white rounded-[2.5rem] text-2xl font-black uppercase tracking-tighter shadow-3xl shadow-blue-500/20 transition-all">
                                {loading ? <Loader2 className="w-10 h-10 animate-spin" /> : "Authorize Fuel Disbursement"}
                            </Button>
                        </div>

                    </div>
                </CardContent>
            </Card>
        </form>
    )
}
