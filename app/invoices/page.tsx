"use client"

import { useState, useEffect, useMemo } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { 
  Plus, Receipt, TrendingUp,
  Clock, CheckCircle2, FileText,
  Search, ArrowUpRight, Loader2, History, Landmark
} from "lucide-react"
import { format, isWithinInterval, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { ProfessionalReportButton } from "@/components/ui/professional-report-button"
import { ReportBrandSelector } from "@/components/report-brand-selector"
import { SystemPeriodFilter, type ReportPeriod } from "@/components/ui/system-period-filter"
import Link from "next/link"

export default function InvoiceDashboardPage() {
  const [allInvoices, setAllInvoices] = useState<any[]>([])
  const [filteredInvoices, setFilteredInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBrand, setSelectedBrand] = useState<any>(null)
  const [period, setPeriod] = useState<ReportPeriod>("all")
  const [search, setSearch] = useState("")

  useEffect(() => {
    async function fetchInvoices() {
        const supabase = getSupabaseBrowserClient()
        const { data } = await supabase
            .from("invoices")
            .select("*")
            .order("created_at", { ascending: false })
        
        setAllInvoices(data || [])
        setFilteredInvoices(data || [])
        setLoading(false)
    }
    fetchInvoices()
  }, [])

  useEffect(() => {
    if (!allInvoices.length) return
    
    let filtered = allInvoices
    if (period !== "all") {
        const now = new Date()
        let interval: { start: Date; end: Date }
        if (period === "daily") interval = { start: startOfDay(now), end: endOfDay(now) }
        else if (period === "weekly") interval = { start: startOfWeek(now), end: endOfWeek(now) }
        else if (period === "monthly") interval = { start: startOfMonth(now), end: endOfMonth(now) }
        else interval = { start: startOfYear(now), end: endOfYear(now) }

        filtered = allInvoices.filter(inv => {
            try {
                return isWithinInterval(new Date(inv.issue_date || inv.created_at), interval)
            } catch { return true }
        })
    }

    if (search) {
        filtered = filtered.filter(inv => 
            inv.invoice_number?.toLowerCase().includes(search.toLowerCase()) ||
            inv.client_name?.toLowerCase().includes(search.toLowerCase())
        )
    }

    setFilteredInvoices(filtered)
  }, [period, allInvoices, search])

  // KPIs
  const totalInvoiced = filteredInvoices.reduce((sum, inv) => sum + (inv.grand_total || 0), 0)
  const paidInvoiced = filteredInvoices.filter(inv => inv.status === 'PAID').reduce((sum, inv) => sum + (inv.grand_total || 0), 0)
  const pendingInvoiced = totalInvoiced - paidInvoiced
  const collectionRate = totalInvoiced > 0 ? (paidInvoiced / totalInvoiced) * 100 : 0

  if (loading) return (
    <div className="h-screen w-full flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Consolidating Billing Ledger...</p>
    </div>
  )

  return (
    <div className="flex-1 overflow-auto p-8 space-y-10 bg-slate-50/30 dark:bg-slate-950/30 pb-20">
      
      {/* ── Header ── */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
          <div className="space-y-1">
              <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                      <Receipt className="w-6 h-6" />
                  </div>
                  Billing Command
              </h1>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Enterprise collections & revenue tracking center</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
              <SystemPeriodFilter currentPeriod={period} onPeriodChange={setPeriod} />
              
              <div className="flex items-center gap-2">
                <ReportBrandSelector onBrandChange={setSelectedBrand} />
                <ProfessionalReportButton 
                    data={filteredInvoices} 
                    filename="Enterprise_Billing_Report" 
                    title="Enterprise Consolidated Billing Records" 
                    moduleColor="indigo"
                    activePeriod={period}
                    headers={["invoice_number", "client_name", "issue_date", "grand_total", "status"]}
                    buttonLabel="Executive Report"
                    brand={selectedBrand}
                />
              </div>

              <Link href="/invoices/new">
                <Button className="h-12 px-6 rounded-2xl bg-slate-900 hover:bg-black text-white font-black uppercase text-[10px] tracking-widest shadow-xl transition-all">
                    <Plus className="w-4 h-4 mr-2" />
                    New Invoice
                </Button>
              </Link>
          </div>
      </div>

      {/* ── KPI Grid ── */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 shadow-lg bg-slate-900 text-white rounded-[2.5rem] overflow-hidden relative group transition-all hover:scale-[1.02]">
            <CardContent className="p-8">
                <div className="flex justify-between items-start mb-6">
                    <div className="p-3 bg-white/10 rounded-2xl">
                        <TrendingUp className="w-6 h-6" />
                    </div>
                    <Badge className="bg-white/20 text-white border-0 font-black text-[9px] uppercase tracking-widest">Revenue</Badge>
                </div>
                <h3 className="text-4xl font-black">TZS {totalInvoiced.toLocaleString()}</h3>
                <p className="text-[10px] font-black opacity-60 uppercase tracking-widest mt-4 italic">Aggregated Billing Value</p>
            </CardContent>
            <Receipt className="absolute -bottom-6 -right-6 w-32 h-32 opacity-5" />
        </Card>

        <Card className="border-0 shadow-lg bg-white dark:bg-slate-900 rounded-[2.5rem] border-l-8 border-l-emerald-500 transition-all hover:scale-[1.02]">
            <CardContent className="p-8">
                <div className="flex justify-between items-start mb-6">
                    <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
                        <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <Badge className="bg-emerald-100 text-emerald-700 border-0 font-black text-[9px] uppercase tracking-widest">Collected</Badge>
                </div>
                <h3 className="text-4xl font-black text-slate-800 dark:text-white">TZS {paidInvoiced.toLocaleString()}</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-4 italic">Settled Liquid Assets</p>
            </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-white dark:bg-slate-900 rounded-[2.5rem] border-l-8 border-l-amber-500 transition-all hover:scale-[1.02]">
            <CardContent className="p-8">
                <div className="flex justify-between items-start mb-6">
                    <div className="p-3 bg-amber-50 rounded-2xl text-amber-600">
                        <Clock className="w-6 h-6" />
                    </div>
                    <Badge className="bg-amber-100 text-amber-700 border-0 font-black text-[9px] uppercase tracking-widest">Receivables</Badge>
                </div>
                <h3 className="text-4xl font-black text-slate-800 dark:text-white">TZS {pendingInvoiced.toLocaleString()}</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-4 italic">Outstanding Commitment</p>
            </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-indigo-600 to-indigo-800 text-white rounded-[2.5rem] transition-all hover:scale-[1.02]">
            <CardContent className="p-8">
                <div className="flex justify-between items-start mb-6">
                    <div className="p-3 bg-white/10 rounded-2xl">
                        <Landmark className="w-6 h-6" />
                    </div>
                    <Badge className="bg-white/20 text-white border-0 font-black text-[9px] uppercase tracking-widest">Efficiency</Badge>
                </div>
                <h3 className="text-4xl font-black">{collectionRate.toFixed(1)}%</h3>
                <div className="h-1.5 w-full bg-white/20 rounded-full mt-6 overflow-hidden">
                    <div className="h-full bg-white transition-all duration-1000" style={{ width: `${collectionRate}%` }} />
                </div>
            </CardContent>
        </Card>
      </div>

      {/* ── Invoice History ── */}
      <div className="space-y-6">
          <div className="flex items-center justify-between px-4">
              <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg">
                      <History className="w-5 h-5" />
                  </div>
                  <div>
                     <h3 className="text-lg font-black uppercase tracking-tight text-slate-800 dark:text-white">Billing History</h3>
                     <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Chronological archive of all enterprise invoices</p>
                  </div>
              </div>
              <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                 <input 
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search Client / Invoice No..."
                    className="h-11 pl-10 pr-4 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-xl text-[10px] font-bold uppercase tracking-widest outline-none focus:border-indigo-500/50 transition-all w-72 shadow-sm"
                 />
              </div>
          </div>

          <Card className="border-0 shadow-2xl rounded-[3rem] overflow-hidden border-slate-200/60">
            <CardContent className="p-0">
                <Table>
                    <TableHeader className="bg-slate-50 dark:bg-slate-900">
                        <TableRow className="border-b-2">
                            <TableHead className="py-6 pl-8 font-black uppercase text-[9px] tracking-[0.2em]">Ref. Number</TableHead>
                            <TableHead className="font-black uppercase text-[9px] tracking-[0.2em]">Counterparty</TableHead>
                            <TableHead className="font-black uppercase text-[9px] tracking-[0.2em]">Execution Date</TableHead>
                            <TableHead className="text-right font-black uppercase text-[9px] tracking-[0.2em]">Asset Value (TZS)</TableHead>
                            <TableHead className="text-center font-black uppercase text-[9px] tracking-[0.2em]">Financial Status</TableHead>
                            <TableHead className="text-right pr-8 font-black uppercase text-[9px] tracking-[0.2em]">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredInvoices.map((inv) => (
                            <TableRow key={inv.id} className="hover:bg-slate-50/50 border-b last:border-0">
                                <TableCell className="pl-8 py-6">
                                    <span className="font-black text-xs font-mono text-slate-400">{inv.invoice_number}</span>
                                </TableCell>
                                <TableCell>
                                    <div className="font-black text-sm uppercase text-slate-900 dark:text-white leading-none mb-1">{inv.client_name}</div>
                                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                        <Building2 className="w-3 h-3" /> External Entity
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <span className="text-xs font-bold text-muted-foreground uppercase">{format(new Date(inv.issue_date || inv.created_at), 'dd MMM yyyy')}</span>
                                </TableCell>
                                <TableCell className="text-right">
                                    <span className="font-black font-mono text-lg text-slate-900 dark:text-white">{inv.grand_total.toLocaleString()}</span>
                                </TableCell>
                                <TableCell className="text-center">
                                    <Badge variant="outline" className={`rounded-xl font-black text-[9px] uppercase tracking-widest px-3 py-1.5 border-2 ${inv.status === 'PAID' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                                        {inv.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right pr-8">
                                    <Link href={`/invoices/${inv.id}`}>
                                        <Button variant="ghost" size="icon" className="h-10 w-10 hover:bg-indigo-50 text-indigo-600 rounded-xl transition-all">
                                            <ArrowUpRight className="h-5 w-5" />
                                        </Button>
                                    </Link>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
          </Card>
      </div>

    </div>
  )
}

function Building2({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M8 10h.01"/><path d="M16 10h.01"/><path d="M8 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M16 18h.01"/>
    </svg>
  )
}
