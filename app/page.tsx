"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { Mountain, Loader2 } from "lucide-react"

export default function RootPage() {
    const { profile, loading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!loading) {
            if (profile?.role === 'SUPER_ADMIN') {
                router.replace("/super-admin")
            } else if (profile) {
                router.replace("/admin")
            } else {
                router.replace("/login")
            }
        }
    }, [profile, loading, router])

    return (
        <div className="flex h-screen w-full items-center justify-center bg-slate-950 flex-col gap-5">
            <div className="relative">
                <div className="w-20 h-20 rounded-[2rem] bg-amber-500 flex items-center justify-center shadow-2xl shadow-amber-500/30 animate-pulse">
                    <Mountain className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center border border-white/10">
                    <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
                </div>
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-500">Initializing Platform...</p>
        </div>
    )
}
