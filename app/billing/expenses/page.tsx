"use client"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { ExpenseTracker } from "@/lib/expense-tracker"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Plus, Receipt, Filter, Download, ArrowUpRight, Wallet, Info } from "lucide-react"
import { useTranslation } from "@/components/language-context"
import { SimpleDetailModal } from "@/components/ui/simple-detail-modal"
import { ProfessionalReportButton } from "@/components/ui/professional-report-button"

export default function ExpensesPage() {
    const { t } = useTranslation()
    const { toast } = useToast()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [expenses, setExpenses] = useState<any[]>([])
    const [totalRevenue, setTotalRevenue] = useState(0)
    const [userProfile, setUserProfile] = useState<any>(null)
    const [infoModalOpen, setInfoModalOpen] = useState(false)
    const [infoData, setInfoData] = useState<any>(null)

    const [newExpense, setNewExpense] = useState({
        amount: "",
        category: "",
        description: "",
        log_date: new Date().toISOString().split('T')[0]
    })

    const categories = ["Fuel", "Explosives", "Labor", "Maintenance", "Transport", "Admin", "Food", "Other"]

    useEffect(() => {
        fetchFinancials()
    }, [])

    async function fetchFinancials() {
        setLoading(true)
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
        
        setUserProfile(profile)
        const cid = profile?.company_id

        // Fetch expenses
        let expQuery = supabase.from("expenses").select("*")
        if (cid) expQuery = expQuery.eq("company_id", cid)
        const { data: expData } = await expQuery.order("log_date", { ascending: false })
        
        // Fetch revenue (Invoiced amount)
        let invQuery = supabase.from("invoices").select("grand_total").eq("status", "PAID")
        if (cid) invQuery = invQuery.eq("company_id", cid)
        const { data: invData } = await invQuery

        setExpenses(expData || [])
        setTotalRevenue(invData?.reduce((s, i) => s + (i.grand_total || 0), 0) || 0)
        setLoading(false)
    }

    const handleSaveExpense = async () => {
        if (!newExpense.amount || !newExpense.category) {
            toast({ title: "Incomplete Data", description: "Amount and Category are mandatory.", variant: "destructive" })
            return
        }

        setSaving(true)
        try {
            const supabase = getSupabaseBrowserClient()
            const { data: { user } } = await supabase.auth.getUser()

            const { error } = await supabase.from("expenses").insert({
                company_id: userProfile?.company_id, 
                amount: parseFloat(newExpense.amount),
                category: newExpense.category.toLowerCase(),
                description: newExpense.description,
                log_date: newExpense.log_date
            })

            if (error) throw error

            toast({ title: "Expense Saved", description: "The expense has been successfully recorded." })
            setNewExpense({ amount: "", category: "", description: "", log_date: new Date().toISOString().split('T')[0] })
            fetchFinancials()
        } catch (err: any) {
            toast({ title: "Error", description: err.message, variant: "destructive" })
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="w-12 h-12 animate-spin text-slate-400" /></div>

    return (
        <div className="flex-1 overflow-auto p-8 space-y-10 bg-slate-50/30 dark:bg-slate-950/30 pb-20">
             <DashboardHeader 
                title="Expense Management" 
                description="Track your spending, costs, and project expenses"
            />

            <div className="grid gap-10 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-10">
                    <ExpenseTracker expenses={expenses} totalRevenue={totalRevenue} />

                    <Card className="border-0 shadow-2xl rounded-[2.5rem] overflow-hidden">
                        <CardHeader className="bg-slate-950 text-white p-8 scale-100">
                            <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center justify-between">
                                {t('expenses' as any) || "Expense List"}
                                <ProfessionalReportButton 
                                    data={expenses} 
                                    filename="Expense_Report" 
                                    title="Expense Summary Report" 
                                    moduleColor="red"
                                    headers={["log_date", "category", "description", "amount"]}
                                    buttonLabel="Download Report"
                                />
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-slate-50 border-b">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Date</th>
                                            <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Category</th>
                                            <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Description</th>
                                            <th className="px-6 py-4 text-right text-[10px] font-black uppercase text-slate-400 tracking-widest">Amount</th>
                                            <th className="px-6 py-4 text-center text-[10px] font-black uppercase text-slate-400 tracking-widest">Info</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {expenses.map((e) => (
                                            <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-5 text-sm font-bold text-slate-600">{e.log_date}</td>
                                                <td className="px-6 py-5">
                                                    <span className="px-3 py-1 rounded-full bg-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-600 border">
                                                        {e.category}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5 text-sm font-medium text-slate-500 italic">{e.description || "N/A"}</td>
                                                <td className="px-6 py-5 text-right font-black text-slate-900">TZS {e.amount.toLocaleString()}</td>
                                                <td className="px-6 py-5 text-center">
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        onClick={() => { setInfoData(e); setInfoModalOpen(true); }}
                                                        className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 hover:bg-blue-500 hover:text-white transition-all shadow-sm"
                                                    >
                                                        <Info className="h-4 w-4" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                        {expenses.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">No expenses found</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                        <SimpleDetailModal 
                            isOpen={infoModalOpen} 
                            onClose={() => setInfoModalOpen(false)} 
                            data={infoData} 
                            title="Expense Entry" 
                        />
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="border-0 shadow-2xl rounded-[2.5rem] p-10 bg-white border-2 border-emerald-100 sticky top-8">
                        <h3 className="text-xl font-black uppercase tracking-tighter mb-8 flex items-center gap-3">
                            <Plus className="w-6 h-6 text-emerald-600" />
                            New Expense
                        </h3>
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-40">Amount (TZS)</Label>
                                <Input 
                                    type="number" 
                                    value={newExpense.amount} 
                                    onChange={e => setNewExpense({...newExpense, amount: e.target.value})} 
                                    className="h-14 border-2 rounded-2xl font-black text-2xl text-emerald-600" 
                                    placeholder="0"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-40">Category</Label>
                                <Select value={newExpense.category} onValueChange={v => setNewExpense({...newExpense, category: v})}>
                                    <SelectTrigger className="h-14 border-2 rounded-2xl font-bold bg-slate-50">
                                        <SelectValue placeholder="Select Cost Sector" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-2">
                                        {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-40">Reference / Description</Label>
                                <Input 
                                    value={newExpense.description} 
                                    onChange={e => setNewExpense({...newExpense, description: e.target.value})} 
                                    className="h-14 border-2 rounded-2xl font-bold" 
                                    placeholder="e.g. Fuel for TR-105"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-40">Log Date</Label>
                                <Input 
                                    type="date" 
                                    value={newExpense.log_date} 
                                    onChange={e => setNewExpense({...newExpense, log_date: e.target.value})} 
                                    className="h-14 border-2 rounded-2xl font-bold" 
                                />
                            </div>

                            <Button 
                                disabled={saving} 
                                onClick={handleSaveExpense}
                                className="w-full h-16 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-emerald-500/20 transition-all hover:scale-[1.02]"
                            >
                                {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : "Save Expense"}
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    )
}
