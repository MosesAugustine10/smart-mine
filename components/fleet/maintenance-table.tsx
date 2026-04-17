"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { format } from "date-fns"
import { Eye, Edit, Trash2, Search, Wrench, Calendar, Gauge, ShieldCheck, AlertTriangle, CheckCircle2, Info } from "lucide-react"
import { SimpleDetailModal } from "@/components/ui/simple-detail-modal"

interface MaintenanceLog {
  id: string
  maintenance_date: string
  maintenance_type: string
  description: string
  cost: number
  performed_by: string
  next_service_date: string
  odometer_reading: number
  reporter_signature?: string
  supervisor_signature?: string
  manager_signature?: string
  vehicle: {
    vehicle_number: string
    vehicle_type: string
  }
}

interface MaintenanceTableProps {
  maintenanceLogs: MaintenanceLog[]
}

export function MaintenanceTable({ maintenanceLogs }: MaintenanceTableProps) {
    const [searchTerm, setSearchTerm] = useState("")
    const [infoModalOpen, setInfoModalOpen] = useState(false)
    const [infoData, setInfoData] = useState<any>(null)
    const today = new Date().toISOString().split('T')[0]

    const filteredLogs = maintenanceLogs.filter(log => 
        log.vehicle?.vehicle_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.maintenance_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.performed_by?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const getServiceStatus = (nextDate: string) => {
        if (!nextDate) return null
        if (nextDate < today) return { label: "OVERDUE", color: "destructive", icon: AlertTriangle }
        if (nextDate === today) return { label: "DUE TODAY", color: "warning", icon: AlertTriangle }
        return { label: "SCHEDULED", color: "outline", icon: CheckCircle2 }
    }

    return (
        <Card className="border-0 shadow-2xl rounded-[2.5rem] overflow-hidden">
            <CardHeader className="bg-slate-900 text-white p-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <CardTitle className="text-xl font-black uppercase tracking-tight">Fleet Reliability Ledger</CardTitle>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Detailed Maintenance {"&"} Repair Archive</p>
                    </div>
                    <div className="relative w-full md:w-72">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <Input 
                            placeholder="SEARCH ACTIVITY..." 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="h-12 pl-12 bg-white/5 border-white/10 rounded-xl text-xs font-bold uppercase tracking-widest text-white placeholder:text-slate-600 focus:ring-amber-500"
                        />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50 border-b-2">
                                <TableHead className="text-[10px] font-black uppercase tracking-widest p-6">Timeline</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest">Asset Details</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest">Activity Type</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest">Performance</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">Governance</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">Info</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredLogs.map((log) => {
                                const status = getServiceStatus(log.next_service_date)
                                return (
                                    <TableRow key={log.id} className="hover:bg-slate-50/80 transition-colors border-b">
                                        <TableCell className="p-6">
                                            <div className="font-black text-slate-900 border-l-4 border-amber-500 pl-4">
                                                {format(new Date(log.maintenance_date), "dd MMM yyyy")}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="p-2.5 rounded-xl bg-slate-900 text-white">
                                                    <Wrench className="w-4 h-4 text-amber-500" />
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-900 uppercase tracking-tight">{log.vehicle?.vehicle_number || 'N/A'}</p>
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase">{log.vehicle?.vehicle_type}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-2 text-amber-600 border-amber-50 mb-1">
                                                {log.maintenance_type}
                                            </Badge>
                                            <p className="text-[10px] font-bold text-slate-400 line-clamp-1 italic max-w-[200px]">{log.description}</p>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Gauge className="w-3 h-3 text-slate-400" />
                                                <span className="text-xs font-bold text-slate-700">{log.odometer_reading?.toLocaleString()} KM</span>
                                            </div>
                                            {status && (
                                                <div className="mt-1 flex items-center gap-1.5">
                                                    <status.icon className={`w-3 h-3 ${status.color === 'destructive' ? 'text-red-500' : 'text-amber-500'}`} />
                                                    <span className={`text-[8px] font-black uppercase ${status.color === 'destructive' ? 'text-red-600' : 'text-amber-600'}`}>{status.label}: {format(new Date(log.next_service_date), 'dd/MM/yyyy')}</span>
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <p className="font-black text-slate-900 tracking-tighter">TZS {log.cost?.toLocaleString() || 0}</p>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{log.performed_by}</p>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center justify-center gap-1.5">
                                                <ShieldCheck className={`w-5 h-5 ${log.reporter_signature ? 'text-amber-500' : 'text-slate-200'}`} />
                                                <ShieldCheck className={`w-5 h-5 ${log.supervisor_signature ? 'text-blue-500' : 'text-slate-200'}`} />
                                                <ShieldCheck className={`w-5 h-5 ${log.manager_signature ? 'text-emerald-500' : 'text-slate-200'}`} />
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                onClick={() => { setInfoData(log); setInfoModalOpen(true); }}
                                                className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 hover:bg-amber-500 hover:text-white transition-all shadow-sm"
                                            >
                                                <Info className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                        <TableCell className="text-right p-6">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-slate-100">
                                                    <Eye className="h-4 w-4 text-slate-600" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-red-50">
                                                    <Trash2 className="h-4 w-4 text-red-400" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
            <SimpleDetailModal 
                isOpen={infoModalOpen} 
                onClose={() => setInfoModalOpen(false)} 
                data={infoData} 
                title="Maintenance Entry" 
            />
        </Card>
    )
}
