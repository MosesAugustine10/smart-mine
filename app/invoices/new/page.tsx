"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard-header"
import { CentralizedInvoice } from "@/components/billing/centralized-invoice"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Plus, Receipt, History, Building2, MapPin, Search, Filter, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default function NewInvoiceGeneratorPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [clientInfo, setClientInfo] = useState({
    name: "Main Mining Ltd",
    address: "Area 4, Geita Site, Tanzania",
    invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
    issueDate: new Date().toISOString().split('T')[0],
    taxRate: 18
  })

  const [availableOperations, setAvailableOperations] = useState<any[]>([])
  const [selectedOperations, setSelectedOperations] = useState<string[]>([])
  const [step, setStep] = useState(1) // 1: Selection, 2: Preview

  useEffect(() => {
    async function fetchAllOperations() {
        const supabase = getSupabaseBrowserClient()
        
        // Parallel fetch from all modules
        const [blasting, drilling, diamond, material, geophysics] = await Promise.all([
            supabase.from("blasting_executions").select("*").order("created_at", { ascending: false }).limit(10),
            supabase.from("drilling_executions").select("*").order("created_at", { ascending: false }).limit(10),
            supabase.from("diamond_drilling_executions").select("*").order("created_at", { ascending: false }).limit(10),
            supabase.from("material_handling_operations").select("*").order("created_at", { ascending: false }).limit(5),
            supabase.from("geophysics_surveys").select("*").order("created_at", { ascending: false }).limit(5)
        ])

        const allOps: any[] = []
        
        if (blasting.data) {
            blasting.data.forEach((op: any) => allOps.push({
                id: op.id,
                module: "BLASTING",
                reference: op.blaster_name,
                description: `Blasting Execution - PF: ${op.powder_factor}`,
                quantity: 1,
                unit_price: Number(op.total_explosive_cost || 0) + Number(op.labor_cost || 0),
                total_cost: Number(op.total_explosive_cost || 0) + Number(op.labor_cost || 0),
                date: op.blast_date
            }))
        }

        if (drilling.data) {
            drilling.data.forEach((op: any) => allOps.push({
                id: op.id,
                module: "DRILLING",
                reference: op.drill_number,
                description: `Drilling Execution - Depth: ${op.hole_length}m`,
                quantity: op.hole_length || 1,
                unit_price: op.drilling_cost_per_m || 55000,
                total_cost: (op.hole_length || 1) * (op.drilling_cost_per_m || 55000),
                date: op.execution_date
            }))
        }

        if (diamond.data) {
            diamond.data.forEach((op: any) => allOps.push({
                id: op.id,
                module: "DIAMOND",
                reference: op.drill_rig_number,
                description: `Diamond Drilling - Hole: ${op.hole_number}`,
                quantity: op.actual_depth || 1,
                unit_price: 135000, // Standard unit rate if not in DB
                total_cost: (op.actual_depth || 1) * 135000,
                date: op.execution_date
            }))
        }

        if (material.data) {
            material.data.forEach((op: any) => allOps.push({
                id: op.id,
                module: "MATERIAL",
                reference: op.equipment_id,
                description: `Material Handling - Production Cycle`,
                quantity: op.total_tonnes || 1,
                unit_price: 2500,
                total_cost: (op.total_tonnes || 1) * 2500,
                date: op.date
            }))
        }

        if (geophysics.data) {
            geophysics.data.forEach((op: any) => allOps.push({
                id: op.id,
                module: "GEOPHYSICS",
                reference: op.survey_id,
                description: `Survey: ${op.survey_type}`,
                quantity: 1,
                unit_price: 450000,
                total_cost: 450000,
                date: op.date_start
            }))
        }

        setAvailableOperations(allOps.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()))
        setLoading(false)
    }
    fetchAllOperations()
  }, [])

  const toggleOperation = (id: string) => {
    setSelectedOperations(prev => 
        prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const selectedBillingItems = availableOperations.filter(op => selectedOperations.includes(op.id))

  const handleSaveInvoice = async () => {
    setSaving(true)
    try {
        const supabase = getSupabaseBrowserClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        const totalAmount = selectedBillingItems.reduce((sum, item) => sum + item.total_cost, 0)
        const taxRateFactor = clientInfo.taxRate / 100
        const taxAmount = totalAmount * taxRateFactor
        
        const { data: inv, error: invError } = await supabase
            .from("invoices")
            .insert({
                company_id: user?.id,
                invoice_number: clientInfo.invoiceNumber,
                client_name: clientInfo.name,
                client_address: clientInfo.address,
                issue_date: clientInfo.issueDate,
                total_amount: totalAmount,
                tax_rate: clientInfo.taxRate,
                tax_amount: taxAmount,
                grand_total: totalAmount + taxAmount,
                status: "ISSUED"
            })
            .select()
            .single()

        if (invError) throw invError

        const lineItems = selectedBillingItems.map(item => ({
            invoice_id: inv.id,
            module_name: item.module,
            reference_id: item.id,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_cost
        }))

        const { error: linesError } = await supabase.from("invoice_items").insert(lineItems)
        if (linesError) throw linesError

        toast({ title: "Module Master Invoiced", description: "All selected operational entities have been billed." })
        router.push("/invoices")
    } catch (err: any) {
        toast({ title: "Billing Process Failure", description: err.message, variant: "destructive" })
    } finally {
        setSaving(false)
    }
  }

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50"><Loader2 className="w-12 h-12 animate-spin text-slate-400" /></div>

  return (
    <div className="flex-1 overflow-auto p-8 space-y-10 bg-slate-50/30 dark:bg-slate-950/30 pb-20">
      
      <div className="flex items-center justify-between mb-8">
          <Button onClick={() => step === 2 ? setStep(1) : router.back()} variant="ghost" className="h-10 px-4 rounded-xl font-bold uppercase text-[10px] tracking-widest border-2 hover:bg-white">
              <ChevronLeft className="w-4 h-4 mr-2" />
              {step === 2 ? "Return to Selection" : "Abort Generator"}
          </Button>
          <div className="flex items-center gap-4">
             <div className={`w-3 h-3 rounded-full ${step === 1 ? 'bg-blue-600 animate-pulse' : 'bg-slate-200'}`} />
             <div className="h-[2px] w-8 bg-slate-200" />
             <div className={`w-3 h-3 rounded-full ${step === 2 ? 'bg-blue-600 animate-pulse' : 'bg-slate-200'}`} />
          </div>
      </div>

      <DashboardHeader 
        title={step === 1 ? "Module Operational Pull" : "Master Process Preview"} 
        description={step === 1 ? "Select verified operational executions from all modules to generate consolidated billing." : "Final Detailed review of the consulting invoice before ledger indexing."}
      />

      {step === 1 ? (
        <div className="grid gap-10 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
                <Card className="border-0 shadow-2xl rounded-[2.5rem] overflow-hidden">
                    <CardHeader className="bg-slate-900 text-white p-8">
                        <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center justify-between">
                           Unbilled Execution List
                           <Badge className="bg-white/10 text-white font-black">{availableOperations.length} Records Found</Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="max-h-[600px] overflow-y-auto">
                            {availableOperations.map((op) => (
                                <div key={op.id} className={`flex items-center justify-between p-6 border-b transition-all ${selectedOperations.includes(op.id) ? 'bg-blue-50/50 border-blue-100' : 'hover:bg-slate-50'}`}>
                                    <div className="flex items-center gap-6">
                                        <Checkbox 
                                            id={op.id} 
                                            checked={selectedOperations.includes(op.id)} 
                                            onCheckedChange={() => toggleOperation(op.id)}
                                            className="w-6 h-6 rounded-lg border-2"
                                        />
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <Badge variant="outline" className={`text-[9px] font-black tracking-widest uppercase border-2 ${op.module === 'BLASTING' ? 'text-orange-600 border-orange-100' : (op.module === 'DRILLING' ? 'text-blue-600 border-blue-100' : 'text-emerald-600 border-emerald-100')}`}>
                                                    {op.module}
                                                </Badge>
                                                <span className="text-[10px] font-black text-slate-400 font-mono italic">{op.date ? new Date(op.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}</span>
                                            </div>
                                            <p className="text-sm font-black text-slate-800 uppercase tracking-tight">{op.description}</p>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">REF: {op.reference}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-md font-black text-slate-900 tracking-tighter">TZS {op.total_cost.toLocaleString()}</p>
                                        <p className="text-[9px] font-black text-slate-400 uppercase">Unit Amount</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-6">
                <Card className="border-0 shadow-2xl rounded-[2.5rem] p-10 bg-white border-2 border-slate-100 sticky top-8">
                    <h3 className="text-xl font-black uppercase tracking-tighter mb-8 flex items-center gap-3">
                        <Building2 className="w-6 h-6 text-blue-600" />
                        Billing Configuration
                    </h3>
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest opacity-40">Client Designation</Label>
                            <Input value={clientInfo.name} onChange={e => setClientInfo({...clientInfo, name: e.target.value})} className="h-12 border-2 rounded-xl font-bold" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest opacity-40">Project Site Address</Label>
                            <Input value={clientInfo.address} onChange={e => setClientInfo({...clientInfo, address: e.target.value})} className="h-12 border-2 rounded-xl font-bold" />
                        </div>
                        <div className="space-y-2">
                             <Label className="text-[10px] font-black uppercase tracking-widest opacity-40">VAT Allocation (%)</Label>
                             <Input 
                                type="number" 
                                value={clientInfo.taxRate} 
                                onChange={e => setClientInfo({...clientInfo, taxRate: parseFloat(e.target.value)})} 
                                className="h-12 border-2 rounded-xl font-black text-blue-600" 
                             />
                        </div>
                        <div className="pt-6 border-t space-y-4">
                            <div className="flex justify-between items-center text-xs opacity-60 font-bold uppercase">
                                <span>Selected Entities</span>
                                <span>{selectedOperations.length}</span>
                            </div>
                            <div className="flex justify-between items-center text-lg font-black uppercase text-slate-900">
                                <span>Sub-Quantum</span>
                                <span>TZS {selectedBillingItems.reduce((s: number, i: any) => s + i.total_cost, 0).toLocaleString()}</span>
                            </div>
                        </div>
                        <Button 
                            disabled={selectedOperations.length === 0} 
                            onClick={() => setStep(2)}
                            className="w-full h-16 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-500/20"
                        >
                            Proceed to Preview <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
      ) : (
        <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <CentralizedInvoice 
                clientName={clientInfo.name}
                clientAddress={clientInfo.address}
                invoiceNumber={clientInfo.invoiceNumber}
                issueDate={clientInfo.issueDate}
                status="VERIFIED"
                taxRate={clientInfo.taxRate}
                billingData={selectedBillingItems}
            />
            
            <div className="flex gap-4 pt-10 border-t-4 border-slate-100">
                <Button 
                  onClick={handleSaveInvoice} 
                  disabled={saving}
                  className="flex-1 h-24 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[2.5rem] text-2xl font-black uppercase tracking-tighter shadow-3xl shadow-emerald-500/20 transition-all hover:scale-[1.01]"
                >
                    {saving ? <Loader2 className="w-10 h-10 animate-spin" /> : "AUTH MASTER Process"}
                </Button>
            </div>
        </div>
      )}

    </div>
  )
}
