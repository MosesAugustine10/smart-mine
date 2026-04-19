"use client"

import { useState, useEffect, useCallback } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { DashboardHeader } from "@/components/dashboard-header"
import {
    CheckCircle2, XCircle, Loader2, Clock, RefreshCw,
    Smartphone, Building2, Receipt, AlertTriangle
} from "lucide-react"

const METHOD_LABELS: Record<string, { label: string; color: string }> = {
    manual_mpesa:  { label: "M-Pesa",       color: "bg-green-100 text-green-700 border-green-200" },
    manual_tigo:   { label: "Tigo Pesa",    color: "bg-blue-100 text-blue-700 border-blue-200" },
    manual_airtel: { label: "Airtel Money", color: "bg-red-100 text-red-700 border-red-200" },
    selcom:        { label: "Selcom",        color: "bg-purple-100 text-purple-700 border-purple-200" },
}

export default function PendingVerificationPage() {
    const { toast } = useToast()
    const [pendingInvoices, setPendingInvoices] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [actioning, setActioning] = useState<string | null>(null)

    const fetchPending = useCallback(async () => {
        setLoading(true)
        const supabase = getSupabaseBrowserClient()
        const { data } = await supabase
            .from("invoices")
            .select(`
                id, invoice_number, amount, currency, payment_method,
                manual_transaction_id, created_at, updated_at, status,
                companies:company_id ( name, phone )
            `)
            .eq("status", "pending_verification")
            .order("updated_at", { ascending: false })

        setPendingInvoices(data || [])
        setLoading(false)
    }, [])

    useEffect(() => {
        fetchPending()
        // Poll every 30 seconds for new submissions
        const interval = setInterval(fetchPending, 30000)
        return () => clearInterval(interval)
    }, [fetchPending])

    const handleAction = async (invoiceId: string, action: "approve" | "reject") => {
        setActioning(invoiceId + action)
        try {
            const supabase = getSupabaseBrowserClient()
            const { data: { session } } = await supabase.auth.getSession()

            const res = await fetch("/api/super-admin/payments/verify", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${session?.access_token || ""}`,
                },
                body: JSON.stringify({ invoice_id: invoiceId, action }),
            })

            const result = await res.json()
            if (!res.ok) throw new Error(result.error)

            toast({
                title: action === "approve" ? "✅ Imeidhinishwa!" : "❌ Imekataliwa",
                description: result.message,
            })

            // Remove from list immediately
            setPendingInvoices(prev => prev.filter(inv => inv.id !== invoiceId))

        } catch (err: any) {
            toast({ title: "Hitilafu", description: err.message, variant: "destructive" })
        } finally {
            setActioning(null)
        }
    }

    return (
        <div className="flex-1 overflow-auto p-8 bg-slate-50/30 dark:bg-slate-950/30 space-y-8 pb-20">
            {/* Header */}
            <div className="flex items-center justify-between">
                <DashboardHeader
                    title="Malipo Yanayosubiri Uthibitisho"
                    description="Kagua na idhinisha malipo ya simu yaliyotumwa na wateja"
                />
                <Button
                    variant="ghost"
                    onClick={fetchPending}
                    className="h-10 px-4 rounded-xl border-2 font-black text-[9px] uppercase tracking-widest flex items-center gap-2"
                >
                    <RefreshCw className="w-4 h-4" /> Refresh
                </Button>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-3 gap-4">
                <Card className="border-0 shadow-lg rounded-3xl bg-amber-500 text-slate-950">
                    <CardContent className="p-6">
                        <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">Yanasubiri</p>
                        <p className="text-4xl font-black">{pendingInvoices.length}</p>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-lg rounded-3xl bg-white dark:bg-slate-900">
                    <CardContent className="p-6">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Jumla ya Fedha</p>
                        <p className="text-2xl font-black text-slate-900 dark:text-white">
                            TSh {pendingInvoices.reduce((s, i) => s + (i.amount || 0), 0).toLocaleString()}
                        </p>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-lg rounded-3xl bg-white dark:bg-slate-900">
                    <CardContent className="p-6">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Imesasishwa</p>
                        <p className="text-xs font-bold text-slate-500 mt-2">Kila sekunde 30</p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Table */}
            <Card className="border-0 shadow-2xl rounded-[2.5rem] overflow-hidden">
                <CardHeader className="bg-slate-900 text-white p-8">
                    <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
                        <Clock className="w-5 h-5 text-amber-400" />
                        Orodha ya Malipo Yanayosubiri
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
                        </div>
                    ) : pendingInvoices.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 space-y-4 text-center">
                            <CheckCircle2 className="w-16 h-16 text-emerald-500" />
                            <p className="font-black text-xl text-slate-700 dark:text-slate-300 uppercase tracking-tight">Hakuna Malipo Yanayosubiri</p>
                            <p className="text-sm font-bold text-slate-400">Malipo yote yamethibitishwa au hayajawasilishwa bado.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                            {pendingInvoices.map((inv) => {
                                const method = METHOD_LABELS[inv.payment_method] || { label: inv.payment_method, color: "bg-slate-100 text-slate-600" }
                                const isActioning = actioning?.startsWith(inv.id)
                                return (
                                    <div key={inv.id} className="p-6 flex flex-col lg:flex-row lg:items-center gap-6 hover:bg-slate-50/50 transition-colors">
                                        {/* Company Info */}
                                        <div className="flex items-center gap-4 flex-1 min-w-0">
                                            <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center shrink-0">
                                                <Building2 className="w-6 h-6 text-amber-400" />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h4 className="font-black text-slate-900 dark:text-white text-base truncate">
                                                        {inv.companies?.name || "—"}
                                                    </h4>
                                                    <Badge className={`text-[9px] font-black uppercase border ${method.color} shrink-0`}>
                                                        <Smartphone className="w-2.5 h-2.5 mr-1" />{method.label}
                                                    </Badge>
                                                </div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                                    📞 {inv.companies?.phone || "—"}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Invoice Details */}
                                        <div className="grid grid-cols-3 gap-4 flex-1">
                                            <div>
                                                <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest mb-0.5">Invoice Namba</p>
                                                <p className="text-xs font-black font-mono text-slate-700 dark:text-slate-300">{inv.invoice_number}</p>
                                            </div>
                                            <div>
                                                <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest mb-0.5">Kiasi</p>
                                                <p className="text-sm font-black text-slate-900 dark:text-white">TSh {(inv.amount || 0).toLocaleString()}</p>
                                            </div>
                                            <div>
                                                <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest mb-0.5">Transaction ID</p>
                                                <p className="text-xs font-black font-mono text-amber-600 dark:text-amber-400">
                                                    {inv.manual_transaction_id || "—"}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Warning & Date */}
                                        <div className="hidden xl:block text-right shrink-0">
                                            <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest mb-0.5">Ilitumwa</p>
                                            <p className="text-[10px] font-bold text-slate-600">
                                                {new Date(inv.updated_at).toLocaleString("sw-TZ", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                                            </p>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex items-center gap-3 shrink-0">
                                            <Button
                                                onClick={() => handleAction(inv.id, "approve")}
                                                disabled={!!isActioning}
                                                className="h-12 px-5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-500/20 transition-all"
                                            >
                                                {actioning === inv.id + "approve"
                                                    ? <Loader2 className="w-4 h-4 animate-spin" />
                                                    : <><CheckCircle2 className="w-4 h-4 mr-1.5" />Thibitisha</>
                                                }
                                            </Button>
                                            <Button
                                                onClick={() => handleAction(inv.id, "reject")}
                                                disabled={!!isActioning}
                                                variant="ghost"
                                                className="h-12 px-5 rounded-2xl border-2 border-red-200 hover:bg-red-50 text-red-600 font-black text-[10px] uppercase tracking-widest transition-all"
                                            >
                                                {actioning === inv.id + "reject"
                                                    ? <Loader2 className="w-4 h-4 animate-spin" />
                                                    : <><XCircle className="w-4 h-4 mr-1.5" />Kataa</>
                                                }
                                            </Button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Reminder */}
            {pendingInvoices.length > 0 && (
                <div className="flex items-center gap-4 bg-amber-50 border-2 border-amber-200 rounded-2xl p-5">
                    <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0" />
                    <p className="text-xs font-bold text-amber-700">
                        <strong>Kumbuka:</strong> Kabla ya kuthibitisha, angalia simu yako ili kuhakikisha pesa zimepokelewa kweli kweli kwenye namba yako ya biashara.
                    </p>
                </div>
            )}
        </div>
    )
}
