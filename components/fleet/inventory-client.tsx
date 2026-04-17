"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { format } from "date-fns"
import { 
  Eye, Edit, Trash2, Search, Package, MapPin, 
  AlertTriangle, DollarSign, Archive, TrendingUp, Box, Filter
} from "lucide-react"
import { SparePart } from "@/lib/types"

interface InventoryClientProps {
  initialParts: SparePart[]
}

export function InventoryClient({ initialParts }: InventoryClientProps) {
    const [searchTerm, setSearchTerm] = useState("")

    const filteredParts = useMemo(() => {
        if (!searchTerm) return initialParts
        return initialParts.filter(p => 
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.item_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase())
        )
    }, [initialParts, searchTerm])

    return (
        <Card className="border-0 shadow-2xl rounded-[2.5rem] overflow-hidden">
            <CardHeader className="bg-slate-900 text-white p-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <CardTitle className="text-xl font-black uppercase tracking-tight">Technical Parts List</CardTitle>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Detailed Component Archive {"&"} SKU Tracking</p>
                    </div>
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="relative w-full md:w-72">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <Input 
                                placeholder="SEARCH List..." 
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="h-12 pl-12 bg-white/5 border-white/10 rounded-xl text-xs font-bold uppercase tracking-widest text-white placeholder:text-slate-600 focus:ring-blue-500"
                            />
                        </div>
                        <Button variant="outline" className="h-12 w-12 rounded-xl bg-white/5 border-white/10 hover:bg-white/10 p-0">
                            <Filter className="w-4 h-4 text-white" />
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50 border-b-2">
                                <TableHead className="text-[10px] font-black uppercase tracking-widest p-6">SKU Identification</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest">Metadata</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest">Storage Status</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-right">Stock Health</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-right">Fiscal Quantum</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredParts.map((part) => {
                                const isLowStock = part.current_stock < part.minimum_stock
                                const totalValue = (part.current_stock || 0) * (part.unit_cost || 0)
                                return (
                                    <TableRow key={part.id} className="hover:bg-slate-50/80 transition-colors border-b">
                                        <TableCell className="p-6">
                                            <div className="font-black text-slate-900 border-l-4 border-blue-600 pl-4">
                                                <p className="font-mono text-xs">{part.item_code}</p>
                                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter mt-1">{part.name}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2 mb-1">
                                                <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-2 text-blue-600 border-blue-50 bg-blue-50/10">
                                                    {part.category}
                                                </Badge>
                                            </div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">{part.manufacturer}</p>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-3 h-3 text-slate-400" />
                                                <span className="text-xs font-bold text-slate-700">{part.location}</span>
                                            </div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase mt-1">Primary Bin</p>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex flex-col items-end gap-1">
                                                <p className={`text-2xl font-black tracking-tighter ${isLowStock ? 'text-red-600' : 'text-slate-900'}`}>
                                                    {part.current_stock}
                                                </p>
                                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${isLowStock ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-100 text-slate-500'}`}>
                                                    {isLowStock ? 'THRESHOLD BREACH' : 'STABLE LEVEL'}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <p className="font-black text-slate-900 tracking-tighter">TZS {totalValue.toLocaleString()}</p>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Unit: {part.unit_cost.toLocaleString()}</p>
                                        </TableCell>
                                        <TableCell className="text-right p-6">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-slate-100">
                                                    <Archive className="h-4 w-4 text-slate-600" />
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
        </Card>
    )
}
