"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { ProfessionalSignature } from "@/components/professional-signature"
import { RegionSelect } from "@/components/ui/region-select"
import { 
  Target, Calculator, DollarSign, ShieldCheck, 
  Loader2, Ruler, Bomb, MapPin, Calendar, CheckCircle2, XCircle
} from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"

interface BlastingDesignFormProps {
  initialData?: any
  blastNumber?: string
}

export function BlastingDesignForm({ initialData, blastNumber }: BlastingDesignFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [userRole, setUserRole] = useState<string>("engineer")
  const [userId, setUserId] = useState<string>("")
  
  const [formData, setFormData] = useState({
    blast_number: initialData?.blast_number || blastNumber || `BLST-${Date.now().toString().slice(-4)}`,
    location: initialData?.location || "",
    region: initialData?.region || "",
    planned_date: initialData?.planned_date || new Date().toISOString().split('T')[0],
    planned_holes: initialData?.planned_holes || 0,
    burden: initialData?.burden || 0,
    spacing: initialData?.spacing || 0,
    hole_depth: initialData?.hole_depth || 0,
    bench_height: initialData?.bench_height || 0,
    explosive_type: initialData?.explosive_type || "ANFO", 
    planned_charge_per_hole: initialData?.planned_charge_per_hole || 0,
    estimated_explosive_weight: initialData?.estimated_explosive_weight || 0,
    
    // FISCAL ALLOCATION (Merged from Budget Form)
    boxes_of_explosives: initialData?.boxes_of_explosives || 0,
    bags_of_anfo: initialData?.bags_of_anfo || 0,
    detonator_quantity: initialData?.detonator_quantity || 0,
    explosive_cost_per_kg: initialData?.explosive_cost_per_kg || 0,
    drilling_cost_per_m: initialData?.drilling_cost_per_m || 0,
    labor: initialData?.labor || 0,
    initiation_cost: initialData?.initiation_cost || 0,
    accessories_cost: initialData?.accessories_cost || 0,
    fuel_cost: initialData?.fuel_cost || 0,

    // OUTPUTS
    estimated_tonnage: initialData?.estimated_tonnage || 0,
    estimated_cost: initialData?.estimated_cost || 0,
    estimated_cost_per_tonne: initialData?.estimated_cost_per_tonne || 0,
    planned_powder_factor: initialData?.planned_powder_factor || 0,

    // APPROVAL TRACKING
    status: initialData?.status || "pending",
    approval_comments: initialData?.approval_comments || "",
    approved_by_name: initialData?.approved_by_name || "",
    approval_date: initialData?.approval_date || "",
    created_by: initialData?.created_by || ""
  })

  useEffect(() => {
    async function fetchUserRole() {
      const supabase = getSupabaseBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        const { data: profile } = await supabase.from("user_profiles").select("role, first_name, last_name").eq("id", user.id).single()
        if (profile) {
           setUserRole(profile.role)
           if (!initialData) {
             setFormData(prev => ({ ...prev, created_by: `${profile.first_name} ${profile.last_name}` }))
           }
        }
      }
    }
    fetchUserRole()
  }, [])

  // Auto-calculate outputs
  useEffect(() => {
    const tonnage = formData.planned_holes * formData.burden * formData.spacing * formData.bench_height * 2.65
    
    // Weight calculation from Boxes/Bags
    const weightFromBoxes = (formData.boxes_of_explosives * 25) + (formData.bags_of_anfo * 25)
    // Or from charge per hole
    const weightFromHoles = formData.planned_holes * formData.planned_charge_per_hole
    
    const totalExplosive = weightFromBoxes > 0 ? weightFromBoxes : weightFromHoles
    
    const expCost = totalExplosive * formData.explosive_cost_per_kg
    const drillCost = (formData.planned_holes * formData.hole_depth) * formData.drilling_cost_per_m
    const totalCost = expCost + drillCost + formData.labor + formData.initiation_cost + formData.accessories_cost + formData.fuel_cost
    
    const pf = tonnage > 0 ? totalExplosive / tonnage : 0
    const costPerTonne = tonnage > 0 ? totalCost / tonnage : 0

    setFormData(prev => ({
      ...prev,
      estimated_tonnage: Number(tonnage.toFixed(2)),
      estimated_explosive_weight: Number(totalExplosive.toFixed(2)),
      estimated_cost: Number(totalCost.toFixed(2)),
      estimated_cost_per_tonne: Number(costPerTonne.toFixed(2)),
      planned_powder_factor: Number(pf.toFixed(3))
    }))
  }, [
    formData.planned_holes, formData.burden, formData.spacing, formData.hole_depth, formData.bench_height, 
    formData.planned_charge_per_hole, formData.explosive_cost_per_kg, formData.drilling_cost_per_m,
    formData.labor, formData.initiation_cost, formData.accessories_cost, formData.fuel_cost,
    formData.boxes_of_explosives, formData.bags_of_anfo
  ])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setLoading(true)
    try {
      const supabase = getSupabaseBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      const payload = {
        ...formData,
        company_id: user?.id,
        current_phase: "design"
      }

      const { error } = initialData?.id 
        ? await supabase.from("blasting_operations").update(payload).eq("id", initialData.id)
        : await supabase.from("blasting_operations").insert(payload)

      if (error) throw error

      toast({ title: "PLANNING COMPLETE", description: "Blasting budget and design has been successfully archived." })
      router.push("/blasting")
      router.refresh()
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleApprovalAction = async (newStatus: "approved" | "rejected") => {
     setLoading(true)
     try {
       const supabase = getSupabaseBrowserClient()
       const { data: profile } = await supabase.from("user_profiles").select("first_name, last_name").eq("id", userId).single()
       
       const approverName = profile ? `${profile.first_name} ${profile.last_name}` : "System Admin"
       const dateNow = new Date().toISOString()

       const { error } = await supabase.from("blasting_operations").update({
          status: newStatus,
          approved_by_name: approverName,
          approval_date: dateNow,
          approval_comments: formData.approval_comments,
          approved_by: userId
       }).eq("id", initialData.id)

       if (error) throw error

       setFormData(prev => ({
         ...prev,
         status: newStatus,
         approved_by_name: approverName,
         approval_date: dateNow
       }))

       toast({ title: `Budget ${newStatus.toUpperCase()}`, description: `The blasting design has been ${newStatus}.` })
       router.refresh()
     } catch (err: any) {
       toast({ title: "Approval Error", description: err.message, variant: "destructive" })
     } finally {
       setLoading(false)
     }
  }

  const isApprover = ["supervisor", "company_admin", "super_admin", "manager"].includes(userRole)

  return (
    <div className="space-y-8 pb-20">
      
      {/* APPROVAL WORKFLOW BANNER (If evaluating existing record) */}
      {initialData && (
        <Card className={`border-2 ${formData.status === 'approved' ? 'border-emerald-500 bg-emerald-50/50' : formData.status === 'rejected' ? 'border-red-500 bg-red-50/50' : 'border-amber-500 bg-amber-50/50'} shadow-sm`}>
           <CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                 <div className="flex items-center gap-3">
                    <ShieldCheck className={`w-6 h-6 ${formData.status === 'approved' ? 'text-emerald-600' : formData.status === 'rejected' ? 'text-red-600' : 'text-amber-600'}`} />
                    <h3 className="text-xl font-black uppercase tracking-tight text-slate-800">Fiscal Clearance {"&"} Approval</h3>
                 </div>
                 <div className="flex flex-col gap-1 text-[11px] font-bold uppercase tracking-widest opacity-60">
                    <p>Financial Officer: {formData.created_by || "System Data"}</p>
                    <p>Verified By: {formData.approved_by_name || "Pending Review"}</p>
                    {formData.approval_date && <p>Date: {new Date(formData.approval_date).toLocaleString()}</p>}
                 </div>
              </div>

              <div className="flex flex-col items-end gap-3 min-w-[250px]">
                 <div className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest text-white ${formData.status === 'approved' ? 'bg-emerald-500' : formData.status === 'rejected' ? 'bg-red-500' : 'bg-amber-500 animate-pulse'}`}>
                    STATUS: {formData.status}
                 </div>
                 
                 {isApprover && formData.status === "pending" && (
                    <div className="w-full space-y-2">
                       <Input 
                         value={formData.approval_comments} 
                         onChange={e => setFormData({...formData, approval_comments: e.target.value})} 
                         placeholder="Optional authorization notes..." 
                         className="h-8 text-[11px] bg-white border-2" 
                       />
                       <div className="flex gap-2 w-full">
                          <Button onClick={() => handleApprovalAction("approved")} disabled={loading} className="flex-1 h-9 bg-emerald-600 hover:bg-emerald-700 text-[10px] font-black uppercase tracking-widest rounded-lg">
                             <CheckCircle2 className="w-3 h-3 mr-1" /> Approve
                          </Button>
                          <Button onClick={() => handleApprovalAction("rejected")} disabled={loading} className="flex-1 h-9 bg-red-600 hover:bg-red-700 text-[10px] font-black uppercase tracking-widest rounded-lg">
                             <XCircle className="w-3 h-3 mr-1" /> Reject
                          </Button>
                       </div>
                    </div>
                 )}
                 {formData.approval_comments && formData.status !== "pending" && (
                    <p className="text-[10px] font-semibold italic opacity-70">Comments: {formData.approval_comments}</p>
                 )}
              </div>
           </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit}>
        <Card className="border-0 shadow-2xl rounded-[3rem] overflow-hidden border-t-8 border-t-orange-600">
          <CardHeader className="bg-slate-900 text-white p-10">
            <CardTitle className="text-4xl font-black uppercase tracking-tighter italic">✦ PART 1: BLASTING BUDGET {"&"} DESIGN FORM ✦</CardTitle>
            <CardDescription className="text-slate-400 font-bold">Configure Technical Strategy {"&"} Budget Approval (Uidhinishaji wa Bajeti)</CardDescription>
          </CardHeader>
          
          <CardContent className="p-10 bg-slate-50/50 space-y-12">
            <div className="grid gap-12 lg:grid-cols-2">
              
              {/* TECHNICAL DESIGN SECTION */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-2 border-b-2 border-slate-200 pb-2">
                  <Ruler className="w-5 h-5 text-orange-600" />
                  <h3 className="font-black text-xs uppercase tracking-widest text-slate-800">1. Technical Pattern Design</h3>
                </div>
                
                <div className="grid gap-6 bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-sm">
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Blast ID</Label>
                        <Input value={formData.blast_number} disabled className="h-12 border-2 rounded-xl font-black bg-slate-50" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Scheduled Date</Label>
                        <Input type="date" value={formData.planned_date} onChange={e => setFormData({...formData, planned_date: e.target.value})} className="h-12 border-2 rounded-xl font-bold" />
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Region / Mkoa</Label>
                        <Input value={formData.region} onChange={e => setFormData({...formData, region: e.target.value})} className="h-12 border-2 rounded-xl" placeholder="e.g. Tanga" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Location / Site</Label>
                        <Input value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="h-12 border-2 rounded-xl" placeholder="Pit B, Bench 4" />
                      </div>
                   </div>

                   <div className="grid grid-cols-3 gap-4 border-t pt-6 mt-2">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 text-blue-600">Burden (m)</Label>
                        <Input type="number" step="0.1" value={formData.burden} onChange={e => setFormData({...formData, burden: parseFloat(e.target.value) || 0})} className="h-12 border-2 rounded-xl font-bold" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 text-blue-600">Spacing (m)</Label>
                        <Input type="number" step="0.1" value={formData.spacing} onChange={e => setFormData({...formData, spacing: parseFloat(e.target.value) || 0})} className="h-12 border-2 rounded-xl font-bold" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 text-emerald-600">Bench Ht (m)</Label>
                        <Input type="number" step="0.1" value={formData.bench_height} onChange={e => setFormData({...formData, bench_height: parseFloat(e.target.value) || 0})} className="h-12 border-2 rounded-xl font-bold" />
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Planned Holes</Label>
                        <Input type="number" value={formData.planned_holes} onChange={e => setFormData({...formData, planned_holes: parseInt(e.target.value) || 0})} className="h-12 border-2 rounded-xl font-black text-rose-600" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Hole Depth (m)</Label>
                        <Input type="number" step="1" value={formData.hole_depth} onChange={e => setFormData({...formData, hole_depth: parseFloat(e.target.value) || 0})} className="h-12 border-2 rounded-xl font-bold" />
                      </div>
                   </div>
                </div>
              </div>

              {/* FISCAL ALLOCATION SECTION */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-2 border-b-2 border-slate-200 pb-2">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-black text-xs uppercase tracking-widest text-slate-800">2. Budget {"&"} Cost Approval (Uidhinishaji wa Bajeti)</h3>
                </div>

                <div className="grid gap-6 bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-sm">
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Boxes Expl. (@25kg)</Label>
                        <Input type="number" value={formData.boxes_of_explosives} onChange={e => setFormData({...formData, boxes_of_explosives: parseInt(e.target.value) || 0})} className="h-12 border-2 rounded-xl font-black text-orange-600" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Bags ANFO (@25kg)</Label>
                        <Input type="number" value={formData.bags_of_anfo} onChange={e => setFormData({...formData, bags_of_anfo: parseInt(e.target.value) || 0})} className="h-12 border-2 rounded-xl font-black text-orange-600" />
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-4 border-t pt-6">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Explosive cost/kg (TZS)</Label>
                        <Input type="number" value={formData.explosive_cost_per_kg} onChange={e => setFormData({...formData, explosive_cost_per_kg: parseFloat(e.target.value) || 0})} className="h-12 border-2 rounded-xl font-bold" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Detonator Qty (pcs)</Label>
                        <Input type="number" value={formData.detonator_quantity} onChange={e => setFormData({...formData, detonator_quantity: parseInt(e.target.value) || 0})} className="h-12 border-2 rounded-xl font-bold" />
                      </div>
                   </div>

                   <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Labor (TZS)</Label>
                        <Input type="number" value={formData.labor} onChange={e => setFormData({...formData, labor: parseFloat(e.target.value) || 0})} className="h-10 border-2 rounded-xl text-xs" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Fuel (TZS)</Label>
                        <Input type="number" value={formData.fuel_cost} onChange={e => setFormData({...formData, fuel_cost: parseFloat(e.target.value) || 0})} className="h-10 border-2 rounded-xl text-xs" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Misc (TZS)</Label>
                        <Input type="number" value={formData.initiation_cost} onChange={e => setFormData({...formData, initiation_cost: parseFloat(e.target.value) || 0})} className="h-10 border-2 rounded-xl text-xs" />
                      </div>
                   </div>
                </div>
              </div>
            </div>

            {/* STRATEGIC OUTPUTS */}
            <div className="bg-slate-900 rounded-[3.5rem] p-12 text-white relative overflow-hidden ring-4 ring-orange-500/20">
               <div className="relative z-10 grid gap-12 md:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-2 border-l-4 border-slate-700 pl-6">
                     <p className="text-[10px] font-black uppercase tracking-widest opacity-40">estimated tonnage</p>
                     <p className="text-4xl font-black">{formData.estimated_tonnage.toLocaleString()}</p>
                     <p className="text-[10px] font-bold opacity-30 uppercase mt-1">Tonnes Projected</p>
                  </div>
                  <div className="space-y-2 border-l-4 border-orange-500 pl-6 bg-orange-500/5 py-4 rounded-r-2xl">
                     <p className="text-[10px] font-black uppercase tracking-widest text-orange-400">total projected budget</p>
                     <p className="text-4xl font-black text-orange-500">TZS {formData.estimated_cost.toLocaleString()}</p>
                     <p className="text-[10px] font-bold opacity-30 uppercase mt-1">Fiscal Allocation</p>
                  </div>
                  <div className="space-y-2 border-l-4 border-slate-700 pl-6">
                     <p className="text-[10px] font-black uppercase tracking-widest opacity-40">powder factor (kg/t)</p>
                     <p className="text-4xl font-black text-blue-400">{formData.planned_powder_factor}</p>
                     <p className="text-[10px] font-bold opacity-30 uppercase mt-1">Design Efficiency</p>
                  </div>
                  <div className="space-y-2 border-l-4 border-slate-700 pl-6">
                     <p className="text-[10px] font-black uppercase tracking-widest opacity-40">est. cost / tonne</p>
                     <p className="text-4xl font-black text-emerald-400">TZS {formData.estimated_cost_per_tonne.toLocaleString()}</p>
                     <p className="text-[10px] font-bold opacity-30 uppercase mt-1">Unit Economics</p>
                  </div>
               </div>
               <Calculator className="absolute -bottom-20 -right-20 w-80 h-80 opacity-[0.03] text-white pointer-events-none -z-10" />
            </div>

            {/* SUBMISSION */}
            <div className="flex gap-6 pt-6">
               <Button type="submit" disabled={loading || (formData.status === "approved")} className="flex-1 h-24 bg-orange-600 hover:bg-orange-700 rounded-[2rem] text-2xl font-black uppercase tracking-[0.2em] shadow-2xl shadow-orange-500/20 transition-all active:scale-95 disabled:opacity-50">
                  {loading ? <Loader2 className="w-10 h-10 animate-spin" /> : formData.status === "approved" ? "BUDGET LOCKED & SECURED" : "Initialize Comprehensive Budget"}
               </Button>
               <Button type="button" variant="outline" onClick={() => router.back()} className="h-24 px-12 rounded-[2rem] font-bold uppercase tracking-widest border-2 hover:bg-slate-100">
                  Discard
               </Button>
            </div>

          </CardContent>
        </Card>
      </form>
    </div>
  )
}
