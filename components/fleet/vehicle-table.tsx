"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ExportCSVButton } from "@/components/export-csv-button"
import { Search, Truck, MapPin, Edit, Trash2, ShieldCheck, AlertTriangle, CheckCircle2, Info } from "lucide-react"
import { SimpleDetailModal } from "@/components/ui/simple-detail-modal"
import { Vehicle } from "@/lib/types"

interface VehicleTableProps {
  vehicles: Vehicle[]
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  operational: { label: "OPERATIONAL", color: "bg-emerald-500", icon: CheckCircle2 },
  maintenance: { label: "MAINTENANCE", color: "bg-amber-500", icon: AlertTriangle },
  breakdown: { label: "BREAKDOWN", color: "bg-red-500", icon: ShieldCheck },
  retired: { label: "RETIRED", color: "bg-slate-400", icon: Trash2 },
}

export function VehicleTable({ vehicles }: VehicleTableProps) {
    const [searchTerm, setSearchTerm] = useState("")
    const [infoModalOpen, setInfoModalOpen] = useState(false)
    const [infoData, setInfoData] = useState<any>(null)

    const filteredVehicles = vehicles.filter(v => 
        v.vehicle_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.vehicle_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.current_location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.region?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <Card className="border-0 shadow-2xl rounded-[2.5rem] overflow-hidden">
            <CardHeader className="bg-slate-900 text-white p-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <CardTitle className="text-xl font-black uppercase tracking-tight">Active Asset List</CardTitle>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Strategic Mining Fleet Indexing</p>
                    </div>
                    <div className="relative w-full md:w-72">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <Input 
                            placeholder="SEARCH ASSETS..." 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="h-12 pl-12 bg-white/5 border-white/10 rounded-xl text-xs font-bold uppercase tracking-widest text-white placeholder:text-slate-600 focus:ring-slate-500"
                        />
                    </div>
                    <ExportCSVButton data={filteredVehicles} filename="FleetList" className="h-12 border-white/20 bg-white/10 text-white hover:bg-white/20" />
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50 border-b-2">
                                <TableHead className="text-[10px] font-black uppercase tracking-widest p-6">Identification</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest">Metadata</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest">Strategic Deployment</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest">Operational Status</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">Info</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredVehicles.map((vehicle) => {
                                const status = statusConfig[vehicle.status] || statusConfig.operational
                                return (
                                    <TableRow key={vehicle.id} className="hover:bg-slate-50/80 transition-colors border-b">
                                        <TableCell className="p-6">
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 rounded-2xl bg-slate-900 text-white">
                                                    <Truck className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-900 uppercase tracking-tight">{vehicle.vehicle_number}</p>
                                                    <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest mt-1 border-2 border-slate-100 italic">
                                                        {vehicle.vehicle_type}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <p className="text-xs font-bold text-slate-700">{vehicle.make} {vehicle.model}</p>
                                            <p className="text-[9px] font-black text-slate-400 uppercase">Commissioned in {vehicle.year}</p>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-3 h-3 text-slate-400" />
                                                <span className="text-xs font-bold text-slate-700">{vehicle.region}</span>
                                            </div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase mt-1 italic">{vehicle.current_location}</p>
                                        </TableCell>
                                        <TableCell>
                                            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${status.color} text-white shadow-lg shadow-${status.color}/20`}>
                                                <status.icon className="w-3 h-3" />
                                                <span className="text-[9px] font-black uppercase tracking-widest">{status.label}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center p-6">
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                onClick={() => { setInfoData(vehicle); setInfoModalOpen(true); }}
                                                className="h-10 w-10 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                                            >
                                                <Info className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                        <TableCell className="text-right p-6">
                                            <div className="flex justify-end gap-2">
                                                <Link href={`/fleet/vehicles/${vehicle.id}`}>
                                                  <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-slate-100">
                                                      <Edit className="h-4 w-4 text-slate-600" />
                                                  </Button>
                                                </Link>
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
                title="Mission Critical Asset Detail" 
            />
        </Card>
    )
}
