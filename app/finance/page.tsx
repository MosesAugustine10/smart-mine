"use client"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useTranslation } from "@/components/language-context"
import { ProfessionalReportButton } from "@/components/ui/professional-report-button"
import { Loader2, TrendingUp, TrendingDown, DollarSign, ArrowUpRight, ArrowDownRight, Landmark, Receipt, CreditCard, Filter } from "lucide-react"
import { format, isWithinInterval, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, parseISO } from "date-fns"
import { SystemPeriodFilter, type ReportPeriod } from "@/components/ui/system-period-filter"

export default function FinancialLedgerPage() {
    const { t } = useTranslation()
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState<any>(null)
    const [allTransactions, setAllTransactions] = useState<any[]>([])
    const [filteredTransactions, setFilteredTransactions] = useState<any[]>([])
    const [period, setPeriod] = useState<ReportPeriod>("all")

    useEffect(() => {
        async function fetchFinance() {
            const supabase = getSupabaseBrowserClient()
            const { data: { session } } = await supabase.auth.getSession()
            
            if (!session) {
                setLoading(false)
                return
            }

            const { data: profile } = await supabase
                .from("user_profiles")
                .select("company_id")
                .eq("id", session.user.id)
                .single()
            
            const cid = profile?.company_id

            // Fetch Invoices (Revenue)
            let invQuery = supabase.from("invoices").select("*")
            if (cid) invQuery = invQuery.eq("company_id", cid)
            const { data: invData } = await invQuery
            
            // Fetch Expenses (Costs)
            let expQuery = supabase.from("expenses").select("*")
            if (cid) expQuery = expQuery.eq("company_id", cid)
            const { data: expData } = await expQuery

            const revenue = invData?.reduce((s: number, i: any) => s + (i.grand_total || 0), 0) || 0
            const costs = expData?.reduce((s: number, e: any) => s + (e.amount || 0), 0) || 0
            const profit = revenue - costs

            setStats({ revenue, costs, profit })

            // Merge for unified ledger
            const unified = [
                ...(invData || []).map((i: any) => ({
                    date: i.issue_date || i.created_at,
                    type: "INCOME",
                    category: "Billing",
                    desc: i.client_name,
                    amount: i.grand_total,
                    status: i.status
                })),
                ...(expData || []).map((e: any) => ({
                    date: e.log_date,
                    type: "EXPENSE",
                    category: e.category,
                    desc: e.description,
                    amount: e.amount,
                    status: "PAID"
                }))
            ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

            setAllTransactions(unified)
            setFilteredTransactions(unified)
            setLoading(false)
        }
        fetchFinance()
    }, [])

    useEffect(() => {
        if (!allTransactions.length) return
        
        let filtered = allTransactions
        if (period !== "all") {
            const now = new Date()
            let interval: { start: Date; end: Date }
            if (period === "daily") interval = { start: startOfDay(now), end: endOfDay(now) }
            else if (period === "weekly") interval = { start: startOfWeek(now), end: endOfWeek(now) }
            else if (period === "monthly") interval = { start: startOfMonth(now), end: endOfMonth(now) }
            else interval = { start: startOfYear(now), end: endOfYear(now) }

            filtered = allTransactions.filter(t => {
                try {
                    return isWithinInterval(new Date(t.date), interval)
                } catch { return true }
            })
        }

        const revenue = filtered.filter(t => t.type === "INCOME").reduce((s: number, i: any) => s + (i.amount || 0), 0)
        const costs = filtered.filter(t => t.type === "EXPENSE").reduce((s: number, e: any) => s + (e.amount || 0), 0)
        const profit = revenue - costs

        setStats({ revenue, costs, profit })
        setFilteredTransactions(filtered)
    }, [period, allTransactions])

    if (loading) return (
        <div className="h-screen w-full flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-emerald-600" />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-mono">Consolidating Fiscal Assets...</p>
        </div>
    )

    return (
        <div className="flex-1 overflow-auto p-8 space-y-10 bg-slate-50/30 dark:bg-slate-950/30 pb-20">
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                            <Landmark className="w-6 h-6" />
                        </div>
                        Financial Ledger
                    </h1>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Governance of corporate revenue & expenditure</p>
                </div>
                
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
                    <SystemPeriodFilter currentPeriod={period} onPeriodChange={setPeriod} />
                    <ProfessionalReportButton 
                        data={filteredTransactions} 
                        filename="MASTER_FINANCIAL_Review" 
                        title="Master Consolidated Financial Records" 
                        moduleColor="emerald"
                        activePeriod={period}
                        headers={["date", "type", "category", "desc", "amount", "status"]}
                    />
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card className="border-0 shadow-lg bg-white overflow-hidden relative group transition-all hover:scale-[1.02]">
                    <CardContent className="p-8">
                        <div className="flex justify-between items-start mb-6">
                            <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
                                <TrendingUp className="w-6 h-6" />
                            </div>
                            <Badge className="bg-blue-100 text-blue-700 border-0 font-black text-[9px] uppercase tracking-widest">Gross Revenue</Badge>
                        </div>
                        <h3 className="text-4xl font-black text-slate-800">TZS {stats.revenue.toLocaleString()}</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-4 flex items-center gap-2">
                           <Receipt className="w-3 h-3" /> Total Invoiced (Paid & Pending)
                        </p>
                    </CardContent>
                    <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                        <DollarSign className="w-24 h-24" />
                    </div>
                </Card>

                <Card className="border-0 shadow-lg bg-white overflow-hidden relative group transition-all hover:scale-[1.02]">
                    <CardContent className="p-8">
                        <div className="flex justify-between items-start mb-6">
                            <div className="p-3 bg-red-50 rounded-2xl text-red-600">
                                <TrendingDown className="w-6 h-6" />
                            </div>
                            <Badge className="bg-red-100 text-red-700 border-0 font-black text-[9px] uppercase tracking-widest">Total Expenses</Badge>
                        </div>
                        <h3 className="text-4xl font-black text-slate-800">TZS {stats.costs.toLocaleString()}</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-4 flex items-center gap-2">
                           <CreditCard className="w-3 h-3" /> Operating Costs (OpEx)
                        </p>
                    </CardContent>
                </Card>

                <Card className={`border-0 shadow-xl overflow-hidden relative text-white transition-all hover:scale-[1.02] ${stats.profit >= 0 ? 'bg-slate-900' : 'bg-red-900'}`}>
                    <CardContent className="p-8">
                        <div className="flex justify-between items-start mb-6">
                            <div className={`p-3 rounded-2xl ${stats.profit >= 0 ? 'bg-white/10' : 'bg-white/20'}`}>
                                <Landmark className="w-6 h-6" />
                            </div>
                            <Badge className="bg-white/20 text-white border-0 font-black text-[9px] uppercase tracking-widest">Net Profit/Loss</Badge>
                        </div>
                        <h3 className="text-4xl font-black">TZS {stats.profit.toLocaleString()}</h3>
                        <div className="mt-4 flex items-center gap-2">
                            {stats.profit >= 0 ? <ArrowUpRight className="w-4 h-4 text-emerald-400" /> : <ArrowDownRight className="w-4 h-4 text-red-400" />}
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Margin Health Scan Complete</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-0 shadow-2xl rounded-[2.5rem] overflow-hidden">
                <CardHeader className="bg-slate-50 border-b p-8">
                    <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-slate-900">
                        <Receipt className="w-4 h-4 text-emerald-600" /> Unified Transaction Ledger
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-white border-b-2">
                                <tr>
                                    <th className="px-8 py-5 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Event Date</th>
                                    <th className="px-8 py-5 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Type</th>
                                    <th className="px-8 py-5 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Categorization</th>
                                    <th className="px-8 py-5 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Description</th>
                                    <th className="px-8 py-5 text-right text-[10px] font-black uppercase text-slate-400 tracking-widest">Amount (TZS)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredTransactions.map((t, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-8 py-6 text-sm font-bold text-slate-600">{format(new Date(t.date), "dd MMM yyyy")}</td>
                                        <td className="px-8 py-6">
                                            <Badge className={`font-black text-[9px] uppercase tracking-widest py-1 px-3 ${t.type === 'INCOME' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'} border-0`}>
                                                {t.type}
                                            </Badge>
                                        </td>
                                        <td className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.category}</td>
                                        <td className="px-8 py-6">
                                            <div className="text-sm font-bold text-slate-900">{t.desc}</div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase">{t.status}</div>
                                        </td>
                                        <td className={`px-8 py-6 text-right font-black text-lg ${t.type === 'INCOME' ? 'text-emerald-600' : 'text-red-600'}`}>
                                            {t.type === 'INCOME' ? '+' : '-'} {t.amount.toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
