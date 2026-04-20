"use client"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, Filter, FlaskConical, Microscope, CheckCircle2, AlertTriangle, TrendingUp, Clock, Activity, Edit3 } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { ProfessionalReportButton } from "@/components/ui/professional-report-button"
import Link from "next/link"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { format, differenceInDays } from "date-fns"

export default function AdvancedAssayDashboard() {
    const [samples, setSamples] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState("ALL")
    const [labFilter, setLabFilter] = useState("ALL")

    useEffect(() => {
        async function fetchSamples() {
            const supabase = getSupabaseBrowserClient()
            const { data } = await supabase
                .from('assay_samples')
                .select('*')
                .order('created_at', { ascending: false })
            
            if (data && data.length > 0) {
                setSamples(data)
            } else {
                // Mock robust data for consultant view
                const now = new Date()
                const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000).toISOString()
                
                setSamples([
                    {
                        id: '1', sample_id: 'DD-26-001', lab_name: 'SGS Lab', status: 'Approved',
                        date_dispatched: daysAgo(20), date_received: daysAgo(18), date_completed: daysAgo(10),
                        result_au: 14.5, qaqc_pass: 'PASS', material_type: 'Core', sample_type: 'Routine', qaqc_variance: '1.2%'
                    },
                    {
                        id: '2', sample_id: 'DD-26-002', lab_name: 'SGS Lab', status: 'Approved',
                        date_dispatched: daysAgo(18), date_received: daysAgo(16), date_completed: daysAgo(8),
                        result_au: 2.1, qaqc_pass: 'PASS', material_type: 'Core', sample_type: 'Routine', qaqc_variance: '2.5%'
                    },
                    {
                        id: '3', sample_id: 'DD-26-003', lab_name: 'MinLab Int', status: 'Assayed',
                        date_dispatched: daysAgo(22), date_received: daysAgo(19), date_completed: daysAgo(2),
                        result_au: 0.1, qaqc_pass: 'WARNING', material_type: 'Core', sample_type: 'Blank QA/QC', comments: 'Slight blank contamination'
                    },
                    {
                        id: '4', sample_id: 'DD-26-004', lab_name: 'SGS Lab', status: 'Dispatched',
                        date_dispatched: daysAgo(2), date_received: null, date_completed: null,
                        result_au: null, qaqc_pass: null, material_type: 'RC Chips', sample_type: 'Routine'
                    },
                    {
                        id: '5', sample_id: 'DD-26-005', lab_name: 'MinLab Int', status: 'Approved',
                        date_dispatched: daysAgo(25), date_received: daysAgo(23), date_completed: daysAgo(5),
                        result_au: 55.2, qaqc_pass: 'FAIL', material_type: 'Core', sample_type: 'Routine', comments: 'Failed duplicate repeat, extremely high grade variance.'
                    },
                    {
                        id: '6', sample_id: 'DD-26-STD1', lab_name: 'MinLab Int', status: 'Approved',
                        date_dispatched: daysAgo(25), date_received: daysAgo(23), date_completed: daysAgo(6),
                        result_au: 1.5, qaqc_pass: 'PASS', material_type: 'Core', sample_type: 'Standard QA/QC'
                    }
                ])
            }
            setLoading(false)
        }
        fetchSamples()
    }, [])

    // KPI Calculations
    const totalSamples = samples.length
    const assayedSamples = samples.filter(s => s.result_au !== null && s.result_au !== undefined)
    
    const avgAu = assayedSamples.length > 0 
        ? (assayedSamples.reduce((sum: number, s: any) => sum + Number(s.result_au), 0) / assayedSamples.length).toFixed(2) 
        : "0.00"

    const highGradeCount = assayedSamples.filter(s => Number(s.result_au) > 5).length

    const completedSamples = samples.filter(s => s.date_completed && s.date_dispatched)
    const avgTat = completedSamples.length > 0
        ? Math.round(completedSamples.reduce((sum: number, s: any) => sum + differenceInDays(new Date(s.date_completed), new Date(s.date_dispatched)), 0) / completedSamples.length)
        : 0

    const qaqcSamples = samples.filter(s => s.qaqc_pass !== null && s.qaqc_pass !== undefined)
    const qaqcPassRate = qaqcSamples.length > 0
        ? Math.round((qaqcSamples.filter(s => s.qaqc_pass === 'PASS' || s.qaqc_pass === 'WARNING').length / qaqcSamples.length) * 100)
        : 100

    // Filters
    const uniqueLabs = Array.from(new Set(samples.map(s => s.lab_name).filter(Boolean)))
    
    const filteredSamples = samples.filter(s => {
        const matchSearch = s.sample_id?.toLowerCase().includes(searchTerm.toLowerCase())
        const matchStatus = statusFilter === "ALL" || s.status === statusFilter
        const matchLab = labFilter === "ALL" || s.lab_name === labFilter
        return matchSearch && matchStatus && matchLab
    })

    // Prepare Chart Data
    const chartData = assayedSamples.slice().reverse().map(s => ({
        name: s.sample_id,
        Au: Number(s.result_au).toFixed(2),
        isHigh: Number(s.result_au) > 5
    }))

    // Generate Smart Alerts
    interface AssayAlert {
        id: string;
        type: 'qaqc' | 'grade' | 'delay';
        title: string;
        desc: string;
    }

    const alerts: AssayAlert[] = []
    samples.forEach((s: any) => {
        if (s.qaqc_pass === 'FAIL') {
            alerts.push({ id: s.id, type: 'qaqc', title: `QA/QC Failure: ${s.sample_id}`, desc: s.comments || 'Variance exceeded limits.' })
        }
        if (Number(s.result_au) > 10) {
            alerts.push({ id: s.id, type: 'grade', title: `Extreme Grade: ${s.sample_id}`, desc: `Returned ${s.result_au} g/t Au.` })
        }
        if (s.date_dispatched && !s.date_completed) {
            const tat = differenceInDays(new Date(), new Date(s.date_dispatched))
            if (tat > 14) {
                alerts.push({ id: s.id, type: 'delay', title: `Delay Warning: ${s.sample_id}`, desc: `TAT is ${tat} days at ${s.lab_name}.` })
            }
        }
    })

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Approved': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
            case 'Assayed': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400'
            case 'Received at Lab': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
            case 'Dispatched': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400'
            case 'Collected': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400'
            default: return 'bg-slate-100 text-slate-700'
        }
    }

    const getQaqcBadge = (qaqc: string) => {
        switch (qaqc) {
            case 'PASS': return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30'
            case 'WARNING': return 'text-amber-600 bg-amber-50 dark:bg-amber-900/30'
            case 'FAIL': return 'text-rose-600 bg-rose-50 dark:bg-rose-900/30'
            default: return 'text-slate-400 bg-slate-50'
        }
    }

    return (
        <div className="flex-1 overflow-auto p-4 md:p-8 space-y-10 bg-slate-50/50 dark:bg-slate-950/50 pb-32">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter flex items-center gap-4 text-slate-900 dark:text-white leading-none">
                       <Microscope className="w-10 h-10 text-purple-600" /> Assay <span className="text-purple-600">Analytics</span>
                    </h1>
                    <p className="text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] text-slate-500 mt-2">
                        Professional QA/QC Validation & Sample Tracking System
                    </p>
                </div>
                
                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                    <ProfessionalReportButton 
                        data={samples} 
                        filename="ASSAY_QAQC_REPORT" 
                        title="Assay Tracking & QA/QC Statement" 
                        moduleColor="purple"
                        headers={["sample_id", "sample_type", "lab_name", "status", "result_au", "qaqc_pass", "date_dispatched", "date_completed"]}
                    />
                    <Link href="/diamond-drilling/assay/new" className="flex-1 md:flex-none">
                        <Button className="w-full h-12 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-black uppercase text-[10px] tracking-widest shadow-lg shadow-purple-500/20 transition-all">
                            <Plus className="w-4 h-4 mr-2" />
                            Dispatch Samples
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Main Advanced KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border-0 shadow-lg bg-white dark:bg-slate-900 overflow-hidden relative group">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2.5 bg-purple-50 dark:bg-purple-900/30 rounded-xl text-purple-600">
                                <FlaskConical className="w-5 h-5" />
                            </div>
                            <Badge className="bg-slate-100 text-slate-500 border-0 font-black text-[9px] uppercase tracking-widest">Global</Badge>
                        </div>
                        <h3 className="text-3xl md:text-4xl font-black">{avgAu} <span className="text-sm">g/t</span></h3>
                        <p className="text-[9px] font-black uppercase tracking-widest mt-2 text-slate-400">Running Average Grade</p>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-white dark:bg-slate-900 overflow-hidden relative group">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl text-emerald-600">
                                <CheckCircle2 className="w-5 h-5" />
                            </div>
                            <Badge className={qaqcPassRate >= 95 ? "bg-emerald-100 text-emerald-700 border-0 font-black text-[9px] uppercase" : "bg-amber-100 text-amber-700 border-0 font-black text-[9px] uppercase"}>Validation</Badge>
                        </div>
                        <h3 className="text-3xl md:text-4xl font-black text-emerald-600">{qaqcPassRate}%</h3>
                        <p className="text-[9px] font-black uppercase tracking-widest mt-2 text-slate-400">QA/QC Pass Rate</p>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-white dark:bg-slate-900 overflow-hidden relative group">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 rounded-xl text-blue-600">
                                <Clock className="w-5 h-5" />
                            </div>
                            <Badge className="bg-slate-100 text-slate-500 border-0 font-black text-[9px] uppercase tracking-widest">Efficiency</Badge>
                        </div>
                        <h3 className="text-3xl md:text-4xl font-black">{avgTat} <span className="text-sm text-slate-400">Days</span></h3>
                        <p className="text-[9px] font-black uppercase tracking-widest mt-2 text-slate-400">Avg Turnaround Time</p>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white overflow-hidden relative group cursor-pointer hover:-translate-y-1 transition-all">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl text-white">
                                <TrendingUp className="w-5 h-5" />
                            </div>
                        </div>
                        <h3 className="text-3xl md:text-4xl font-black">{highGradeCount}</h3>
                        <p className="text-[9px] font-black uppercase tracking-widest mt-2 text-white/80">High Grade Intercepts</p>
                    </CardContent>
                    <div className="absolute -bottom-6 -right-6 opacity-20 pointer-events-none group-hover:scale-125 transition-transform duration-700">
                        <TrendingUp className="w-32 h-32" />
                    </div>
                </Card>
            </div>

            {/* Charts & Alerts Layout */}
            <div className="grid lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 border-0 shadow-xl bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden">
                    <CardHeader className="border-b border-slate-100 dark:border-slate-800 p-6 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-lg font-black uppercase tracking-widest flex items-center gap-2">
                                <Activity className="w-5 h-5 text-purple-600" /> Grade Distribution Trend
                            </CardTitle>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Au (g/t) sequence plotting</p>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
                                <XAxis dataKey="name" tick={{ fontSize: 9, fontWeight: 800, fill: '#94A3B8' }} tickMargin={10} axisLine={false} />
                                <YAxis tick={{ fontSize: 10, fontWeight: 800, fill: '#94A3B8' }} axisLine={false} tickLine={false} tickFormatter={(val) => `${val}g/t`} />
                                <RechartsTooltip 
                                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)', background: '#1e293b', color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                                />
                                <Line type="monotone" dataKey="Au" stroke="#9333ea" strokeWidth={4} dot={{ r: 4, strokeWidth: 2, fill: '#fff', stroke: '#9333ea' }} activeDot={{ r: 8, fill: '#f59e0b', stroke: '#fff' }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-xl bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden flex flex-col">
                    <CardHeader className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 p-6">
                        <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-rose-500">
                            <AlertTriangle className="w-5 h-5" /> Smart Alerts
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 flex-1 overflow-auto">
                        {alerts.length > 0 ? (
                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                {alerts.map((alert, i) => (
                                    <div key={i} className="p-5 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                        <div className="flex items-center gap-3 mb-1">
                                            <div className={`w-2 h-2 rounded-full ${alert.type === 'grade' ? 'bg-amber-500' : alert.type === 'qaqc' ? 'bg-rose-500' : 'bg-purple-500'}`} />
                                            <h4 className="text-xs font-black uppercase tracking-tight">{alert.title}</h4>
                                        </div>
                                        <p className="text-[10px] font-bold text-slate-500 pl-5">{alert.desc}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center p-8 text-center opacity-50">
                                <CheckCircle2 className="w-10 h-10 mb-2 text-emerald-500" />
                                <p className="text-[10px] font-black uppercase tracking-widest">No Active Alerts</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Filter & Advanced Table Section */}
            <div className="space-y-4">
                <div className="flex flex-col md:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                        <Input 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search by Sample ID..." 
                            className="h-12 pl-11 bg-white dark:bg-slate-900 border-0 shadow-sm rounded-2xl text-xs font-bold"
                        />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="h-12 w-full md:w-[150px] bg-white dark:bg-slate-900 border-0 shadow-sm rounded-2xl text-xs font-bold">
                            <Filter className="w-3 h-3 mr-2" />
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-0 shadow-xl">
                            <SelectItem value="ALL">All Status</SelectItem>
                            <SelectItem value="Collected">Collected</SelectItem>
                            <SelectItem value="Dispatched">Dispatched</SelectItem>
                            <SelectItem value="Received at Lab">Received</SelectItem>
                            <SelectItem value="Assayed">Assayed</SelectItem>
                            <SelectItem value="Approved">Approved</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={labFilter} onValueChange={setLabFilter}>
                        <SelectTrigger className="h-12 w-full md:w-[150px] bg-white dark:bg-slate-900 border-0 shadow-sm rounded-2xl text-xs font-bold">
                            <FlaskConical className="w-3 h-3 mr-2" />
                            <SelectValue placeholder="Laboratory" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-0 shadow-xl">
                            <SelectItem value="ALL">All Labs</SelectItem>
                            {uniqueLabs.map((l: string) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl overflow-hidden border border-slate-100 dark:border-slate-800">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 dark:bg-slate-800/50">
                                <tr>
                                    <th className="px-6 py-5 text-[9px] font-black uppercase text-slate-400 tracking-widest">Sample ID</th>
                                    <th className="px-6 py-5 text-[9px] font-black uppercase text-slate-400 tracking-widest">Tracking Dates</th>
                                    <th className="px-6 py-5 text-[9px] font-black uppercase text-slate-400 tracking-widest text-center">TAT</th>
                                    <th className="px-6 py-5 text-[9px] font-black uppercase text-slate-400 tracking-widest">Status</th>
                                    <th className="px-6 py-5 text-[9px] font-black uppercase text-slate-400 tracking-widest text-right">Au (g/t)</th>
                                    <th className="px-6 py-5 text-[9px] font-black uppercase text-slate-400 tracking-widest text-center">QA/QC</th>
                                    <th className="px-6 py-5 text-[9px] font-black uppercase text-slate-400 tracking-widest text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                {filteredSamples.map((s, idx) => {
                                    const tat = (s.date_dispatched && s.date_completed) 
                                        ? differenceInDays(new Date(s.date_completed), new Date(s.date_dispatched))
                                        : null

                                    return (
                                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                                            <td className="px-6 py-5">
                                                <div className="text-xs font-black text-slate-700 dark:text-slate-200">{s.sample_id}</div>
                                                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-0.5 mt-0.5">{s.sample_type} • {s.lab_name}</div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="text-[10px] font-bold text-slate-500 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span> {s.date_dispatched ? format(new Date(s.date_dispatched), "MMM dd") : '-'}</div>
                                                <div className="text-[10px] font-bold text-emerald-600 flex items-center gap-1.5 mt-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> {s.date_completed ? format(new Date(s.date_completed), "MMM dd") : 'Pending'}</div>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                {tat !== null ? (
                                                    <Badge variant="outline" className={`font-black text-[9px] uppercase border-2 ${tat > 14 ? 'border-rose-200 text-rose-600 bg-rose-50' : 'border-slate-200'}`}>
                                                        {tat}d
                                                    </Badge>
                                                ) : <span className="text-slate-300">-</span>}
                                            </td>
                                            <td className="px-6 py-5">
                                                <Badge className={`font-black text-[9px] uppercase tracking-widest py-1 border-0 ${getStatusBadge(s.status)}`}>
                                                    {s.status}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                {s.result_au !== null && s.result_au !== undefined ? (
                                                    <div className={`text-sm font-black ${Number(s.result_au) > 5 ? 'text-amber-500' : 'text-slate-600 dark:text-white'}`}>
                                                        {Number(s.result_au).toFixed(2)}
                                                    </div>
                                                ) : <span className="text-slate-300 font-bold">-</span>}
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                {s.qaqc_pass ? (
                                                    <span className={`inline-flex items-center px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${getQaqcBadge(s.qaqc_pass)}`}>
                                                        {s.qaqc_pass}
                                                    </span>
                                                ) : <span className="text-slate-300">-</span>}
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                {(s.status !== 'Approved' && s.status !== 'Assayed') ? (
                                                    <Link href={`/diamond-drilling/assay/results?sampleId=${s.sample_id}`}>
                                                        <Button variant="ghost" size="sm" className="h-8 text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-purple-600 hover:bg-purple-50">
                                                            <Edit3 className="w-3 h-3 mr-1.5" /> Log
                                                        </Button>
                                                    </Link>
                                                ) : (
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-slate-500" disabled>
                                                        <CheckCircle2 className="w-4 h-4" />
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    )
                                })}
                                {filteredSamples.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-16 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">
                                            No tracking records found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}
