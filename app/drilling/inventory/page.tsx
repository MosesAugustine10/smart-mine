"use client"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { InventoryTable } from "@/components/inventory/inventory-table"
import { QRScanner } from "@/components/qr-scanner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { Plus, QrCode, ArrowRightLeft, History, BarChart3, Wrench, ShieldCheck } from "lucide-react"
import { ProfessionalReportButton } from "@/components/ui/professional-report-button"
import Link from "next/link"

export default function DrillingInventoryPage() {
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
            .eq("category", "DRILLING")
            .order("updated_at", { ascending: false })
        
        if (data) setItems(data)
        setLoading(false)
    }
    fetchInventory()
  }, [])

  return (
    <div className="flex-1 overflow-auto p-8 space-y-8 bg-slate-50/30 dark:bg-slate-950/30">
        <DashboardHeader 
            title="Drilling Tooling & Assets" 
            description="Enterprise lifecycle management for rigs, bits, and consumables" 
        />

        <div className="grid gap-6 md:grid-cols-4">
            <div className="md:col-span-3 flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-3xl border-2 border-slate-100 shadow-sm transition-all hover:shadow-md">
                <div className="flex gap-2">
                    <Link href="/inventory/transactions">
                        <Button variant="outline" className="h-12 rounded-2xl font-black uppercase text-[10px] tracking-widest border-2">
                            <History className="w-4 h-4 mr-2" />
                            Audit Ledger
                        </Button>
                    </Link>
                    <Button variant="outline" className="h-12 rounded-2xl font-black uppercase text-[10px] tracking-widest border-2">
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Usage Analytics
                    </Button>
                    <ProfessionalReportButton 
                        data={items} 
                        filename="DRILLING_INVENTORY_AUDIT" 
                        title="Drilling Asset Ledger" 
                        moduleColor="blue"
                        headers={["item_code", "item_name", "batch_number", "current_stock", "unit", "unit_cost", "location", "supplier", "last_updated"]}
                    />
                </div>
                <div className="flex gap-2">
                    <Button 
                        onClick={() => setShowScanner(!showScanner)}
                        className={`h-12 rounded-2xl border-2 font-black uppercase text-[10px] tracking-widest transition-all ${showScanner ? 'bg-red-50 text-red-600 border-red-200' : 'bg-slate-900 text-white border-slate-900 hover:bg-black'}`}
                    >
                        <QrCode className="w-4 h-4 mr-2" />
                        {showScanner ? "Close Scanner" : "Scan Asset QR"}
                    </Button>
                    <Link href="/drilling/inventory/new">
                        <Button className="h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-[10px] tracking-widest shadow-lg shadow-blue-500/20">
                            <Plus className="w-4 h-4 mr-2" />
                            Provision Asset
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="bg-gradient-to-br from-blue-600 to-indigo-800 rounded-3xl p-6 text-white shadow-xl shadow-blue-500/20 flex items-center justify-between">
                <div>
                   <p className="text-[10px] font-black uppercase tracking-widest opacity-60">System Integrity</p>
                   <p className="text-xl font-black uppercase mt-1 tracking-tighter">OPTIMAL</p>
                </div>
                <ShieldCheck className="w-10 h-10 opacity-40" />
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
                <h3 className="text-sm font-black uppercase tracking-[0.3em] text-slate-400 pl-4">Operational Ledger</h3>
                <InventoryTable items={items} />
            </div>

            <div className="space-y-8">
                {showScanner && (
                    <div className="animate-in zoom-in-95 duration-300">
                        <QRScanner module="drilling" onScan={(d) => { toast({ title: "Asset Identified", description: `Serialized Link: ${d}` }); setShowScanner(false); }} />
                    </div>
                )}

                <div className="bg-white dark:bg-slate-950 p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-sm space-y-8">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600">
                            <Wrench className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs font-black uppercase opacity-40">Maintenance Alerts</p>
                            <p className="text-sm font-bold">2 Bits Near End-of-Life</p>
                        </div>
                    </div>
                    
                    <div className="space-y-4 pt-4 border-t-2 border-slate-50">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                            <span>Inventory Flow (30d)</span>
                            <span className="text-emerald-600">+12% Gain</span>
                        </div>
                        <div className="grid grid-cols-7 gap-1 h-12">
                            {[40, 60, 45, 90, 65, 30, 80].map((h, i) => (
                                <div key={i} className="bg-blue-600 rounded-lg self-end transition-all hover:scale-110 cursor-help" style={{ height: `${h}%` }} title={`Day ${i+1}: ${h} units`} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  )
}
