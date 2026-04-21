"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import {
    Mountain, Smartphone, CreditCard, CheckCircle2,
    Loader2, Copy, ExternalLink, AlertCircle
} from "lucide-react"

// ── Check if Selcom is configured (client-safe — checks a public flag endpoint) ──
// We expose this as a small API rather than leaking secrets to the client
async function checkSelcomAvailability(): Promise<boolean> {
    try {
        const res = await fetch("/api/selcom/status")
        const data = await res.json()
        return data?.configured === true
    } catch {
        return false
    }
}

const BUSINESS_PHONE = "0623 310 006"
const BUSINESS_NAME = "SMART MINE"

const PAYMENT_METHODS = [
    { id: "manual_mpesa",  label: "M-Pesa",       color: "border-green-400 bg-green-50 text-green-800",  accent: "bg-green-500" },
    { id: "manual_tigo",   label: "Tigo Pesa",    color: "border-blue-400 bg-blue-50 text-blue-800",    accent: "bg-blue-500" },
    { id: "manual_airtel", label: "Airtel Money", color: "border-red-400 bg-red-50 text-red-800",       accent: "bg-red-500" },
]

export default function ClientPaymentPage() {
    const params = useParams()
    const invoiceId = params?.invoiceId as string
    const { toast } = useToast()

    const [invoice, setInvoice] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [selcomAvailable, setSelcomAvailable] = useState(false)
    const [selectedMethod, setSelectedMethod] = useState("manual_mpesa")
    const [txnId, setTxnId] = useState("")
    const [senderPhone, setSenderPhone] = useState("")
    const [submitting, setSubmitting] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [activeTab, setActiveTab] = useState<"manual" | "selcom">("manual")

    useEffect(() => {
        async function init() {
            const supabase = getSupabaseBrowserClient()
            const { data } = await supabase
                .from("invoices")
                .select("*, companies:company_id(name, phone)")
                .eq("id", invoiceId)
                .single()
            setInvoice(data)

            const available = await checkSelcomAvailability()
            setSelcomAvailable(available)
            setLoading(false)
        }
        if (invoiceId) init()
    }, [invoiceId])

    const handleCopyPhone = () => {
        navigator.clipboard.writeText(BUSINESS_PHONE.replace(/\s/g, ""))
        toast({ title: "✅ Namba imenakiliwa!", description: "Weka namba hii kwenye simu yako ya malipo." })
    }

    const handleSubmitManual = async () => {
        if (!txnId.trim()) {
            toast({ title: "Jaza Transaction ID", description: "Weka namba ya muamala uliopokelewa baada ya kutuma pesa.", variant: "destructive" })
            return
        }
        setSubmitting(true)
        try {
            const res = await fetch("/api/payments/manual/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    invoice_id: invoiceId,
                    payment_method: selectedMethod,
                    transaction_id: txnId.trim(),
                    amount: invoice?.amount,
                    sender_phone: senderPhone.trim() || undefined,
                }),
            })
            const result = await res.json()
            if (!res.ok) throw new Error(result.error)
            setSubmitted(true)
        } catch (err: any) {
            toast({ title: "Hitilafu", description: err.message, variant: "destructive" })
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
            <Loader2 className="w-12 h-12 animate-spin text-amber-500" />
        </div>
    )

    if (!invoice) return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4 text-center p-8">
            <AlertCircle className="w-16 h-16 text-red-500" />
            <h1 className="text-2xl font-black text-white uppercase">Invoice Haipatikani</h1>
            <p className="text-slate-400 font-bold">Hakikisha link uliyopewa ni sahihi.</p>
        </div>
    )

    if (submitted) return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-6 p-8 text-center">
            <div className="w-24 h-24 rounded-full bg-emerald-500/20 border-2 border-emerald-500/40 flex items-center justify-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-500" />
            </div>
            <div className="space-y-3">
                <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Asante!</h1>
                <p className="text-lg font-bold text-slate-300">Malipo yako yanasubiri kuthibitishwa.</p>
                <p className="text-sm font-medium text-slate-400 max-w-sm">
                    Tutakujulisha mara moja baada ya kuthibitisha. Kwa kawaida hii huchukua chini ya saa 1 wakati wa biashara.
                </p>
            </div>
            <a href={`https://wa.me/255623310006?text=Habari! Nimelipa invoice ${invoice.invoice_number}. TxID: ${txnId}`}
                target="_blank" rel="noreferrer"
                className="flex items-center gap-2 text-sm font-black text-emerald-400 hover:text-emerald-300 transition-colors uppercase tracking-widest">
                <ExternalLink className="w-4 h-4" /> Wasiliana Nasi WhatsApp
            </a>
        </div>
    )

    if (invoice.status === "paid") return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-6 p-8 text-center">
            <CheckCircle2 className="w-20 h-20 text-emerald-500" />
            <h1 className="text-3xl font-black text-white uppercase">Invoice Imelipwa!</h1>
            <p className="text-slate-400 font-bold">Invoice hii imelipwa tayari. Asante!</p>
        </div>
    )

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-start py-12 px-4">
            {/* Header */}
            <div className="flex items-center gap-3 mb-10">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
                    <Mountain className="w-5 h-5 text-white" />
                </div>
                <span className="font-black text-2xl text-white tracking-tighter uppercase">
                    SMART <span className="text-amber-500">MINE</span>
                </span>
            </div>

            {/* Invoice Summary Card */}
            <div className="w-full max-w-md bg-slate-900 rounded-[2.5rem] p-8 border border-white/5 shadow-2xl mb-6">
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 mb-1">Invoice ya Malipo</p>
                <h2 className="text-3xl font-black text-white tracking-tighter mb-1">{invoice.companies?.name}</h2>
                <div className="flex items-baseline gap-2 mt-4">
                    <span className="text-5xl font-black text-amber-400 tracking-tighter">
                        {(invoice.amount || 0).toLocaleString()}
                    </span>
                    <span className="text-lg font-bold text-slate-500">TSh</span>
                </div>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mt-1">
                    {invoice.description || "SMART MINE — Subscription"}
                </p>
                <div className="mt-4 flex items-center justify-between text-[9px] font-black uppercase tracking-widest">
                    <span className="text-slate-500">INV: {invoice.invoice_number}</span>
                    <Badge className={`border font-black text-[9px] uppercase ${invoice.status === "paid" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700 border-amber-200"}`}>
                        {invoice.status === "pending_verification" ? "Inasubiri" : invoice.status?.toUpperCase()}
                    </Badge>
                </div>
            </div>

            {/* Tab Switcher */}
            <div className="w-full max-w-md flex gap-2 mb-4 bg-slate-900 p-1.5 rounded-2xl border border-white/5">
                <button onClick={() => setActiveTab("manual")}
                    className={`flex-1 h-11 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === "manual" ? "bg-amber-500 text-slate-950 shadow-lg" : "text-slate-400 hover:text-white"}`}>
                    <Smartphone className="w-4 h-4" /> Lipa kwa Simu
                </button>
                <button onClick={() => setActiveTab("selcom")}
                    className={`flex-1 h-11 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === "selcom" ? "bg-amber-500 text-slate-950 shadow-lg" : "text-slate-400 hover:text-white"}`}>
                    <CreditCard className="w-4 h-4" /> Selcom Online
                </button>
            </div>

            {/* ── TAB 1: Manual Mobile Money ── */}
            {activeTab === "manual" && (
                <div className="w-full max-w-md space-y-4">
                    {/* Business number display */}
                    <div className="bg-slate-900 border border-white/5 rounded-[2rem] p-6 text-center space-y-2">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Tuma pesa kwa namba hii</p>
                        <button onClick={handleCopyPhone} className="group flex items-center justify-center gap-3 mx-auto">
                            <span className="text-3xl font-black text-white tracking-wider">{BUSINESS_PHONE}</span>
                            <Copy className="w-5 h-5 text-slate-500 group-hover:text-amber-400 transition-colors" />
                        </button>
                        <p className="text-xs font-bold text-amber-400 uppercase tracking-widest">{BUSINESS_NAME}</p>
                        <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-white/5">
                            {PAYMENT_METHODS.map(m => (
                                <button key={m.id} onClick={() => setSelectedMethod(m.id)}
                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${selectedMethod === m.id ? m.color + " border-current scale-105" : "border-transparent text-slate-500 hover:text-white"}`}>
                                    {m.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Steps */}
                    <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-5 space-y-3">
                        {[
                            `Fungua ${PAYMENT_METHODS.find(m => m.id === selectedMethod)?.label} kwenye simu yako`,
                            `Tuma TSh ${(invoice.amount || 0).toLocaleString()} kwa namba: ${BUSINESS_PHONE}`,
                            "Pokea ujumbe wa uthibitisho (Confirmation SMS)",
                            "Weka Namba ya Muamala hapa chini"
                        ].map((step, i) => (
                            <div key={i} className="flex items-start gap-3">
                                <div className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0 text-[10px] font-black text-amber-400">{i + 1}</div>
                                <p className="text-xs font-bold text-slate-400 leading-snug">{step}</p>
                            </div>
                        ))}
                    </div>

                    {/* Transaction ID Input */}
                    <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 pl-1 block">
                            Namba ya Muamala (Transaction ID) *
                        </label>
                        <input
                            value={txnId}
                            onChange={e => setTxnId(e.target.value)}
                            placeholder="Mfano: MP2504191234"
                            className="w-full h-14 px-5 rounded-2xl bg-slate-900 border-2 border-white/10 focus:border-amber-500 text-white font-black text-sm tracking-wider outline-none transition-all placeholder:text-slate-600"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 pl-1 block">
                            Namba Uliyotumia (Optional)
                        </label>
                        <input
                            value={senderPhone}
                            onChange={e => setSenderPhone(e.target.value)}
                            placeholder="Mfano: 0712 345 678"
                            className="w-full h-14 px-5 rounded-2xl bg-slate-900 border-2 border-white/10 focus:border-amber-500 text-white font-bold text-sm outline-none transition-all placeholder:text-slate-600"
                        />
                    </div>
                    <Button
                        onClick={handleSubmitManual}
                        disabled={submitting || !txnId.trim()}
                        className="w-full h-16 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black uppercase tracking-widest text-sm shadow-2xl shadow-amber-500/20 transition-all active:scale-95"
                    >
                        {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "THIBITISHA MALIPO"}
                    </Button>
                </div>
            )}

            {/* ── TAB 2: Selcom Online ── */}
            {activeTab === "selcom" && (
                <div className="w-full max-w-md">
                    <div className="bg-slate-900 border border-white/5 rounded-[2rem] p-8 text-center space-y-6">
                        <div className="w-16 h-16 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center mx-auto">
                            <CreditCard className="w-8 h-8 text-purple-400" />
                        </div>
                        {selcomAvailable ? (
                            <>
                                <div>
                                    <h3 className="text-xl font-black text-white uppercase tracking-tight">Lipa Kupitia Selcom</h3>
                                    <p className="text-sm font-bold text-slate-400 mt-2">M-Pesa, Tigo Pesa, Airtel Money, au Kadi ya Benki</p>
                                </div>
                                {invoice.payment_link ? (
                                    <a href={invoice.payment_link} target="_blank" rel="noreferrer" className="block">
                                        <Button className="w-full h-14 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-black uppercase tracking-widest shadow-xl shadow-purple-500/20">
                                            <ExternalLink className="w-4 h-4 mr-2" />
                                            LIPA KUPITIA SELCOM
                                        </Button>
                                    </a>
                                ) : (
                                    <p className="text-sm font-bold text-slate-400">Link ya Selcom bado haijatengenezwa. Wasiliana nasi.</p>
                                )}
                            </>
                        ) : (
                            <>
                                <div>
                                    <h3 className="text-lg font-black text-slate-400 uppercase tracking-tight">Huduma Inakuja Hivi Karibuni</h3>
                                    <p className="text-sm font-bold text-slate-500 mt-2">
                                        Malipo ya online kupitia Selcom yatapatikana hivi karibuni. Kwa sasa, tafadhali lipa kwa simu (tab ya kwanza).
                                    </p>
                                </div>
                                <button
                                    onClick={() => setActiveTab("manual")}
                                    className="text-amber-400 font-black text-sm uppercase tracking-widest hover:text-amber-300 transition-colors"
                                >
                                    ← Rudi kwa Malipo ya Simu
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Footer */}
            <p className="mt-10 text-[9px] font-bold text-slate-600 uppercase tracking-widest text-center">
                © 2026 SMART MINE Tanzania · Hakuna malipo yasiyoidhinishwa
            </p>
        </div>
    )
}
