"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { 
  ClipboardCheck, Search, ChevronLeft, ChevronRight, 
  AlertTriangle, ShieldCheck, UserCheck, Calendar, Activity, 
  MapPin, Filter, MoreHorizontal, Info
} from "lucide-react"
import { SimpleDetailModal } from "@/components/ui/simple-detail-modal"
import { QuarryReportButton } from "./quarry-reports"

interface Inspection {
  id: string
  inspection_date: string
  machine_name: string
  operator_name: string
  shift: string
  checklist_items: any[]
  amogtech_signature?: string
  tcplc_signature?: string
  inspector_signature?: string
}

interface ChecklistHistoryTableProps {
  inspections: Inspection[]
}

export function ChecklistHistoryTable({ inspections }: ChecklistHistoryTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [infoModalOpen, setInfoModalOpen] = useState(false)
  const [infoData, setInfoData] = useState<any>(null)

  const filteredInspections = inspections.filter(ins => 
    ins.machine_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ins.operator_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const paginatedInspections = filteredInspections.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const totalPages = Math.ceil(filteredInspections.length / itemsPerPage)

  return (
    <Card className="border shadow-2xl rounded-[2rem] overflow-hidden bg-white/50 backdrop-blur-md">
      <CardHeader className="p-8 border-b bg-slate-50/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <CardTitle className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3 text-blue-700">
              <ClipboardCheck className="h-8 w-8" />
              Inspection Archive (QF-01)
            </CardTitle>
            <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Historical Machine Health & Safety Compliance</p>
          </div>
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <Input
              placeholder="Search assets or operators..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 w-full md:w-[350px] h-12 rounded-2xl border-2 bg-white"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-900 text-white uppercase text-[10px] tracking-widest font-black">
              <TableRow className="hover:bg-transparent border-0">
                <TableHead className="pl-8 text-white h-14">Machine / Asset</TableHead>
                <TableHead className="text-white h-14">Date / Shift</TableHead>
                <TableHead className="text-white h-14">Inspector</TableHead>
                <TableHead className="text-center text-white h-14">Health Status</TableHead>
                <TableHead className="text-center text-white h-14">Info</TableHead>
                <TableHead className="text-right pr-8 text-white h-14">Report</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedInspections.map((ins) => {
                const hasCritical = ins.checklist_items?.some((item: any) => item.status === 'not_ok' || item.status === 'critical')
                
                return (
                  <TableRow key={ins.id} className="hover:bg-blue-50/50 transition-all group">
                    <TableCell className="pl-8 py-6 font-black text-slate-900 uppercase">
                      {ins.machine_name}
                    </TableCell>
                    <TableCell>
                       <div className="font-bold text-slate-600 text-[10px] flex items-center gap-1">
                          <Calendar className="w-3 h-3 opacity-30" />
                          {format(new Date(ins.inspection_date), "dd MMM yyyy")}
                       </div>
                       <Badge variant="outline" className="mt-1 text-[9px] font-black tracking-widest bg-slate-100 border-0">
                          {ins.shift} SHIFT
                       </Badge>
                    </TableCell>
                    <TableCell className="font-bold text-slate-600 text-xs">
                       <div className="flex items-center gap-2">
                          <UserCheck className="w-3 h-3 text-blue-500" />
                          {ins.operator_name || "Unknown"}
                       </div>
                    </TableCell>
                    <TableCell className="text-center">
                       {hasCritical ? (
                         <Badge className="bg-red-500 text-white font-black text-[9px] px-3">CRITICAL FAULT</Badge>
                       ) : (
                         <Badge className="bg-emerald-500 text-white font-black text-[9px] px-3">OPERATIONAL</Badge>
                       )}
                    </TableCell>
                    <TableCell className="text-center">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => { setInfoData(ins); setInfoModalOpen(true); }}
                            className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-300 hover:bg-blue-500 hover:text-white transition-all shadow-sm"
                        >
                            <Info className="h-4 w-4" />
                        </Button>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                       <QuarryReportButton type="checklist" data={ins} />
                    </TableCell>
                  </TableRow>
                )
              })}
              {paginatedInspections.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-20 bg-slate-50/50">
                    <AlertTriangle className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <p className="font-black text-slate-400 uppercase tracking-widest">No matching logs found in vault.</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="p-8 border-t bg-slate-50/50 flex flex-col md:flex-row items-center justify-between gap-4">
           <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
             Showing {Math.min(filteredInspections.length, (currentPage - 1) * itemsPerPage + 1)} - {Math.min(filteredInspections.length, currentPage * itemsPerPage)} of {filteredInspections.length} logs
           </p>
           <div className="flex gap-2">
             <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-12 px-6 rounded-2xl border-2 font-black uppercase text-[10px] tracking-widest"
             >
                <ChevronLeft className="w-4 h-4 mr-2" /> Prev
             </Button>
             <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="h-12 px-6 rounded-2xl border-2 font-black uppercase text-[10px] tracking-widest"
             >
                Next <ChevronRight className="w-4 h-4 ml-2" />
             </Button>
           </div>
        </div>
      </CardContent>
      <SimpleDetailModal 
          isOpen={infoModalOpen} 
          onClose={() => setInfoModalOpen(false)} 
          data={infoData} 
          title="Checklist Data" 
      />
    </Card>
  )
}
