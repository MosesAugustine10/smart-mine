"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Loader2, ArrowLeft, Save, TestTube } from "lucide-react"
import Link from "next/link"

export default function DispatchSamplePage() {
    const router = useRouter()
    const { toast } = useToast()
    const [loading, setLoading] = useState(false)

    const [formData, setFormData] = useState({
        sample_id: "",
        material_type: "Core",
        sample_type: "Routine",
        qaqc_type: "None",
        lab_name: "",
        cost_per_sample: "",
        expected_tat: "14",
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const supabase = getSupabaseBrowserClient()
            const { data: { session } } = await supabase.auth.getSession()
            
            const company_id = session?.user?.user_metadata?.company_id || session?.user?.id

            const submitData = {
                company_id,
                sample_id: formData.sample_id,
                material_type: formData.material_type,
                sample_type: formData.sample_type,
                qaqc_type: formData.qaqc_type,
                lab_name: formData.lab_name,
                cost_per_sample: formData.cost_per_sample ? Number(formData.cost_per_sample) : 0,
                expected_tat_days: formData.expected_tat ? Number(formData.expected_tat) : 14,
                status: 'Dispatched',
                date_dispatched: new Date().toISOString(),
                date_sampled: new Date().toISOString()
            }

            const { error } = await supabase
                .from('assay_samples')
                .insert([submitData])

            if (error) throw error

            toast({
                title: "Sample Dispatched",
                description: `Sample ${formData.sample_id} successfully registered.`
            })
            
            router.push('/diamond-drilling/assay')
        } catch (error: any) {
            toast({
                title: "Dispatch Failed",
                description: error.message,
                variant: "destructive"
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex-1 overflow-auto p-8 space-y-8 bg-slate-50/30 dark:bg-slate-950/30">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="flex items-center gap-4">
                    <Link href="/diamond-drilling/assay">
                        <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl hover:bg-white dark:hover:bg-slate-900 shadow-sm border-2 border-transparent hover:border-slate-100 dark:hover:border-slate-800 transition-all">
                            <ArrowLeft className="w-5 h-5 text-slate-500" />
                        </Button>
                    </Link>
                    <DashboardHeader 
                        title="Sample Dispatch Form" 
                        description="Register high-fidelity geological samples for laboratory assay" 
                    />
                </div>

                <form onSubmit={handleSubmit}>
                    <Card className="border-2 border-slate-100 dark:border-slate-800 rounded-[2.5rem] shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
                        <div className="h-4 bg-purple-600" />
                        <CardContent className="p-10 space-y-8">
                            <div className="flex items-center gap-4 border-b-2 border-slate-50 dark:border-slate-800 pb-6">
                                <div className="p-4 bg-purple-50 dark:bg-purple-900/30 rounded-2xl text-purple-600">
                                    <TestTube className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white">Sample Identification</h3>
                                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Core parameters</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Sample ID Code</Label>
                                    <Input 
                                        required 
                                        placeholder="e.g. DD-SMP-1045"
                                        className="h-14 rounded-2xl border-2 border-slate-100 dark:border-slate-800 px-6 font-bold uppercase"
                                        value={formData.sample_id}
                                        onChange={e => setFormData({...formData, sample_id: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Expected Turnaround Time (Days)</Label>
                                    <Input 
                                        type="number"
                                        required 
                                        placeholder="14"
                                        className="h-14 rounded-2xl border-2 border-slate-100 dark:border-slate-800 px-6 font-bold"
                                        value={formData.expected_tat}
                                        onChange={e => setFormData({...formData, expected_tat: e.target.value})}
                                    />
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Target Laboratory</Label>
                                    <Input 
                                        required 
                                        placeholder="e.g. SGS Minerals"
                                        className="h-14 rounded-2xl border-2 border-slate-100 dark:border-slate-800 px-6 font-bold"
                                        value={formData.lab_name}
                                        onChange={e => setFormData({...formData, lab_name: e.target.value})}
                                    />
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Cost Per Sample (USD)</Label>
                                    <Input 
                                        type="number"
                                        step="0.01"
                                        placeholder="45.00"
                                        className="h-14 rounded-2xl border-2 border-slate-100 dark:border-slate-800 px-6 font-bold text-amber-600 font-mono"
                                        value={formData.cost_per_sample}
                                        onChange={e => setFormData({...formData, cost_per_sample: e.target.value})}
                                    />
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4 md:col-span-2">
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Material</Label>
                                        <select 
                                            className="w-full h-14 rounded-2xl border-2 border-slate-100 dark:border-slate-800 px-6 font-bold bg-transparent text-sm appearance-none cursor-pointer"
                                            value={formData.material_type}
                                            onChange={e => setFormData({...formData, material_type: e.target.value})}
                                        >
                                            <option value="Core">Solid Core</option>
                                            <option value="RC Chips">RC Chips</option>
                                            <option value="Sludge">Sludge</option>
                                            <option value="Soil">Soil</option>
                                        </select>
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Class</Label>
                                        <select 
                                            className="w-full h-14 rounded-2xl border-2 border-slate-100 dark:border-slate-800 px-6 font-bold bg-transparent text-sm appearance-none cursor-pointer"
                                            value={formData.sample_type}
                                            onChange={e => setFormData({...formData, sample_type: e.target.value})}
                                        >
                                            <option value="Routine">Routine</option>
                                            <option value="Blank">Blank QA/QC</option>
                                        </select>
                                    </div>
                                    <div className="space-y-3 md:col-span-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">QA/QC Type</Label>
                                        <select 
                                            className="w-full h-14 rounded-2xl border-2 border-slate-100 dark:border-slate-800 px-6 font-bold bg-transparent text-sm appearance-none cursor-pointer"
                                            value={formData.qaqc_type}
                                            onChange={e => setFormData({...formData, qaqc_type: e.target.value})}
                                        >
                                            <option value="None">N/A (Routine Sample)</option>
                                            <option value="Standard">Standard (CRM)</option>
                                            <option value="Duplicate">Field Duplicate</option>
                                            <option value="Pulp Duplicate">Pulp Duplicate</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="mt-8 flex justify-end">
                        <Button 
                            disabled={loading}
                            type="submit" 
                            className="h-14 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-black uppercase text-[10px] tracking-widest px-10 shadow-xl shadow-purple-500/20 transition-all hover:scale-105"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
                            Submit to Ledger
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
