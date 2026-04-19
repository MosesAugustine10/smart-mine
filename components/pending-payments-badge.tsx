"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Clock } from "lucide-react"

export function PendingPaymentsBadge() {
    const [count, setCount] = useState(0)

    useEffect(() => {
        async function fetchCount() {
            const supabase = getSupabaseBrowserClient()
            const { count: c } = await supabase
                .from("invoices")
                .select("*", { count: "exact", head: true })
                .eq("status", "pending_verification")
            setCount(c || 0)
        }

        fetchCount()
        const interval = setInterval(fetchCount, 30000) // Poll every 30s
        return () => clearInterval(interval)
    }, [])

    return (
        <Link
            href="/super-admin/payments/pending-verification"
            className="relative flex items-center gap-2 h-10 px-4 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all group"
            title={`${count} malipo yanayosubiri uthibitisho`}
        >
            <Clock className="w-4 h-4 text-slate-500 group-hover:text-amber-500 transition-colors" />
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300 hidden sm:block">
                Malipo
            </span>
            {count > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center px-1.5 shadow-lg shadow-red-500/30 animate-pulse">
                    {count > 99 ? "99+" : count}
                </span>
            )}
        </Link>
    )
}
