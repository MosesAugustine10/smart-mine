"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { 
  TrendingUp, TrendingDown, Pickaxe, ShieldCheck, Zap, 
  Fuel, BarChart3, ChevronRight, AlertTriangle, Package,
  Sun, Moon, LogOut, Table as TableIcon, History, Calendar, User,
  FlaskConical, Truck, Bomb, Users, Info, X
} from "lucide-react"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { chimboKeyLabels as keyLabels } from "@/lib/chimbo-translations"
import { useTheme } from "next-themes"
import { ModuleHelpNotebook } from "@/components/module-help-notebook"
import { ChimboNotificationBell, pushChimboNotification } from "@/components/chimbo/chimbo-notifications"

import { getActiveAccount } from "@/lib/chimbo-auth"

function getLocalData(key: string) {
  if (typeof window === "undefined") return []
  try { return JSON.parse(localStorage.getItem(key) || "[]") } catch { return [] }
}

export default function ChimboDashboard() {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [account, setAccount] = useState<any>(null)
  
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null)

  const [todayProd, setTodayProd] = useState<any>(null)
  const [todaySafety, setTodaySafety] = useState<any>(null)
  const [todayBlast, setTodayBlast] = useState<any>(null)
  const [todayFuel, setTodayFuel] = useState<any>(null)

  // Data for tables
  const [prodList, setProdList] = useState<any[]>([])
  const [drillList, setDrillList] = useState<any[]>([])
  const [salesList, setSalesList] = useState<any[]>([])
  const [expenseList, setExpenseList] = useState<any[]>([])
  const [safetyList, setSafetyList] = useState<any[]>([])
  const [assayList, setAssayList] = useState<any[]>([])
  const [personnelList, setPersonnelList] = useState<any[]>([])
  const [transportList, setTransportList] = useState<any[]>([])
  const [blastingList, setBlastingList] = useState<any[]>([])
  const [ghalaList, setGhalaList] = useState<any[]>([])
  const [jackhammerList, setJackhammerList] = useState<any[]>([])
  const [fuelList, setFuelList] = useState<any[]>([])

  const [selectedItem, setSelectedItem] = useState<any>(null)

  useEffect(() => {
    const acc = getActiveAccount()
    if (!acc) { router.replace("/chimbo"); return }
    setAccount(acc)

    if (acc.trial_start && acc.subscription_status === "TRIAL") {
      const start = new Date(acc.trial_start)
      const now = new Date()
      const daysPassed = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      setTrialDaysLeft(Math.max(0, 30 - daysPassed))
    }

    const today = new Date().toISOString().split("T")[0]
    const todayProdData = getLocalData("chimbo_production").filter((r: any) => r.date === today)
    const todaySafetyData = getLocalData("chimbo_safety").filter((r: any) => r.date === today)
    setTodayProd(todayProdData.slice(-1)[0])
    setTodaySafety(todaySafetyData.length)
    setTodayBlast(getLocalData("chimbo_blasting").filter((r: any) => r.date === today).slice(-1)[0])
    setTodayFuel(getLocalData("chimbo_fuel").filter((r: any) => r.date === today))

    // Auto-push notifications for safety incidents today
    if (todaySafetyData.length > 0) {
      const lastSafety = todaySafetyData[todaySafetyData.length - 1]
      const existing = JSON.parse(localStorage.getItem("chimbo_notifications") || "[]")
      const alreadyNotified = existing.some((n: any) => n.id?.includes("safety_auto"))
      if (!alreadyNotified) {
        pushChimboNotification({
          type: "safety",
          title: "⚠️ Taarifa ya Usalama Leo",
          body: `${lastSafety.incident_type || lastSafety.type || "Tukio"} – ${lastSafety.description || "Tafadhali angalia mfumo wa Usalama."}`,
          urgent: true,
        })
      }
    }
    if (todayProdData.length > 0) {
      const last = todayProdData[todayProdData.length - 1]
      const existing = JSON.parse(localStorage.getItem("chimbo_notifications") || "[]")
      const alreadyNotified = existing.some((n: any) => n.id?.includes("prod_auto"))
      if (!alreadyNotified) {
        pushChimboNotification({
          type: "production",
          title: "Uzalishaji Umeingizwa",
          body: `Shimo: ${last.site_name || "N/A"} – Mizigo ${last.load_count} ${last.load_unit || ""}`,
          urgent: false,
        })
      }
    }

    setProdList(getLocalData("chimbo_production").slice(-10).reverse())
    setDrillList(getLocalData("chimbo_drilling").slice(-10).reverse())
    setSalesList(getLocalData("chimbo_sales").slice(-10).reverse())
    setExpenseList(getLocalData("chimbo_expenses").slice(-10).reverse())
    setSafetyList(getLocalData("chimbo_safety").slice(-10).reverse())
    setAssayList(getLocalData("chimbo_assay").slice(-10).reverse())
    setPersonnelList(getLocalData("chimbo_vibarua").slice(-10).reverse())
    setTransportList(getLocalData("chimbo_transport").slice(-10).reverse())
    setBlastingList(getLocalData("chimbo_blasting").slice(-10).reverse())
    setGhalaList(getLocalData("chimbo_ghala").slice(-10).reverse())
    setJackhammerList(getLocalData("chimbo_jackhammer").slice(-10).reverse())
    setFuelList(getLocalData("chimbo_fuel").slice(-10).reverse())



    setMounted(true)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("chimbo_account")
    router.replace("/chimbo")
  }

  const weeklyProd = getLocalData("chimbo_production").reduce((s: number, r: any) => s + (Number(r.load_count) || 0), 0)
  const weeklySales = getLocalData("chimbo_sales").reduce((s: number, r: any) => s + (Number(r.total_amount) || 0), 0)
  const weeklyExpenses = getLocalData("chimbo_expenses").reduce((s: number, r: any) => s + (Number(r.amount) || 0), 0)
  const weeklyProfit = weeklySales - weeklyExpenses

  if (!account || !mounted) return null

  const isManager = account.role === "MANAGER"
  const vibe = () => { if (typeof navigator !== 'undefined') navigator.vibrate?.(40) }

  // ── SUPERVISOR VIEW: Form launcher only — no analytics ────────────────────
  if (!isManager) return (
    <div className="p-4 space-y-8 pb-32 min-h-screen bg-slate-50 dark:bg-[#020617]">
      {/* Welcome */}
      <div className="pt-6 space-y-1">
        <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em]">Karibu Tena, Msimamizi!</p>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter italic">
          {new Date().toLocaleDateString("sw-TZ", { weekday: "long", day: "2-digit", month: "long" })}
        </h1>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Chagua kazi ya leo kuanza kuingiza data</p>
      </div>

      {/* Safety status */}
      <div className={`flex items-center gap-4 p-5 rounded-3xl border-2 ${
        todaySafety > 0
          ? "bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-800"
          : "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-800"
      }`}>
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
          todaySafety > 0 ? "bg-red-500" : "bg-emerald-500"
        }`}>
          <ShieldCheck className={`w-6 h-6 text-white`} />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Hali ya Usalama Leo</p>
          <p className={`text-lg font-black uppercase ${
            todaySafety > 0 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"
          }`}>
            {todaySafety > 0 ? `⚠️ AJALI ${todaySafety} LEO!` : "✅ MGODI NI SALAMA"}
          </p>
        </div>
      </div>

      {/* Form launcher grid */}
      <div className="space-y-4">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Ingiza Data ya Leo</p>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "Shimo Leo",    icon: Pickaxe,    href: "/chimbo/shimo-leo",    color: "bg-orange-500",  desc: "Uzalishaji" },
            { label: "Jackhammer",   icon: Zap,        href: "/chimbo/jackhammer",   color: "bg-red-500",     desc: "Mashine" },
            { label: "Kulipua",      icon: AlertTriangle, href: "/chimbo/kulipua",  color: "bg-rose-600",    desc: "Milipuko" },
            { label: "Ghala/Stoo",   icon: Package,    href: "/chimbo/ghala",        color: "bg-amber-500",   desc: "Vifaa" },
            { label: "Mafuta",       icon: Fuel,       href: "/chimbo/mafuta",       color: "bg-blue-500",    desc: "Fuel" },
            { label: "Assay",        icon: BarChart3,  href: "/chimbo/assay",        color: "bg-violet-500",  desc: "Maabara" },
            { label: "Usafirishaji", icon: Truck,      href: "/chimbo/usafirishaji", color: "bg-sky-500",     desc: "Safari" },
            { label: "Ripoti Ajali", icon: ShieldCheck,href: "/chimbo/ajali",        color: "bg-rose-700",    desc: "Usalama" },
          ].map(m => (
            <Link key={m.label} href={m.href}
              className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm active:scale-95 transition-all hover:border-slate-200 dark:hover:border-slate-700 group"
            >
              <div className={`w-11 h-11 rounded-2xl ${m.color} flex items-center justify-center mb-4 shadow-lg group-active:scale-90 transition-transform`}>
                <m.icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-widest leading-tight">{m.label}</p>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{m.desc}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Today's prod summary */}
      {todayProd && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 space-y-2">
          <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Uzalishaji wa Leo ✓</p>
          <p className="text-3xl font-black text-slate-900 dark:text-white">
            {todayProd.load_count} <span className="text-sm text-orange-500 uppercase">{todayProd.load_unit}</span>
          </p>
          <p className="text-[9px] font-bold text-slate-400 uppercase">{todayProd.site_name}</p>
        </div>
      )}

      <style jsx global>{`
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-marquee { animation: marquee 30s linear infinite; }
      `}</style>
    </div>
  )

  return (
    <div className="p-4 space-y-8 pb-32 transition-colors duration-500 min-h-screen bg-slate-50 dark:bg-[#020617] text-slate-900 dark:text-slate-100">
      
      {/* 📜 Marquee Banner */}
      <div className="bg-white dark:bg-slate-950 border-y border-slate-200 dark:border-slate-800 py-3 -mx-4 mb-2 overflow-hidden">
        <div className="animate-marquee whitespace-nowrap flex gap-10">
          {[1,2,3,4].map(i => (
            <span key={i} className="text-[10px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-[0.3em] italic">
              ✦ SMART MINE ✦ MFUMO WA KISASA WA KUSIMAMIA MGODI ✦ USIMAMIZI BORA, TIJA ZAIDI ✦ TEKNOLOJIA KWA WACHIMBAJI ✦
            </span>
          ))}
        </div>
      </div>
      
      {/* ── Welcome Section ── */}
      <div className="flex items-center justify-between pt-2">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter italic">
            Habari, <span className="text-amber-500">{account.full_name?.split(" ")[0]}</span>
          </h1>
          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] italic">
            {new Date().toLocaleDateString("sw-TZ", { weekday: "long", day: "2-digit", month: "long" })} (Leo)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ChimboNotificationBell />
          <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="h-12 w-12 rounded-[1.5rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 shadow-xl">
             {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <button onClick={handleLogout} className="h-12 w-12 rounded-[1.5rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-rose-500 shadow-xl">
             <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
      <div className="flex justify-end -mt-4">
        <ModuleHelpNotebook moduleTitle="Dashbodi Kuu" />
      </div>

      {/* Gold Price Widget logic removed per user request */}

      {/* ── Quick Actions — MANAGER only */}
      {isManager && (
        <div className="grid grid-cols-1 gap-4">
            <Link href="/chimbo/mauzo" onClick={vibe} className="flex items-center justify-between p-6 bg-emerald-500 rounded-[2.2rem] shadow-xl shadow-emerald-500/20 active:scale-95 transition-all">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-slate-900/10 flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-slate-900" />
                    </div>
                    <div>
                        <h4 className="text-lg font-black text-slate-900 uppercase tracking-tighter leading-none italic">Rekodi Mauzo Leo</h4>
                        <p className="text-[10px] font-bold text-slate-900/60 uppercase tracking-widest mt-1">Ingiza mauzo ya dhahabu haraka</p>
                    </div>
                </div>
                <div className="h-10 w-10 rounded-full bg-slate-900/10 flex items-center justify-center">
                  <ChevronRight className="w-5 h-5 text-slate-900" />
                </div>
            </Link>
        </div>
      )}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                <Pickaxe className="w-5 h-5 text-orange-500" />
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Hali ya Shimo</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
            <Link href="/chimbo/shimo-leo" className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 hover:border-orange-500 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Uzalishaji Leo</p>
                {todayProd ? (
                    <div className="space-y-1">
                        <p className="text-3xl font-black text-slate-900 dark:text-white leading-none">{todayProd.load_count} <span className="text-xs text-orange-500 uppercase">{todayProd.load_unit}</span></p>
                        <p className="text-[9px] font-bold text-emerald-500 uppercase">Mizigo Imehifadhiwa</p>
                    </div>
                ) : (
                    <p className="text-sm font-bold text-slate-300 dark:text-slate-700 italic">"Bonyeza kuingiza data..."</p>
                )}
                <ChevronRight className="absolute top-6 right-6 w-4 h-4 text-slate-300" />
            </Link>

            <Link href="/chimbo/ajali" className={`relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 shadow-sm ${todaySafety > 0 ? "border-rose-500 animate-pulse" : ""}`}>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Usalama</p>
                {todaySafety > 0 ? (
                    <p className="text-xl font-black text-rose-500 leading-none">⚠️ AJALI {todaySafety}!</p>
                ) : (
                    <p className="text-xl font-black text-emerald-500 leading-none">✅ SALAMA</p>
                )}
                <p className="text-[9px] font-bold text-slate-400 mt-2 italic italic">Siku 18 Bila Ajali</p>
            </Link>
        </div>
      </div>

      {/* ── Financial Reports Section — MANAGER only */}
      {isManager && (
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-blue-500" />
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Ripoti za Boss</h3>
            </div>

            <Link href="/chimbo/ripoti" className="group block bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-8 relative overflow-hidden shadow-2xl transition-all">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <TrendingUp className="w-32 h-32" />
                </div>
                <div className="flex justify-between items-end mb-8">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Faida ya Wiki</p>
                        <h4 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">
                            TSh {weeklyProfit.toLocaleString()}/=
                        </h4>
                    </div>
                    <div className="flex gap-1 h-12 items-end">
                        {[3, 5, 8, 4, 10].map((h, i) => (
                            <div key={i} style={{ height: `${h * 10}%` }} className="w-2 bg-blue-500 rounded-full" />
                        ))}
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4 border-t border-slate-50 dark:border-slate-800 pt-6">
                    <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Mauzo (+)</p>
                        <p className="text-md font-black text-emerald-500">{weeklySales.toLocaleString()}/=</p>
                    </div>
                    <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Gharama (-)</p>
                        <p className="text-md font-black text-red-500">{weeklyExpenses.toLocaleString()}/=</p>
                    </div>
                </div>
            </Link>
        </div>
      )}

      {/* ── Section: Vifaa na Ghala ── */}
      <div className="grid grid-cols-2 gap-4">
          {[
              { label: "MASHINE", icon: Zap, col: "text-red-500", bg: "bg-red-500/10", route: "/chimbo/jackhammer", roles: ["BOSS", "SUPERVISOR"] },
              { label: "MAFUTA", icon: Fuel, col: "text-blue-500", bg: "bg-blue-500/10", route: "/chimbo/mafuta", roles: ["BOSS", "SUPERVISOR"] },
              { label: "VIBARUA", icon: "👷", col: "text-amber-500", bg: "bg-amber-500/10", route: "/chimbo/vibarua", managerOnly: true },
              { label: "GHALA/STOO", icon: Package, col: "text-indigo-500", bg: "bg-indigo-500/10", route: "/chimbo/ghala", managerOnly: false },
          ].filter(m => !m.managerOnly || isManager).map(m => (
              <Link key={m.label} href={m.route} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm active:scale-95 transition-all">
                  <div className={`w-10 h-10 rounded-xl ${m.bg} flex items-center justify-center mb-4`}>
                      {typeof m.icon === "string" ? <span className="text-lg">{m.icon}</span> : <m.icon className={`w-5 h-5 ${m.col}`} />}
                  </div>
                  <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">{m.label}</p>
              </Link>
          ))}
      </div>
      {/* ── Section: Daftari Kamili la Kazi ── */}
      <div className="space-y-6">
          <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
                      <TableIcon className="w-5 h-5 text-violet-500" />
                  </div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Full Work Log / Daftari Kamili la Kazi</h3>
              </div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Weka Macho Kila Kitu</p>
          </div>

          <Tabs defaultValue="production" className="w-full">
              <TabsList className="w-full h-14 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1.5 rounded-[2.5rem] mb-4 overflow-x-auto no-scrollbar flex justify-start gap-1">
                  <TabsTrigger value="production" className="px-4 text-[9px] font-black uppercase tracking-widest data-[state=active]:bg-orange-500 data-[state=active]:text-white rounded-xl transition-all">Uzalishaji</TabsTrigger>
                  <TabsTrigger value="drilling" className="px-4 text-[9px] font-black uppercase tracking-widest data-[state=active]:bg-red-500 data-[state=active]:text-white rounded-xl transition-all">Machine</TabsTrigger>
                  <TabsTrigger value="jackhammer" className="px-4 text-[9px] font-black uppercase tracking-widest data-[state=active]:bg-purple-500 data-[state=active]:text-white rounded-xl transition-all">Jackhammer</TabsTrigger>
                  <TabsTrigger value="ghala" className="px-4 text-[9px] font-black uppercase tracking-widest data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-xl transition-all">Ghala</TabsTrigger>
                  <TabsTrigger value="mafuta" className="px-4 text-[9px] font-black uppercase tracking-widest data-[state=active]:bg-cyan-500 data-[state=active]:text-black rounded-xl transition-all">Mafuta</TabsTrigger>
                  <TabsTrigger value="kulipua" className="px-4 text-[9px] font-black uppercase tracking-widest data-[state=active]:bg-red-700 data-[state=active]:text-white rounded-xl transition-all">Kulipua</TabsTrigger>
                  {isManager && <TabsTrigger value="sales" className="px-4 text-[9px] font-black uppercase tracking-widest data-[state=active]:bg-emerald-500 data-[state=active]:text-white rounded-xl transition-all">Mauzo</TabsTrigger>}
                  {isManager && <TabsTrigger value="expenses" className="px-4 text-[9px] font-black uppercase tracking-widest data-[state=active]:bg-rose-500 data-[state=active]:text-white rounded-xl transition-all">Matumizi</TabsTrigger>}
                  <TabsTrigger value="assay" className="px-4 text-[9px] font-black uppercase tracking-widest data-[state=active]:bg-blue-500 data-[state=active]:text-white rounded-xl transition-all">Assay</TabsTrigger>
                  <TabsTrigger value="safety" className="px-4 text-[9px] font-black uppercase tracking-widest data-[state=active]:bg-yellow-500 data-[state=active]:text-black rounded-xl transition-all">Usalama</TabsTrigger>
                  <TabsTrigger value="vibarua" className="px-4 text-[9px] font-black uppercase tracking-widest data-[state=active]:bg-indigo-500 data-[state=active]:text-white rounded-xl transition-all">Vibarua</TabsTrigger>
                  <TabsTrigger value="transport" className="px-4 text-[9px] font-black uppercase tracking-widest data-[state=active]:bg-slate-700 data-[state=active]:text-white rounded-xl transition-all">Safari</TabsTrigger>
              </TabsList>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl relative">
                  
                  {/* Detail Modal Definition Helper */}
                  <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
                      <DialogContent className="sm:max-w-[425px] bg-slate-950 border-slate-800 rounded-[2.5rem] p-8">
                          <DialogHeader>
                              <DialogTitle className="text-2xl font-black text-white uppercase italic tracking-tighter flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center">
                                      <Info className="w-5 h-5 text-white" />
                                  </div>
                                  Full Record Details / Taarifa Zote za Form
                              </DialogTitle>
                          </DialogHeader>
                          <div className="mt-6 space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                              {selectedItem && Object.entries(selectedItem).map(([key, value]: [string, any]) => (
                                  key !== 'local_id' && key !== 'table_name' && key !== 'sync_status' && key !== 'photos' && key !== 'photo' && key !== 'created_locally_at' && (
                                      <div key={key} className="flex flex-col border-b border-white/10 pb-3 transition-all hover:bg-white/5 px-2 rounded-lg">
                                          <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">{keyLabels[key] || key.replace(/_/g, ' ')}</span>
                                          <span className="text-slate-100 font-black text-sm uppercase italic">{String(value)}</span>
                                      </div>
                                  )
                              ))}
                              {selectedItem?.photos && selectedItem.photos.length > 0 && (
                                  <div className="pt-4">
                                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">Picha zilizohifadhiwa</span>
                                      <div className="flex gap-2 overflow-x-auto pb-2">
                                          {selectedItem.photos.map((p: string, i: number) => (
                                              <img key={i} src={p} className="w-20 h-20 rounded-xl object-cover border border-white/10" alt="site" />
                                          ))}
                                      </div>
                                  </div>
                              )}
                          </div>
                      </DialogContent>
                  </Dialog>

                  {/* Production Tab Content */}
                  <TabsContent value="production" className="m-0">
                      <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                              <thead>
                                  <tr className="bg-slate-50 dark:bg-slate-800/50">
                                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Date / Tarehe</th>
                                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Site / Shimo</th>
                                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Loads / Mizigo</th>
                                      <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Action</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                  {prodList.length > 0 ? prodList.map((row, i) => (
                                      <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                          <td className="px-6 py-5 text-[11px] font-bold text-slate-500">{new Date(row.date).toLocaleDateString()}</td>
                                          <td className="px-6 py-5 text-[11px] font-black text-slate-900 dark:text-white uppercase italic">{row.site_name}</td>
                                          <td className="px-6 py-5">
                                              <span className="text-[12px] font-black text-orange-500">{row.load_count}</span>
                                              <span className="text-[9px] font-bold text-slate-400 uppercase ml-1">{row.load_unit}</span>
                                          </td>
                                          <td className="px-4 py-5">
                                              <button onClick={() => setSelectedItem(row)} className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-amber-500 transition-colors">
                                                  <ChevronRight className="w-4 h-4" />
                                              </button>
                                          </td>
                                      </tr>
                                  )) : (
                                      <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400 text-xs italic">Hakuna data iliyoingizwa bado.</td></tr>
                                  )}
                              </tbody>
                          </table>
                      </div>
                  </TabsContent>

                  {/* Drilling Tab Content */}
                  <TabsContent value="drilling" className="m-0">
                      <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                              <thead>
                                  <tr className="bg-slate-50 dark:bg-slate-800/50">
                                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Driller / Mpigaji</th>
                                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Machine / Mashine</th>
                                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Rods / Fimbo</th>
                                      <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Action</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                  {drillList.length > 0 ? drillList.map((row, i) => (
                                      <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                          <td className="px-6 py-5 text-[11px] font-black text-slate-900 dark:text-white uppercase italic">{row.driller_name || "N/A"}</td>
                                          <td className="px-6 py-5 text-[11px] font-bold text-slate-500">{row.machine_no}</td>
                                          <td className="px-6 py-5 text-[12px] font-black text-red-500">{row.rods_drilled}</td>
                                          <td className="px-4 py-5">
                                              <button onClick={() => setSelectedItem(row)} className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-amber-500 transition-colors">
                                                  <ChevronRight className="w-4 h-4" />
                                              </button>
                                          </td>
                                      </tr>
                                  )) : (
                                      <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400 text-xs italic">Hakuna data ya machine bado.</td></tr>
                                  )}
                              </tbody>
                          </table>
                      </div>
                  </TabsContent>

                  {/* Sales Tab Content */}
                  <TabsContent value="sales" className="m-0">
                      <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                              <thead>
                                  <tr className="bg-slate-50 dark:bg-slate-800/50">
                                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Buyer / Mnunuzi</th>
                                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Weight / Uzito</th>
                                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Total / Jumla</th>
                                      <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Info</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                  {salesList.length > 0 ? salesList.map((row, i) => (
                                      <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                          <td className="px-6 py-5 text-[11px] font-black text-slate-900 dark:text-white uppercase italic">{row.buyer_name}</td>
                                          <td className="px-6 py-5 text-[11px] font-bold text-slate-500">{row.weight_grams}g</td>
                                          <td className="px-6 py-5 text-[12px] font-black text-emerald-500">{Number(row.total_amount).toLocaleString()}</td>
                                          <td className="px-4 py-5">
                                              <button onClick={() => setSelectedItem(row)} className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                                  <Info className="w-4 h-4" />
                                              </button>
                                          </td>
                                      </tr>
                                  )) : (
                                      <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400 text-xs italic">Hakuna mauzo yaliyowekwa.</td></tr>
                                  )}
                              </tbody>
                          </table>
                      </div>
                  </TabsContent>

                  {/* Assay Tab Content */}
                  <TabsContent value="assay" className="m-0">
                      <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                              <thead>
                                  <tr className="bg-slate-50 dark:bg-slate-800/50">
                                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Sample ID / Namba</th>
                                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Grade / Karati</th>
                                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Lab / Maabara</th>
                                      <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">All</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                  {assayList.length > 0 ? assayList.map((row, i) => (
                                      <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                          <td className="px-6 py-5 text-[11px] font-black text-slate-900 dark:text-white uppercase italic">{row.sample_id}</td>
                                          <td className="px-6 py-5 text-[12px] font-black text-blue-500">{row.grade}</td>
                                          <td className="px-6 py-5 text-[11px] font-bold text-slate-500">{row.laboratory}</td>
                                          <td className="px-4 py-5">
                                              <button onClick={() => setSelectedItem(row)} className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                                  <ChevronRight className="w-4 h-4" />
                                              </button>
                                          </td>
                                      </tr>
                                  )) : (
                                      <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400 text-xs italic">Hakuna matokeo ya Assay bado.</td></tr>
                                  )}
                              </tbody>
                          </table>
                      </div>
                  </TabsContent>

                  {/* Safety Tab Content */}
                  <TabsContent value="safety" className="m-0">
                      <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                              <thead>
                                  <tr className="bg-slate-50 dark:bg-slate-800/50">
                                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Type / Aina</th>
                                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Desc / Maelezo</th>
                                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Step / Hatua</th>
                                      <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">All</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                  {safetyList.length > 0 ? safetyList.map((row, i) => (
                                      <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                          <td className="px-6 py-5 text-[11px] font-black text-yellow-600 uppercase italic">{row.type}</td>
                                          <td className="px-6 py-5 text-[11px] font-bold text-slate-500">{row.description}</td>
                                          <td className="px-6 py-5 text-[11px] font-black text-slate-900 dark:text-white">{row.action}</td>
                                          <td className="px-4 py-5">
                                              <button onClick={() => setSelectedItem(row)} className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                                  <ChevronRight className="w-4 h-4" />
                                              </button>
                                          </td>
                                      </tr>
                                  )) : (
                                      <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400 text-xs italic">Mgodi ni salama, hakuna rekodi.</td></tr>
                                  )}
                              </tbody>
                          </table>
                      </div>
                  </TabsContent>

                  {/* Personnel Tab Content */}
                  <TabsContent value="vibarua" className="m-0">
                      <div className="overflow-x_auto">
                          <table className="w-full text-left border-collapse">
                              <thead>
                                  <tr className="bg-slate-50 dark:bg-slate-800/50">
                                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Count / Idadi</th>
                                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Task / Kazi</th>
                                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Paid / Malipo</th>
                                      <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Detail</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                  {personnelList.length > 0 ? personnelList.map((row, i) => (
                                      <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                          <td className="px-6 py-5 text-[14px] font-black text-indigo-500 uppercase italic">{row.count}</td>
                                          <td className="px-6 py-5 text-[11px] font-bold text-slate-500">{row.task}</td>
                                          <td className={`px-6 py-5 text-[10px] font-black uppercase tracking-widest ${row.paid === 'YES' ? 'text-emerald-500' : 'text-rose-500'}`}>{row.paid}</td>
                                          <td className="px-4 py-5">
                                              <button onClick={() => setSelectedItem(row)} className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                                  <User className="w-4 h-4" />
                                              </button>
                                          </td>
                                      </tr>
                                  )) : (
                                      <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400 text-xs italic">Hakuna vibarua waliosajiliwa.</td></tr>
                                  )}
                              </tbody>
                          </table>
                      </div>
                  </TabsContent>

                  {/* Expenses Tab Content */}
                  <TabsContent value="expenses" className="m-0">
                      <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                              <thead>
                                  <tr className="bg-slate-50 dark:bg-slate-800/50">
                                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Maelezo</th>
                                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Pesa</th>
                                      <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">View</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                  {expenseList.length > 0 ? expenseList.map((row, i) => (
                                      <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                          <td className="px-6 py-5 text-[11px] font-bold text-slate-500">{row.description}</td>
                                          <td className="px-6 py-5 text-[12px] font-black text-rose-500">{Number(row.amount).toLocaleString()}</td>
                                          <td className="px-4 py-5">
                                              <button onClick={() => setSelectedItem(row)} className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                                  <Info className="w-4 h-4" />
                                              </button>
                                          </td>
                                      </tr>
                                  )) : (
                                      <tr><td colSpan={3} className="px-6 py-12 text-center text-slate-400 text-xs italic">Hakuna matumizi bado.</td></tr>
                                  )}
                              </tbody>
                          </table>
                      </div>
                  </TabsContent>

                  {/* Transport Tab Content */}
                  <TabsContent value="transport" className="m-0">
                      <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                              <thead>
                                  <tr className="bg-slate-50 dark:bg-slate-800/50">
                                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Gari</th>
                                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Safari</th>
                                      <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">View</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                  {transportList.length > 0 ? transportList.map((row, i) => (
                                      <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                          <td className="px-6 py-5 text-[11px] font-black text-slate-900 dark:text-white uppercase italic">{row.truck_no}</td>
                                          <td className="px-6 py-5 text-[11px] font-bold text-slate-500">{row.route}</td>
                                          <td className="px-4 py-5">
                                              <button onClick={() => setSelectedItem(row)} className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                                  <Truck className="w-4 h-4" />
                                              </button>
                                          </td>
                                      </tr>
                                  )) : (
                                      <tr><td colSpan={3} className="px-6 py-12 text-center text-slate-400 text-xs italic">Hakuna safari zilizorekodiwa.</td></tr>
                                  )}
                              </tbody>
                          </table>
                      </div>
                  </TabsContent>

                  <TabsContent value="ghala" className="m-0">
                      <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                              <thead>
                                  <tr className="bg-slate-50 dark:bg-slate-800/50">
                                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Tarehe</th>
                                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Kifaa</th>
                                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Aina</th>
                                      <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">View</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                  {ghalaList.length > 0 ? ghalaList.map((row, i) => (
                                      <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                          <td className="px-6 py-5 text-[11px] font-bold text-slate-500">{new Date(row.date || new Date()).toLocaleDateString()}</td>
                                          <td className="px-6 py-5 text-[11px] font-black text-slate-900 dark:text-white uppercase italic">{row.item_name || row.kifaa}</td>
                                          <td className="px-6 py-5 text-[11px] font-bold text-slate-500">{row.action_type || row.aina || row.action}</td>
                                          <td className="px-4 py-5">
                                              <button onClick={() => setSelectedItem(row)} className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                                  <Info className="w-4 h-4" />
                                              </button>
                                          </td>
                                      </tr>
                                  )) : (
                                      <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400 text-xs italic">Hakuna rekodi za ghala.</td></tr>
                                  )}
                              </tbody>
                          </table>
                      </div>
                  </TabsContent>

                  <TabsContent value="jackhammer" className="m-0">
                      <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                              <thead>
                                  <tr className="bg-slate-50 dark:bg-slate-800/50">
                                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Tarehe</th>
                                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Mashine</th>
                                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Muda/Hali</th>
                                      <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">View</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                  {jackhammerList.length > 0 ? jackhammerList.map((row, i) => (
                                      <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                          <td className="px-6 py-5 text-[11px] font-bold text-slate-500">{new Date(row.date || new Date()).toLocaleDateString()}</td>
                                          <td className="px-6 py-5 text-[11px] font-black text-slate-900 dark:text-white uppercase italic">{row.machine_no || row.namba}</td>
                                          <td className="px-6 py-5 text-[11px] font-bold text-slate-500">{row.hours_used || row.status || row.hali}</td>
                                          <td className="px-4 py-5">
                                              <button onClick={() => setSelectedItem(row)} className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                                  <Info className="w-4 h-4" />
                                              </button>
                                          </td>
                                      </tr>
                                  )) : (
                                      <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400 text-xs italic">Hakuna rekodi za jackhammer.</td></tr>
                                  )}
                              </tbody>
                          </table>
                      </div>
                  </TabsContent>

                  <TabsContent value="mafuta" className="m-0">
                      <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                              <thead>
                                  <tr className="bg-slate-50 dark:bg-slate-800/50">
                                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Tarehe</th>
                                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Lita</th>
                                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Kifaa/Matumizi</th>
                                      <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">View</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                  {fuelList.length > 0 ? fuelList.map((row, i) => (
                                      <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                          <td className="px-6 py-5 text-[11px] font-bold text-slate-500">{new Date(row.date || new Date()).toLocaleDateString()}</td>
                                          <td className="px-6 py-5 text-[12px] font-black text-blue-500 uppercase italic">{row.liters || row.litres || row.lita} L</td>
                                          <td className="px-6 py-5 text-[11px] font-bold text-slate-500">{row.equipment || row.purpose || row.matumizi}</td>
                                          <td className="px-4 py-5">
                                              <button onClick={() => setSelectedItem(row)} className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                                  <Info className="w-4 h-4" />
                                              </button>
                                          </td>
                                      </tr>
                                  )) : (
                                      <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400 text-xs italic">Hakuna rekodi za mafuta.</td></tr>
                                  )}
                              </tbody>
                          </table>
                      </div>
                  </TabsContent>

                  <TabsContent value="kulipua" className="m-0">
                      <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                              <thead>
                                  <tr className="bg-slate-50 dark:bg-slate-800/50">
                                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Tarehe</th>
                                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Mlipuaji</th>
                                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Kiasi/Milipuko</th>
                                      <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">View</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                  {blastingList.length > 0 ? blastingList.map((row, i) => (
                                      <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                          <td className="px-6 py-5 text-[11px] font-bold text-slate-500">{new Date(row.date || new Date()).toLocaleDateString()}</td>
                                          <td className="px-6 py-5 text-[11px] font-black text-slate-900 dark:text-white uppercase italic">{row.blaster_name || row.mlipuaji || row.mtaalamu}</td>
                                          <td className="px-6 py-5 text-[11px] font-bold text-rose-500">{row.holes || row.quantity || row.idadi}</td>
                                          <td className="px-4 py-5">
                                              <button onClick={() => setSelectedItem(row)} className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                                  <Info className="w-4 h-4" />
                                              </button>
                                          </td>
                                      </tr>
                                  )) : (
                                      <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400 text-xs italic">Hakuna rekodi za kulipua.</td></tr>
                                  )}
                              </tbody>
                          </table>
                      </div>
                  </TabsContent>
              </div>
          </Tabs>
      </div>


      <style jsx global>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
      `}</style>
    </div>
  )
}
