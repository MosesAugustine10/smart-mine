"use client"

import { DashboardHeader } from "@/components/dashboard-header"
import { InventoryForm } from "@/components/inventory/inventory-form"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function NewDrillingInventoryPage() {
    return (
        <div className="flex-1 overflow-auto p-8 space-y-8 bg-slate-50/30 dark:bg-slate-950/30 pb-20">
            <div className="flex items-center gap-4">
                <Link href="/drilling/inventory">
                    <Button variant="ghost" className="rounded-xl hover:bg-white p-2">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <DashboardHeader title="Drilling Asset Registry" description="Ingesting new rigs, bits, and technical consumables into the fleet ledger" />
            </div>

            <InventoryForm category="DRILLING" />
        </div>
    )
}
