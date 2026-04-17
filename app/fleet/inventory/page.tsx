import { getSupabaseServerClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard-header"
import { InventoryTable } from "@/components/inventory/inventory-table"
import { ProfessionalReportButton } from "@/components/ui/professional-report-button"
import { Button } from "@/components/ui/button"
import { Plus, Package, History, DollarSign, Calculator, AlertTriangle, ShieldCheck } from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function FleetInventoryPage() {
    const supabase = await getSupabaseServerClient()

    const { data: itemsData } = await supabase
        .from("inventory_items")
        .select("*")
        .eq("category", "FLEET")
        .order("updated_at", { ascending: false })

    const items = itemsData || []

    // Aggregations
    const totalItems = items.reduce((sum, p) => sum + (p.current_stock || 0), 0)
    const lowStock = items.filter(p => (p.current_stock || 0) < (p.minimum_stock || 5)).length
    const totalValue = items.reduce((sum, p) => sum + ((p.current_stock || 0) * (p.unit_cost || 0)), 0)

    return (
        <div className="flex-1 overflow-auto p-8 space-y-10 bg-slate-50/30 dark:bg-slate-950/30 pb-20">
            <DashboardHeader 
                title="Fleet Strategy & Spares Hub" 
                description="Mission-critical mechanical asset management for the mobile equipment fleet" 
            />

            <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-3xl border-2 border-slate-100 shadow-sm transition-all hover:shadow-md">
                <div className="flex gap-2">
                    <Link href="/inventory/transactions">
                        <Button variant="outline" className="h-12 rounded-2xl font-black uppercase text-[10px] tracking-widest border-2">
                            <History className="w-4 h-4 mr-2" />
                            Audit Ledger
                        </Button>
                    </Link>
                    <ProfessionalReportButton 
                        data={items} 
                        filename="FLEET_INVENTORY_AUDIT" 
                        title="Fleet Technical Asset Ledger" 
                        moduleColor="blue"
                        headers={["item_code", "item_name", "batch_number", "current_stock", "unit", "unit_cost", "location", "supplier", "last_updated"]}
                    />
                </div>
                <div className="flex gap-2">
                    <Link href="/fleet/inventory/new">
                        <Button className="h-12 px-8 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-blue-500/20 transition-all hover:scale-[1.02]">
                            <Plus className="w-4 h-4 mr-2" />
                            Provision New Spare
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white relative overflow-hidden group">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Portfolio Valuation</p>
                    <p className="text-3xl font-black tracking-tighter mt-2 flex items-center gap-2 italic">
                        <span className="not-italic text-sm text-blue-400">TZS</span> {totalValue.toLocaleString()}
                    </p>
                    <Calculator className="absolute -bottom-6 -right-6 h-32 w-32 opacity-5" />
                </div>
                <div className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Physical Quantum</p>
                    <p className="text-3xl font-black tracking-tighter mt-2 text-slate-900">{totalItems} <span className="text-xs text-slate-400">UNITS</span></p>
                </div>
                <div className={`p-8 rounded-[2.5rem] border-2 shadow-sm ${lowStock > 0 ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'}`}>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Health Index</p>
                    <div className="flex items-center justify-between mt-2">
                        <p className={`text-3xl font-black tracking-tighter ${lowStock > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                            {lowStock > 0 ? `${lowStock} ALERT(S)` : 'STABLE'}
                        </p>
                        {lowStock === 0 && <ShieldCheck className="w-8 h-8 text-emerald-500" />}
                    </div>
                </div>
            </div>

            <div className="space-y-4 pt-4 text-center">
                 <h3 className="text-sm font-black uppercase tracking-[0.4em] text-slate-400">Master Technical Ledger</h3>
                 <InventoryTable items={items} />
            </div>
        </div>
    )
}
