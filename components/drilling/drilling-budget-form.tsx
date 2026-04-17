"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, DollarSign, Target, MapPin, Ruler, Calculator, Drill, ShieldCheck, CheckCircle2, XCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface DrillingBudgetFormProps {
  initialData?: any
  drillNumber?: string
}

export function DrillingBudgetForm({ initialData, drillNumber }: DrillingBudgetFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [userRole, setUserRole] = useState<string>("engineer")
  const [userId, setUserId] = useState<string>("")

  const [formData, setFormData] = useState({
    drill_number: initialData?.drill_number || drillNumber || `DRL-${Date.now().toString().slice(-4)}`,
    location: initialData?.location || "",
    region: initialData?.region || "",
    planned_date: initialData?.planned_date || new Date().toISOString().split("T")[0],
    planned_holes: initialData?.planned_holes || 0,
    burden: initialData?.burden || 0,
    spacing: initialData?.spacing || 0,
    planned_depth: initialData?.planned_depth || 0,
    planned_rate: initialData?.planned_rate || 0, // m/hr
    rig_id: initialData?.rig_id || "",
    planned_bit_type: initialData?.planned_bit_type || "",

    // COST PART
    drilling_cost_per_m: initialData?.drilling_cost_per_m || 0,
    labor: initialData?.labor || 0,
    fuel_cost: initialData?.fuel_cost || 0,
    accessories_cost: initialData?.accessories_cost || 0,

    // OUTPUTS
    estimated_total_depth: initialData?.estimated_total_depth || 0,
    estimated_cost: initialData?.estimated_cost || 0,
    estimated_hours: initialData?.estimated_hours || 0,

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
    const totalDepth = formData.planned_holes * formData.planned_depth
    const drillingCost = totalDepth * formData.drilling_cost_per_m
    const totalCost = drillingCost + formData.labor + formData.fuel_cost + formData.accessories_cost
    const totalHours = formData.planned_rate > 0 ? totalDepth / formData.planned_rate : 0

    setFormData(prev => ({
      ...prev,
      estimated_total_depth: Number(totalDepth.toFixed(2)),
      estimated_cost: Number(totalCost.toFixed(2)),
      estimated_hours: Number(totalHours.toFixed(2))
    }))
  }, [
    formData.planned_holes, formData.planned_depth, formData.drilling_cost_per_m, 
    formData.labor, formData.fuel_cost, formData.accessories_cost, formData.planned_rate
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
        ? await supabase.from("drilling_operations").update(payload).eq("id", initialData.id)
        : await supabase.from("drilling_operations").insert(payload)

      if (error) throw error

      toast({
        title: "DRILLING PLAN LOGGED",
        description: `Operation ${formData.drill_number} has been archived in the planning registry.`
      })

      router.push("/drilling")
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

       const { error } = await supabase.from("drilling_operations").update({
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

       toast({ title: `Budget ${newStatus.toUpperCase()}`, description: `The drilling budget has been ${newStatus}.` })
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
                    <h3 className="text-xl font-black uppercase tracking-tight text-slate-800">Digital Approval Status</h3>
                 </div>
                 <div className="flex flex-col gap-1 text-[11px] font-bold uppercase tracking-widest opacity-60">
                    <p>Created By: {formData.created_by || "System Data"}</p>
                    <p>Reviewed By: {formData.approved_by_name || "Pending Review"}</p>
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
                         className="h-8 text-[11px] bg-white border-2 border-slate-200" 
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
        <Card className="border-0 shadow-2xl rounded-[2.5rem] overflow-hidden border-t-8 border-t-blue-600">
          <CardHeader className="bg-slate-900 text-white p-8">
            <CardTitle className="text-3xl font-black uppercase tracking-tighter italic">✦ DRILLING MODULE (PLANNING/BUDGET FORM) ✦</CardTitle>
          </CardHeader>
          
          <CardContent className="p-8 bg-slate-50/50">
            <div className="grid gap-10">
              
              {/* BASIC INFO */}
              <div className="space-y-4 col-span-full">
                <div className="flex items-center gap-2 mb-2 border-b-2 border-slate-200 pb-2">
                  <Target className="w-5 h-5 text-blue-600" />
                  <h3 className="font-black text-xs uppercase tracking-widest text-slate-800">Basic Information</h3>
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 bg-white p-6 rounded-3xl border-2 border-slate-100 shadow-sm">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">drill number</Label>
                    <Input value={formData.drill_number} disabled className="h-12 border-2 rounded-xl font-bold bg-slate-100" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">location</Label>
                    <Input value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="h-12 border-2 rounded-xl" placeholder="E.g. Pit B, Section 4" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">region</Label>
                    <Input value={formData.region} onChange={e => setFormData({...formData, region: e.target.value})} className="h-12 border-2 rounded-xl" placeholder="Geita, Mwanza etc" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">planned date</Label>
                    <Input type="date" value={formData.planned_date} onChange={e => setFormData({...formData, planned_date: e.target.value})} className="h-12 border-2 rounded-xl" />
                  </div>
                </div>
              </div>

              {/* DESIGN PARAMETERS */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2 border-b-2 border-slate-200 pb-2">
                  <Drill className="w-5 h-5 text-blue-600" />
                  <h3 className="font-black text-xs uppercase tracking-widest text-slate-800">Design Parameters</h3>
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 bg-white p-6 rounded-3xl border-2 border-slate-100 shadow-sm">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">planned holes</Label>
                    <Input type="number" value={formData.planned_holes} onChange={e => setFormData({...formData, planned_holes: parseInt(e.target.value) || 0})} className="h-12 border-2 rounded-xl font-bold" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 text-blue-600">burden (m)</Label>
                    <Input type="number" step="0.1" value={formData.burden} onChange={e => setFormData({...formData, burden: parseFloat(e.target.value) || 0})} className="h-12 border-2 rounded-xl font-bold" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 text-blue-600">spacing (m)</Label>
                    <Input type="number" step="0.1" value={formData.spacing} onChange={e => setFormData({...formData, spacing: parseFloat(e.target.value) || 0})} className="h-12 border-2 rounded-xl font-bold" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 text-emerald-600">planned depth (m)</Label>
                    <Input type="number" step="0.1" value={formData.planned_depth} onChange={e => setFormData({...formData, planned_depth: parseFloat(e.target.value) || 0})} className="h-12 border-2 rounded-xl font-bold" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 text-emerald-600">planned rate (m/hr)</Label>
                    <Input type="number" step="0.1" value={formData.planned_rate} onChange={e => setFormData({...formData, planned_rate: parseFloat(e.target.value) || 0})} className="h-12 border-2 rounded-xl font-bold" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">rig id</Label>
                    <Input value={formData.rig_id} onChange={e => setFormData({...formData, rig_id: e.target.value})} className="h-12 border-2 rounded-xl font-bold" placeholder="RIG-001" />
                  </div>
                  <div className="space-y-2 col-span-full">
                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">planned bit type</Label>
                    <Input value={formData.planned_bit_type} onChange={e => setFormData({...formData, planned_bit_type: e.target.value})} className="h-12 border-2 rounded-xl" placeholder="E.g. Tricone, PDC" />
                  </div>
                </div>
              </div>

              {/* COST PART */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2 border-b-2 border-slate-200 pb-2">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-black text-xs uppercase tracking-widest text-slate-800">COST PART</h3>
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 bg-white p-6 rounded-3xl border-2 border-slate-100 shadow-sm">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">drilling cost/m (TZS)</Label>
                    <Input type="number" step="100" value={formData.drilling_cost_per_m} onChange={e => setFormData({...formData, drilling_cost_per_m: parseFloat(e.target.value) || 0})} className="h-12 border-2 rounded-xl font-bold" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">labor (TZS)</Label>
                    <Input type="number" step="1000" value={formData.labor} onChange={e => setFormData({...formData, labor: parseFloat(e.target.value) || 0})} className="h-12 border-2 rounded-xl font-bold" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">fuel cost (TZS)</Label>
                    <Input type="number" step="100" value={formData.fuel_cost} onChange={e => setFormData({...formData, fuel_cost: parseFloat(e.target.value) || 0})} className="h-12 border-2 rounded-xl font-bold" />
                  </div>
                  <div className="space-y-2">
                     <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">accessories cost (TZS)</Label>
                     <Input type="number" step="1000" value={formData.accessories_cost} onChange={e => setFormData({...formData, accessories_cost: parseFloat(e.target.value) || 0})} className="h-12 border-2 rounded-xl font-bold" />
                  </div>
                </div>
              </div>

              {/* OUTPUTS */}
              <div className="bg-blue-950 rounded-[2.5rem] p-10 text-white relative overflow-hidden">
                 <div className="relative z-10 grid gap-8 md:grid-cols-3">
                    <div className="text-center md:text-left bg-white/5 p-6 rounded-2xl border border-white/10">
                       <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">estimated total depth</p>
                       <p className="text-4xl font-black">{formData.estimated_total_depth.toLocaleString()}</p>
                       <p className="text-[10px] font-bold opacity-40 uppercase">Meters</p>
                    </div>
                    <div className="text-center md:text-left bg-emerald-500/10 p-6 rounded-2xl border border-emerald-500/20">
                       <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2 text-emerald-200">estimated cost</p>
                       <p className="text-4xl font-black text-emerald-400">{formData.estimated_cost.toLocaleString()}</p>
                       <p className="text-[10px] font-bold opacity-40 uppercase text-emerald-200">TZS Total</p>
                    </div>
                    <div className="text-center md:text-left bg-white/5 p-6 rounded-2xl border border-white/10">
                       <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">estimated hours</p>
                       <p className="text-4xl font-black text-amber-400">{formData.estimated_hours.toLocaleString()}</p>
                       <p className="text-[10px] font-bold opacity-40 uppercase">Operating Hours</p>
                    </div>
                 </div>
                 <Calculator className="absolute -bottom-10 -right-10 w-64 h-64 opacity-5 text-white pointer-events-none -z-10" />
              </div>

              {/* ACTION BUTTONS */}
              <div className="bg-slate-100 p-6 rounded-2xl border border-slate-200">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                   <Target className="w-4 h-4 text-slate-400" />
                   Review and Finalize Strategy
                </p>
                <div className="flex gap-4 pt-4">
                   <Button type="submit" disabled={loading || (formData.status === "approved")} className="flex-1 h-20 bg-blue-700 hover:bg-blue-800 rounded-2xl text-xl font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50">
                      {loading ? <Loader2 className="w-8 h-8 animate-spin" /> : formData.status === "approved" ? "BUDGET APPROVED & LOCKED" : "Save Planning File"}
                   </Button>
                </div>
              </div>

            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
