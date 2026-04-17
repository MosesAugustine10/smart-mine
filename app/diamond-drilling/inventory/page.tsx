"use client"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { InventoryTable } from "@/components/inventory/inventory-table"
import { QRScanner } from "@/components/qr-scanner"
import { Button } from "@/components/ui/button"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { Plus, QrCode, Gem, History, BarChart3, FlaskConical, CircleCheck } from "lucide-react"
import { ProfessionalReportButton } from "@/components/ui/professional-report-button"
import Link from "next/link"

export default function DiamondInventoryPage() {
  const { toast } = useToast()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showScanner, setShowScanner] = useState(false)

  useEffect(() => {
    async function fetchInventory() {
        const supabase = getSupabaseBrowserClient()
        const { data } = await supabase
            .from("inventory_items")
            .select("*")
            .eq("category", "DIAMOND_DRILLING")
            .order("updated_at", { ascending: false })
        
        if (data) setItems(data)
        setLoading(false)
    }
    fetchInventory()
  }, [])

  return (
    <div className="flex-1 overflow-auto p-8 space-y-8 bg-slate-50/30 dark:bg-slate-950/30">
        <DashboardHeader 
            title="Diamond Core Tooling Ledger" 
            description="Tracking high-value exploration assets and lithological consumables" 
        />

        <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-3xl border-2 border-slate-100 shadow-sm">
            <div className="flex gap-2">
                <Link href="/inventory/transactions">
                    <Button variant="outline" className="h-12 rounded-2xl font-black uppercase text-[10px] tracking-widest border-2">
                        <History className="w-4 h-4 mr-2" />
                        Chain of Custody
                    </Button>
                </Link>
                <Button variant="outline" className="h-12 rounded-2xl font-black uppercase text-[10px] tracking-widest border-2">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Asset Utilization
                </Button>
                <ProfessionalReportButton 
                    data={items} 
                    filename="DIAMOND_INVENTORY_AUDIT" 
                    title="Diamond Core Asset Ledger" 
                    moduleColor="emerald"
                    headers={["item_code", "item_name", "batch_number", "current_stock", "unit", "unit_cost", "location", "supplier", "last_updated"]}
                />
            </div>
            <div className="flex gap-2">
                <Button 
                    onClick={() => setShowScanner(!showScanner)}
                    className="h-12 rounded-2xl bg-emerald-950 text-white font-black uppercase text-[10px] tracking-widest transition-all hover:bg-black"
                >
                    <QrCode className="w-4 h-4 mr-2" />
                    {showScanner ? "Deactivate Optics" : "Digital Asset Scan"}
                </Button>
                <Link href="/diamond-drilling/inventory/new">
                    <Button className="h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-[10px] tracking-widest shadow-lg shadow-emerald-500/20">
                        <Plus className="w-4 h-4 mr-2" />
                        Register Diamonds
                    </Button>
                </Link>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
                <InventoryTable items={items} onTransfer={(item) => toast({ title: "Movement Auth", description: `Authorizing removal of ${item.item_name} from secure hold.` })} />
            </div>

            <div className="space-y-8">
                {showScanner && (
                    <div className="animate-in slide-in-from-right-4 duration-500">
                        <QRScanner module="diamond" onScan={(d) => { toast({ title: "SKU Resolved", description: `Reference: ${d}` }); setShowScanner(false); }} />
                    </div>
                )}

                <div className="bg-emerald-950 text-white p-8 rounded-[3rem] shadow-2xl relative overflow-hidden">
                    <div className="relative z-10 flex flex-col gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                                <FlaskConical className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-xs font-black uppercase opacity-60">Consumable Health</p>
                                <p className="text-sm font-bold text-emerald-100">Lab Trays: STABLE</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                <span>Drill Fluid Levels</span>
                                <span>94%</span>
                            </div>
                            <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 w-[94%]" />
                            </div>
                        </div>

                        <div className="flex items-center gap-2 pt-4 text-emerald-400">
                           <CircleCheck className="w-4 h-4" />
                           <span className="text-[10px] font-bold uppercase tracking-widest">Enterprise Compliance Verified</span>
                        </div>
                    </div>
                    <Gem className="absolute -bottom-10 -right-10 w-48 h-48 opacity-5 text-white" />
                </div>
            </div>
        </div>
    </div>
  )
}
