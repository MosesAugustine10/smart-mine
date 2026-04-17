"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { format } from "date-fns"
import { Eye, Edit, Trash2, Search, Fuel, MapPin, User, ShieldCheck, Info } from "lucide-react"
import { SimpleDetailModal } from "@/components/ui/simple-detail-modal"

interface FuelLog {
  id: string
  log_date_time: string
  location: string
  fuel_type: string
  quantity: number
  cost_per_liter: number
  total_cost: number
  odometer_reading: number
  reporter_signature?: string
  supervisor_signature?: string
  manager_signature?: string
  vehicle: {
    vehicle_number: string
    vehicle_type: string
  }
  driver?: {
    full_name: string
  }
}

interface FuelLogsTableProps {
  fuelLogs: FuelLog[]
}

export function FuelLogsTable({ fuelLogs }: FuelLogsTableProps) {
    const [searchTerm, setSearchTerm] = useState("")
    const [infoModalOpen, setInfoModalOpen] = useState(false)
    const [infoData, setInfoData] = useState<any>(null)

    const filteredLogs = fuelLogs.filter(log => 
        log.vehicle?.vehicle_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.driver?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <Card className="border-0 shadow-2xl rounded-[2.5rem] overflow-hidden">
            <CardHeader className="bg-slate-900 text-white p-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <CardTitle className="text-xl font-black uppercase tracking-tight">Fuel Disbursement List</CardTitle>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Detailed Fleet Consumption Archive</p>
                    </div>
                    <div className="relative w-full md:w-72">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <Input 
                            placeholder="SEARCH List..." 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="h-12 pl-12 bg-white/5 border-white/10 rounded-xl text-xs font-bold uppercase tracking-widest text-white placeholder:text-slate-600 focus:ring-blue-500"
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
                                <TableHead className="text-[10px] font-black uppercase tracking-widest">Asset Identification</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest">Operator</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest">Disbursement</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">Governance</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">Info</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredLogs.map((log) => (
                                <TableRow key={log.id} className="hover:bg-slate-50/80 transition-colors border-b">
                                    <TableCell className="p-6">
                                        <div className="font-black text-slate-900 border-l-4 border-blue-500 pl-4">
                                            {format(new Date(log.log_date_time), "dd MMM yyyy")}
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">{format(new Date(log.log_date_time), "HH:mm")}</p>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="p-2.5 rounded-xl bg-slate-900 text-white">
                                                <Fuel className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-900 uppercase tracking-tight">{log.vehicle?.vehicle_number || 'N/A'}</p>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase">{log.vehicle?.vehicle_type}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <User className="w-3 h-3 text-slate-400" />
                                            <span className="text-xs font-bold text-slate-700">{log.driver?.full_name || 'N/A'}</span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <MapPin className="w-3 h-3 text-slate-400" />
                                            <span className="text-[9px] font-black text-slate-400 uppercase">{log.location}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-2 text-blue-600 border-blue-50">
                                            {log.quantity.toFixed(2)} L
                                        </Badge>
                                        <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase italic">{log.fuel_type}</p>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <p className="font-black text-slate-900 tracking-tighter">TZS {log.total_cost.toLocaleString()}</p>
                                        <p className="text-[9px] font-bold text-slate-400 tracking-widest uppercase">L: {log.cost_per_liter.toLocaleString()}</p>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-center gap-1.5">
                                            <ShieldCheck className={`w-5 h-5 ${log.reporter_signature ? 'text-blue-500' : 'text-slate-200'}`} />
                                            <ShieldCheck className={`w-5 h-5 ${log.supervisor_signature ? 'text-amber-500' : 'text-slate-200'}`} />
                                            <ShieldCheck className={`w-5 h-5 ${log.manager_signature ? 'text-emerald-500' : 'text-slate-200'}`} />
                                        </div>
                                        <p className="text-[8px] font-black text-center text-slate-400 uppercase mt-1">Chain Status</p>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            onClick={() => { setInfoData(log); setInfoModalOpen(true); }}
                                            className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 hover:bg-blue-500 hover:text-white transition-all shadow-sm"
                                        >
                                            <Info className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                    <TableCell className="text-right">
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
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
            <SimpleDetailModal 
                isOpen={infoModalOpen} 
                onClose={() => setInfoModalOpen(false)} 
                data={infoData} 
                title="Fuel Log Data" 
            />
        </Card>
    )
}
