"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import {
  Mountain, Home, Pickaxe, Package, ShieldAlert, BarChart3,
  Wifi, WifiOff, Menu, X, Sun, Moon, DollarSign, Settings,
  Users, FlaskConical, Bomb, Truck, Droplet, LogOut,
  Crown, UserCog, ChevronRight
} from "lucide-react"
import { useTheme } from "next-themes"
import { getActiveAccount, clearActiveAccount, type ChimboAccount } from "@/lib/chimbo-auth"
import { useChimboSession } from "@/hooks/use-chimbo-session"

// ─── Manager-only routes (SUPERVISOR is redirected away) ──────────────────────
const MANAGER_ONLY_ROUTES = [
  "/chimbo/ramani",
]

// ─── Bottom navigation ────────────────────────────────────────────────────────
const MANAGER_NAV = [
  { label: "Home",   icon: Home,       href: "/chimbo/dashboard" },
  { label: "Mauzo",  icon: DollarSign, href: "/chimbo/mauzo" },
  { label: "Ripoti", icon: BarChart3,  href: "/chimbo/ripoti" },
  { label: "Timu",   icon: Users,      href: "/chimbo/vibarua" },
]
const SUPERVISOR_NAV = [
  { label: "Home",   icon: Home,       href: "/chimbo/dashboard" },
]

// ─── Sidebar modules ──────────────────────────────────────────────────────────
const MANAGER_MODULES = [
  {
    group: "Uzalishaji",
    items: [
      { label: "Shimo Leo",       icon: Pickaxe,      href: "/chimbo/shimo-leo",    color: "text-orange-500" },
      { label: "Jackhammer",      icon: Settings,     href: "/chimbo/jackhammer",   color: "text-red-500" },
      { label: "Kulipua (Blast)", icon: Bomb,         href: "/chimbo/kulipua",      color: "text-rose-600" },
      { label: "Mshipa (Core)",   icon: Mountain,     href: "/chimbo/mshipa",       color: "text-indigo-500" },
    ],
  },
  {
    group: "Fedha na Mauzo",
    items: [
      { label: "Mauzo ya Osha",  icon: DollarSign,   href: "/chimbo/mauzo",        color: "text-emerald-500" },
      { label: "Matumizi",       icon: DollarSign,   href: "/chimbo/matumizi",     color: "text-red-400" },
      { label: "Invoices / Malipo", icon: Crown,      href: "/chimbo/billing",      color: "text-amber-500" },
    ],
  },
  {
    group: "Uendeshaji",
    items: [
      { label: "Ghala (Stoo)",    icon: Package,      href: "/chimbo/ghala",        color: "text-amber-600" },
      { label: "Mafuta (Fuel)",   icon: Droplet,      href: "/chimbo/mafuta",       color: "text-blue-500" },
      { label: "Vibarua",         icon: Users,        href: "/chimbo/vibarua",      color: "text-amber-400" },
      { label: "Maabara (Assay)", icon: FlaskConical, href: "/chimbo/assay",        color: "text-violet-500" },
      { label: "Usafirishaji",    icon: Truck,        href: "/chimbo/usafirishaji", color: "text-blue-400" },
    ],
  },
  {
    group: "Ripoti na Usalama",
    items: [
      { label: "Ripoti Zangu",   icon: BarChart3,    href: "/chimbo/ripoti",       color: "text-blue-600" },
      { label: "Ripoti Ajali",   icon: ShieldAlert,  href: "/chimbo/ajali",        color: "text-red-600" },
    ],
  },
]

