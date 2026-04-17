"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { Download, ArrowUpRight, FileText, Info } from "lucide-react"
import { SimpleDetailModal } from "@/components/ui/simple-detail-modal"

export function InvoiceTableClient({ invoices }: { invoices: any[] }) {
    const [infoModalOpen, setInfoModalOpen] = useState(false)
    const [infoData, setInfoData] = useState<any>(null)

    return (
        <>
            <table className="w-full">
                <thead className="bg-slate-50 border-b">
                    <tr>
                        <th className="p-8 text-left text-[10px] font-black uppercase opacity-40 tracking-widest">Invoice Unit</th>
                        <th className="p-8 text-left text-[10px] font-black uppercase opacity-40 tracking-widest">Client Identity</th>
                        <th className="p-8 text-left text-[10px] font-black uppercase opacity-40 tracking-widest text-center">Fiscal Status</th>
                        <th className="p-8 text-right text-[10px] font-black uppercase opacity-40 tracking-widest">Financial Quantum</th>
                        <th className="p-8 text-center text-[10px] font-black uppercase opacity-40 tracking-widest">Info</th>
                        <th className="p-8 text-right text-[10px] font-black uppercase opacity-40 tracking-widest">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {invoices?.length === 0 ? (
                        <tr>
                            <td colSpan={6} className="p-20 text-center">
                                <FileText className="w-20 h-20 text-slate-100 mx-auto mb-6" />
                                <p className="text-2xl font-black text-slate-300 uppercase tracking-tighter">No Invoices Discovered</p>
                                <p className="text-sm font-bold text-slate-400 mt-2">Begin by generating a professional invoice from operational module data.</p>
                            </td>
                        </tr>
                    ) : (
                        invoices?.map(invoice => (
                            <tr key={invoice.id} className="group hover:bg-slate-50 transition-all">
                                <td className="p-8">
                                    <div>
                                        <p className="text-md font-black uppercase text-slate-800 tracking-tighter">#{invoice.invoice_number}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Issued {format(new Date(invoice.issue_date), "MMM dd, yyyy")}</p>
                                    </div>
                                </td>
                                <td className="p-8">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center font-black text-xs text-slate-400 uppercase">{invoice.client_name.substring(0, 2)}</div>
                                        <p className="text-md font-black uppercase text-slate-800 tracking-tighter">{invoice.client_name}</p>
                                    </div>
                                </td>
                                <td className="p-8 text-center">
                                    <Badge className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border-0 ${
                                        invoice.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-600' : 
                                        invoice.status === 'DRAFT' ? 'bg-slate-100 text-slate-400' :
                                        'bg-amber-500/10 text-amber-600'
                                    }`}>
                                        {invoice.status}
                                    </Badge>
                                </td>
                                <td className="p-8 text-right font-black text-xl tracking-tighter">
                                    {invoice.currency} {invoice.total_amount.toLocaleString()}
                                </td>
                                <td className="p-8 text-center">
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        onClick={() => { setInfoData(invoice); setInfoModalOpen(true); }}
                                        className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 hover:bg-blue-500 hover:text-white transition-all shadow-sm"
                                    >
                                        <Info className="h-4 w-4" />
                                    </Button>
                                </td>
                                <td className="p-8 text-right">
                                    <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100">
                                        <Button variant="outline" className="h-10 w-10 p-0 rounded-xl border-2 hover:bg-blue-600 hover:text-white transition-all">
                                            <Download className="w-4 h-4" />
                                        </Button>
                                        <Link href={`/billing/invoices/${invoice.id}`}>
                                            <Button variant="outline" className="h-10 px-4 rounded-xl border-2 font-black uppercase text-[10px] tracking-widest flex gap-2 hover:bg-slate-950 hover:text-white transition-all">
                                                View Records
                                                <ArrowUpRight className="w-3 h-3" />
                                            </Button>
                                        </Link>
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
            <SimpleDetailModal 
                isOpen={infoModalOpen} 
                onClose={() => setInfoModalOpen(false)} 
                data={infoData} 
                title="Invoice Summary" 
            />
        </>
    )
}
