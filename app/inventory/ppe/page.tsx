"use client"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  ShieldCheck, Package, ShoppingCart, History, 
  ArrowRight, ShieldAlert, Loader2, CheckCircle2 
} from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { usePermissions } from "@/hooks/use-permissions"
import { useTranslation } from "@/components/language-context"
import { useToast } from "@/components/ui/use-toast"

export default function PPEInventoryPage() {
    const { t } = useTranslation()
    const { role, canEdit, canRequest } = usePermissions('inventory')
    const [items, setItems] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [requestData, setRequestData] = useState({ itemId: '', quantity: 1 })
    const { toast } = useToast()

    useEffect(() => {
        async function fetchPPE() {
            const supabase = getSupabaseBrowserClient()
            const { data } = await supabase
                .from('inventory_items')
                .select('*')
                .eq('category', 'PPE')
            
            if (data) setItems(data)
            setLoading(false)
        }
        fetchPPE()
    }, [])

    const handleRequest = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!requestData.itemId) return

        setSubmitting(true)
        const supabase = getSupabaseBrowserClient()
        const { data: { session } } = await supabase.auth.getSession()

        const { error } = await supabase
            .from('inventory_requests')
            .insert({
                item_id: requestData.itemId,
                quantity: requestData.quantity,
                requester_id: session?.user?.id,
                status: 'PENDING'
            })

        if (!error) {
            toast({
                title: "Request Submitted (Imewasilishwa)",
                description: "Your PPE request has been sent to the Stock Keeper for approval.",
                variant: "default",
            })
            setRequestData({ itemId: '', quantity: 1 })
        } else {
            toast({
                title: "Error (Hitilafu)",
                description: "Failed to submit request. Please ensure you are authorized.",
                variant: "destructive",
            })
        }
        setSubmitting(false)
    }

    if (loading) return (
        <div className="h-screen w-full flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-rose-600" />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading PPE Safety Ledger...</p>
        </div>
    )

    return (
        <div className="flex-1 overflow-auto p-8 space-y-10 bg-slate-50/30 dark:bg-slate-950/30 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <DashboardHeader 
                    title="PPE & General Inventory" 
                    description="Safety equipment management: Gloves, Helmets, Boots, and Protective Gear." 
                />
                <div className="flex gap-3">
                    <Button variant="outline" className="h-12 rounded-2xl font-black uppercase text-[10px] tracking-widest border-2">
                        <History className="w-4 h-4 mr-2" />
                        Usage History
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Inventory List */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {items.map((item) => (
                            <Card key={item.id} className="border-2 border-slate-100 rounded-[2rem] overflow-hidden hover:shadow-xl transition-all">
                                <CardContent className="p-8">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="p-4 bg-rose-50 rounded-2xl text-rose-600">
                                            <ShieldCheck className="w-6 h-6" />
                                        </div>
                                        <Badge variant={item.stock_quantity > 10 ? "secondary" : "destructive"} className="rounded-lg text-[9px] font-black uppercase">
                                            {item.stock_quantity > 10 ? 'In Stock' : 'Low Stock'}
                                        </Badge>
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none mb-2">
                                        {item.name}
                                    </h3>
                                    <p className="text-4xl font-black text-slate-900 mb-6 italic">
                                        {item.stock_quantity} <span className="text-sm not-italic font-black text-slate-400 uppercase">{item.unit}</span>
                                    </p>
                                    {canEdit && (
                                        <Button className="w-full h-12 rounded-xl bg-slate-900 font-black uppercase text-[10px] tracking-widest">
                                            Update Stock Count
                                        </Button>
                                    )}
                                    {canRequest && (
                                        <Button 
                                            variant="outline" 
                                            className="w-full h-12 rounded-xl border-2 font-black uppercase text-[10px] tracking-widest hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-colors"
                                            onClick={() => setRequestData({ ...requestData, itemId: item.id })}
                                        >
                                            <ShoppingCart className="w-4 h-4 mr-2" />
                                            Request Item
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Request Form */}
                {canRequest && (
                    <Card className="border-2 border-slate-900 rounded-[3rem] p-10 bg-white shadow-2xl sticky top-8 h-fit">
                        <CardHeader className="p-0 mb-8">
                            <CardTitle className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
                                <Package className="w-6 h-6 text-rose-600" />
                                PPE Request
                            </CardTitle>
                            <CardDescription className="text-xs font-bold uppercase tracking-widest text-slate-400">Submit a requisition for safety gear</CardDescription>
                        </CardHeader>
                        <form onSubmit={handleRequest} className="space-y-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Selected Item</Label>
                                <select 
                                    className="w-full h-14 rounded-2xl border-2 px-4 font-bold text-sm bg-slate-50 focus:border-slate-900 transition-colors"
                                    value={requestData.itemId}
                                    onChange={(e) => setRequestData({ ...requestData, itemId: e.target.value })}
                                    required
                                >
                                    <option value="">Choose item...</option>
                                    {items.map(item => (
                                        <option key={item.id} value={item.id}>{item.name} ({item.stock_quantity} available)</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Requisition Quantity</Label>
                                <Input 
                                    type="number" 
                                    min="1"
                                    className="h-14 rounded-2xl border-2 font-bold focus:border-slate-900 transition-colors"
                                    value={requestData.quantity}
                                    onChange={(e) => setRequestData({ ...requestData, quantity: parseInt(e.target.value) })}
                                    required
                                />
                            </div>

                            <div className="p-6 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                                <div className="flex gap-3">
                                    <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0" />
                                    <p className="text-[10px] font-bold text-slate-500 leading-relaxed uppercase">
                                        All requests are logged for safety compliance. Stock Keepers will verify size availability upon approval.
                                    </p>
                                </div>
                            </div>

                            <Button 
                                className="w-full h-16 rounded-[1.5rem] bg-rose-600 hover:bg-rose-700 text-white font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-rose-600/20"
                                disabled={submitting || !requestData.itemId}
                            >
                                {submitting ? <Loader2 className="animate-spin h-5 w-5" /> : (
                                    <>
                                        Submit Request <ArrowRight className="ml-2 w-4 h-4" />
                                    </>
                                )}
                            </Button>
                        </form>
                    </Card>
                )}

                {/* Status for Stock Keeper */}
                {role === 'Stock Keeper' && (
                    <Card className="border-2 border-emerald-500 rounded-[3rem] p-10 bg-white shadow-2xl h-fit">
                        <CardHeader className="p-0 mb-8">
                            <CardTitle className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
                                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                                Pending Actions
                            </CardTitle>
                        </CardHeader>
                        <div className="space-y-4">
                            <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-100 italic font-black text-sm text-center text-emerald-700">
                                0 Pending Requests
                            </div>
                            <Button className="w-full h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-[10px] tracking-widest">
                                View Request Dashboard
                            </Button>
                        </div>
                    </Card>
                )}
            </div>
        </div>
    )
}
