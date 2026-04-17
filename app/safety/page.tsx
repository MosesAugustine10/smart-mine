"use client"

import { useState, useEffect } from "react"
import { ProfessionalReportButton } from "@/components/ui/professional-report-button"
import { IncidentTrendsChart } from "@/components/safety/charts/incident-trends-chart"
import { RiskMatrixChart } from "@/components/safety/charts/risk-matrix-chart"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, ShieldAlert, Zap, History, ArrowUpRight, Loader2 } from "lucide-react"
import Link from "next/link"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { SystemPeriodFilter, type ReportPeriod } from "@/components/ui/system-period-filter"
import { isWithinInterval, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns"
import { SafetyTable } from "@/components/safety/safety-table"
import { SafetyScorecard } from "@/components/safety/safety-scorecard"

export default function SafetyComplianceDashboard() {
  const [loading, setLoading] = useState(true)
  const [allIncidents, setAllIncidents] = useState<any[]>([])
  const [allRisks, setAllRisks] = useState<any[]>([])
  const [filteredIncidents, setFilteredIncidents] = useState<any[]>([])
  const [filteredRisks, setFilteredRisks] = useState<any[]>([])
  const [period, setPeriod] = useState<ReportPeriod>("all")

  useEffect(() => {
    async function fetchData() {
      const supabase = getSupabaseBrowserClient()
      
      const { data: incData } = await supabase
        .from("safety_incidents")
        .select("*")
        .order("incident_date", { ascending: false })
      
      const { data: riskData } = await supabase
        .from("risk_assessments")
        .select("*")
        .order("created_at", { ascending: false })
      
      setAllIncidents(incData || [])
      setAllRisks(riskData || [])
      setFilteredIncidents(incData || [])
      setFilteredRisks(riskData || [])
      setLoading(false)
    }
    fetchData()
  }, [])

  useEffect(() => {
    if (!allIncidents.length && !allRisks.length) return
    
    let fInc = allIncidents
    let fRisk = allRisks

    if (period !== "all") {
      const now = new Date()
      let interval: { start: Date; end: Date }
      if (period === "daily") interval = { start: startOfDay(now), end: endOfDay(now) }
      else if (period === "weekly") interval = { start: startOfWeek(now), end: endOfWeek(now) }
      else if (period === "monthly") interval = { start: startOfMonth(now), end: endOfMonth(now) }
      else interval = { start: startOfYear(now), end: endOfYear(now) }

      fInc = allIncidents.filter(i => {
        try { return isWithinInterval(new Date(i.incident_date), interval) } catch { return true }
      })
      fRisk = allRisks.filter(r => {
        try { return isWithinInterval(new Date(r.created_at), interval) } catch { return true }
      })
    }

    setFilteredIncidents(fInc)
    setFilteredRisks(fRisk)
  }, [period, allIncidents, allRisks])

  if (loading) return (
    <div className="h-screen w-full flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-red-600" />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing Safety Protocols...</p>
    </div>
  )

  // Mock data for charts
  const mockTrends = [
    { period: "JAN", incidents: 2, nearMisses: 8 },
    { period: "FEB", incidents: 3, nearMisses: 12 },
    { period: "MAR", incidents: 1, nearMisses: 15 },
    { period: "APR", incidents: 4, nearMisses: 9 },
    { period: "MAY", incidents: 2, nearMisses: 11 },
  ]

  const mockRiskData = filteredIncidents.map((inc, i) => ({
      id: inc.id,
      title: inc.title,
      likelihood: Math.floor(Math.random() * 5) + 1,
      severity: inc.severity === 'CRITICAL' ? 5 : (inc.severity === 'HIGH' ? 4 : (inc.severity === 'MEDIUM' ? 3 : 2)),
      riskLevel: inc.severity.toLowerCase()
  }))

  return (
    <div className="flex-1 overflow-auto p-8 space-y-10 bg-slate-50/30 dark:bg-slate-950/30 pb-20">
      <div className="relative">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-red-500/10 rounded-full blur-[100px] animate-pulse" />
          
          <div className="relative z-10 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8">
              <div className="space-y-1">
                  <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-red-600 flex items-center justify-center text-white shadow-lg shadow-red-500/20">
                          <ShieldAlert className="w-6 h-6" />
                      </div>
                      Safety Center
                  </h1>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Forensic risk monitoring & HSSE governance</p>
              </div>
              
              <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
                 <SystemPeriodFilter currentPeriod={period} onPeriodChange={setPeriod} />
                 
                 <div className="flex items-center gap-2">
                    <ProfessionalReportButton 
                        data={filteredIncidents} 
                        filename="SAFETY_INCIDENT_REPORT" 
                        title="Enterprise Incident Ledger" 
                        moduleColor="red"
                        activePeriod={period}
                        buttonLabel="Incidents"
                        headers={["incident_number", "incident_date", "title", "location", "severity", "status"]}
                    />
                    <ProfessionalReportButton 
                        data={filteredRisks} 
                        filename="SAFETY_RISK_REPORT" 
                        title="Enterprise Risk Assessment Register" 
                        moduleColor="amber"
                        activePeriod={period}
                        buttonLabel="Risks"
                        headers={["assessment_number", "date", "activity", "location", "risk_level", "status"]}
                    />
                 </div>

                 <Link href="/safety/new">
                    <Button className="h-12 px-6 rounded-2xl bg-red-600 hover:bg-black text-white font-black uppercase text-[10px] tracking-widest shadow-xl transition-all">
                        <Plus className="w-4 h-4 mr-2" /> Log Incident
                    </Button>
                 </Link>
              </div>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
          <Link href="/safety/new" className="group">
              <Card className="h-48 border-0 shadow-2xl rounded-[3rem] overflow-hidden bg-white hover:bg-red-600 transition-all duration-500 cursor-pointer border-l-[12px] border-red-600 group-hover:border-white">
                  <CardContent className="h-full p-8 flex items-center justify-between">
                      <div className="space-y-2">
                          <div className="flex items-center gap-3">
                              <h3 className="text-3xl font-black uppercase tracking-tighter text-slate-900 group-hover:text-white transition-colors">Log Incident</h3>
                              <ArrowUpRight className="w-6 h-6 text-red-600 group-hover:text-white transition-all opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0" />
                          </div>
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest group-hover:text-red-100 transition-colors">Immediate Industrial Occurence Logging</p>
                      </div>
                      <ShieldAlert className="w-24 h-24 text-red-100 group-hover:text-white/20 transition-all group-hover:scale-110 duration-700" />
                  </CardContent>
              </Card>
          </Link>

          <Link href="/safety/risk-assessment/new" className="group">
              <Card className="h-48 border-0 shadow-2xl rounded-[3rem] overflow-hidden bg-white hover:bg-amber-500 transition-all duration-500 cursor-pointer border-l-[12px] border-amber-600 group-hover:border-white">
                  <CardContent className="h-full p-8 flex items-center justify-between">
                      <div className="space-y-2">
                          <div className="flex items-center gap-3">
                              <h3 className="text-3xl font-black uppercase tracking-tighter text-slate-900 group-hover:text-white transition-colors">Assessment</h3>
                              <ArrowUpRight className="w-6 h-6 text-amber-600 group-hover:text-white transition-all opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0" />
                          </div>
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest group-hover:text-amber-100 transition-colors">Pre-Shift Hazard Mitigation Protocol</p>
                      </div>
                      <Zap className="w-24 h-24 text-amber-100 group-hover:text-white/20 transition-all group-hover:scale-110 duration-700" />
                  </CardContent>
              </Card>
          </Link>
      </div>

      <SafetyScorecard />

      <div className="grid gap-8 lg:grid-cols-2">
        <IncidentTrendsChart data={mockTrends} />
        <RiskMatrixChart data={mockRiskData} />
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between px-4">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-lg">
                    <History className="w-5 h-5" />
                </div>
                <div>
                   <h3 className="text-lg font-black uppercase tracking-tight text-slate-800 dark:text-white">Audit Registry</h3>
                   <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Permanent Archive of Site Occurrences</p>
                </div>
            </div>
        </div>
        <SafetyTable incidents={filteredIncidents} />
      </div>
    </div>
  )
}
