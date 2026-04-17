"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { 
  ChevronLeft, FileText, Download, TrendingUp, TrendingDown, 
  BarChart3, Calendar, Filter, Share2, Mountain, Clock, ChevronDown
} from "lucide-react"
import { ProfessionalReportButton } from "@/components/ui/professional-report-button"
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { isWithinInterval, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, parseISO } from "date-fns"
import { chimboKeyLabels } from "@/lib/chimbo-translations"

function getLocalData(key: string) {
  if (typeof window === "undefined") return []
  try { return JSON.parse(localStorage.getItem(key) || "[]") } catch { return [] }
}

export default function RipotiPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<"daily"|"weekly"|"monthly"|"yearly">("weekly")
  const [filteredSales, setFilteredSales] = useState<any[]>([])
  const [filteredExpenses, setFilteredExpenses] = useState<any[]>([])
  const [filteredProduction, setFilteredProduction] = useState<any[]>([])
  const [filteredDrilling, setFilteredDrilling] = useState<any[]>([])
  const [filteredBlasting, setFilteredBlasting] = useState<any[]>([])
  const [filteredAssay, setFilteredAssay] = useState<any[]>([])
  const [filteredSafety, setFilteredSafety] = useState<any[]>([])
  const [filteredPersonnel, setFilteredPersonnel] = useState<any[]>([])
  const [filteredTransport, setFilteredTransport] = useState<any[]>([])

  // Metrics
  const [metrics, setMetrics] = useState({
    weeklyProfit: 0,
    monthlyProfit: 0,
    weeklySales: 0,
    weeklyExpenses: 0,
    topExpType: "Chakula",
    totalGold: 0
  })

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      await new Promise(r => setTimeout(r, 600))
      
      const sales = getLocalData("chimbo_sales")
      const expenses = getLocalData("chimbo_expenses")
      const production = getLocalData("chimbo_production")
      const drilling = getLocalData("chimbo_drilling")
      const blasting = getLocalData("chimbo_blasting")
      const assay = getLocalData("chimbo_assay")
      const safety = getLocalData("chimbo_safety")
      const personnel = getLocalData("chimbo_vibarua")
      const transport = getLocalData("chimbo_transport")

      const now = new Date()
      let interval: { start: Date; end: Date }

      if (period === "daily") interval = { start: startOfDay(now), end: endOfDay(now) }
      else if (period === "weekly") interval = { start: startOfWeek(now), end: endOfWeek(now) }
      else if (period === "monthly") interval = { start: startOfMonth(now), end: endOfMonth(now) }
      else interval = { start: startOfYear(now), end: endOfYear(now) }

      const fSales = sales.filter((s: any) => {
        try { return isWithinInterval(parseISO(s.created_at || s.date), interval) } catch { return true }
      })
      const fExpenses = expenses.filter((e: any) => {
        try { return isWithinInterval(parseISO(e.created_at || e.date), interval) } catch { return true }
      })
      const fProd = production.filter((p: any) => {
        try { return isWithinInterval(parseISO(p.created_at || p.date), interval) } catch { return true }
      })
      const fDrill = drilling.filter((p: any) => {
        try { return isWithinInterval(parseISO(p.created_at || p.date), interval) } catch { return true }
      })
      const fBlast = blasting.filter((p: any) => {
        try { return isWithinInterval(parseISO(p.created_at || p.date), interval) } catch { return true }
      })
      const fAssay = assay.filter((p: any) => {
        try { return isWithinInterval(parseISO(p.created_at || p.date), interval) } catch { return true }
      })
      const fSafety = safety.filter((p: any) => {
        try { return isWithinInterval(parseISO(p.created_at || p.date), interval) } catch { return true }
      })
      const fPersonnel = personnel.filter((p: any) => {
        try { return isWithinInterval(parseISO(p.created_at || p.date), interval) } catch { return true }
      })
      const fTransport = transport.filter((p: any) => {
        try { return isWithinInterval(parseISO(p.created_at || p.date), interval) } catch { return true }
      })

      setFilteredSales(fSales)
      setFilteredExpenses(fExpenses)
      setFilteredProduction(fProd)
      setFilteredDrilling(fDrill)
      setFilteredBlasting(fBlast)
      setFilteredAssay(fAssay)
      setFilteredSafety(fSafety)
      setFilteredPersonnel(fPersonnel)
      setFilteredTransport(fTransport)

      const wSales = fSales.reduce((s: number, r: any) => s + (Number(r.total_amount) || 0), 0)
      const wExp = fExpenses.reduce((s: number, r: any) => s + (Number(r.amount) || 0), 0)
      const wProd = fProd.reduce((s: number, r: any) => s + (Number(r.load_count) || 0), 0)

      setMetrics({
        weeklyProfit: wSales - wExp,
        monthlyProfit: (wSales - wExp) * 3.8, 
        weeklySales: wSales,
        weeklyExpenses: wExp,
        topExpType: fExpenses.length > 0 ? fExpenses[0].category || "Vifaa" : "Hakuna",
        totalGold: wProd * 0.4
      })
      setLoading(false)
    }
    loadData()
  }, [period])

  const vibe = () => { if (typeof navigator !== 'undefined') navigator.vibrate?.(40) }

  if (loading) return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center gap-4 transition-colors duration-500">
        <Mountain className="w-12 h-12 text-amber-500 animate-pulse" />
        <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em]">Tunaandaa Ripoti...</p>
    </div>
  )

  return (
    <div className="p-4 space-y-6 pb-20 bg-slate-50 dark:bg-slate-950 transition-colors duration-500 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center shadow-sm">
                <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-white" />
            </button>
            <div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic leading-none">Ripoti Zangu</h1>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest italic">Uchambuzi wa Mgodi</p>
            </div>
        </div>
        <div className="flex items-center gap-3">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button className="h-10 px-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-2 text-[10px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-widest shadow-sm">
                        <Calendar className="w-3.5 h-3.5" />
                        {period === 'daily' ? 'Leo' : period === 'weekly' ? 'Wiki Hii' : period === 'monthly' ? 'Mwezi Huu' : 'Mwaka Huu'}
                        <ChevronDown className="w-3 h-3 opacity-50" />
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white min-w-[150px] p-2 rounded-2xl shadow-2xl">
                    <DropdownMenuItem onClick={() => setPeriod("daily")} className="rounded-xl h-10 font-bold text-xs uppercase cursor-pointer">Leo (Daily)</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setPeriod("weekly")} className="rounded-xl h-10 font-bold text-xs uppercase cursor-pointer">Wiki Hii (Weekly)</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setPeriod("monthly")} className="rounded-xl h-10 font-bold text-xs uppercase cursor-pointer">Mwezi Huu (Monthly)</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setPeriod("yearly")} className="rounded-xl h-10 font-bold text-xs uppercase cursor-pointer">Mwaka Huu (Yearly)</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            <button onClick={vibe} className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/20 active:scale-95 transition-all">
                <Share2 className="w-4 h-4 text-slate-950" />
            </button>
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-1 gap-4">
        {/* Profit Card */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-[2.5rem] p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
                <BarChart3 className="w-32 h-32" />
            </div>
            <div className="relative z-10 flex flex-col gap-6">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Hali ya Faida - Wiki Hii</p>
                </div>
                <div>
                   <h2 className={`text-5xl font-black tracking-tighter ${metrics.weeklyProfit >= 0 ? "text-white" : "text-red-500"}`}>
                        {metrics.weeklyProfit >= 0 ? "+" : ""}
                        {metrics.weeklyProfit.toLocaleString()}
                        <span className="text-sm font-bold ml-1">/=</span>
                   </h2>
                </div>
                <div className="flex gap-4">
                    <div className="flex-1 bg-white/5 rounded-2xl p-4 border border-white/5">
                        <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Mwezi Huu</p>
                        <p className="text-lg font-black text-white">TSh {metrics.monthlyProfit.toLocaleString()}/=</p>
                    </div>
                    <div className="w-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/5">
                        {metrics.weeklyProfit >= 0 ? <TrendingUp className="text-emerald-500" /> : <TrendingDown className="text-red-500" />}
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* ── Detailed Analytics ── */}
      <div className="bg-slate-900/50 rounded-[2.5rem] border border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-black text-white uppercase tracking-widest italic">Mnyambuliko (Details)</h3>
            <Filter className="w-4 h-4 text-slate-500" />
        </div>
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center group">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                        <p className="text-xs font-black text-white">Jumla ya Mauzo</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase">Wiki iliyopita</p>
                    </div>
                </div>
                <p className="text-lg font-black text-white">TSh {metrics.weeklySales.toLocaleString()}</p>
            </div>

            <div className="flex justify-between items-center group">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                        <TrendingDown className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                        <p className="text-xs font-black text-white">Jumla ya Gharama</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase">Matumizi yote</p>
                    </div>
                </div>
                <p className="text-lg font-black text-white">TSh {metrics.weeklyExpenses.toLocaleString()}</p>
            </div>

            <div className="h-px bg-slate-800" />
            
            <div className="space-y-4">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Chati ya Uzalishaji</p>
                <div className="flex items-end gap-2 h-32 px-4 justify-between">
                    {[40, 70, 45, 90, 65, 80, 55].map((h, i) => (
                        <div key={i} className="flex-1 group relative flex flex-col items-center gap-2">
                             <div className="w-full bg-slate-800 rounded-lg relative overflow-hidden h-24">
                                <div 
                                    className="absolute bottom-0 w-full bg-gradient-to-t from-amber-600 to-amber-400 rounded-t-lg transition-all duration-1000" 
                                    style={{ height: `${h}%` }} 
                                />
                             </div>
                             <span className="text-[8px] font-bold text-slate-600">S{i+1}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="h-px bg-slate-800" />

            <div className="flex justify-between items-center group">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                        <p className="text-xs font-black text-white">Gharama Kubwa</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase">Aina ya matumizi</p>
                    </div>
                </div>
                <p className="text-lg font-black text-white uppercase">{metrics.topExpType}</p>
            </div>

            <div className="h-px bg-slate-800" />

            <div className="text-center">
                <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] mb-4">Makisio ya Uzalishaji</p>
                <div className="flex justify-center gap-8">
                    <div>
                        <p className="text-2xl font-black text-white">12.5g</p>
                        <p className="text-[9px] text-slate-500 font-bold uppercase">Dhahabu</p>
                    </div>
                    <div className="h-10 w-px bg-slate-800" />
                    <div>
                        <p className="text-2xl font-black text-white">850</p>
                        <p className="text-[9px] text-slate-500 font-bold uppercase">Magunia</p>
                    </div>
                </div>
            </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <ProfessionalReportButton 
            data={[
                ...filteredSales.map(s => ({ ...s, section: "MAUZO" })), 
                ...filteredExpenses.map(e => ({ ...e, section: "MATUMIZI" })), 
                ...filteredProduction.map(p => ({ ...p, section: "UZALISHAJI" })),
                ...filteredDrilling.map(d => ({ ...d, section: "UCHIMBAJI" })),
                ...filteredBlasting.map(b => ({ ...b, section: "ULIPUAJI" })),
                ...filteredAssay.map(a => ({ ...a, section: "MAABARA (ASSAY)" })),
                ...filteredSafety.map(s => ({ ...s, section: "USALAMA" })),
                ...filteredPersonnel.map(p => ({ ...p, section: "VIBARUA" })),
                ...filteredTransport.map(t => ({ ...t, section: "USAFIRISHAJI" }))
            ]}
            filename={`RIPOTI_YA_MGODI_${period.toUpperCase()}`}
            title={`RIPOTI RASMI YA MGODI (${period.toUpperCase()})`}
            moduleColor="orange"
            language="sw"
            showLanguageSwitch={true}
            buttonLabel="PAKUA RIPOTI RASMI (PDF)"
            translations={chimboKeyLabels}
            hidePeriodSelector={true}
            kpis={[
                { label: "PROFIT / FAIDA", value: `TSh ${metrics.weeklyProfit.toLocaleString()}` },
                { label: "SALES / MAUZO", value: `TSh ${metrics.weeklySales.toLocaleString()}` },
                { label: "EXPENSES / GHARAMA", value: `TSh ${metrics.weeklyExpenses.toLocaleString()}` },
                { label: "GOLD (g) / DHAHABU (g)", value: `${metrics.totalGold.toFixed(1)}g` }
            ]}
        />
      </div>

    </div>
  )
}
