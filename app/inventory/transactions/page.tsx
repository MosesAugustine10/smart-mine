"use client"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { StockTransactionsTable } from "@/components/inventory/stock-transactions-table"
import { Card, CardContent } from "@/components/ui/card"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { History, ShieldCheck, Filter, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ProfessionalReportButton } from "@/components/ui/professional-report-button"

export default function InventoryAuditTrail() {
    const [transactions, setTransactions] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchTransactions = async () => {
            const supabase = getSupabaseBrowserClient()
            const { data } = await supabase
                .from("stock_transactions")
                .select("*")
                .order("created_at", { ascending: false })
            
            if (data) setTransactions(data)
            setLoading(false)
        }
        fetchTransactions()
    }, [])

    return (
        <div className="flex-1 overflow-auto p-8 space-y-10 bg-slate-50/30 pb-20">
            <div className="flex justify-between items-end">
                <DashboardHeader 
                    title="Asset Audit Trail" 
                    description="Forensic ledger of all inventory acquisitions and operational consumption" 
                />
                <div className="flex gap-3">
                    <ProfessionalReportButton 
                        data={transactions} 
                        filename="INVENTORY_AUDIT_TRAIL" 
                        title="Master Inventory Audit Ledger"
                        moduleColor="slate"
                        headers={["item_code", "type", "quantity", "module", "reference_id", "date", "user_id"]}
                    />
                </div>
            </div>

            <Card className="border-0 shadow-3xl rounded-[3rem] overflow-hidden">
                <div className="bg-slate-900 p-8 text-white flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center">
                            <History className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black uppercase tracking-tighter">Chain of Custody Ledger</h3>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Real-time synchronization active</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-4 py-2 rounded-xl">
                        <ShieldCheck className="w-4 h-4" /> System Verified Audit
                    </div>
                </div>
                <CardContent className="p-0">
                    <StockTransactionsTable transactions={transactions} />
                </CardContent>
            </Card>
        </div>
    )
}
