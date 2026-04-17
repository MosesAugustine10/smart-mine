"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ProfessionalSignature } from "@/components/professional-signature"
import { Wrench, Loader2, Gauge, DollarSign, History, Plus, Trash2, Database, ShieldCheck } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { useOffline } from "@/components/offline-provider"
import { recordBulkUsage } from "@/lib/inventory-sync"

interface Vehicle {
  id: string
  vehicle_number: string
  vehicle_type: string
}

interface MaintenanceFormProps {
  vehicles: Vehicle[]
}

export function MaintenanceForm({ vehicles }: MaintenanceFormProps) {
    const router = useRouter()
    const { toast } = useToast()
    const { offlineWrite } = useOffline()
    const [loading, setLoading] = useState(false)
    const [fleetInventory, setFleetInventory] = useState<any[]>([])
    
    const [formData, setFormData] = useState({
        fleet_vehicle_id: "",
        date: new Date().toISOString().split("T")[0],
        maintenance_type: "",
        description: "",
        cost: "",
        performed_by: "",
        next_service_date: "",
        next_service_odometer: "",
        odometer_reading: ""
    })

    const [partAllocations, setPartAllocations] = useState<Array<{itemCode: string, quantity: number}>>([
        { itemCode: "", quantity: 1 }
    ])

    const [signatures, setSignatures] = useState<{
        mechanic: string | null;
        supervisor: string | null;
        manager: string | null;
    }>({
        mechanic: null,
        supervisor: null,
        manager: null
    })

    useEffect(() => {
        const fetchFleetInventory = async () => {
            const supabase = getSupabaseBrowserClient()
            const { data } = await supabase
                .from("inventory_items")
                .select("id, item_code, item_name, current_stock, unit")
                .eq("category", "FLEET")
            if (data) setFleetInventory(data)
        }
        fetchFleetInventory()
    }, [])

    const addPartRow = () => setPartAllocations([...partAllocations, { itemCode: "", quantity: 1 }])
    const removePartRow = (index: number) => setPartAllocations(partAllocations.filter((_, i) => i !== index))
    const updatePartRow = (index: number, field: string, value: any) => {
        const newRows = [...partAllocations]
        newRows[index] = { ...newRows[index], [field]: value }
        setPartAllocations(newRows)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!signatures.mechanic) {
            toast({ title: "Compliance Blocked", description: "Mechanic signature is mandatory for reliability logs.", variant: "destructive" })
            return
        }

        setLoading(true)
        try {
            const supabase = getSupabaseBrowserClient()
            const { data: { user } } = await supabase.auth.getUser()
            
            const payload = {
                company_id: user?.id,
                fleet_vehicle_id: formData.fleet_vehicle_id,
                maintenance_date: formData.date,
                maintenance_type: formData.maintenance_type,
                description: formData.description,
                cost: parseFloat(formData.cost) || 0,
                performed_by: formData.performed_by,
                next_service_date: formData.next_service_date || null,
                next_service_odometer: parseFloat(formData.next_service_odometer) || null,
                odometer_reading: parseFloat(formData.odometer_reading) || null,
                reporter_signature: signatures.mechanic,
                supervisor_signature: signatures.supervisor,
                manager_signature: signatures.manager
            }

            const { error: logError } = await supabase.from("maintenance_logs").insert(payload)
            if (logError) throw logError

            // AUTOMATIC SPARE PARTS SYNC
            const validAllocations = partAllocations.filter(p => p.itemCode && p.quantity > 0)
            if (validAllocations.length > 0) {
                await recordBulkUsage({
                    module: 'FLEET',
                    referenceId: vehicles.find(v => v.id === formData.fleet_vehicle_id)?.vehicle_number || 'UNKNOWN',
                    items: validAllocations
                })
            }

            toast({ title: "Maintenance Finalized", description: "Log indexed and inventory stock updated." })
            router.push("/fleet/maintenance")
            router.refresh()
        } catch (err: any) {
            toast({ title: "Archival Error", description: err.message, variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-10 pb-20">
            <Card className="border-0 shadow-3xl rounded-[3.5rem] overflow-hidden border-t-8 border-t-amber-500">
                <CardHeader className="bg-slate-950 text-white p-12 relative">
                    <div className="flex justify-between items-center relative z-10">
                        <div>
                            <CardTitle className="text-4xl font-black uppercase tracking-tighter">Fleet Reliability Log</CardTitle>
                            <p className="opacity-70 font-semibold mt-1 italic text-amber-200 text-sm">Industrial Asset Maintenance & Consumption Tracking</p>
                        </div>
                        <Wrench className="w-20 h-20 opacity-10 animate-pulse text-amber-500" />
                    </div>
                </CardHeader>

                <CardContent className="p-12 bg-slate-50/30">
                    <div className="space-y-12">
                        
                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="h-8 w-1 bg-amber-500 rounded-full" />
                                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">1. Operational Context</h3>
                                </div>
                                <div className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-sm space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-amber-600">Asset Selection *</Label>
                                        <Select value={formData.fleet_vehicle_id} onValueChange={v => setFormData({...formData, fleet_vehicle_id: v})} required>
                                            <SelectTrigger className="h-14 border-2 rounded-2xl font-bold">
                                                <SelectValue placeholder="Select Vehicle Number" />
                                            </SelectTrigger>
                                            <SelectContent>{vehicles.map(v => <SelectItem key={v.id} value={v.id}>{v.vehicle_number}</SelectItem>)}</SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase">Odometer/Hours</Label>
                                            <Input type="number" value={formData.odometer_reading} onChange={e => setFormData({...formData, odometer_reading: e.target.value})} className="h-14 border-2 rounded-2xl font-black text-xl" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase">Service Date</Label>
                                            <Input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="h-14 border-2 rounded-2xl" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="h-8 w-1 bg-blue-500 rounded-full" />
                                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">2. Technical Accountability</h3>
                                </div>
                                <div className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-sm space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase">Maintenance Type</Label>
                                        <Input value={formData.maintenance_type} onChange={e => setFormData({...formData, maintenance_type: e.target.value})} className="h-14 border-2 rounded-2xl font-bold uppercase" placeholder="E.g., Component Overhaul" required />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase">Lead Technician</Label>
                                            <Input value={formData.performed_by} onChange={e => setFormData({...formData, performed_by: e.target.value})} className="h-14 border-2 rounded-2xl" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase text-emerald-600">Direct Cost (TZS)</Label>
                                            <Input type="number" value={formData.cost} onChange={e => setFormData({...formData, cost: e.target.value})} className="h-14 border-2 rounded-2xl font-black text-xl text-emerald-600 border-emerald-50" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="h-8 w-1 bg-orange-500 rounded-full" />
                                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">3. Spare Parts Allocation (PRO)</h3>
                                </div>
                                <Button type="button" onClick={addPartRow} variant="outline" className="rounded-xl border-orange-200 text-orange-600 font-black text-[10px] uppercase tracking-widest">
                                    <Plus className="w-4 h-4 mr-2" /> Add Part
                                </Button>
                            </div>
                            <div className="bg-orange-50/30 p-8 rounded-[3rem] border-2 border-orange-100 shadow-inner space-y-4">
                                {partAllocations.map((row, idx) => (
                                    <div key={idx} className="flex gap-4 items-end bg-white p-4 rounded-2xl border-2 border-orange-50">
                                        <div className="flex-1 space-y-2">
                                            <Label className="text-[8px] font-black uppercase opacity-40">Select Master Spare Part Batch</Label>
                                            <Select value={row.itemCode} onValueChange={val => updatePartRow(idx, 'itemCode', val)}>
                                                <SelectTrigger className="h-12 border-2 rounded-xl">
                                                    <SelectValue placeholder="Choose Part" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl">
                                                    {fleetInventory.map(item => (
                                                        <SelectItem key={item.id} value={item.item_code}>
                                                            {item.item_name} [{item.item_code}] ({item.current_stock} {item.unit} left)
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="w-32 space-y-2 text-center">
                                            <Label className="text-[8px] font-black uppercase opacity-40">Qty Used</Label>
                                            <Input type="number" value={row.quantity} onChange={e => updatePartRow(idx, 'quantity', parseInt(e.target.value) || 0)} className="h-12 border-2 rounded-xl text-center font-black" />
                                        </div>
                                        <Button type="button" onClick={() => removePartRow(idx)} disabled={partAllocations.length === 1} variant="ghost" className="h-12 w-12 rounded-xl text-red-500 hover:bg-red-50">
                                            <Trash2 className="w-5 h-5" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* PREDICTIVE HEALTH SUMMARY */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="h-8 w-1 bg-slate-800 rounded-full" />
                                <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">4. Predictive Health Summary</h3>
                            </div>
                            <div className="grid md:grid-cols-2 gap-8 bg-slate-900 p-10 rounded-[3rem] text-white">
                                <div className="space-y-4">
                                    <Label className="text-[10px] font-black uppercase opacity-40 tracking-widest text-amber-500">Technical Diagnostic Report</Label>
                                    <Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="min-h-[140px] bg-white/5 border-2 border-white/10 rounded-[2rem] p-6 text-slate-200" placeholder="Detail component conditions, oil analysis results, or pending failures..." required />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase opacity-40 text-amber-500">Next Service Date</Label>
                                        <Input type="date" value={formData.next_service_date} onChange={e => setFormData({...formData, next_service_date: e.target.value})} className="h-14 bg-white/5 border-2 border-white/10 rounded-2xl text-white" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase opacity-40 text-amber-500">Next Threshold (KM)</Label>
                                        <Input type="number" value={formData.next_service_odometer} onChange={e => setFormData({...formData, next_service_odometer: e.target.value})} className="h-14 bg-white/5 border-2 border-white/10 rounded-2xl text-white font-black" />
                                    </div>
                                    <div className="col-span-full pt-4 opacity-30 text-[9px] uppercase font-black tracking-[0.3em] flex items-center gap-2">
                                        <History className="w-3 h-3" /> Predictive Fleet Analytics Active
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* AUTHORIZATION */}
                        <div className="col-span-full space-y-8 pt-8 border-t-2 border-slate-200">
                             <div className="flex items-center gap-4">
                                <ShieldCheck className="w-5 h-5 text-amber-600" />
                                <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">5. Authorization & Compliance</h3>
                            </div>
                            
                            <div className="grid gap-8 md:grid-cols-3">
                                <div className="flex flex-col items-center gap-4 bg-white p-8 rounded-3xl border-2 border-slate-100 shadow-sm">
                                    <ProfessionalSignature onSign={sig => setSignatures({...signatures, mechanic: sig})} title="Mechanic Authorization" required />
                                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-40">Lead Mechanic (Saini ya fundi)</Label>
                                </div>
                                <div className="flex flex-col items-center gap-4 bg-white p-8 rounded-3xl border-2 border-slate-100 shadow-sm">
                                    <ProfessionalSignature onSign={sig => setSignatures({...signatures, supervisor: sig})} title="Supervisor Review" />
                                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-40">Section Head (Saini ya msimamizi)</Label>
                                </div>
                                <div className="flex flex-col items-center gap-4 bg-white p-8 rounded-3xl border-2 border-slate-100 shadow-sm">
                                    <ProfessionalSignature onSign={sig => setSignatures({...signatures, manager: sig})} title="Maintenance Approval" />
                                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-40">Engineering Manager (Saini ya meneja)</Label>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-6 pt-10 border-t-4 border-slate-100">
                            <Button type="submit" disabled={loading} className="flex-1 h-24 bg-amber-500 hover:bg-amber-600 text-white rounded-[2.5rem] text-2xl font-black uppercase tracking-tighter shadow-3xl shadow-amber-500/20 transition-all hover:scale-[1.01]">
                                {loading ? <Loader2 className="w-10 h-10 animate-spin" /> : "Authorize Maintenance Process"}
                            </Button>
                        </div>

                    </div>
                </CardContent>
            </Card>
        </form>
    )
}
