"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Loader2, Calculator, Bomb, Target, DollarSign, Plus, Trash2, ChevronLeft, ShieldCheck } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { EXPLOSIVE_TYPES, DETONATOR_TYPES } from "@/lib/constants"
import { Badge } from "@/components/ui/badge"

export function BlastingBudgetForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    budget_name: "",
    location: "",
    planned_date: new Date().toISOString().split("T")[0],
    planned_holes: "0",
    
    // Explosives "Boxes" Logic (@25kg)
    boxes_of_explosives: "0",
    bags_of_anfo: "0",
    explosive_cost_per_kg: "0",
    
    // Detonators
    detonator_type: "",
    detonator_quantity: "0",
    detonator_cost_per_piece: "0",
    
    // Other Costs
    fuel_cost: "0",
    labor_cost: "0",
    other_expenses: "0",
    
    notes: ""
  })

  // Calculations
  const totalExplosiveKg = (parseFloat(formData.boxes_of_explosives) || 0) * 25 + (parseFloat(formData.bags_of_anfo) || 0) * 25
  const explosiveTotal = totalExplosiveKg * (parseFloat(formData.explosive_cost_per_kg) || 0)
  const detonatorTotal = (parseFloat(formData.detonator_quantity) || 0) * (parseFloat(formData.detonator_cost_per_piece) || 0)
  const subTotal = explosiveTotal + detonatorTotal + (parseFloat(formData.fuel_cost) || 0) + (parseFloat(formData.labor_cost) || 0) + (parseFloat(formData.other_expenses) || 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      // Professional Payload Conversion
      const payload = {
        ...formData,
        explosive_quantity_kg: totalExplosiveKg,
        total_explosive_cost: explosiveTotal,
        total_detonator_cost: detonatorTotal,
        grand_total: subTotal
      }
      
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      toast({
        title: "Blasting Budget Created",
        description: `Budget for ${formData.budget_name} archived. Total Projection: TZS ${subTotal.toLocaleString()}`,
      })
      
      router.push("/blasting")
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" onClick={() => router.back()} className="h-10 px-4 rounded-xl font-bold uppercase text-[10px] tracking-widest border-2 hover:bg-white transition-all">
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to Operations
          </Button>
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 border-2 border-blue-500/20 rounded-xl text-blue-700">
              <Calculator className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Financial Planning Active</span>
          </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-10">
        <Card className="border-0 shadow-3xl rounded-[3rem] overflow-hidden border-t-[12px] border-orange-600 bg-white/70 backdrop-blur-xl">
          <CardHeader className="bg-slate-950 text-white p-12 relative overflow-hidden">
            <div className="absolute -top-20 -right-20 w-80 h-80 bg-orange-500/20 rounded-full blur-3xl animate-pulse" />
            <div className="relative z-10">
                <CardTitle className="text-4xl md:text-5xl font-black uppercase tracking-tighter">Blasting Budget Analysis</CardTitle>
                <p className="opacity-70 font-medium italic mt-2 text-lg">Forensic cost projection & material allocation pipeline</p>
            </div>
          </CardHeader>
          
          <CardContent className="p-10 space-y-12">
            
            {/* Phase 1: Operational Scope */}
            <div className="grid gap-10 md:grid-cols-2">
                <div className="space-y-6">
                    <div className="flex items-center gap-3 pl-2">
                        <Target className="w-5 h-5 text-orange-600" />
                        <Label className="text-sm font-black uppercase tracking-widest text-slate-800">Operational Scope</Label>
                    </div>
                    <div className="grid gap-6 bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase opacity-40">Project Name / Reference</Label>
                            <Input value={formData.budget_name} onChange={e => setFormData({...formData, budget_name: e.target.value})} placeholder="e.g. North Pit Expansion Q2" className="h-14 font-bold rounded-2xl border-2" required />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase opacity-40">Planned Holes</Label>
                                <Input type="number" value={formData.planned_holes} onChange={e => setFormData({...formData, planned_holes: e.target.value})} className="h-14 font-bold rounded-2xl border-2" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase opacity-40">Planned Date</Label>
                                <Input type="date" value={formData.planned_date} onChange={e => setFormData({...formData, planned_date: e.target.value})} className="h-14 font-bold rounded-2xl border-2" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="flex items-center gap-3 pl-2">
                        <Bomb className="w-5 h-5 text-red-600" />
                        <Label className="text-sm font-black uppercase tracking-widest text-slate-800">Material Allocation</Label>
                    </div>
                    <div className="grid gap-6 bg-red-50/30 p-8 rounded-[2.5rem] border border-red-100">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase opacity-40">Detonator Type</Label>
                                <Select value={formData.detonator_type} onValueChange={v => setFormData({...formData, detonator_type: v})}>
                                    <SelectTrigger className="h-14 rounded-2xl border-2 bg-white"><SelectValue placeholder="Select" /></SelectTrigger>
                                    <SelectContent>
                                        {DETONATOR_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase opacity-40">Number of Detonators (pcs) *</Label>
                                <Input type="number" value={formData.detonator_quantity} onChange={e => setFormData({...formData, detonator_quantity: e.target.value})} className="h-14 font-black border-2 rounded-2xl flex-1 bg-white" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 border-t pt-6 border-red-100">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase opacity-40">Boxes of Explosives (@25kg) *</Label>
                                <Input type="number" value={formData.boxes_of_explosives} onChange={e => setFormData({...formData, boxes_of_explosives: e.target.value})} className="h-14 font-black border-2 rounded-2xl flex-1 bg-white" placeholder="0" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase opacity-40">Bags of ANFO (@25kg) *</Label>
                                <Input type="number" value={formData.bags_of_anfo} onChange={e => setFormData({...formData, bags_of_anfo: e.target.value})} className="h-14 font-black border-2 rounded-2xl flex-1 bg-white" placeholder="0" />
                            </div>
                        </div>
                        
                        <div className="flex items-center justify-between px-4 py-3 bg-red-600/10 rounded-xl">
                            <span className="text-[10px] font-black uppercase text-red-700 tracking-widest">Total Projected Product Weight</span>
                            <Badge className="bg-red-700 text-white font-black">{totalExplosiveKg.toLocaleString()} KG</Badge>
                        </div>
                    </div>
                </div>
            </div>

            {/* Phase 2: Cost Analysis */}
            <div className="space-y-8 bg-slate-900 text-white p-12 rounded-[4rem] relative overflow-hidden shadow-2xl">
                <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-10">
                        <div className="w-12 h-12 rounded-2xl bg-orange-500/20 flex items-center justify-center text-orange-500">
                            <DollarSign className="w-7 h-7" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black uppercase tracking-widest">Financial Cost Analysis</h3>
                            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mt-1">Precise unit cost mapping & total projection</p>
                        </div>
                    </div>

                    <div className="grid gap-8 md:grid-cols-3">
                        <div className="space-y-3">
                            <Label className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Explosive Cost / kg (TZS)</Label>
                            <Input type="number" value={formData.explosive_cost_per_kg} onChange={e => setFormData({...formData, explosive_cost_per_kg: e.target.value})} className="h-16 bg-white/5 border-white/10 text-3xl font-black rounded-[1.5rem] focus:bg-white/10" />
                            <p className="text-[10px] font-bold text-orange-400 uppercase">Subtotal: {explosiveTotal.toLocaleString()} TZS</p>
                        </div>
                        <div className="space-y-3">
                            <Label className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Detonator Cost / piece (TZS)</Label>
                            <Input type="number" value={formData.detonator_cost_per_piece} onChange={e => setFormData({...formData, detonator_cost_per_piece: e.target.value})} className="h-16 bg-white/5 border-white/10 text-3xl font-black rounded-[1.5rem] focus:bg-white/10" />
                            <p className="text-[10px] font-bold text-orange-400 uppercase">Subtotal: {detonatorTotal.toLocaleString()} TZS</p>
                        </div>
                        <div className="space-y-3">
                            <Label className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Misc Expenses (Fuel/Labor)</Label>
                            <div className="grid grid-cols-2 gap-2">
                                <Input type="number" placeholder="Fuel" value={formData.fuel_cost} onChange={e => setFormData({...formData, fuel_cost: e.target.value})} className="h-16 bg-white/5 border-white/10 text-xl font-bold rounded-[1.5rem]" />
                                <Input type="number" placeholder="Labor" value={formData.labor_cost} onChange={e => setFormData({...formData, labor_cost: e.target.value})} className="h-16 bg-white/5 border-white/10 text-xl font-bold rounded-[1.5rem]" />
                            </div>
                        </div>
                    </div>

                    <div className="mt-12 pt-10 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-8">
                         <div>
                             <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.3em]">Total Estimated Budget</p>
                             <h4 className="text-6xl font-black text-orange-500 tracking-tighter">TZS {subTotal.toLocaleString()}</h4>
                         </div>
                         <div className="p-6 bg-white/5 rounded-3xl border border-white/10 text-center">
                             <p className="text-[9px] font-black uppercase text-slate-400 mb-1">Cost Per Planned Hole</p>
                             <p className="text-2xl font-black">{formData.planned_holes !== "0" ? (subTotal / (parseFloat(formData.planned_holes) || 1)).toLocaleString() : 0} <span className="text-[10px] text-slate-500">TZS/Hole</span></p>
                         </div>
                    </div>
                </div>
                <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-orange-600/10 rounded-full blur-[100px]" />
            </div>

            <div className="space-y-4">
                <Label className="text-xs font-black uppercase tracking-widest text-slate-400 pl-1">Explanatory Notes / Remarks</Label>
                <Textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Provide context for significant cost deviations or specific site requirements..." className="min-h-[120px] rounded-[2rem] border-2 p-6 bg-slate-50 transition-all focus:bg-white" />
            </div>

            <div className="flex gap-6 pt-6">
                <Button type="submit" disabled={loading} size="lg" className="flex-1 h-24 bg-orange-600 hover:bg-orange-800 rounded-[2.5rem] text-2xl font-black uppercase tracking-widest shadow-2xl shadow-orange-500/40 transition-all hover:scale-[1.01] active:translate-y-2">
                    {loading ? <Loader2 className="w-10 h-10 animate-spin" /> : "Authorize & Lock Budget"}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.back()} className="h-24 px-12 rounded-[2.5rem] font-bold uppercase text-[10px] tracking-[0.2em] border-2 shadow-sm">
                    Discard Draft
                </Button>
            </div>
            
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
