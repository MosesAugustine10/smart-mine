"use client"

import { DashboardHeader } from "@/components/dashboard-header"
import { InventoryForm } from "@/components/inventory/inventory-form"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function NewFleetInventoryPage() {
    return (
        <div className="flex-1 overflow-auto p-8 space-y-8 bg-slate-50/30 dark:bg-slate-950/30 pb-20">
            <div className="flex items-center gap-4">
                <Link href="/fleet/inventory">
                    <Button variant="ghost" className="rounded-xl hover:bg-white p-2">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <DashboardHeader title="Mechanical Spare Registry" description="Registering critical technical assets for the heavy earthmoving fleet" />
            </div>

            <InventoryForm category="FLEET" />
        </div>
    )
}
