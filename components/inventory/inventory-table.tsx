"use client"

import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { 
    Table, TableBody, TableCell, TableHead, 
    TableHeader, TableRow 
} from "@/components/ui/table"
import { 
    AlertTriangle, Package, Warehouse, 
    History, DollarSign, Calculator, Tag, Info
} from "lucide-react"
import { SimpleDetailModal } from "@/components/ui/simple-detail-modal"
import { useState } from "react"
import { Button } from "@/components/ui/button"

interface InventoryTableProps {
    items: any[]
    onTransfer?: (item: any) => void
}

export function InventoryTable({ items, onTransfer }: InventoryTableProps) {
    const [infoModalOpen, setInfoModalOpen] = useState(false)
    const [infoData, setInfoData] = useState<any>(null)
    if (!items || items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-20 bg-slate-50 rounded-[3rem] border-4 border-dashed border-slate-200">
                <Package className="w-16 h-16 text-slate-300 mb-4" />
                <h3 className="text-xl font-black text-slate-400 uppercase tracking-widest">Master Ledger Empty</h3>
                <p className="text-xs text-slate-400 font-bold mt-2">NO REVIEWABLE ASSETS REGISTERED IN THIS SECTOR</p>
            </div>
        )
    }

    return (
        <div className="rounded-[2.5rem] border-2 border-slate-100 overflow-hidden bg-white shadow-sm">
            <Table>
                <TableHeader className="bg-slate-900">
                    <TableRow className="hover:bg-slate-900 border-0 h-16">
                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-8">Asset SKU</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Designation / Source</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Batch / Expiry</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Inventory</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Unit / Value</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Governance</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center pr-8">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {items.map((item) => {
                        const isLow = item.current_stock <= (item.minimum_stock || 10)
                        const totalValue = (item.current_stock || 0) * (item.unit_cost || item.cost_per_unit || 0)
                        
                        return (
                            <TableRow key={item.id} className="h-20 hover:bg-slate-50/50 transition-colors border-b-2 border-slate-50 last:border-0">
                                <TableCell className="pl-8">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-xl ${isLow ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'}`}>
                                            <Tag className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="font-mono font-black text-[10px] text-slate-400 tracking-tighter">{item.item_code}</div>
                                            <div className="text-sm font-bold text-slate-900">{item.item_name}</div>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="space-y-1">
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                            <Warehouse className="w-3 h-3" /> {item.location || 'Central Store'}
                                        </div>
                                        <div className="text-[11px] font-bold text-slate-600">{item.supplier || 'Generic Provider'}</div>
                                    </div>
                                </TableCell>
                                <TableCell className="text-center">
                                    <div className="space-y-1">
                                        <div className="text-[10px] font-mono font-bold px-2 py-0.5 bg-slate-100 rounded inline-block">
                                            {item.batch_number || 'NO-BATCH'}
                                        </div>
                                        {item.expiration_date && (
                                            <div className="text-[9px] font-black text-red-500 uppercase flex items-center justify-center gap-1">
                                                <AlertTriangle className="w-3 h-3" /> EXP: {format(new Date(item.expiration_date), 'dd MMM yy')}
                                            </div>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="space-y-1">
                                        <div className={`text-lg font-black ${isLow ? 'text-red-600' : 'text-slate-900'}`}>
                                            {item.current_stock} <span className="text-[10px] font-bold text-slate-400 uppercase">{item.unit || 'pcs'}</span>
                                        </div>
                                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                            Min: {item.minimum_stock || 10}
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="space-y-0.5">
                                        <div className="text-xs font-bold text-slate-800">
                                            TZS {(item.unit_cost || item.cost_per_unit || 0).toLocaleString()}
                                        </div>
                                        <div className="text-[11px] font-black text-emerald-600 flex items-center justify-end gap-1">
                                            <Calculator className="w-3 h-3" /> TZS {totalValue.toLocaleString()}
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex flex-col items-end gap-1">
                                        {isLow ? (
                                            <Badge className="bg-red-600 text-white border-0 font-black text-[9px] tracking-widest uppercase py-1">
                                                Critically Low
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50 font-black text-[9px] tracking-widest uppercase py-1">
                                                Stock Optimal
                                            </Badge>
                                        )}
                                        <div className="text-[9px] font-medium text-slate-400 flex items-center gap-1">
                                            <History className="w-3 h-3" /> Updated: {item.updated_at ? format(new Date(item.updated_at), 'dd/MM/yy') : 'N/A'}
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="text-center pr-8">
                                    <div className="flex items-center justify-center gap-2">
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            onClick={() => { setInfoData(item); setInfoModalOpen(true); }}
                                            className="h-9 w-9 rounded-xl bg-blue-500/10 text-blue-600 hover:bg-blue-500 hover:text-white transition-all shadow-sm"
                                        >
                                            <Info className="h-4 w-4" />
                                        </Button>
                                        {onTransfer && (
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                onClick={() => onTransfer(item)}
                                                className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-600 hover:bg-amber-500 hover:text-white transition-all shadow-sm"
                                            >
                                                <History className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>

            <SimpleDetailModal 
                isOpen={infoModalOpen} 
                onClose={() => setInfoModalOpen(false)} 
                data={infoData} 
                title="Asset Registry Detail" 
            />
        </div>
    )
}
