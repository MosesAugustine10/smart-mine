"use client"

import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent } from "@/components/ui/card"
import { 
  Bomb, Drill, Gem, Wrench, ArrowRight, Package, 
  History, QrCode, AlertTriangle, TrendingUp, DollarSign
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useTranslation } from "@/components/language-context"
import { ModuleHelpNotebook } from "@/components/module-help-notebook"
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

import { usePermissions } from "@/hooks/use-permissions"
import { ShieldCheck } from "lucide-react"

export default function InventoryHub() {
  const { t } = useTranslation()
  const { role, canEdit, canRequest } = usePermissions('inventory')

  const modules = [
    {
      title: "Explosives & Blasting",
      desc: "Initiation systems, bulk agents & high-security tracking",
      href: "/blasting/inventory",
      icon: Bomb,
      color: "text-orange-600",
      bg: "bg-orange-50 dark:bg-orange-900/20",
      borderColor: "border-orange-100 dark:border-orange-900/40",
      stats: ["42.5t Stock", "12 Critical Units"],
      allowedRoles: ["Investor", "Manager", "Blaster", "Stock Keeper", "Supervisor"]
    },
    {
      title: "Drilling Consumables",
      desc: "Lifecycle management for bits, rods, hammers & rigs",
      href: "/drilling/inventory",
      icon: Drill,
      color: "text-blue-600",
      bg: "bg-blue-50 dark:bg-blue-900/20",
      borderColor: "border-blue-100 dark:border-blue-900/40",
      stats: ["885 Units", "System Optimal"],
      allowedRoles: ["Investor", "Manager", "Geologist", "Driller", "Stock Keeper", "Supervisor"]
    },
    {
      title: "Diamond Tooling",
      desc: "Precision core bits, reaming shells & sample storage",
      href: "/diamond-drilling/inventory",
      icon: Gem,
      color: "text-emerald-600",
      bg: "bg-emerald-50 dark:bg-emerald-900/20",
      borderColor: "border-emerald-100 dark:border-emerald-900/40",
      stats: ["Verified Audit", "12 New Receptions"],
      allowedRoles: ["Investor", "Manager", "Geologist", "Diamond Driller", "Stock Keeper", "Supervisor"]
    },
    {
      title: "Fleet Spare Parts",
      desc: "Mechanical inventory for CAT, Komatsu & Hitachi fleet",
      href: "/fleet/inventory",
      icon: Wrench,
      color: "text-indigo-600",
      bg: "bg-indigo-50 dark:bg-indigo-900/20",
      borderColor: "border-indigo-100 dark:border-indigo-900/40",
      stats: ["12.4M Valuated", "5 Active Services"],
      allowedRoles: ["Investor", "Manager", "Stock Keeper", "Supervisor"]
    },
    {
      title: "PPE & General (Nguo za Kinga)",
      desc: "Safety gear: Gloves, Helmets, Boots, Goggles, Overalls",
      href: "/inventory/ppe",
      icon: ShieldCheck,
      color: "text-rose-600",
      bg: "bg-rose-50 dark:bg-rose-900/20",
      borderColor: "border-rose-100 dark:border-rose-900/40",
      stats: ["Full Stock", "All Sizes"],
      allowedRoles: ["Investor", "Manager", "Accountant", "Geologist", "Blaster", "Driller", "Diamond Driller", "Stock Keeper", "Supervisor", "Driver/Operator"]
    }
  ]

  // Filter modules based on role
  const visibleModules = modules.filter(m => !role || m.allowedRoles.includes(role))

  const trendData = [
    { name: 'Mon', blasting: 4000, drilling: 2400, fleet: 2400 },
    { name: 'Tue', blasting: 3000, drilling: 1398, fleet: 2210 },
    { name: 'Wed', blasting: 2000, drilling: 9800, fleet: 2290 },
    { name: 'Thu', blasting: 2780, drilling: 3908, fleet: 2000 },
    { name: 'Fri', blasting: 1890, drilling: 4800, fleet: 2181 },
    { name: 'Sat', blasting: 2390, drilling: 3800, fleet: 2500 },
    { name: 'Sun', blasting: 3490, drilling: 4300, fleet: 2100 },
  ];

  return (
    <div className="flex-1 overflow-auto p-8 space-y-10 bg-slate-50/30 dark:bg-slate-950/30 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="flex items-center gap-4">
          <DashboardHeader 
            title={t('inventory')} 
            description={`Operational supply chain command center | Authenticated as: ${role || 'Guest'}`} 
          />
          <ModuleHelpNotebook moduleTitle="Inventory" />
        </div>
        <div className="flex gap-3">
            {canEdit && (
              <>
                <Button variant="outline" className="h-12 rounded-2xl font-black uppercase text-[10px] tracking-widest border-2">
                    <QrCode className="w-4 h-4 mr-2" />
                    Global Scan
                </Button>
                <Button variant="outline" className="h-12 rounded-2xl font-black uppercase text-[10px] tracking-widest border-2">
                    <History className="w-4 h-4 mr-2" />
                    Audit Trail
                </Button>
              </>
            )}
            {canRequest && (
              <Button className="h-12 rounded-2xl font-black uppercase text-[10px] tracking-widest bg-amber-500 text-white shadow-lg shadow-amber-500/20">
                <Package className="w-4 h-4 mr-2" />
                New Request
              </Button>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {visibleModules.map((mod) => (
          <Link key={mod.title} href={mod.href}>
            <Card className={`group relative border-2 ${mod.borderColor} rounded-[2.5rem] overflow-hidden transition-all hover:shadow-2xl hover:scale-[1.02] cursor-pointer bg-white dark:bg-slate-900 h-full flex flex-col`}>
              <div className={`h-24 ${mod.bg} flex items-center justify-center relative`}>
                <mod.icon className={`h-10 w-10 ${mod.color}`} />
                <div className="absolute top-4 right-6 uppercase text-[9px] font-black opacity-30 tracking-[0.2em]">Module Active</div>
              </div>
              <CardContent className="p-8 flex flex-col flex-1">
                <h3 className="text-sm font-black uppercase tracking-tighter text-slate-900 dark:text-white mb-2 leading-tight min-h-[40px]">
                    {mod.title}
                </h3>
                <p className="text-[10px] font-medium text-slate-500 mb-6 leading-relaxed opacity-80">
                    {mod.desc}
                </p>
                <div className="mt-auto space-y-4">
                    <div className="flex flex-wrap gap-2">
                        {mod.stats.map(s => (
                            <Badge key={s} variant="secondary" className="rounded-lg text-[8px] font-black uppercase tracking-widest px-2 py-0.5">
                                {s}
                            </Badge>
                        ))}
                    </div>
                    <div className="flex items-center gap-2 font-black text-[9px] uppercase tracking-widest text-slate-950 dark:text-white pt-2 border-t border-slate-50 dark:border-slate-800">
                        {canEdit ? 'Manage Stock' : 'View & Request'} <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
                    </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-8">
        <Card className="lg:col-span-2 border-0 shadow-2xl rounded-[3rem] bg-slate-900 text-white overflow-hidden p-10 relative">
            <div className="relative z-10 flex flex-col xl:flex-row gap-10">
                <div className="space-y-8 flex-1">
                    <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center">
                            <TrendingUp className="h-7 w-7 text-emerald-400" />
                        </div>
                        <div>
                            <h4 className="text-2xl font-black uppercase tracking-tighter">Inventory Health Ledger</h4>
                            <p className="text-xs font-bold uppercase tracking-widest text-white/40">Consolidated System Status</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Total Valuation</p>
                            <p className="text-3xl font-black italic tracking-tighter flex items-center gap-2">
                                <span className="text-xs not-italic text-emerald-400">TZS</span> 84.2M
                            </p>
                        </div>
                        <div className="space-y-2">
                            <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Stock Availability</p>
                            <p className="text-3xl font-black italic tracking-tighter">94.8% <span className="text-[10px] not-italic text-emerald-400 font-black uppercase">Optimal</span></p>
                        </div>
                    </div>
                </div>

                <div className="xl:w-80 h-48 bg-white/5 rounded-[2rem] p-6 border border-white/10">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40 mb-4">Stock Trend Ledger</p>
                    <div className="h-32 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={trendData}>
                                <Line type="monotone" dataKey="blasting" stroke="#ea580c" strokeWidth={2} dot={false} />
                                <Line type="monotone" dataKey="drilling" stroke="#2563eb" strokeWidth={2} dot={false} />
                                <Line type="monotone" dataKey="fleet" stroke="#4f46e5" strokeWidth={2} dot={false} />
                                <Tooltip contentStyle={{ display: 'none' }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex justify-between mt-2">
                        <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-orange-600"></div><span className="text-[7px] font-black opacity-40 uppercase">Blast</span></div>
                        <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div><span className="text-[7px] font-black opacity-40 uppercase">Drill</span></div>
                        <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-indigo-600"></div><span className="text-[7px] font-black opacity-40 uppercase">Fleet</span></div>
                    </div>
                </div>
            </div>
            <Package className="absolute -bottom-16 -right-16 h-80 w-80 text-white opacity-[0.03] pointer-events-none" />
        </Card>

        <Card className="border-2 border-slate-100 rounded-[3rem] p-10 space-y-8 shadow-sm">
            <div className="flex items-center justify-between">
                <h4 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-600" />
                    Strategic Alerts
                </h4>
                <Badge className="bg-orange-50 text-orange-600 border-0 font-black uppercase text-[9px]">Check Required</Badge>
            </div>
            <div className="space-y-4">
                {[
                    { title: "Detonator Shortage Check", sub: "Blasting Pit 4 reserves low", color: "border-orange-200" },
                    { title: "Rig Spare Authorization", sub: "Pending manager sign-off", color: "border-slate-100" },
                ].map(item => (
                    <div key={item.title} className={`p-5 rounded-2xl border-2 ${item.color} bg-slate-50/50`}>
                        <p className="text-xs font-black uppercase tracking-tight leading-none">{item.title}</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase">{item.sub}</p>
                    </div>
                ))}
            </div>
            <Button className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-black text-white font-black uppercase text-[10px] tracking-widest">
                Resolve High-Priority Alerts
            </Button>
        </Card>
      </div>
    </div>
  )
}