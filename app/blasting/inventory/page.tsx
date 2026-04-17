"use client"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { InventoryTable } from "@/components/inventory/inventory-table"
import { QRScanner } from "@/components/qr-scanner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { Plus, Package, ArrowRightLeft, History, BarChart3, QrCode } from "lucide-react"
import { ProfessionalReportButton } from "@/components/ui/professional-report-button"
import Link from "next/link"

export default function BlastingInventoryPage() {
  const { toast } = useToast()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showScanner, setShowScanner] = useState(false)

  // Fetch items from explosive_products (Assumed table name from previous context)
  useEffect(() => {
    async function fetchInventory() {
        const supabase = getSupabaseBrowserClient()
        const { data } = await supabase
            .from("inventory_items")
            .select("*")
            .eq("category", "BLASTING")
            .order("updated_at", { ascending: false })
        
        if (data) setItems(data)
        setLoading(false)
    }
    fetchInventory()
  }, [])

  const handleScan = (data: string) => {
    toast({
        title: "Optical Link Established",
        description: `Product ID: ${data} has been retrieved from the master ledger.`
    })
    setShowScanner(false)
  }

  return (
    <div className="flex-1 overflow-auto p-8 space-y-8 bg-slate-50/30 dark:bg-slate-950/30">
        <DashboardHeader 
            title="Explosives & Accessories Inventory" 
            description="High-security tracking for initiation systems and bulk materials" 
        />

        <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-3xl border-2 border-slate-100 shadow-sm">
            <div className="flex gap-2">
                <Link href="/inventory/transactions">
                    <Button variant="outline" className="h-12 rounded-2xl font-black uppercase text-[10px] tracking-widest border-2">
                        <History className="w-4 h-4 mr-2" />
                        Transaction Audit
                    </Button>
                </Link>
                <Button variant="outline" className="h-12 rounded-2xl font-black uppercase text-[10px] tracking-widest border-2">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Consumption Analytics
                </Button>
                <ProfessionalReportButton 
                    data={items} 
                    filename="BLASTING_INVENTORY_AUDIT" 
                    title="Explosives & Initiation Registry" 
                    moduleColor="orange"
                    headers={["item_code", "item_name", "batch_number", "current_stock", "unit", "unit_cost", "location", "supplier", "last_updated"]}
                />
            </div>
            <div className="flex gap-2">
                <Button 
                    onClick={() => setShowScanner(!showScanner)}
                    className="h-12 rounded-2xl bg-slate-900 border-2 border-slate-900 text-white font-black uppercase text-[10px] tracking-widest transition-all hover:bg-black"
                >
                    <QrCode className="w-4 h-4 mr-2" />
                    {showScanner ? "Close Scanner" : "Initiate QR Flow"}
                </Button>
                <Link href="/blasting/inventory/new">
                    <Button className="h-12 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-black uppercase text-[10px] tracking-widest shadow-lg shadow-orange-500/20">
                        <Plus className="w-4 h-4 mr-2" />
                        Register New Stock
                    </Button>
                </Link>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
                <InventoryTable items={items} onTransfer={(item) => toast({ title: "Transfer Initiated", description: `Authorizing logic for ${item.item_name}` })} />
            </div>

            <div className="space-y-8">
                {showScanner && (
                    <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                        <QRScanner module="blasting" onScan={handleScan} />
                    </div>
                )}

                <Card className="border-2 border-slate-100 rounded-[2.5rem] shadow-sm overflow-hidden">
                    <CardHeader className="bg-slate-50 border-b-2 py-6 px-8 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-900">Health Monitoring</CardTitle>
                            <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest">Global Stock Velocity</p>
                        </div>
                        <Package className="w-5 h-5 text-orange-600" />
                    </CardHeader>
                    <CardContent className="p-8 space-y-6">
                        <div className="space-y-2">
                             <div className="flex justify-between items-end">
                                <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Bulk ANFO Efficiency</span>
                                <span className="text-xs font-black">82%</span>
                             </div>
                             <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-orange-500 w-[82%]" />
                             </div>
                        </div>
                        <div className="space-y-2">
                             <div className="flex justify-between items-end">
                                <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Detonator Reserves</span>
                                <span className="text-xs font-black text-red-500">12% - CRITICAL</span>
                             </div>
                             <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-red-500 w-[12%]" />
                             </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
  )
}
