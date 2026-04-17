"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Package, Archive, DollarSign, Calculator, MapPin, AlertTriangle, ShieldCheck } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { SparePart } from "@/lib/types"

interface SparePartFormProps {
  part?: SparePart
  nextPartNumber?: string
}

const categories = [
  "tire",
  "filter",
  "engine_oil",
  "hydraulic",
  "electrical",
  "brake",
  "transmission",
  "other"
]

export function SparePartForm({ part, nextPartNumber }: SparePartFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    item_code: part?.item_code || nextPartNumber || "",
    name: part?.name || "",
    category: part?.category || "other",
    manufacturer: part?.manufacturer || "",
    compatible_vehicle_models: part?.compatible_vehicle_models?.join(", ") || "",
    current_stock: part?.current_stock?.toString() || "0",
    minimum_stock: part?.minimum_stock?.toString() || "5",
    unit_cost: part?.unit_cost?.toString() || "0",
    location: part?.location || "",
    notes: part?.notes || "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = getSupabaseBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()

      const vehicles = formData.compatible_vehicle_models
        ? formData.compatible_vehicle_models.split(',').map(v => v.trim())
        : []

      const partData = {
        company_id: user?.id,
        item_code: formData.item_code,
        name: formData.name,
        category: formData.category,
        manufacturer: formData.manufacturer || null,
        compatible_vehicle_models: vehicles,
        current_stock: parseInt(formData.current_stock) || 0,
        minimum_stock: parseInt(formData.minimum_stock) || 5,
        unit_cost: parseFloat(formData.unit_cost) || 0,
        location: formData.location || null,
        notes: formData.notes || null,
      }

      if (part) {
        const { error } = await supabase.from("spare_parts").update(partData).eq("id", part.id)
        if (error) throw error
        toast({ title: "Inventory Refined", description: "Strategic part parameters have been recalibrated." })
      } else {
        const { error } = await supabase.from("spare_parts").insert(partData)
        if (error) throw error
        toast({ title: "Component Ingested", description: "New technical part has been indexed into the corporate List." })
      }

      router.push("/fleet/inventory")
      router.refresh()
    } catch (err: any) {
      toast({ title: "Archival Failure", description: err.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const isLowStock = parseInt(formData.current_stock) < parseInt(formData.minimum_stock)
  const totalStockValue = (parseInt(formData.current_stock) || 0) * (parseFloat(formData.unit_cost) || 0)

  return (
    <form onSubmit={handleSubmit} className="space-y-10 pb-20">
      <Card className="border-0 shadow-3xl rounded-[3.5rem] overflow-hidden border-t-8 border-t-blue-600">
        <CardHeader className="bg-slate-950 text-white p-12 relative">
          <div className="flex justify-between items-center relative z-10">
            <div>
              <CardTitle className="text-4xl font-black uppercase tracking-tighter">
                {part ? "Component Calibration" : "Inventory Ingestion"}
              </CardTitle>
              <p className="opacity-70 font-semibold mt-1 italic text-blue-200">
                Main Technical Parts List {"&"} Asset Compatibility
              </p>
            </div>
            <Package className="w-20 h-20 opacity-10 animate-pulse text-blue-500" />
          </div>
        </CardHeader>

        <CardContent className="p-12 bg-slate-50/30">
          <div className="space-y-12">
            
            {/* Section 1: Product Definition */}
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-8 w-1 bg-blue-600 rounded-full" />
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">1. Detailed SKU Identification</h3>
              </div>
              <div className="grid md:grid-cols-2 gap-8 ring-1 ring-slate-100 p-1 bg-white/50 rounded-[2.5rem]">
                <div className="p-8 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase opacity-40">Part Serial / SKU Number *</Label>
                    <Input 
                      value={formData.item_code} 
                      onChange={e => setFormData({...formData, item_code: e.target.value})} 
                      className="h-14 border-2 rounded-2xl font-black text-xl font-mono text-blue-600" 
                      placeholder="SKU-XXXX-ALPHA" 
                      required 
                      disabled={!!part} // Don't change SKU after creation
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase opacity-40">Component Designation *</Label>
                    <Input 
                      value={formData.name} 
                      onChange={e => setFormData({...formData, name: e.target.value})} 
                      className="h-14 border-2 rounded-2xl font-black uppercase tracking-tight" 
                      placeholder="E.g., Engine Oil Filter - X1" 
                      required 
                    />
                  </div>
                </div>
                <div className="p-8 space-y-4 bg-slate-900 border-l-4 border-blue-600 rounded-r-[2rem] text-white">
                   <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase opacity-40 text-blue-400">Technical Category *</Label>
                      <Select value={formData.category} onValueChange={v => setFormData({...formData, category: v})} required>
                        <SelectTrigger className="h-14 border-2 border-white/10 bg-white/5 text-white rounded-2xl font-black uppercase tracking-widest text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat.replace(/_/g, ' ').toUpperCase()}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                   </div>
                   <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase opacity-40 text-blue-400">Manufacturer</Label>
                      <Input value={formData.manufacturer} onChange={e => setFormData({...formData, manufacturer: e.target.value})} className="h-14 border-2 border-white/10 bg-white/5 text-white rounded-2xl font-bold" placeholder="E.g., Bosch, CAT" />
                   </div>
                </div>
              </div>
            </div>

            {/* Section 2: Compatibility {"&"} Storage */}
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-8 w-1 bg-emerald-500 rounded-full" />
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">2. Deployment Compatibility {"&"} Storage</h3>
              </div>
              <div className="bg-white p-10 rounded-[3rem] border-2 border-slate-100 shadow-sm space-y-8">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase opacity-40">Compatible Vehicle Models (Comma Separated)</Label>
                  <Input value={formData.compatible_vehicle_models} onChange={e => setFormData({...formData, compatible_vehicle_models: e.target.value})} className="h-14 border-2 rounded-2xl font-bold italic" placeholder="777D, 793F, D10T" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase opacity-40">Primary Storage Coordinate</Label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="h-14 pl-12 border-2 rounded-2xl font-bold" placeholder="E.g., Warehouse A, Shelf B-4" />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Stock Governance */}
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-8 w-1 bg-amber-500 rounded-full" />
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">3. Stock Governance {"&"} Fiscal Impact</h3>
              </div>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-white p-10 rounded-[3rem] border-2 border-slate-100 shadow-sm space-y-8">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase opacity-40">Available Stock *</Label>
                        <Input type="number" value={formData.current_stock} onChange={e => setFormData({...formData, current_stock: e.target.value})} className={`h-14 border-2 rounded-2xl font-black text-2xl ${isLowStock ? 'text-red-600 border-red-100' : 'text-slate-900'}`} required />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase opacity-40 text-amber-600">Minimum Level *</Label>
                        <Input type="number" value={formData.minimum_stock} onChange={e => setFormData({...formData, minimum_stock: e.target.value})} className="h-14 border-2 rounded-2xl font-black text-2xl text-amber-600" required />
                      </div>
                    </div>
                    {isLowStock && (
                      <div className="flex items-center gap-3 p-4 bg-red-50 text-red-700 rounded-2xl border-2 border-red-100 text-xs font-black uppercase animate-pulse">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                        Critical Stock Threshold Breach
                      </div>
                    )}
                </div>
                <div className="bg-slate-900 p-10 rounded-[3rem] text-white flex flex-col justify-center space-y-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase opacity-40 text-blue-400">Unit Procurement Cost (TZS)</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                        <Input type="number" value={formData.unit_cost} onChange={e => setFormData({...formData, unit_cost: e.target.value})} className="h-16 pl-12 bg-white/5 border-2 border-white/10 rounded-3xl font-black text-2xl text-white" placeholder="0.00" />
                      </div>
                    </div>
                    <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-black uppercase opacity-40 tracking-widest">Inventory Fiscal Quantum</p>
                          <p className="text-3xl font-black tracking-tighter text-emerald-500">TZS {totalStockValue.toLocaleString()}</p>
                        </div>
                        <Calculator className="w-10 h-10 opacity-20" />
                    </div>
                </div>
              </div>
            </div>

            {/* Section 4: Qualitative Observations */}
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase opacity-40">Administrative Notes {"&"} Quality Controls</Label>
              <Textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="min-h-[120px] border-2 rounded-3xl p-6 font-semibold" placeholder="Detail part condition, certification standards, or batch restrictions..." />
            </div>

            <div className="flex gap-6 pt-10 border-t-4 border-slate-100">
              <Button type="submit" disabled={loading} className="flex-1 h-24 bg-blue-600 hover:bg-blue-700 text-white rounded-[2.5rem] text-2xl font-black uppercase tracking-tighter shadow-3xl shadow-blue-500/20 transition-all">
                {loading ? <Loader2 className="w-10 h-10 animate-spin" /> : (part ? "Update Process" : "Authorize Ingestion")}
              </Button>
            </div>

          </div>
        </CardContent>
      </Card>
    </form>
  )
}
