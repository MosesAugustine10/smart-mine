"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Building2, Save, Send, CheckCircle2, Loader2,
    AlertTriangle, ArrowLeft, Calendar, DollarSign,
    Pickaxe, Zap, Diamond, Layers, Activity, Truck, Package, Wallet, ShieldAlert,
    ChevronDown, ChevronRight
} from "lucide-react"



export default function SubscriptionManagementPage() {
    const params = useParams()
    const router = useRouter()
    const { toast } = useToast()
    const companyId = params.companyId as string

    const [company, setCompany] = useState<any>(null)
    const [subscription, setSubscription] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [sendingInvoice, setSendingInvoice] = useState(false)

    // Form state
    const [billingCycle, setBillingCycle] = useState("monthly")
    const [amount, setAmount] = useState("")
    const [selectedModules, setSelectedModules] = useState<any>({}) // Now an object
    const [inventoryOpen, setInventoryOpen] = useState(true)

    useEffect(() => {
        async function loadData() {
            const supabase = getSupabaseBrowserClient()
            const [{ data: co }, { data: sub }] = await Promise.all([
                supabase.from("companies").select("*").eq("id", companyId).single(),
                supabase.from("company_subscriptions").select("*").eq("company_id", companyId).maybeSingle()
            ])
            setCompany(co)
            
            if (sub) {
                setSubscription(sub)
                setBillingCycle(sub.billing_cycle || "monthly")
                setAmount(sub.amount?.toString() || "")
                
                // Handle both legacy string[] and new object structures
                const modules = sub.enabled_modules || []
                if (Array.isArray(modules)) {
                    const modObj: any = {}
                    modules.forEach((m: string) => {
                        if (m === 'inventory') {
                            modObj['inventory'] = {
                                blasting: true,
                                drilling: true,
                                diamond_drilling: true,
                                spare_parts: true
                            }
                        } else {
                            modObj[m] = true
                        }
                    })
                    setSelectedModules(modObj)
                } else {
                    setSelectedModules(modules)
                }
            } else {
                // Default modules for new subscription (Enabling all by default since UI is removed)
                const defaults: any = {
                    blasting: true,
                    drilling: true,
                    'diamond-drilling': true,
                    'material-handling': true,
                    geophysics: true,
                    fleet: true,
                    inventory: { blasting: true, drilling: true, diamond_drilling: true, spare_parts: true },
                    finance: true,
                    safety: true
                }
                setSelectedModules(defaults)
            }
            setLoading(false)
        }
        loadData()
    }, [companyId])



    const handleSave = async () => {
        setSaving(true)
        try {
            const supabase = getSupabaseBrowserClient()
            const now = new Date()
            const nextBilling = new Date(now)
            if (billingCycle === "monthly") nextBilling.setMonth(nextBilling.getMonth() + 1)
            else if (billingCycle === "quarterly") nextBilling.setMonth(nextBilling.getMonth() + 3)
            else nextBilling.setFullYear(nextBilling.getFullYear() + 1)

            const payload = {
                company_id: companyId,
                subscription_type: company?.category === "SMALL_SCALE" ? "small_scale" : "medium_scale",
                billing_cycle: billingCycle,
                amount: parseFloat(amount) || 0,
                enabled_modules: selectedModules, // Saving as JSONB object
                start_date: now.toISOString().split("T")[0],
                next_billing_date: nextBilling.toISOString().split("T")[0],
                status: parseFloat(amount) === 0 ? "trial" : "active",
                updated_at: now.toISOString()
            }

            if (subscription?.id) {
                await supabase.from("company_subscriptions").update(payload).eq("id", subscription.id)
            } else {
                const { data } = await supabase.from("company_subscriptions").insert(payload).select().single()
                setSubscription(data)
            }

            toast({ title: "✅ Imehifadhiwa!", description: "Usajili wa mteja umewekwa vizuri." })
        } catch (err: any) {
            toast({ title: "Hitilafu", description: err.message, variant: "destructive" })
        } finally {
            setSaving(false)
        }
    }

    const handleSendInvoice = async () => {
        if (!subscription?.id) {
            toast({ title: "Hifadhi kwanza", description: "Bonyeza 'Hifadhi' kabla ya kutuma invoice.", variant: "destructive" })
            return
        }
        setSendingInvoice(true)
        try {
            const res = await fetch("/api/selcom/create-invoice", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    company_id: companyId,
                    subscription_id: subscription.id,
                    amount: parseFloat(amount),
                    description: `SMART MINE – ${company?.name} (${billingCycle === "monthly" ? "Mwezi" : billingCycle === "quarterly" ? "Miezi 3" : "Mwaka"})`,
                    billing_cycle: billingCycle
                })
            })
            const result = await res.json()
            if (!res.ok) throw new Error(result.error)
            toast({
                title: "🧾 Invoice Imetumwa!",
                description: `Invoice Namba: ${result.invoice_number}. Link ya malipo imetengenezwa.`
            })
            if (result.payment_link) {
                window.open(`https://wa.me/${company?.phone?.replace(/\D/g, "")}?text=Habari ${company?.name}! Hii ni invoice yako ya SMART MINE: ${result.payment_link}`, "_blank")
            }
        } catch (err: any) {
            toast({ title: "Invoice Imeshindwa", description: err.message, variant: "destructive" })
        } finally {
            setSendingInvoice(false)
        }
    }

    const handleManualVerify = async () => {
        const supabase = getSupabaseBrowserClient()
        await supabase.from("company_subscriptions")
            .update({ status: "active", updated_at: new Date().toISOString() })
            .eq("company_id", companyId)
        toast({ title: "✅ Malipo Yamethibitishwa", description: "Mteja sasa ana access kamili." })
        setSubscription((prev: any) => ({ ...prev, status: "active" }))
    }

    if (loading) return (
        <div className="flex h-screen items-center justify-center">
            <Loader2 className="w-12 h-12 animate-spin text-amber-500" />
        </div>
    )

    const statusColors: Record<string, string> = {
        trial: "bg-blue-100 text-blue-700 border-blue-200",
        active: "bg-emerald-100 text-emerald-700 border-emerald-200",
        past_due: "bg-red-100 text-red-700 border-red-200",
        cancelled: "bg-slate-100 text-slate-500 border-slate-200",
    }

    return (
        <div className="flex-1 overflow-auto p-8 bg-slate-50/30 dark:bg-slate-950/30 space-y-8 pb-20">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => router.back()} className="h-10 px-4 rounded-xl font-bold text-[10px] uppercase tracking-widest border-2">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Rudi Nyuma
                </Button>
            </div>

            <div className="flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-6 text-center md:text-left">
                <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border-2 border-amber-500/20 flex items-center justify-center shrink-0">
                    <Building2 className="w-8 h-8 text-amber-500" />
                </div>
                <div className="flex flex-col items-center md:items-start">
                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">SMART MINE</h1>
                    <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{company?.name} · {company?.category?.replace("_", " ")}</p>
                    {subscription?.status && (
                        <Badge className={`mt-2 border font-black text-[8px] md:text-[9px] uppercase tracking-widest ${statusColors[subscription.status] || ""}`}>
                            {subscription.status === "trial" ? "⏳ MAJARIBIO" : subscription.status === "active" ? "✅ AKTIVE" : subscription.status === "past_due" ? "⚠️ DENI LIPO" : "❌ IMEFUTWA"}
                        </Badge>
                    )}
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
                {/* Billing Settings */}
                <Card className="border-0 shadow-xl rounded-[2.5rem] overflow-hidden">
                    <CardHeader className="bg-slate-900 text-white p-8">
                        <CardTitle className="flex items-center gap-3 text-sm font-black uppercase tracking-widest">
                            <DollarSign className="w-5 h-5 text-amber-400" /> Mipangilio ya Bei
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 space-y-6">
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Mzunguko wa Malipo (Billing Cycle)</label>
                            <select
                                value={billingCycle}
                                onChange={e => setBillingCycle(e.target.value)}
                                className="w-full h-14 px-5 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-black uppercase tracking-widest outline-none focus:border-amber-500"
                            >
                                <option value="monthly">Mwezi (Monthly)</option>
                                <option value="quarterly">Miezi 3 (Quarterly)</option>
                                <option value="annually">Mwaka (Annually)</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Kiasi cha Kulipa (TSh)</label>
                            <div className="relative">
                                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">TSh</span>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={e => setAmount(e.target.value)}
                                    placeholder="0"
                                    className="w-full h-14 pl-14 pr-5 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-xl font-black outline-none focus:border-amber-500 transition-all"
                                />
                            </div>
                            <p className="text-[10px] text-slate-400 mt-2 font-bold">Weka 0 kwa mteja wa majaribio ya bure.</p>
                        </div>

                        {subscription && (
                            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 md:p-6 space-y-3">
                                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4 text-[10px] font-black uppercase text-slate-500">
                                    <span>Ilianza</span>
                                    <span>{subscription.start_date}</span>
                                </div>
                                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4 text-[10px] font-black uppercase text-slate-500">
                                    <span>Billing Ijayo</span>
                                    <span>{subscription.next_billing_date}</span>
                                </div>
                                {subscription.trial_ends_at && (
                                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4 text-[10px] font-black uppercase text-amber-600">
                                        <span>Majaribio Yanamalizika</span>
                                        <span>{new Date(subscription.trial_ends_at).toLocaleDateString()}</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>


            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="h-16 md:h-20 rounded-2xl bg-slate-900 hover:bg-black text-white font-black uppercase text-[10px] md:text-[11px] tracking-widest shadow-xl"
                >
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-4 h-4 mr-2" />Hifadhi</>}
                </Button>

                <Button
                    onClick={handleSendInvoice}
                    disabled={sendingInvoice}
                    className="h-16 md:h-20 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black uppercase text-[10px] md:text-[11px] tracking-widest shadow-xl shadow-amber-500/20"
                >
                    {sendingInvoice ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-4 h-4 mr-2" />Tuma Invoice</>}
                </Button>

                <Button
                    onClick={handleManualVerify}
                    variant="outline"
                    className="h-16 md:h-20 rounded-2xl border-2 border-emerald-500/50 text-emerald-700 hover:bg-emerald-50 font-black uppercase text-[10px] md:text-[11px] tracking-widest px-4 leading-tight"
                >
                    <CheckCircle2 className="w-4 h-4 mr-2 shrink-0" />
                    Thibitisha Malipo
                </Button>
            </div>

            {/* Warning if past_due */}
            {subscription?.status === "past_due" && (
                <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 flex items-center gap-4">
                    <AlertTriangle className="w-8 h-8 text-red-500 shrink-0" />
                    <div>
                        <p className="font-black text-sm text-red-700 uppercase">Akaunti Imezuiwa</p>
                        <p className="text-xs font-bold text-red-500 mt-1">Mteja hana access. Thibitisha malipo au tuma invoice mpya kumruhusu aingie mfumo.</p>
                    </div>
                </div>
            )}
        </div>
    )
}
