"use client"

import React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Mountain, HardHat, Building2, ShieldCheck, ArrowRight } from "lucide-react"

export default function UnifiedLoginPage() {
    const vibe = () => { if (typeof navigator !== 'undefined') navigator.vibrate?.(50) }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 transition-colors duration-500">
            {/* Ambient Background Glows */}
            <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-amber-500/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />
            </div>

            <div className="relative z-10 w-full max-w-4xl space-y-12">
                {/* Brand */}
                <div className="text-center space-y-4">
                    <div className="w-20 h-20 mx-auto rounded-[2rem] bg-amber-500 flex items-center justify-center shadow-2xl shadow-amber-500/30">
                        <Mountain className="w-10 h-10 text-white" />
                    </div>
                    <div>
                        <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">
                            Karibu <span className="text-amber-500">SMART MINE</span>
                        </h1>
                        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.4em] mt-2">
                            Chagua jinsi unavyotaka kuingia
                        </p>
                    </div>
                </div>

                {/* Role Cards */}
                <div className="grid md:grid-cols-2 gap-8">
                    {/* CARD 1: Small Scale */}
                    <Link href="/login/small" onClick={vibe} className="group flex flex-col bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[3rem] p-10 hover:border-amber-500/50 hover:shadow-2xl hover:shadow-amber-500/10 transition-all duration-500 transform hover:-translate-y-2">
                        <div className="w-16 h-16 rounded-[1.5rem] bg-amber-500 flex items-center justify-center shadow-xl shadow-amber-500/20 mb-8 group-hover:scale-110 transition-transform">
                            <Pickaxe className="w-8 h-8 text-white" />
                        </div>
                        <div className="space-y-4 flex-1">
                            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight italic">
                                MCHIMBAJI MDOGO / <br />MSIMAMIZI WA SITE
                            </h3>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                                Kwa wachimbaji binafsi na wasimamizi wa mashimo. Ingia kwa namba yako ya simu na PIN.
                            </p>
                        </div>
                        <Button className="w-full h-14 mt-10 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-amber-500/20">
                            INGIA KAMA MCHIMBAJI MDOGO <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </Link>

                    {/* CARD 2: Medium Scale */}
                    <Link href="/login/medium" onClick={vibe} className="group flex flex-col bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[3rem] p-10 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 transform hover:-translate-y-2">
                        <div className="w-16 h-16 rounded-[1.5rem] bg-blue-600 flex items-center justify-center shadow-xl shadow-blue-500/20 mb-8 group-hover:scale-110 transition-transform">
                            <Building2 className="w-8 h-8 text-white" />
                        </div>
                        <div className="space-y-4 flex-1">
                            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight italic">
                                MGODI WA KATI / <br />MKANDARASI / MSHAURI
                            </h3>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                                Kwa makampuni, wakandarasi, na wataalamu wa madini. Ingia kwa email na password.
                            </p>
                        </div>
                        <Button className="w-full h-14 mt-10 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-blue-500/20">
                            INGIA KAMA MGODI WA KATI <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </Link>
                </div>

                {/* Footer Security Badge */}
                <div className="flex flex-col items-center gap-4 py-8">
                    <div className="flex items-center gap-2 px-6 py-2 bg-slate-900 dark:bg-white/5 rounded-full border border-white/10">
                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                        <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">Mfumo Umelindwa kwa TOTP & Encryption</span>
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">© 2026 SMART MINE TANZANIA</p>
                </div>
            </div>
        </div>
    )
}

const Pickaxe = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M7 22l3.35-3.35" /><path d="M10.35 18.65L14 15l-4-4-3.65 3.65" /><path d="M14 15l7.65-7.65" /><path d="M21 9a2.5 2.5 0 0 0 -2-2L14 3a2.5 2.5 0 0 0 -2 2l4 4a2.5 2.5 0 0 0 2 2z" /><path d="M11 7l3 3" />
    </svg>
)
