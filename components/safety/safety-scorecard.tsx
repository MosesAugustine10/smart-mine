"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, AlertTriangle, CheckCircle, Clock, TrendingUp, Activity, Zap, ShieldCheck } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

export function SafetyScorecard() {
  const [metrics, setMetrics] = useState({
    lti: 0, 
    ltiRate: 0,
    totalIncidents: 0,
    daysSinceLast: 0,
    nearMisses: 0,
    score: 0,
    criticalOpen: 0
  })

  useEffect(() => {
    async function fetchSafetyMetrics() {
        const supabase = getSupabaseBrowserClient()
        const { data: incidents } = await supabase.from("safety_incidents").select("*").order("incident_date", { ascending: false })
        if (!incidents) return

        const lti = incidents.filter((i: any) => i.incident_type === 'lost_time_injury' || i.days_lost > 0).length
        const nearMisses = incidents.filter((i: any) => i.incident_type === 'near_miss').length
        const openCritical = incidents.filter((i: any) => i.severity === 'CRITICAL' && !i.manager_signature).length
        
        let daysSinceLast = metrics.daysSinceLast || 45 // Fallback to 45 as a placeholder
        const lastIncident = incidents[0]
        if (lastIncident) {
            daysSinceLast = Math.floor((new Date().getTime() - new Date(lastIncident.incident_date).getTime()) / (1000 * 60 * 60 * 24))
        }

        const score = Math.max(0, 100 - (lti * 15) - (nearMisses * 2) - (openCritical * 10))

        setMetrics({
            lti,
            ltiRate: (lti / 200000) * 200000, 
            totalIncidents: incidents.length,
            daysSinceLast: Math.max(0, daysSinceLast),
            nearMisses,
            score,
            criticalOpen: openCritical
        })
    }
    fetchSafetyMetrics()
  }, [])

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        
        {/* Dynamic Credit Scorer */}
        <Card className="border-0 shadow-3xl bg-slate-900 text-white rounded-[3rem] overflow-hidden relative group md:col-span-2 lg:col-span-1">
            <CardHeader className="bg-white/5 border-b border-white/5 p-8 relative z-10">
                <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center justify-between">
                   <div className="flex items-center gap-2">
                       <ShieldCheck className="w-5 h-5 text-emerald-400" />
                       Safety Process Integrity
                   </div>
                   <Badge className="bg-white/10 text-white border-white/20 uppercase text-[9px] font-black tracking-widest px-3">Active Ledger</Badge>
                </CardTitle>
            </CardHeader>
            <CardContent className="p-10 flex flex-col items-center justify-center relative z-10">
                <div className="relative mb-8">
                    <svg className="w-48 h-48 transform -rotate-90">
                        <circle cx="96" cy="96" r="88" stroke="rgba(255,255,255,0.05)" strokeWidth="16" fill="transparent" />
                        <circle cx="96" cy="96" r="88" stroke={metrics.score > 80 ? '#10b981' : (metrics.score > 50 ? '#f59e0b' : '#ef4444')} strokeWidth="16" fill="transparent" strokeDasharray={552} strokeDashoffset={552 - (552 * metrics.score) / 100} className="transition-all duration-1000 ease-out" strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-6xl font-black tracking-tighter">{metrics.score}</span>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">System Score</span>
                    </div>
                </div>
                
                <div className="w-full space-y-4 pt-10 border-t border-white/10">
                    <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5">
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-40">LTI FREE CYCLE</span>
                        <span className="text-xl font-black text-emerald-400">{metrics.daysSinceLast} DAYS</span>
                    </div>
                </div>
            </CardContent>
            <Zap className="absolute -bottom-10 -right-10 w-48 h-48 opacity-5 text-emerald-400" />
        </Card>

        {/* Core KPIs Overlay */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1 lg:col-span-2">
            <div className="grid grid-cols-2 gap-6">
                <Card className="border-0 shadow-2xl bg-white dark:bg-slate-900 rounded-[2.5rem] border-l-8 border-l-red-600 transition-all hover:scale-[1.02]">
                    <CardHeader className="p-6 pb-0">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Critical Assets</p>
                        <CardTitle className="text-5xl font-black pt-2 text-slate-800 dark:text-white">{metrics.lti}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <p className="text-[9px] font-bold text-red-600 uppercase tracking-widest flex items-center gap-1.5">
                           <Activity className="w-3.5 h-3.5" /> Incident Magnitude
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-2xl bg-white dark:bg-slate-900 rounded-[2.5rem] border-l-8 border-l-amber-500 transition-all hover:scale-[1.02]">
                    <CardHeader className="p-6 pb-0">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Proactive Logs</p>
                        <CardTitle className="text-5xl font-black pt-2 text-slate-800 dark:text-white">{metrics.nearMisses}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <p className="text-[9px] font-bold text-amber-600 uppercase tracking-widest flex items-center gap-1.5">
                           <TrendingUp className="w-3.5 h-3.5" /> Preventive Insights
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-0 shadow-3xl bg-gradient-to-br from-red-600 to-red-800 text-white rounded-[3rem] p-10 relative overflow-hidden group">
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div>
                        <h3 className="text-sm font-black uppercase tracking-widest opacity-60">High Readiness Alert</h3>
                        <p className="text-3xl font-black mt-2 leading-tight uppercase tracking-tighter">Emergency Process Status: <span className="text-red-300">STANDBY</span></p>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-20 h-20 bg-white/10 rounded-3xl backdrop-blur-xl flex items-center justify-center border border-white/20 animate-pulse">
                            <Shield className="w-10 h-10 text-white" />
                        </div>
                        <span className="text-[8px] font-black tracking-widest uppercase opacity-40">System Shield</span>
                    </div>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-[80px] -mr-32 -mt-32" />
            </Card>
        </div>

    </div>
  )
}
