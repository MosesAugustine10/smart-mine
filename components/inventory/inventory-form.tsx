"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Package, QrCode, ShieldCheck, Warehouse, DollarSign, Calculator, AlertCircle, BarChart3, Clock, Box } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface InventoryFormProps {
  category?: string
}

export function InventoryForm({ category }: InventoryFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    item_name: "",
    category: category || "explosives", // explosives, fuel, drilling, mechanical
    unit: "kg",
    current_stock: 0,
    minimum_stock_level: 0,
    lead_time: 7, // days
    reorder_point: 0,
    unit_cost: 0,

    // OUTPUTS
    stock_status: "OPTIMAL",
    reorder_alert: false,
    total_asset_value: 0
  })

  // Auto-calculate outputs
  useEffect(() => {
    const isLow = formData.current_stock <= formData.minimum_stock_level
    const status = isLow ? "CRITICAL" : (formData.current_stock <= (formData.minimum_stock_level * 1.5) ? "LOW" : "OPTIMAL")
    const totalValue = formData.current_stock * formData.unit_cost
    const alert = formData.current_stock <= formData.reorder_point

    setFormData(prev => ({
      ...prev,
      stock_status: status,
      reorder_alert: alert,
      total_asset_value: Number(totalValue.toFixed(2))
    }))
  }, [formData.current_stock, formData.minimum_stock_level, formData.reorder_point, formData.unit_cost])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = getSupabaseBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()

      const payload = {
        ...formData,
        company_id: user?.id,
        created_by: user?.id
      }

      const { error } = await supabase.from("inventory_items").insert(payload)
      if (error) throw error

      toast({ title: "ASSET REGISTERED", description: "Item added to Main Records." })
      router.push("/inventory")
      router.refresh()
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 pb-24">
      <Card className="border-0 shadow-2xl rounded-[3rem] overflow-hidden border-t-8 border-t-blue-600">
        <CardHeader className="bg-slate-900 text-white p-10">
          <CardTitle className="text-3xl font-black uppercase tracking-tighter italic">✦ INVENTORY HUB ✦ (ITEM List) ✦</CardTitle>
        </CardHeader>
        
        <CardContent className="p-10 bg-slate-50/50">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            
            {/* ITEM IDENTITY */}
            <div className="space-y-6 col-span-full">
              <div className="flex items-center gap-2 mb-2">
                <Box className="w-5 h-5 text-blue-600" />
                <h3 className="font-black text-xs uppercase tracking-widest text-slate-500">Item Identity</h3>
              </div>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2 col-span-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">item name</Label>
                  <Input value={formData.item_name} onChange={e => setFormData({...formData, item_name: e.target.value})} className="h-12 border-2 rounded-xl font-bold" placeholder="Master SKU Designation" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">category</Label>
                  <Select value={formData.category} onValueChange={v => setFormData({...formData, category: v})}>
                    <SelectTrigger className="h-12 border-2 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="explosives">Explosives / Detonators</SelectItem>
                      <SelectItem value="fuel">Fuel / Hydrocarbons</SelectItem>
                      <SelectItem value="drilling">Drilling Consumables</SelectItem>
                      <SelectItem value="mechanical">Mechanical Spares</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">unit</Label>
                  <Input value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} className="h-12 border-2 rounded-xl font-bold uppercase" placeholder="kg, L, pcs" />
                </div>
              </div>
            </div>

            {/* STOCK METRICS */}
            <div className="space-y-6 col-span-2">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                <h3 className="font-black text-xs uppercase tracking-widest text-slate-500">Stock Metrics</h3>
              </div>
              <div className="grid gap-4 md:grid-cols-3 bg-white p-8 rounded-[2rem] border-2 border-slate-100 shadow-sm">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">current stock</Label>
                  <Input type="number" value={formData.current_stock} onChange={e => setFormData({...formData, current_stock: parseFloat(e.target.value) || 0})} className="h-12 border-2 rounded-xl font-black text-blue-600" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">minimum stock level</Label>
                  <Input type="number" value={formData.minimum_stock_level} onChange={e => setFormData({...formData, minimum_stock_level: parseFloat(e.target.value) || 0})} className="h-12 border-2 rounded-xl font-bold" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">reorder point</Label>
                  <Input type="number" value={formData.reorder_point} onChange={e => setFormData({...formData, reorder_point: parseFloat(e.target.value) || 0})} className="h-12 border-2 rounded-xl font-bold text-orange-600 shadow-inner" />
                </div>
              </div>
            </div>

            {/* SUPPLY CHAIN */}
            <div className="space-y-6">
               <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-slate-400" />
                <h3 className="font-black text-xs uppercase tracking-widest text-slate-500">Supply Chain</h3>
              </div>
              <div className="bg-white p-8 rounded-[2rem] border-2 border-slate-100 shadow-sm space-y-4">
                 <div className="flex justify-between items-center">
                    <Label className="text-[10px] font-black uppercase opacity-60">lead time (days)</Label>
                    <Input type="number" value={formData.lead_time} onChange={e => setFormData({...formData, lead_time: parseInt(e.target.value) || 0})} className="w-16 h-10 border-2 rounded-lg text-right font-black" />
                 </div>
                 <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase opacity-60">unit cost (TZS)</Label>
                    <Input type="number" value={formData.unit_cost} onChange={e => setFormData({...formData, unit_cost: parseFloat(e.target.value) || 0})} className="h-10 border-2 rounded-lg font-black text-emerald-600" />
                 </div>
              </div>
            </div>

            {/* OUTPUTS */}
            <div className="col-span-full bg-blue-950 rounded-[3rem] p-12 text-white relative overflow-hidden ring-4 ring-blue-500/20">
               <div className="relative z-10 grid gap-12 md:grid-cols-3">
                  <div className="text-center text-white">
                     <p className="text-[10px] font-black uppercase tracking-tight opacity-40 mb-3 text-white">stock status</p>
                     <p className={`text-5xl font-black ${formData.stock_status === 'CRITICAL' ? 'text-red-500 animate-pulse' : (formData.stock_status === 'LOW' ? 'text-amber-500' : 'text-emerald-400')}`}>{formData.stock_status}</p>
                     <p className="text-[11px] font-bold opacity-30 uppercase mt-2">Health Indicator</p>
                  </div>
                  <div className="text-center">
                     <p className="text-[10px] font-black uppercase tracking-tight opacity-40 mb-3">reorder alert</p>
                     <div className="flex flex-col items-center">
                        <div className={`p-4 rounded-full ${formData.reorder_alert ? 'bg-red-500 animate-bounce' : 'bg-white/10'}`}>
                           <AlertCircle className={`w-12 h-12 ${formData.reorder_alert ? 'text-white' : 'opacity-20'}`} />
                        </div>
                        <p className="text-[11px] font-black opacity-30 uppercase mt-3">{formData.reorder_alert ? 'THRESHOLD BREACHED' : 'NOMINAL LEVEL'}</p>
                     </div>
                  </div>
                  <div className="text-center">
                     <p className="text-[10px] font-black uppercase tracking-tight opacity-40 mb-3">total asset value</p>
                     <p className="text-5xl font-black text-emerald-400">TZS {formData.total_asset_value.toLocaleString()}</p>
                     <p className="text-[11px] font-bold opacity-30 uppercase mt-2">Portfolio Valuation</p>
                  </div>
               </div>
               <Calculator className="absolute -bottom-20 -left-20 w-80 h-80 opacity-[0.03] text-white pointer-events-none -z-10" />
            </div>

            {/* ACTION BUTTONS */}
            <div className="col-span-full flex gap-4 pt-8">
               <Button type="submit" disabled={loading} className="flex-1 h-20 bg-blue-600 hover:bg-blue-700 rounded-3xl text-xl font-black uppercase tracking-widest shadow-2xl shadow-blue-500/20 transition-all active:scale-95">
                  {loading ? <Loader2 className="w-8 h-8 animate-spin" /> : "Commit Asset to Main List"}
               </Button>
               <Button type="button" variant="outline" onClick={() => router.back()} className="h-20 px-12 rounded-3xl font-bold uppercase tracking-widest border-2 hover:bg-slate-100 text-slate-800">
                  Discard
               </Button>
            </div>

          </div>
        </CardContent>
      </Card>
    </form>
  )
}
