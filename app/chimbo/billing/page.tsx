"use client"

import { useState, useEffect } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { getActiveAccount } from "@/lib/chimbo-auth"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
    Receipt, Clock, CheckCircle2, AlertTriangle, 
    ChevronRight, ExternalLink, RefreshCw, Smartphone
} from "lucide-react"

export default function ChimboBillingPage() {
    const [invoices, setInvoices] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [account, setAccount] = useState<any>(null)

    useEffect(() => {
        const acc = getActiveAccount()
        setAccount(acc)
        if (acc?.company_id) {
            fetchInvoices(acc.company_id)
        }
    }, [])

    async function fetchInvoices(companyId: string) {
        setLoading(true)
        const supabase = getSupabaseBrowserClient()
        const { data } = await supabase
            .from("invoices")
            .select("*")
            .eq("company_id", companyId)
            .order("created_at", { ascending: false })
        
        setInvoices(data || [])
        setLoading(false)
    }

    const vibe = () => { if (typeof navigator !== "undefined") navigator.vibrate?.(40) }

    return (
        <div className="p-4 space-y-6 pb-24">
            {/* Header */}
            <div className="space-y-1">
                <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Historia ya Malipo</h1>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Invoices na hali ya usajili wako</p>
            </div>

            {/* Trial / Subscription Status Card */}
            {account && (
                <Card className="border-0 shadow-xl rounded-[2rem] bg-gradient-to-br from-slate-900 to-slate-800 text-white overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Receipt className="w-24 h-24" />
                    </div>
                    <CardContent className="p-8 space-y-6">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Hali ya Usajili</p>
                            <div className="flex items-center gap-3">
                                <h2 className="text-2xl font-black uppercase italic tracking-tighter">
                                    {account.subscription_status === "ACTIVE" ? "Usajili Uko Hai" : "Muda wa Matazamio"}
                                </h2>
                                <Badge className={`bg-white/10 text-white border-0 font-black text-[9px] uppercase tracking-widest h-6 ${account.subscription_status === "ACTIVE" ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"}`}>
                                    {account.subscription_status || "TRIAL"}
                                </Badge>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                                <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest mb-1">Gharama</p>
                                <p className="text-lg font-black tracking-tight">TSh 25,000<span className="text-xs font-bold text-slate-500">/mwezi</span></p>
                            </div>
                            <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                                <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest mb-1">Mwisho wa Malipo</p>
                                <p className="text-lg font-black tracking-tight">
                                    {account.next_billing_date ? new Date(account.next_billing_date).toLocaleDateString("sw-TZ") : "Siku 30 tangu start"}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Invoices List */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Invoices Zote</h3>
                    <button onClick={() => account && fetchInvoices(account.company_id)} className="text-amber-500">
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center py-12 gap-3">
                        <div className="w-10 h-10 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
                        <p className="text-[10px] font-black text-slate-400 uppercase">Tunaload Data...</p>
                    </div>
                ) : invoices.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 text-center border-2 border-dashed border-slate-100 dark:border-white/5">
                        <p className="text-sm font-bold text-slate-400">Hauna invoice yoyote kwa sasa.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {invoices.map((inv) => (
                            <Card key={inv.id} className="border-0 shadow-lg rounded-3xl overflow-hidden hover:scale-[1.01] transition-all bg-white dark:bg-slate-900 border-2 border-transparent hover:border-amber-500/20">
                                <CardContent className="p-5 flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                                            inv.status === 'paid' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                                        }`}>
                                            <Receipt className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-black text-slate-900 dark:text-white text-base">TSh {inv.amount?.toLocaleString()}</h4>
                                                {inv.status === 'paid' ? (
                                                    <Badge className="bg-emerald-500/10 text-emerald-600 border-0 text-[8px] font-black uppercase tracking-widest">
                                                        IMELIPWA
                                                    </Badge>
                                                ) : (
                                                    <Badge className="bg-amber-500/10 text-amber-600 border-0 text-[8px] font-black uppercase tracking-widest animate-pulse">
                                                        PENDING
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                                INV: {inv.invoice_number} • {new Date(inv.created_at).toLocaleDateString("sw-TZ")}
                                            </p>
                                        </div>
                                    </div>

                                    {inv.status !== 'paid' && (
                                        <a href={`/pay/${inv.id}`} target="_blank" rel="noreferrer">
                                            <Button 
                                                onClick={vibe}
                                                className="h-11 px-5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black uppercase text-[10px] tracking-widest shadow-lg shadow-amber-500/20"
                                            >
                                                LIPA SASA <ExternalLink className="w-3 h-3 ml-1.5" />
                                            </Button>
                                        </a>
                                    )}
                                    {inv.status === 'paid' && (
                                        <CheckCircle2 className="w-6 h-6 text-emerald-500 mr-2" />
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Help Section */}
            <div className="bg-slate-100 dark:bg-white/5 rounded-3xl p-6 space-y-4">
                <div className="flex items-start gap-3">
                    <Smartphone className="w-5 h-5 text-slate-400 shrink-0" />
                    <div>
                        <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">Msaada wa Malipo?</h4>
                        <p className="text-[10px] font-bold text-slate-400 leading-relaxed mt-1">
                            Ikiwa umelipa kwa simu na invoice bado inaonyesha "PENDING", tafadhali wasubiri kwanza kwani Super Admin anahakiki malipo kwa mkono. Huwa haizidi saa 1.
                        </p>
                    </div>
                </div>
                <a href="https://wa.me/255623310006?text=Habari! Nahitaji msaada kuhusu malipo yangu kwenye Smart Mine." target="_blank" rel="noreferrer" className="block">
                    <Button variant="outline" className="w-full h-12 rounded-2xl border-2 font-black text-[10px] uppercase tracking-widest text-slate-600 dark:text-slate-400">
                        Zungumza Nasi WhatsApp
                    </Button>
                </a>
            </div>
        </div>
    )
}
