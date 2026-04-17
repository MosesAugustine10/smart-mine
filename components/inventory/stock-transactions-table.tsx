"use client"

import { useState } from "react"
import { format } from "date-fns"
import { 
    Table, TableBody, TableCell, TableHead, 
    TableHeader, TableRow 
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowUpCircle, ArrowDownCircle, History, User, Database, Info } from "lucide-react"
import { SimpleDetailModal } from "@/components/ui/simple-detail-modal"

interface StockTransactionsTableProps {
    transactions: any[]
}

export function StockTransactionsTable({ transactions }: StockTransactionsTableProps) {
    if (!transactions || transactions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-20 bg-slate-50/50 rounded-[3rem] border-4 border-dashed border-slate-200">
                <History className="w-16 h-16 text-slate-300 mb-4" />
                <h3 className="text-xl font-black text-slate-400 uppercase tracking-widest">No Activity Detected</h3>
                <p className="text-xs text-slate-400 font-bold mt-2">THE History Records IS CURRENTLY CLEAR</p>
            </div>
        )
    }

    const [infoModalOpen, setInfoModalOpen] = useState(false)
    const [infoData, setInfoData] = useState<any>(null)

    return (
        <div className="rounded-[2.5rem] border-2 border-slate-100 overflow-hidden bg-white shadow-sm">
            <Table>
                <TableHeader className="bg-slate-50">
                    <TableRow className="hover:bg-slate-50 border-0 h-16">
                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-8">Movement ID</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Asset SKU</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Type</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Quantity</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Process / Module</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Info</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-right pr-8">Date & Reviewor</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {transactions.map((tx) => (
                        <TableRow key={tx.id} className="h-16 hover:bg-slate-50/50 transition-colors border-b border-slate-50 last:border-0">
                            <TableCell className="pl-8">
                                <div className="font-mono font-black text-[10px] text-slate-400 tracking-tighter">#{tx.id.slice(-8).toUpperCase()}</div>
                            </TableCell>
                            <TableCell>
                                <div className="font-bold text-slate-900">{tx.item_code}</div>
                                <div className="text-[10px] font-medium text-slate-500 uppercase tracking-tight">{tx.item_name || 'System Managed Item'}</div>
                            </TableCell>
                            <TableCell className="text-center">
                                {tx.type === 'IN' ? (
                                    <div className="inline-flex items-center gap-1 text-emerald-600 font-black text-[10px] uppercase tracking-widest">
                                        <ArrowUpCircle className="w-4 h-4" /> Acquisition
                                    </div>
                                ) : (
                                    <div className="inline-flex items-center gap-1 text-red-600 font-black text-[10px] uppercase tracking-widest">
                                        <ArrowDownCircle className="w-4 h-4" /> Consumption
                                    </div>
                                )}
                            </TableCell>
                            <TableCell className="text-right">
                                <div className={`text-lg font-black ${tx.type === 'IN' ? 'text-emerald-600' : 'text-slate-900'}`}>
                                    {tx.type === 'IN' ? '+' : '-'}{tx.quantity}
                                </div>
                            </TableCell>
                            <TableCell className="text-center">
                                <div className="flex flex-col items-center">
                                    <Badge variant="outline" className="bg-slate-50 text-slate-600 font-bold text-[9px] uppercase tracking-tighter">
                                        {tx.module || 'GENERAL'}
                                    </Badge>
                                    <div className="text-[10px] font-black text-slate-400 mt-1 flex items-center gap-1">
                                        <Database className="w-3 h-3" /> {tx.reference_id || 'Internal'}
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell className="text-center">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => { setInfoData(tx); setInfoModalOpen(true); }}
                                  className="h-8 w-8 rounded-xl bg-blue-500/10 text-blue-600 hover:bg-blue-500 hover:text-white transition-all shadow-sm"
                                >
                                  <Info className="h-4 w-4" />
                                </Button>
                            </TableCell>
                            <TableCell className="pr-8 text-right">
                                <div className="text-xs font-bold text-slate-800">
                                    {format(new Date(tx.created_at || tx.date), 'dd MMM yyyy, HH:mm')}
                                </div>
                                <div className="text-[10px] font-medium text-slate-400 flex items-center justify-end gap-1">
                                    <User className="w-3 h-3" /> {tx.user_name || 'Authorized Reviewor'}
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            <SimpleDetailModal 
                isOpen={infoModalOpen} 
                onClose={() => setInfoModalOpen(false)} 
                data={infoData} 
                title="Transaction Details" 
            />
        </div>
    )
}
