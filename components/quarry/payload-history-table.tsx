"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { 
  Truck, Search, ChevronLeft, ChevronRight, 
  Activity, ShieldCheck, UserCheck, Calendar, 
  MapPin, Database, Award, BarChart3, TrendingUp, Info
} from "lucide-react"
import { SimpleDetailModal } from "@/components/ui/simple-detail-modal"

interface PayloadLog {
  id: string
  date: string
  machine_name: string
  operator_name: string
  shift: string
  trips: any[]
  total_tonnage?: number
  total_trips?: number
  supervisor_signature?: string
}

interface PayloadHistoryTableProps {
  payloadLogs: PayloadLog[]
}

export function PayloadHistoryTable({ payloadLogs }: PayloadHistoryTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [infoModalOpen, setInfoModalOpen] = useState(false)
  const [infoData, setInfoData] = useState<any>(null)

  const processedLogs = payloadLogs.map(log => {
    const totalTrips = log.trips?.length || 0
    const totalTonnage = log.trips?.reduce((acc: number, t: any) => acc + (parseFloat(t.tonnage) || 0), 0) || 0
    return { ...log, totalTrips, totalTonnage }
  })

  const filteredLogs = processedLogs.filter(log => 
    log.machine_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.operator_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const sortedLogs = [...filteredLogs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  
  const paginatedLogs = sortedLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const totalPages = Math.ceil(sortedLogs.length / itemsPerPage)

  return (
    <Card className="border-0 shadow-3xl rounded-[3rem] overflow-hidden bg-slate-900 text-white">
      <CardHeader className="p-10 border-b border-white/5 bg-white/5 backdrop-blur-3xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
               <Badge className="bg-emerald-500/20 text-emerald-400 border-0 font-black uppercase text-[10px] px-3">Aggregated Data</Badge>
               <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Production Ledger Analysis</span>
            </div>
            <CardTitle className="text-4xl font-black uppercase tracking-tighter flex items-center gap-4 text-white">
              <TrendingUp className="h-10 w-10 text-emerald-500" />
              Haulage Analytics Archive
            </CardTitle>
            <p className="text-xs font-medium text-white/60 mt-2 italic px-1">QF-02: Executive Payload Tracking & Efficiency Oversight</p>
          </div>
          <div className="relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-white/30 group-focus-within:text-emerald-500 transition-colors" />
            <Input
              placeholder="Filter by machine or operator..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-14 w-full md:w-[400px] h-14 rounded-3xl border-white/10 bg-white/5 text-white placeholder:text-white/20 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all text-lg"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto min-h-[400px]">
          <Table>
            <TableHeader className="bg-white/5 text-white uppercase text-[10px] tracking-widest font-black border-b border-white/5">
              <TableRow className="hover:bg-transparent border-0">
                <TableHead className="pl-10 text-white/70 h-16">Deployment Group</TableHead>
                <TableHead className="text-white/70 h-16">Calendar Reference</TableHead>
                <TableHead className="text-center text-white/70 h-16">Log Density</TableHead>
                <TableHead className="text-right text-white/70 h-16">Volume Moved</TableHead>
                <TableHead className="text-center text-white/70 h-16">Info</TableHead>
                <TableHead className="text-right pr-10 text-white/70 h-16">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedLogs.map((log) => (
                <TableRow key={log.id} className="hover:bg-white/[0.03] transition-all border-b border-white/[0.02]">
                  <TableCell className="pl-10 py-8">
                    <div className="font-black text-2xl text-emerald-400 uppercase tracking-tighter">{log.machine_name}</div>
                    <div className="flex items-center gap-2 mt-1">
                       <UserCheck className="w-3 h-3 text-white/30" />
                       <span className="text-[10px] font-black uppercase text-white/50 tracking-widest">{log.operator_name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                     <div className="font-black text-white text-lg">
                        {format(new Date(log.date), "dd MMM yyyy")}
                     </div>
                     <div className="flex items-center gap-2 mt-1">
                        <Calendar className="w-3 h-3 text-white/20" />
                        <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">{log.shift} SHIFT EXECUTION</span>
                     </div>
                  </TableCell>
                  <TableCell className="text-center">
                     <div className="inline-flex flex-col items-center p-3 rounded-2xl bg-white/5 border border-white/5 min-w-[80px]">
                        <span className="text-2xl font-black text-white">{log.totalTrips}</span>
                        <span className="text-[8px] font-black uppercase text-white/40 tracking-widest">Trips Staged</span>
                     </div>
                  </TableCell>
                  <TableCell className="text-right">
                     <div className="text-3xl font-black text-emerald-400 tracking-tighter">
                        {log.totalTonnage?.toLocaleString()} <span className="text-xs text-white/30">MT</span>
                     </div>
                     <div className="text-[9px] font-black text-white/30 uppercase tracking-widest mt-1">Certified Production Mass</div>
                  </TableCell>
                  <TableCell className="text-center">
                      <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => { setInfoData(log); setInfoModalOpen(true); }}
                          className="h-12 w-12 rounded-full border-white/10 bg-white/5 hover:bg-emerald-500 hover:border-emerald-500 hover:text-white transition-all text-emerald-400"
                      >
                          <Info className="h-5 w-5" />
                      </Button>
                  </TableCell>
                  <TableCell className="text-right pr-10">
                    <Button variant="outline" className="h-12 w-12 rounded-full border-white/10 bg-white/5 hover:bg-emerald-500 hover:border-emerald-500 hover:text-white transition-all">
                       <Database className="w-5 h-5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {paginatedLogs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-32 bg-white/[0.01]">
                    <Activity className="w-16 h-16 text-white/5 mx-auto mb-6 animate-pulse" />
                    <p className="font-black text-white/20 uppercase tracking-[0.5em] text-sm">Vault Analytics Empty</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="p-10 border-t border-white/5 bg-black/20 flex flex-col md:flex-row items-center justify-between gap-6">
           <div className="flex items-center gap-6">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                 <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">Index Page</p>
                 <p className="text-lg font-black text-white">{currentPage} <span className="text-white/20">/ {totalPages || 1}</span></p>
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/30 max-w-[200px] leading-relaxed">
                Authorized access to production archives. All entries GPS verified and timestamped.
              </p>
           </div>
           <div className="flex gap-4">
             <Button 
                variant="outline" 
                size="lg" 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-16 px-10 rounded-[1.5rem] border-white/10 bg-white/5 text-white font-black uppercase text-xs tracking-widest hover:bg-white/10 disabled:opacity-20 transition-all"
             >
                <ChevronLeft className="w-5 h-5 mr-3" /> Prev
             </Button>
             <Button 
                variant="outline" 
                size="lg" 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="h-16 px-10 rounded-[1.5rem] border-white/10 bg-white/5 text-white font-black uppercase text-xs tracking-widest hover:bg-white/10 disabled:opacity-20 transition-all"
             >
                Next <ChevronRight className="w-5 h-5 ml-3" />
             </Button>
           </div>
        </div>
      </CardContent>
      <SimpleDetailModal 
          isOpen={infoModalOpen} 
          onClose={() => setInfoModalOpen(false)} 
          data={infoData} 
          title="Payload Detail" 
      />
    </Card>
  )
}