const SUPERVISOR_MODULES = [
  {
    group: "Fomua za Shamba",
    items: [
      { label: "Shimo Leo",       icon: Pickaxe,     href: "/chimbo/shimo-leo",    color: "text-orange-500" },
      { label: "Jackhammer",      icon: Settings,    href: "/chimbo/jackhammer",   color: "text-red-500" },
      { label: "Kulipua (Blast)", icon: Bomb,        href: "/chimbo/kulipua",      color: "text-rose-600" },
      { label: "Mshipa (Core)",   icon: Mountain,    href: "/chimbo/mshipa",       color: "text-indigo-500" },
    ],
  },
  {
    group: "Uendeshaji",
    items: [
      { label: "Ghala (Stoo)",    icon: Package,     href: "/chimbo/ghala",        color: "text-amber-600" },
      { label: "Mafuta (Fuel)",   icon: Droplet,     href: "/chimbo/mafuta",       color: "text-blue-500" },
      { label: "Maabara (Assay)", icon: FlaskConical,href: "/chimbo/assay",        color: "text-violet-500" },
      { label: "Usafirishaji",    icon: Truck,       href: "/chimbo/usafirishaji", color: "text-blue-400" },
    ],
  },
  {
    group: "Usalama",
    items: [
      { label: "Ripoti Ajali",    icon: ShieldAlert, href: "/chimbo/ajali",        color: "text-red-600" },
    ],
  },
]

