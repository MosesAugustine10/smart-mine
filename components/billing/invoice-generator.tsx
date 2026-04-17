"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { 
  Loader2, 
  Plus, 
  Trash2, 
  DollarSign, 
  FileText, 
  Calculator, 
  Zap, 
  ArrowRight,
  ShieldCheck,
  Building2,
  Calendar,
  Hash,
  Download,
  AlertCircle
} from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Badge } from "@/components/ui/badge"

interface BillableItem {
  id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
  source_module?: string;
  source_id?: string;
}

export function InvoiceGenerator({ projects }: { projects: any[] }) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [harvesting, setHarvesting] = useState(false)
  
  const [formData, setFormData] = useState({
    project_id: "",
    client_name: "",
    client_address: "",
    client_email: "",
    invoice_number: `INV-${Date.now().toString().slice(-6)}`,
    issue_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    tax_rate: 18.00, // Tanzania VAT
    payment_terms: "Direct bank transfer within 30 days.",
    bank_details: "",
    notes: "Professional mining consultancy services.",
    currency: "TZS"
  })

  const [items, setItems] = useState<BillableItem[]>([])

  // Financial Calculations
  const subtotal = items.reduce((sum, item) => sum + item.amount, 0)
  const taxAmount = (subtotal * formData.tax_rate) / 100
  const totalAmount = subtotal + taxAmount

  const addManualItem = () => {
    setItems([...items, { description: "New Service Item", quantity: 1, unit_price: 0, amount: 0 }])
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: keyof BillableItem, value: any) => {
    const newItems = [...items]
    const item = { ...newItems[index], [field]: value }
    item.amount = item.quantity * item.unit_price
    newItems[index] = item
    setItems(newItems)
  }

  // DATA HARVEST ENGINE (The "Magic" part)
  const harvestBillableData = async () => {
    if (!formData.project_id) {
       toast({ title: "Project Required", description: "Select a project to harvest operational data.", variant: "destructive" })
       return
    }

    setHarvesting(true)
    try {
      const supabase = getSupabaseBrowserClient()
      const newItems: BillableItem[] = []

      // 1. Harvest Blasting Data
      const { data: blasts } = await supabase
        .from("blasting_executions")
        .select("*")
        .eq("status", "COMPLETED")
      
      blasts?.forEach(b => {
         const totalBlastCost = (b.total_explosive_cost || 0) + (b.initiation_cost || 0) + (b.labor_cost || 0) + (b.accessories_cost || 0)
         if (totalBlastCost > 0) {
            newItems.push({
               description: `Blasting Execution: ${b.blast_date} | Operator: ${b.blaster_name}`,
               quantity: 1,
               unit_price: totalBlastCost,
               amount: totalBlastCost,
               source_module: 'BLASTING',
               source_id: b.id
            })
         }
      })

      // 2. Harvest Drilling Data
      const { data: drills } = await supabase
        .from("drilling_executions")
        .select("*")
        .eq("project_id", formData.project_id)
      
      drills?.forEach(d => {
         const drillCost = (d.hole_length || 0) * (d.drilling_cost_per_m || 25000) // Default rate if null
         if (drillCost > 0) {
            newItems.push({
               description: `Drilling Services: ${d.drill_number} | ${d.hole_length}m drilled`,
               quantity: d.hole_length,
               unit_price: d.drilling_cost_per_m || 25000,
               amount: drillCost,
               source_module: 'DRILLING',
               source_id: d.id
            })
         }
      })

      // 3. Harvest Quarry Payload Data
      const { data: payloads } = await supabase
         .from("equipment_payloads")
         .select("*")

      payloads?.forEach(p => {
         const tonnageRate = 1500 // Demo rate per ton
         const amount = p.total_tonnage * tonnageRate
         newItems.push({
            description: `Haulage & Payload: ${p.machine_name} | ${p.total_tonnage} MT hauled`,
            quantity: p.total_tonnage,
            unit_price: tonnageRate,
            amount: amount,
            source_module: 'QUARRY',
            source_id: p.id
         })
      })

      setItems([...items, ...newItems])
      toast({ title: "Data Harvested", description: `Discovered and added ${newItems.length} billable events across modules.` })
    } catch (err: any) {
      toast({ title: "Harvest Error", description: err.message, variant: "destructive" })
    } finally {
      setHarvesting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (items.length === 0) {
      toast({ title: "No Items", description: "Invoice must have at least one billable item.", variant: "destructive" })
      return
    }

    setLoading(true)
    try {
      const supabase = getSupabaseBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("company_id")
        .eq("id", user?.id)
        .single()

      // 1. Create Invoice Header
      const { data: invoice, error: invError } = await supabase
        .from("invoices")
        .insert({
          company_id: profile?.company_id,
          project_id: formData.project_id,
          invoice_number: formData.invoice_number,
          client_name: formData.client_name,
          client_address: formData.client_address,
          client_email: formData.client_email,
          issue_date: formData.issue_date,
          due_date: formData.due_date,
          status: 'DRAFT',
          subtotal,
          tax_rate: formData.tax_rate,
          tax_amount: taxAmount,
          total_amount: totalAmount,
          currency: formData.currency,
          payment_terms: formData.payment_terms,
          notes: formData.notes,
          created_by: user?.id
        })
        .select()
        .single()

      if (invError) throw invError

      // 2. Insert Line Items
      const lineItems = items.map(item => ({
        invoice_id: invoice.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        amount: item.amount,
        source_module: item.source_module,
        source_id: item.source_id
      }))

      const { error: itemError } = await supabase.from("invoice_items").insert(lineItems)
      if (itemError) throw itemError

      toast({ title: "Invoice Finalized", description: `Record #${formData.invoice_number} archived in global billing List.` })
      router.push("/billing/invoices")
    } catch (err: any) {
      toast({ title: "Billing Error", description: err.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-12 pb-24 font-inter">
      {/* 1. Executive Identity */}
      <Card className="border-0 shadow-3xl rounded-[4rem] overflow-hidden border-t-8 border-t-blue-600">
        <CardHeader className="p-12 bg-slate-950 text-white flex flex-row justify-between items-center relative overflow-hidden">
           <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full translate-x-1/2 -translate-y-1/2 blur-3xl opacity-50" />
           <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-3">
                 <Badge className="bg-blue-600 text-[8px] font-black py-1 uppercase tracking-widest px-4 rounded-full">Consulting Hub</Badge>
                 <span className="text-blue-500 font-black uppercase text-[10px] tracking-[0.3em]">Institutional Billing</span>
              </div>
              <CardTitle className="text-6xl font-black uppercase tracking-tighter italic">Professional Invoice</CardTitle>
              <p className="text-slate-400 font-bold text-lg italic">Main Financial Settlement List</p>
           </div>
           <Building2 className="w-24 h-24 text-blue-600 opacity-20 relative z-10" />
        </CardHeader>

        <CardContent className="p-12 bg-slate-50/50">
           <div className="grid md:grid-cols-4 gap-8">
              <div className="space-y-2">
                 <Label className="text-[10px] font-black uppercase opacity-40 flex items-center gap-2">
                    <Hash className="w-3 h-3" /> Invoice Number
                 </Label>
                 <Input value={formData.invoice_number} onChange={e => setFormData({...formData, invoice_number: e.target.value})} className="h-14 border-2 rounded-2xl font-black text-xl bg-white" required />
              </div>
              <div className="space-y-2">
                 <Label className="text-[10px] font-black uppercase opacity-40 flex items-center gap-2">
                    <Calendar className="w-3 h-3" /> Issue Date
                 </Label>
                 <Input type="date" value={formData.issue_date} onChange={e => setFormData({...formData, issue_date: e.target.value})} className="h-14 border-2 rounded-2xl font-black text-xl bg-white" required />
              </div>
              <div className="space-y-2">
                 <Label className="text-[10px] font-black uppercase opacity-40 flex items-center gap-2">
                    <AlertCircle className="w-3 h-3 text-amber-500" /> Due Date
                 </Label>
                 <Input type="date" value={formData.due_date} onChange={e => setFormData({...formData, due_date: e.target.value})} className="h-14 border-2 rounded-2xl font-black text-xl bg-white" required />
              </div>
              <div className="space-y-2">
                 <Label className="text-[10px] font-black uppercase opacity-40 tracking-widest">Active Project</Label>
                 <Select value={formData.project_id} onValueChange={v => setFormData({...formData, project_id: v})}>
                    <SelectTrigger className="h-14 border-2 rounded-2xl font-black text-xl bg-white">
                       <SelectValue placeholder="Select Context" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-2">
                       {projects.map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                       ))}
                    </SelectContent>
                 </Select>
              </div>
           </div>

           <div className="grid md:grid-cols-3 gap-8 mt-10 p-10 bg-white rounded-[2.5rem] border-2 border-slate-100 shadow-xl">
               <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase opacity-40">Client Entity Name</Label>
                  <Input value={formData.client_name} onChange={e => setFormData({...formData, client_name: e.target.value})} className="h-12 border-2 rounded-xl font-bold" placeholder="E.g. Tanga Cement PLC" required />
               </div>
               <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase opacity-40">Client Billing Address</Label>
                  <Input value={formData.client_address} onChange={e => setFormData({...formData, client_address: e.target.value})} className="h-12 border-2 rounded-xl font-bold" placeholder="Full Registered Address" />
               </div>
               <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase opacity-40">Client Point of Contact (Email)</Label>
                  <Input type="email" value={formData.client_email} onChange={e => setFormData({...formData, client_email: e.target.value})} className="h-12 border-2 rounded-xl font-bold" placeholder="finance@client.com" />
               </div>
           </div>
        </CardContent>
      </Card>

      {/* 2. Billable Line Items Ledger */}
      <Card className="border-0 shadow-4xl rounded-[4rem] overflow-hidden bg-slate-950 text-white">
        <CardHeader className="p-12 border-b border-white/5 flex flex-row items-center justify-between">
           <div>
              <CardTitle className="text-3xl font-black uppercase tracking-tighter">Settlement Ledger</CardTitle>
              <p className="text-[10px] font-black text-blue-500 mt-1 uppercase tracking-widest italic opacity-60">Itemized Professional Services List</p>
           </div>
           <div className="flex gap-4">
              <Button type="button" onClick={harvestBillableData} disabled={harvesting} className="h-12 px-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-[10px] tracking-widest gap-2 shadow-xl shadow-blue-500/30">
                 {harvesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 fill-white" />}
                 Harvest System Records
              </Button>
              <Button type="button" onClick={addManualItem} variant="outline" className="h-12 px-6 rounded-full border-white/20 bg-white/5 font-black uppercase text-[10px] tracking-widest text-white hover:bg-white hover:text-slate-950 transition-all">
                 <Plus className="w-4 h-4" /> Add Manual Item
              </Button>
           </div>
        </CardHeader>
        <CardContent className="p-0">
           <table className="w-full">
              <thead className="bg-white/5 border-b border-white/5">
                 <tr>
                    <th className="p-8 text-left text-[10px] font-black uppercase opacity-40 tracking-widest">Description / Performance Unit</th>
                    <th className="p-8 text-center text-[10px] font-black uppercase opacity-40 tracking-widest w-32">Qty</th>
                    <th className="p-8 text-right text-[10px] font-black uppercase opacity-40 tracking-widest w-48">Unit Price</th>
                    <th className="p-8 text-right text-[10px] font-black uppercase opacity-40 tracking-widest w-48">Net Total</th>
                    <th className="p-8 text-center text-[10px] font-black uppercase opacity-40 w-24">Del</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                 {items.length === 0 ? (
                    <tr>
                       <td colSpan={5} className="p-32 text-center opacity-30">
                          <Calculator className="w-20 h-20 mx-auto mb-6" />
                          <p className="text-xl font-black uppercase italic tracking-tighter">Ledger Empty</p>
                          <p className="text-[10px] uppercase font-bold tracking-widest mt-2">No records synchronized yet</p>
                       </td>
                    </tr>
                 ) : (
                    items.map((item, index) => (
                       <tr key={index} className="hover:bg-white/5 transition-all">
                          <td className="p-6">
                             <Input 
                                value={item.description} 
                                onChange={e => updateItem(index, 'description', e.target.value)}
                                className="bg-transparent border-0 font-bold text-lg text-white placeholder:text-white/10 p-4 focus:bg-white/5 rounded-xl h-14"
                                placeholder="Service Description"
                             />
                             {item.source_module && (
                                <Badge className="ml-4 bg-emerald-500/20 text-emerald-400 border-0 text-[8px] font-black uppercase py-0.5 tracking-widest">{item.source_module} LINK</Badge>
                             )}
                          </td>
                          <td className="p-6">
                             <Input 
                                type="number"
                                value={item.quantity} 
                                onChange={e => updateItem(index, 'quantity', parseFloat(e.target.value))}
                                className="bg-transparent border-2 border-white/5 font-black text-xl text-white text-center rounded-xl h-14"
                             />
                          </td>
                          <td className="p-6">
                             <Input 
                                type="number"
                                value={item.unit_price} 
                                onChange={e => updateItem(index, 'unit_price', parseFloat(e.target.value))}
                                className="bg-transparent border-2 border-white/5 font-black text-xl text-blue-400 text-right rounded-xl h-14 px-6"
                             />
                          </td>
                          <td className="p-6 text-right font-black text-2xl tracking-tighter">
                             {formData.currency} {item.amount.toLocaleString()}
                          </td>
                          <td className="p-6 text-center">
                             <Button onClick={() => removeItem(index)} variant="ghost" className="h-12 w-12 rounded-full hover:bg-red-500 hover:text-white text-red-400 p-0 transition-all">
                                <Trash2 className="w-5 h-5" />
                             </Button>
                          </td>
                       </tr>
                    ))
                 )}
              </tbody>
           </table>
        </CardContent>
      </Card>

      {/* 3. Financial Settlement Dashboard */}
      <div className="grid md:grid-cols-2 gap-10">
         <Card className="border-0 shadow-3xl rounded-[3.5rem] bg-white p-12 space-y-8">
            <div className="flex items-center gap-4 mb-4 border-b border-slate-100 pb-6">
               <ShieldCheck className="w-10 h-10 text-emerald-600" />
               <h3 className="text-xl font-black uppercase tracking-tight">Governance Terms</h3>
            </div>
            <div className="space-y-4">
               <Label className="text-[10px] font-black uppercase opacity-40">Payment Terms</Label>
               <Textarea value={formData.payment_terms} onChange={e => setFormData({...formData, payment_terms: e.target.value})} className="border-2 rounded-2xl p-6 font-bold bg-slate-50 min-h-[100px]" />
            </div>
            <div className="space-y-4">
               <Label className="text-[10px] font-black uppercase opacity-40">Bank {"&"} Settlement Details</Label>
               <Textarea value={formData.bank_details} onChange={e => setFormData({...formData, bank_details: e.target.value})} className="border-2 rounded-2xl p-6 font-bold bg-slate-50 min-h-[100px]" placeholder="SWIFT/IBAN Details..." />
            </div>
         </Card>

         <Card className="border-0 shadow-3xl rounded-[3.5rem] bg-slate-950 text-white p-16 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl" />
            
            <div className="space-y-6 relative z-10">
               <div className="flex justify-between items-center text-slate-400">
                  <span className="text-[10px] font-black uppercase tracking-widest">Cross-Module Subtotal</span>
                  <span className="font-bold text-xl">{formData.currency} {subtotal.toLocaleString()}</span>
               </div>
               <div className="flex justify-between items-center text-slate-400">
                  <div className="flex items-center gap-2">
                     <span className="text-[10px] font-black uppercase tracking-widest">Tanzania VAT</span>
                     <Input 
                        type="number" 
                        value={formData.tax_rate} 
                        onChange={e => setFormData({...formData, tax_rate: parseFloat(e.target.value)})} 
                        className="w-16 h-8 bg-white/5 border-0 rounded-lg text-xs font-black text-blue-400 text-center"
                     />
                     <span className="text-[10px] font-black italic">%</span>
                  </div>
                  <span className="font-bold text-xl">{formData.currency} {taxAmount.toLocaleString()}</span>
               </div>
               <div className="pt-8 border-t border-white/10 flex justify-between items-end">
                  <div>
                     <p className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-2">Grand Total Settlement</p>
                     <p className="text-6xl font-black tracking-tighter italic">{formData.currency} {totalAmount.toLocaleString()}</p>
                  </div>
                  <DollarSign className="w-16 h-16 text-blue-600 opacity-20" />
               </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full h-24 bg-blue-600 hover:bg-white hover:text-slate-950 rounded-[2.5rem] text-2xl font-black uppercase tracking-tighter transition-all mt-10 shadow-3xl shadow-blue-600/20 group">
               {loading ? <Loader2 className="w-8 h-8 animate-spin" /> : (
                  <>
                     Finalize Settlement Record
                     <ArrowRight className="w-8 h-8 ml-4 group-hover:translate-x-4 transition-transform" />
                  </>
               )}
            </Button>
         </Card>
      </div>
    </form>
  )
}
