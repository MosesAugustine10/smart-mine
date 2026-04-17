"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save, UploadCloud, Microscope, CheckCircle2, AlertTriangle, MessageSquare } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"

export default function AssayResultsForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { toast } = useToast()
    const sampleIdParam = searchParams?.get('sampleId') || ""

    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        sample_id: sampleIdParam,
        result_au: "",
        result_ag: "",
        result_cu: "",
        result_fe: "",
        assay_method: "Fire Assay (FA50)",
        detection_limit: "0.01",
        lab_name: "",
        certificate_number: "",
        qaqc_pass: "PASS",
        qaqc_variance: "",
        comments: "",
        status: "Assayed"
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        // Mock saving data
        setTimeout(() => {
            toast({
                title: "Assay Results Certified",
                description: `Results for ${formData.sample_id} saved successfully with QA/QC validation (${formData.qaqc_pass}).`,
            })
            setLoading(false)
            router.push('/diamond-drilling/assay')
        }, 1200)
    }

    return (
        <div className="flex-1 overflow-auto p-8 bg-slate-50 border-t border-slate-200">
            <div className="max-w-4xl mx-auto space-y-8 pb-32">
                <div className="flex md:items-center justify-between flex-col md:flex-row gap-4">
                    <div>
                        <Link href="/diamond-drilling/assay" className="inline-flex items-center text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-800 transition-colors mb-2">
                            <ArrowLeft className="w-3 h-3 mr-2" /> Back to Ledger
                        </Link>
                        <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-900 flex items-center gap-3">
                            <Microscope className="w-8 h-8 text-purple-600" />
                            Certify Assay Results
                        </h1>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-1">QA/QC Validation & Analytical Data Entry</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Card className="border-0 shadow-lg rounded-[2rem] overflow-hidden">
                        <div className="bg-slate-900 text-white p-6 border-b border-white/10 flex items-center justify-between">
                            <h2 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                Chain of Custody & Identification
                            </h2>
                        </div>
                        <CardContent className="p-8 space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sample ID Code</label>
                                    <Input required value={formData.sample_id} onChange={(e) => setFormData({ ...formData, sample_id: e.target.value })} placeholder="e.g. DD-SMP-1045" className="h-14 bg-slate-50 border-2 rounded-xl text-sm font-bold placeholder:font-normal" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Target Laboratory</label>
                                    <Input required value={formData.lab_name} onChange={(e) => setFormData({ ...formData, lab_name: e.target.value })} placeholder="e.g. SGS Minerals" className="h-14 bg-slate-50 border-2 rounded-xl text-sm font-bold placeholder:font-normal" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Certificate Number</label>
                                    <Input required value={formData.certificate_number} onChange={(e) => setFormData({ ...formData, certificate_number: e.target.value })} placeholder="e.g. MW-2026-8982" className="h-14 bg-slate-50 border-2 rounded-xl text-sm font-bold placeholder:font-normal" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Update Sample Status</label>
                                    <Select value={formData.status} onValueChange={(val) => setFormData({ ...formData, status: val })}>
                                        <SelectTrigger className="h-14 bg-slate-50 border-2 rounded-xl text-sm font-bold">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-2">
                                            <SelectItem value="Collected">Collected</SelectItem>
                                            <SelectItem value="Dispatched">Dispatched</SelectItem>
                                            <SelectItem value="Received at Lab">Received at Lab</SelectItem>
                                            <SelectItem value="Assayed">Assayed</SelectItem>
                                            <SelectItem value="Approved">Approved (QA/QC Passed)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-lg rounded-[2rem] overflow-hidden">
                        <div className="bg-purple-900 text-white p-6 border-b border-white/10 flex items-center justify-between">
                            <h2 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                                <Microscope className="w-4 h-4 text-purple-300" />
                                Analytical Results & Methodology
                            </h2>
                        </div>
                        <CardContent className="p-8 space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Assay Method</label>
                                    <Input required value={formData.assay_method} onChange={(e) => setFormData({ ...formData, assay_method: e.target.value })} placeholder="e.g. Fire Assay (FA50)" className="h-14 bg-slate-50 border-2 rounded-xl text-sm font-bold placeholder:font-normal" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Detection Limit (g/t)</label>
                                    <Input required value={formData.detection_limit} onChange={(e) => setFormData({ ...formData, detection_limit: e.target.value })} type="number" step="0.001" className="h-14 bg-slate-50 border-2 rounded-xl text-sm font-bold placeholder:font-normal" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-4 border-t border-slate-100">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-amber-500">Au (g/t) *</label>
                                    <Input required type="number" step="0.01" value={formData.result_au} onChange={(e) => setFormData({ ...formData, result_au: e.target.value })} className="h-14 bg-amber-50 border-2 border-amber-200 rounded-xl text-lg font-black text-amber-700" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ag (g/t)</label>
                                    <Input type="number" step="0.01" value={formData.result_ag} onChange={(e) => setFormData({ ...formData, result_ag: e.target.value })} className="h-14 bg-slate-50 border-2 rounded-xl text-sm font-bold" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cu (%)</label>
                                    <Input type="number" step="0.01" value={formData.result_cu} onChange={(e) => setFormData({ ...formData, result_cu: e.target.value })} className="h-14 bg-slate-50 border-2 rounded-xl text-sm font-bold" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Fe (%)</label>
                                    <Input type="number" step="0.01" value={formData.result_fe} onChange={(e) => setFormData({ ...formData, result_fe: e.target.value })} className="h-14 bg-slate-50 border-2 rounded-xl text-sm font-bold" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-lg rounded-[2rem] overflow-hidden">
                        <div className="bg-slate-50 border-b border-slate-100 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <h2 className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-slate-800">
                                <AlertTriangle className="w-4 h-4 text-rose-500" />
                                QA/QC Validation & Exceptions
                            </h2>
                            <Badge className="bg-white text-slate-800 border-2 shadow-sm font-black text-[9px] uppercase tracking-widest">
                                Analyst Module
                            </Badge>
                        </div>
                        <CardContent className="p-8 space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">QA/QC Assessment</label>
                                    <Select value={formData.qaqc_pass} onValueChange={(val) => setFormData({ ...formData, qaqc_pass: val })}>
                                        <SelectTrigger className={`h-14 border-2 rounded-xl text-sm font-bold ${formData.qaqc_pass === 'FAIL' ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-2">
                                            <SelectItem value="PASS">PASS - Values within limits</SelectItem>
                                            <SelectItem value="FAIL">FAIL - Re-assay required</SelectItem>
                                            <SelectItem value="WARNING">WARNING - Blank Contamination</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Duplicate Variance (%)</label>
                                    <Input value={formData.qaqc_variance} onChange={(e) => setFormData({ ...formData, qaqc_variance: e.target.value })} placeholder="e.g. 4.2%" className="h-14 bg-slate-50 border-2 rounded-xl text-sm font-bold placeholder:font-normal" />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                        <MessageSquare className="w-3 h-3" /> Comments / Lab Notes
                                    </label>
                                    <Input value={formData.comments} onChange={(e) => setFormData({ ...formData, comments: e.target.value })} placeholder="e.g. Re-assay required due to blank contamination overflow." className="h-14 bg-slate-50 border-2 rounded-xl text-sm font-bold placeholder:font-normal" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="p-8 bg-slate-100/50 rounded-[2rem] border-2 border-slate-200 border-dashed text-center">
                        <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
                        <h4 className="text-sm font-black uppercase text-slate-600 mb-1">Upload Certified Lab Document</h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">PDF, JPG files only. Maximum size 5MB.</p>
                        <Button type="button" variant="outline" className="mt-4 rounded-xl border-2 font-black text-xs h-10 w-48">Select File...</Button>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <Button type="submit" disabled={loading} className="h-16 flex-1 bg-slate-900 hover:bg-black text-white font-black text-xs uppercase tracking-[0.2em] rounded-[1.5rem] shadow-2xl transition-all active:scale-95">
                            {loading ? "Validating..." : "Certify Results & Commit"}
                            {!loading && <Save className="w-4 h-4 ml-2" />}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