// ─────────────────────────────────────────────────────────────────────────────
export default function ChimboLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const [account, setAccount] = useState<ChimboAccount | null>(null)
  const [online, setOnline] = useState(true)
  const [pendingSync, setPendingSync] = useState(0)
  const [showSidebar, setShowSidebar] = useState(false)
  const [mounted, setMounted] = useState(false)

  // ── Auto-logout (15 min inactivity) — only active inside protected pages ──
  const isProtected = pathname !== "/chimbo"
  useChimboSession(isProtected)

  useEffect(() => {
    const acc = getActiveAccount()
    if (!acc) {
      if (pathname !== "/chimbo") router.replace("/chimbo")
      return
    }
    setAccount(acc)
    setOnline(navigator.onLine)
    setMounted(true)

    const onOnline = () => setOnline(true)
    const onOffline = () => setOnline(false)
    window.addEventListener("online", onOnline)
    window.addEventListener("offline", onOffline)

    const checkQueue = () => {
      try {
        const queue = JSON.parse(localStorage.getItem("chimbo_sync_queue") || "[]")
        setPendingSync(queue.filter((r: any) => r.sync_status === "PENDING").length)
      } catch {}
    }
    checkQueue()
    const timer = setInterval(checkQueue, 5000)

    return () => {
      window.removeEventListener("online", onOnline)
      window.removeEventListener("offline", onOffline)
      clearInterval(timer)
    }
  }, [pathname])

  // ── RBAC Guard: routing logic per user role ───────────────────────────────
  useEffect(() => {
    if (!account || !pathname) return
    const isManager = account.role === "MANAGER"
    
    // Admin goes to /dashboard, Supervisor goes to /data-entry
    if (pathname === "/chimbo/dashboard" && !isManager) {
      router.replace("/chimbo/data-entry")
      return
    }

    // Supervisors restricted from manager-only routes
    if (!isManager && MANAGER_ONLY_ROUTES.some(r => pathname.startsWith(r))) {
      router.replace("/chimbo/data-entry")
    }
  }, [account, pathname])

  const handleLogout = () => {
    clearActiveAccount()
    router.replace("/chimbo")
  }

  // Bypass layout for the auth page itself
  if (pathname === "/chimbo") return <>{children}</>

  if (!account || !mounted) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Mountain className="w-16 h-16 text-amber-500 animate-pulse" />
        <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em]">Tunafungua Mfumo...</p>
      </div>
    </div>
  )

  // ── 30-Day Trial Paywall ─────────────────────────────────────────────────
  const start = new Date(account.trial_start || account.created_at || Date.now())
  const daysSince = Math.floor((Date.now() - start.getTime()) / (1000 * 60 * 60 * 24))
  const isExpired = account.subscription_status !== "ACTIVE" && (daysSince > 30 || account.subscription_status === "EXPIRED")

  // Exempt Billing page from Paywall so they can pay
  const isBillingPage = pathname === "/chimbo/billing"

  if (isExpired && account.role === "MANAGER" && !isBillingPage) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center space-y-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-red-500/5 blur-[100px] pointer-events-none" />
        <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center border border-red-500/30">
          <ShieldAlert className="w-10 h-10 text-red-500" />
        </div>
        <div className="space-y-2 z-10">
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter italic">Muda wa Matazamio Umeisha</h1>
          <p className="text-sm font-bold text-slate-400">Siku zako 30 za majaribio ya bure zimemalizika.</p>
        </div>
        <div className="bg-slate-900 border-2 border-amber-500/50 rounded-[2rem] p-8 max-w-sm w-full z-10 shadow-2xl shadow-amber-500/10">
          <p className="text-[10px] font-black uppercase text-amber-500 tracking-widest mb-1">GHARAMA YA MWEZI</p>
          <div className="flex items-baseline gap-1 justify-center mb-6">
             <span className="text-4xl font-black text-white tracking-tighter">25,000</span>
             <span className="text-xs font-bold text-slate-500 uppercase">TSh</span>
          </div>
          <ul className="space-y-3 text-left mb-8">
             {["Endelea kutumia mfumo wote", "Tunza data zako salama", "Ripoti za SMS haziathiriki"].map((t, i) => (
                <li key={i} className="text-[10px] font-bold text-slate-300 uppercase tracking-wide flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> {t}
                </li>
             ))}
          </ul>
          <button 
            onClick={() => { vibe(); router.push("/chimbo/billing") }}
            className="w-full h-14 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black uppercase text-[10px] tracking-widest rounded-xl transition-colors shadow-lg shadow-amber-500/20"
          >
             ANGALIA INVOICE & LIPA
          </button>
          <a href="https://wa.me/255623310006?text=Habari! Muda wangu wa majaribio Smart Mine umeisha. Nahitaji kulipia." target="_blank" rel="noreferrer" className="block mt-3 text-[10px] font-black text-amber-500/60 uppercase tracking-widest hover:text-amber-500">
             Msaada wa Malipo (WhatsApp)
          </a>
        </div>
        <button onClick={handleLogout} className="text-[10px] font-bold text-slate-500 uppercase tracking-widest hover:text-white transition-colors z-10 mt-4">
          Nitaingia Baadaye (Log Out)
        </button>
      </div>
    )
  }

  const isManager = account.role === "MANAGER"
  const MODULES = isManager ? MANAGER_MODULES : SUPERVISOR_MODULES
  
  // Custom nav for supervisor points to data-entry
  const supervisorNavAtEntry = [
    { label: "Home", icon: Home, href: "/chimbo/data-entry" },
  ]
  const NAV = isManager ? MANAGER_NAV : supervisorNavAtEntry
  const vibe = () => { if (typeof navigator !== "undefined") navigator.vibrate?.(40) }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col relative w-full overflow-x-hidden transition-colors duration-500">

      {/* ── Sidebar Drawer ──────────────────────────────────────────────────── */}
      {showSidebar && (
        <div className="fixed inset-0 z-[100] flex">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setShowSidebar(false)} />
          <div className="relative w-[300px] bg-white dark:bg-slate-900 h-full shadow-2xl animate-in slide-in-from-left duration-300 flex flex-col">

            {/* Sidebar header */}
            <div className="p-6 border-b dark:border-white/5">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">SMART MINE</h2>
                  <p className="text-[9px] font-bold text-amber-500 uppercase tracking-widest leading-none mt-1">Mfumo wa Kisasa</p>
                </div>
                <button onClick={() => setShowSidebar(false)} className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>

              {/* Role identity card */}
              <div className={`flex items-center gap-3 p-3 rounded-2xl border-2 ${
                isManager
                  ? "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800"
                  : "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"
              }`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${isManager ? "bg-purple-600" : "bg-amber-500"}`}>
                  {isManager ? <Crown className="w-5 h-5 text-white" /> : <UserCog className="w-5 h-5 text-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">{isManager ? "Msimamizi Mkuu" : "Msimamizi wa Shamba"}</p>
                  <p className="text-sm font-black text-slate-900 dark:text-white truncate">{account.full_name || account.phone}</p>
                </div>
                <div className={`text-[8px] font-black uppercase px-2 py-1 rounded-lg tracking-widest ${
                  isManager ? "bg-purple-100 text-purple-700 dark:bg-purple-800/50 dark:text-purple-300"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-800/50 dark:text-amber-300"
                }`}>
                  {isManager ? "MANAGER" : "SUPERVISOR"}
                </div>
              </div>

              {/* Session timeout warning */}
              <p className="text-[8px] text-slate-400 text-center mt-3 uppercase tracking-widest">
                🔒 Session timeout: dakika 15 bila shughuli
              </p>
            </div>

            {/* Module list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              {MODULES.map(group => (
                <div key={group.group} className="space-y-1">
                  <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em] px-3 mb-2">{group.group}</h3>
                  {group.items.map(item => {
                    const active = pathname?.startsWith(item.href)
                    return (
                      <button
                        key={item.href}
                        onClick={() => { vibe(); router.push(item.href); setShowSidebar(false) }}
                        className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl transition-all text-left group ${
                          active
                            ? "bg-amber-500/10 border-2 border-amber-500/30"
                            : "hover:bg-slate-100 dark:hover:bg-white/5 border-2 border-transparent"
                        }`}
                      >
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${active ? "bg-amber-500/20" : "dark:bg-slate-800 bg-slate-100"}`}>
                          <item.icon className={`w-4 h-4 ${active ? "text-amber-500" : item.color}`} />
                        </div>
                        <span className={`text-sm font-bold ${active ? "text-amber-600 dark:text-amber-400" : "text-slate-700 dark:text-slate-300"}`}>{item.label}</span>
                        {active && <ChevronRight className="w-3.5 h-3.5 text-amber-500 ml-auto" />}
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>

            {/* Logout */}
            <div className="p-4 border-t dark:border-white/5">
              <button
                onClick={() => { vibe(); handleLogout() }}
                className="w-full h-12 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 border border-red-200 dark:border-red-800/50 transition-all"
              >
                <LogOut className="w-4 h-4" /> Ondoka (Log Out)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Top Bar ─────────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-40 bg-white/90 dark:bg-slate-950/95 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {pathname !== "/chimbo/dashboard" ? (
            <button onClick={() => { vibe(); router.back() }} className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center shadow-sm">
              <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </button>
          ) : (
            <button onClick={() => { vibe(); setShowSidebar(true) }} className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center shadow-sm">
              <Menu className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </button>
          )}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20">
              <Mountain className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-black text-slate-900 dark:text-white tracking-tight uppercase italic">
              SMART <span className="text-amber-500">MINE</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest border ${
            isManager
              ? "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200 dark:border-purple-800/50"
              : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800/50"
          }`}>
            {isManager ? <Crown className="w-3 h-3" /> : <UserCog className="w-3 h-3" />}
            {isManager ? "Manager" : "Supervisor"}
          </div>
          <button onClick={() => { vibe(); setTheme(theme === "dark" ? "light" : "dark") }} className="w-8 h-8 rounded-lg dark:bg-slate-800 bg-slate-100 flex items-center justify-center text-amber-500">
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          {pendingSync > 0 && (
            <span className="text-[9px] font-black text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-full">📡 {pendingSync}</span>
          )}
          {online ? <Wifi className="w-4 h-4 text-emerald-500" /> : <WifiOff className="w-4 h-4 text-red-500 animate-pulse" />}
        </div>
      </div>

      {/* ── Ticker ──────────────────────────────────────────────────────────── */}
      <div className="bg-amber-500 py-1 overflow-hidden border-b border-amber-600 relative z-30">
        <div className="animate-marquee">
          <span className="text-[10px] font-black text-slate-950 uppercase tracking-[0.3em] whitespace-nowrap px-4 italic">
            ✦ SMART MINE ✦ Mfumo wa Kisasa wa Kusimamia Mgodi ✦ TEKNOLOJIA KWA WACHIMBAJI ✦
          </span>
        </div>
      </div>

      {/* ── Page Content ───────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto w-full">
        <div className="max-w-4xl mx-auto w-full">{children}</div>
      </main>

      {/* ── Bottom Navigation ──────────────────────────────────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-t border-slate-200 dark:border-white/5">
        <div className="max-w-4xl mx-auto flex h-20 items-center">
          {NAV.map(item => {
            const active = pathname === item.href || (item.href !== "/chimbo/dashboard" && pathname?.startsWith(item.href))
            return (
              <button key={item.href} onClick={() => { vibe(); router.push(item.href) }}
                className={`flex-1 flex flex-col items-center justify-center h-full gap-1 transition-all relative ${active ? "text-amber-500" : "text-slate-400"}`}>
                <item.icon className={`w-5 h-5 ${active ? "scale-110" : ""} transition-transform`} />
                <span className="text-[8px] font-black uppercase tracking-wider">{item.label}</span>
                {active && <div className="absolute top-0 w-6 h-1 bg-amber-500 rounded-b-full shadow-lg shadow-amber-500/50" />}
              </button>
            )
          })}
          <button onClick={() => { vibe(); setShowSidebar(true) }} className="flex-1 flex flex-col items-center justify-center h-full gap-1 text-slate-400">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center active:scale-95">
              <Menu className="w-5 h-5 text-amber-600" />
            </div>
            <span className="text-[8px] font-black uppercase tracking-wider">Menyu</span>
          </button>
        </div>
      </nav>

      {/* ── WhatsApp FAB ───────────────────────────────────────────────────── */}
      <a href="https://wa.me/255623310006?text=Habari! Nahitaji msaada wa Smart Mine." target="_blank" rel="noreferrer" onClick={vibe}
        className="fixed bottom-24 right-5 z-[60]">
        <div className="absolute inset-0 bg-emerald-500 rounded-2xl animate-ping opacity-20 scale-150" style={{ animationDuration: "2s" }} />
        <div className="relative w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-500/30">
          <svg className="w-6 h-6 text-white fill-current" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.301-.15-1.767-.872-2.04-.971-.272-.099-.47-.15-.667.15-.198.301-.765.971-.937 1.171-.173.199-.346.223-.647.073-.3-.15-1.267-.467-2.413-1.49-.893-.797-1.495-1.782-1.67-2.083-.174-.301-.019-.464.131-.613.136-.134.3-.349.451-.523.15-.174.2-.3.3-.5.1-.199.05-.373-.025-.523-.075-.15-.667-1.609-.914-2.204-.24-.579-.481-.5-.667-.51-.183-.01-.39-.01-.597-.01-.206 0-.542.077-.825.385-.282.308-1.078 1.055-1.078 2.571 0 1.516 1.102 2.984 1.256 3.189.155.205 2.169 3.313 5.255 4.646.733.316 1.306.505 1.751.647.737.234 1.408.201 1.938.122.59-.088 1.815-.742 2.072-1.46.257-.718.257-1.332.18-1.46-.077-.128-.282-.204-.583-.355zM12.012 2c-5.523 0-10 4.477-10 10 0 1.777.472 3.444 1.294 4.891l-1.306 4.859 4.981-1.308c1.406.772 3.016 1.211 4.722 1.211 5.523 0 10-4.477 10-10s-4.477-10-10-10zm0 2c4.411 0 8 3.589 8 8s-3.589 8-8 8c-1.503 0-2.903-.419-4.102-1.144L6.15 19.82l.966-3.606C6.319 14.986 5.86 13.548 5.86 12c0-4.411 3.589-8 8-8z" />
          </svg>
        </div>
      </a>
    </div>
  )
}
