"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Package, Ruler, Hash, BarChart3, AlertCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

const drillCategories = [
  { id: "bits", name: "Drill Bits & Cutters" },
  { id: "rods", name: "Drill Rods & Pipes" },
  { id: "fluids", name: "Drilling Fluids & Additives" },
  { id: "spares", name: "Rig Spare Parts" },
  { id: "consumables", name: "General Consumables" }
]

export function DrillingInventoryForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    item_code: "",
    item_name: "",
    category: "DRILLING",
    sub_category: "bits",
    current_stock: "",
    minimum_stock: "5",
    unit: "pcs",
    cost_per_unit: "",
    supplier: "",
    location: "Central Warehouse"
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const supabase = getSupabaseBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()

      const { error } = await supabase.from("inventory_items").insert({
        ...formData,
        current_stock: Number.parseFloat(formData.current_stock) || 0,
        minimum_stock: Number.parseFloat(formData.minimum_stock) || 0,
        cost_per_unit: Number.parseFloat(formData.cost_per_unit) || 0,
        company_id: user?.id, // Note: RLS will normally handle this, but explicit is better if schema requires
      })

      if (error) throw error

      toast({
        title: "Asset Indexed",
        description: `${formData.item_name} has been synchronized with the drilling ledger.`
      })

      router.push("/drilling/inventory")
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-0 shadow-3xl rounded-[2.5rem] overflow-hidden">
      <CardHeader className="bg-slate-900 text-white p-8 relative">
        <div className="flex justify-between items-center relative z-10">
            <div>
                <CardTitle className="text-2xl font-black uppercase tracking-tight">Drilling Asset Registry</CardTitle>
                <p className="opacity-70 font-semibold italic">Standardizing consumables and tooling lifecycle</p>
            </div>
            <Package className="w-12 h-12 opacity-20" />
        </div>
      </CardHeader>
      <CardContent className="p-8 bg-slate-50/30">
        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <Alert variant="destructive" className="rounded-xl border-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 pl-1">Product Identity</Label>
                <div className="grid gap-4 bg-white p-6 rounded-2xl border-2 border-slate-100 shadow-sm">
                   <div className="space-y-2">
                     <Label htmlFor="item_code">Asset SKU / Serial</Label>
                     <Input id="item_code" value={formData.item_code} onChange={e => setFormData({...formData, item_code: e.target.value})} placeholder="e.g. BIT-6IN-001" className="h-12 border-2 rounded-xl font-mono uppercase font-bold" required />
                   </div>
                   <div className="space-y-2">
                     <Label htmlFor="item_name">Designation Name</Label>
                     <Input id="item_name" value={formData.item_name} onChange={e => setFormData({...formData, item_name: e.target.value})} placeholder="Tricone Bit 6.5\" className="h-12 border-2 rounded-xl font-bold" required />
                   </div>
                   <div className="space-y-2">
                     <Label>Category Segment</Label>
                     <Select value={formData.sub_category} onValueChange={v => setFormData({...formData, sub_category: v})}>
                        <SelectTrigger className="h-12 border-2 rounded-xl bg-white shadow-none">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                            {drillCategories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                        </SelectContent>
                     </Select>
                   </div>
                </div>
            </div>

            <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 pl-1">Inventory Metrics</Label>
                <div className="grid gap-4 bg-white p-6 rounded-2xl border-2 border-slate-100 shadow-sm">
                   <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="current_stock">Available Qty</Label>
                            <Input id="current_stock" type="number" value={formData.current_stock} onChange={e => setFormData({...formData, current_stock: e.target.value})} placeholder="0" className="h-12 border-2 rounded-xl font-black text-xl text-blue-600" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="minimum_stock">Low Threshold</Label>
                            <Input id="minimum_stock" type="number" value={formData.minimum_stock} onChange={e => setFormData({...formData, minimum_stock: e.target.value})} placeholder="5" className="h-12 border-2 rounded-xl font-bold text-red-500 bg-red-50/30" />
                        </div>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="unit">Unit of Measure</Label>
                            <Input id="unit" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} placeholder="PCS / Liters" className="h-12 border-2 rounded-xl" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="cost_per_unit">Unit Cost (TZS)</Label>
                            <Input id="cost_per_unit" type="number" value={formData.cost_per_unit} onChange={e => setFormData({...formData, cost_per_unit: e.target.value})} placeholder="0.00" className="h-12 border-2 rounded-xl font-bold" />
                        </div>
                   </div>
                   <div className="space-y-2">
                     <Label htmlFor="location">Warehouse Location</Label>
                     <Input id="location" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="h-12 border-2 rounded-xl" />
                   </div>
                </div>
            </div>
          </div>

          <div className="flex gap-4 pt-6 border-t-2 border-slate-100/60">
            <Button type="submit" disabled={loading} size="lg" className="flex-1 bg-slate-900 hover:bg-black h-16 rounded-2xl text-lg font-black uppercase tracking-widest shadow-2xl transition-all">
              {loading ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : "Commit to Drilling Ledger"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()} className="h-16 px-12 rounded-2xl font-bold uppercase text-xs tracking-widest border-2">
              Discard
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
