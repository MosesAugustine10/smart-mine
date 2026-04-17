import { getSupabaseServerClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  FileText, 
  ChevronLeft, 
  Download, 
  Printer, 
  ShieldCheck, 
  DollarSign, 
  Building2,
  Calendar,
  Hash,
  AlertCircle
} from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { InvoicePDFButton } from "@/components/billing/invoice-pdf-engine"
import { notFound } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function InvoiceDetailPage({ params }: { params: { id: string } }) {
  const supabase = await getSupabaseServerClient()
  
  // 1. Fetch Invoice Header
  const { data: invoice } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", params.id)
    .single()

  if (!invoice) notFound()

  // 2. Fetch Line Items
  const { data: items } = await supabase
    .from("invoice_items")
    .select("*")
    .eq("invoice_id", params.id)
    .order("created_at", { ascending: true })

  return (
    <div className="flex-1 overflow-auto p-4 md:p-8 space-y-10 bg-slate-50/20 dark:bg-slate-950/20 pb-20 font-inter">
      <div className="flex items-center justify-between max-w-6xl mx-auto">
        <Link href="/billing/invoices">
          <Button variant="ghost" className="h-10 px-4 rounded-xl font-black uppercase text-[10px] tracking-widest border-2 hover:bg-white transition-all">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Billing Hub
          </Button>
        </Link>
        <div className="flex items-center gap-2 px-6 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full">
           <ShieldCheck className="w-4 h-4 text-blue-600" />
           <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">Forensic Settlement Registry</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid lg:grid-cols-3 gap-10">
         {/* 1. Header & Financial Summary */}
         <div className="lg:col-span-2 space-y-10">
            <Card className="border-0 shadow-4xl rounded-[4rem] overflow-hidden border-t-8 border-t-blue-600">
               <CardHeader className="p-14 bg-slate-950 text-white flex flex-row justify-between items-start">
                  <div className="space-y-4">
                     <Badge className="bg-blue-600 text-[8px] font-black py-1.5 px-6 rounded-full uppercase tracking-widest">Consulting Record</Badge>
                     <CardTitle className="text-6xl font-black uppercase tracking-tighter italic leading-none">Invoicing #{invoice.invoice_number}</CardTitle>
                     <div className="flex gap-6 pt-4">
                        <div className="flex items-center gap-2 opacity-60">
                           <Calendar className="w-4 h-4" />
                           <span className="text-[10px] font-black uppercase tracking-widest">Issued: {format(new Date(invoice.issue_date), "MMM dd, yyyy")}</span>
                        </div>
                        <div className="flex items-center gap-2 text-amber-500">
                           <AlertCircle className="w-4 h-4" />
                           <span className="text-[10px] font-black uppercase tracking-widest italic font-black">Due: {format(new Date(invoice.due_date), "MMM dd, yyyy")}</span>
                        </div>
                     </div>
                  </div>
                  <div className="text-right">
                     <Badge className={`px-4 py-2 rounded-full text-[10px] font-black uppercase border-0 ${
                        invoice.status === 'PAID' ? 'bg-emerald-500/20 text-emerald-400' : 
                        invoice.status === 'DRAFT' ? 'bg-white/10 text-slate-400' :
                        'bg-amber-500/20 text-amber-500'
                     }`}>
                        {invoice.status} Status
                     </Badge>
                  </div>
               </CardHeader>
               <CardContent className="p-0">
                  <table className="w-full">
                     <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                           <th className="p-8 text-left text-[10px] font-black uppercase opacity-40 tracking-widest">Performance Description</th>
                           <th className="p-8 text-center text-[10px] font-black uppercase opacity-40 tracking-widest">Qty</th>
                           <th className="p-8 text-right text-[10px] font-black uppercase opacity-40 tracking-widest">Net Total</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                        {items?.map(item => (
                           <tr key={item.id} className="hover:bg-slate-50/50 transition-all">
                              <td className="p-8">
                                 <p className="text-md font-black uppercase text-slate-800 tracking-tighter">{item.description}</p>
                                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Unit Rate: {invoice.currency} {item.unit_price.toLocaleString()}</p>
                              </td>
                              <td className="p-8 text-center font-black text-xl text-slate-400">
                                 {item.quantity}
                              </td>
                              <td className="p-8 text-right font-black text-2xl tracking-tighter">
                                 {invoice.currency} {item.amount.toLocaleString()}
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
                  <div className="p-14 bg-slate-50 border-t border-slate-100 flex flex-col items-end gap-2">
                     <div className="flex justify-between w-64 text-slate-400">
                        <span className="text-[10px] font-black uppercase tracking-widest">Subtotal</span>
                        <span className="font-bold text-lg">{invoice.currency} {invoice.subtotal.toLocaleString()}</span>
                     </div>
                     <div className="flex justify-between w-64 text-slate-400">
                        <span className="text-[10px] font-black uppercase tracking-widest">VAT ({invoice.tax_rate}%)</span>
                        <span className="font-bold text-lg">{invoice.currency} {invoice.tax_amount.toLocaleString()}</span>
                     </div>
                     <div className="flex justify-between w-full md:w-80 mt-6 pt-6 border-t font-black text-5xl tracking-tighter italic">
                        <span className="text-[10px] font-black uppercase tracking-widest not-italic opacity-40 self-end mb-2">Grand Total</span>
                        <span>{invoice.currency} {invoice.total_amount.toLocaleString()}</span>
                     </div>
                  </div>
               </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-8">
               <Card className="border-0 shadow-2xl rounded-[3rem] p-10 bg-white">
                  <p className="text-[10px] font-black uppercase opacity-40 tracking-widest mb-4">Payment Terms</p>
                  <p className="text-sm font-bold text-slate-600 leading-relaxed italic border-l-4 border-blue-600 pl-4 bg-slate-50 py-4 rounded-r-2xl">{invoice.payment_terms || "Standard 30 Days."}</p>
               </Card>
               <Card className="border-0 shadow-2xl rounded-[3rem] p-10 bg-white">
                  <p className="text-[10px] font-black uppercase opacity-40 tracking-widest mb-4">Bank Registry</p>
                  <p className="text-sm font-bold text-slate-600 leading-relaxed font-mono bg-slate-50 p-4 rounded-2xl">{invoice.bank_details || "N/A"}</p>
               </Card>
            </div>
         </div>

         {/* 2. Governance Sidebar */}
         <div className="space-y-8">
            <Card className="border-0 shadow-3xl rounded-[3rem] overflow-hidden bg-slate-900 text-white p-10">
               <Building2 className="w-12 h-12 text-blue-500 mb-6" />
               <h3 className="text-xl font-black uppercase tracking-tight mb-2">Subject Context</h3>
               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 italic">Client Entity Details</p>
               <div className="space-y-4">
                  <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                     <p className="text-[8px] font-black uppercase text-blue-400 tracking-widest mb-1">Client Designation</p>
                     <p className="text-xl font-black uppercase tracking-tighter">{invoice.client_name}</p>
                  </div>
                  <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                     <p className="text-[8px] font-black uppercase text-blue-400 tracking-widest mb-1">Billing Point of Contact</p>
                     <p className="text-md font-black uppercase tracking-tighter">{invoice.client_email || "N/A"}</p>
                  </div>
               </div>
            </Card>

            <div className="space-y-4">
               <InvoicePDFButton invoice={invoice} items={items || []} />
               <Button variant="outline" className="w-full h-16 rounded-[2rem] border-2 font-black uppercase text-[10px] tracking-widest hover:bg-slate-950 hover:text-white transition-all shadow-xl">
                  Mark as Dispatched
               </Button>
               <Button variant="ghost" className="w-full h-12 rounded-[2rem] font-bold text-red-400 hover:bg-red-50 transition-all italic">
                  Void Settlement Record
               </Button>
            </div>

            <Card className="border-0 shadow-2xl rounded-[3rem] p-8 bg-emerald-600 text-white flex items-center gap-6">
               <ShieldCheck className="w-12 h-12 opacity-40 shrink-0" />
               <div>
                  <p className="text-xs font-black uppercase tracking-widest">Forensic Ready</p>
                  <p className="text-[10px] font-bold opacity-70">This record is immutable and synchronized across the corporate audit trail.</p>
               </div>
            </Card>
         </div>
      </div>
    </div>
  )
}
