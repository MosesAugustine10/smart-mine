"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function DemoHub() {
    const router = useRouter()

    useEffect(() => {
        router.replace("/")
    }, [router])

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Redirecting...</p>
        </div>
    )
}
