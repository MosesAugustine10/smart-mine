"use client"

/**
 * app/chimbo/data_entry/page.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Supervisor Data Entry Hub
 * As requested: "Supervisor (Site Worker) sees Data Entry Forms only."
 * This page serves as a high-end form launcher for supervisors.
 */

import { useRouter } from "next/navigation"
import { 
  Pickaxe, Zap, AlertTriangle, Package, Fuel, 
  BarChart3, Truck, ShieldCheck, ChevronRight,
  ClipboardList, Clock, History, AlertCircle
} from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { getActiveAccount } from "@/lib/chimbo-auth"

export default function SupervisorDataEntryHub() {
  const router = useRouter()
  const [account, setAccount] = useState<any>(null)
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const acc = getActiveAccount()
    if (!acc) {
      router.replace("/chimbo")
      return
    }
    if (acc.role === "MANAGER") {
      router.replace("/chimbo/dashboard")
      return
    }
    setAccount(acc)

    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [router])

  if (!account) return null

  const vibe = () => { if (typeof navigator !== 'undefined') navigator.vibrate?.(40) }

  const FORMS = [
    { label: "Shimo Leo",    icon: Pickaxe,    href: "/chimbo/shimo-leo",    color: "bg-orange-500",  desc: "Uzalishaji & Mizigo" },
    { label: "Jackhammer",   icon: Zap,        href: "/chimbo/jackhammer",   color: "bg-red-500",     desc: "Muda wa Mashine" },
    { label: "Kulipua",      icon: AlertTriangle, href: "/chimbo/kulipua",  color: "bg-rose-600",    desc: "Vipimo vya Blast" },
    { label: "Ghala/Stoo",   icon: Package,    href: "/chimbo/ghala",        color: "bg-amber-500",   desc: "Kutoa/Kuingiza Vifaa" },
    { label: "Mafuta",       icon: Fuel,       href: "/chimbo/mafuta",       color: "bg-blue-500",    desc: "Matumizi ya Fuel" },
    { label: "Assay",        icon: BarChart3,  href: "/chimbo/assay",        color: "bg-violet-500",  desc: "Matokeo ya Maabara" },
    { label: "Usafirishaji", icon: Truck,      href: "/chimbo/usafirishaji", color: "bg-sky-500",     desc: "Safari & Mizigo" },
    { label: "Ripoti Ajali", icon: ShieldCheck,href: "/chimbo/ajali",        color: "bg-rose-700",    desc: "Taarifa za Usalama" },
  ]

  return (
    <div className="p-4 space-y-8 pb-32 transition-colors duration-500 min-h-screen bg-slate-50 dark:bg-[#020617]">
      
      {/* ── Header ── */}
      <div className="pt-8 space-y-2">
        <div className="flex items-center gap-2">
          <div className="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-[8px] font-black text-amber-600 uppercase tracking-widest">
            Site Supervisor
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{time.toLocaleTimeString()}</p>
        </div>
        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter italic leading-none">
          Daftari la <br/><span className="text-amber-500">Kazi ya Leo</span>
        </h1>
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest max-w-[200px] leading-relaxed">
          Ingiza taarifa sahihi za shamba kwa usalama wa kazi.
        </p>
      </div>

      {/* ── Status Bar ── */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Muda wa Kazi</p>
                <p className="text-xs font-black text-slate-900 dark:text-white uppercase">6h 12m</p>
            </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <History className="w-5 h-5 text-blue-500" />
            </div>
            <div>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Fomu Leo</p>
                <p className="text-xs font-black text-slate-900 dark:text-white uppercase">14 Zimejazwa</p>
            </div>
        </div>
      </div>

      {/* ── Security Alert (Micro-interaction) ── */}
      <div className="bg-rose-500 rounded-[2rem] p-6 text-white relative overflow-hidden shadow-xl shadow-rose-500/20 group cursor-pointer active:scale-95 transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-10 translate-x-10" />
          <div className="flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center animate-pulse">
                  <AlertCircle className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                  <h3 className="text-lg font-black uppercase tracking-tighter italic italic leading-none">Ripoti Ajali?</h3>
                  <p className="text-[9px] font-bold uppercase tracking-widest opacity-80 mt-1">Bonyeza hapa kutoa taarifa ya dharura haraka sana.</p>
              </div>
              <ChevronRight className="w-5 h-5 opacity-40" />
          </div>
      </div>

      {/* ── Form Grid ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Module za Kazi</h3>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          {FORMS.map(m => (
            <Link key={m.label} href={m.href} onClick={vibe}
              className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[2.2rem] p-6 shadow-sm active:scale-95 transition-all hover:border-slate-200 dark:hover:border-slate-700 group overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 p-2 opacity-[0.03] group-hover:scale-150 transition-transform">
                  <m.icon className="w-16 h-16" />
              </div>
              
              <div className={`w-12 h-12 rounded-2xl ${m.color} flex items-center justify-center mb-5 shadow-lg group-active:scale-90 transition-transform`}>
                <m.icon className="w-6 h-6 text-white" />
              </div>
              
              <div className="space-y-1">
                  <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tighter italic leading-none">{m.label}</p>
                  <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">{m.desc}</p>
              </div>
              
              <div className="absolute bottom-6 right-6 w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Plus className="w-4 h-4 text-slate-400" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Helper ── */}
      <div className="bg-slate-800/40 border border-white/5 rounded-[2rem] p-6 flex items-center gap-4">
          <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-amber-500" />
          </div>
          <div className="flex-1">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">MSAADA WA MFUMO</p>
              <p className="text-xs font-bold text-slate-300">Unahitaji msaada wa kutosha? <span className="text-amber-500">Soma hapa →</span></p>
          </div>
      </div>

      <style jsx global>{`
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-marquee { animation: marquee 30s linear infinite; }
      `}</style>
    </div>
  )
}

function Plus(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  )
}
