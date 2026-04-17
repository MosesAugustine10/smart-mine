"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, Download, Printer, ShieldCheck, CreditCard, Building2, MapPin, Globe, Mail, Phone, QrCode } from "lucide-react"
import { format } from "date-fns"

interface BillingItem {
  module: string
  reference: string
  description: string
  quantity: number
  unit_price: number
  total_cost: number
}

interface CentralizedInvoiceProps {
  invoiceNumber: string
  issueDate: string
  clientName: string
  clientAddress: string
  status: string
  taxRate: number
  billingData: BillingItem[]
}

export function CentralizedInvoice({ 
  invoiceNumber, 
  issueDate, 
  clientName, 
  clientAddress, 
  status,
  taxRate,
  billingData 
}: CentralizedInvoiceProps) {
  const totalAmount = billingData.reduce((sum, item) => sum + item.total_cost, 0)
  const taxFactor = taxRate / 100
  const taxAmount = totalAmount * taxFactor
  const grandTotal = totalAmount + taxAmount

  const generatePDF = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Main Invoice - ${invoiceNumber}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
            body { font-family: 'Inter', sans-serif; margin: 0; padding: 50px; color: #0f172a; }
            .header { display: flex; justify-between; border-bottom: 2px solid #e1e7ef; padding-bottom: 40px; margin-bottom: 40px; }
            .company-brand { display: flex; items-center; gap: 15px; }
            .logo-placeholder { width: 50px; height: 50px; background: #0f172a; border-radius: 12px; }
            .inv-meta { text-align: right; }
            .inv-meta h1 { font-size: 36px; font-weight: 900; margin: 0; color: #0f172a; }
            .inv-meta p { font-size: 10px; font-weight: 900; color: #64748b; text-transform: uppercase; margin-top: 5px; }
            .bill-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
            .bill-box h3 { font-size: 10px; font-weight: 900; text-transform: uppercase; color: #94a3b8; margin-bottom: 10px; border-bottom: 1px solid #f1f5f9; padding-bottom: 5px; }
            .bill-box p { font-size: 14px; font-weight: 700; margin: 2px 0; }
            .table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            .table th { padding: 15px; background: #f8fafc; text-align: left; font-size: 10px; font-weight: 900; text-transform: uppercase; color: #64748b; border-bottom: 2px solid #e2e8f0; }
            .table td { padding: 15px; font-size: 13px; border-bottom: 1px solid #f1f5f9; }
            .table td.right { text-align: right; font-family: monospace; font-weight: 700; }
            .summary { margin-top: 40px; display: flex; justify-end; }
            .sum-box { width: 300px; }
            .sum-row { display: flex; justify-content: space-between; padding: 10px 0; }
            .sum-row.total { border-top: 4px solid #0f172a; margin-top: 10px; padding-top: 15px; font-size: 20px; font-weight: 900; }
            .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 80px; }
            .sig-box { border-top: 1px solid #e2e8f0; padding-top: 15px; text-align: center; font-size: 10px; font-weight: 700; text-transform: uppercase; color: #94a3b8; }
            .footer { margin-top: 100px; border-top: 1px solid #f1f5f9; padding-top: 20px; font-size: 9px; color: #94a3b8; text-align: center; line-height: 1.6; }
          \n@media print { @page { margin: 0; } }\n</style>
        </head>
        <body>
          <div class="header">
            <div class="company-brand">
                <div class="logo-placeholder"></div>
                <div>
                   <div style="font-size: 20px; font-weight: 900; letter-spacing: -1px;">SMART MINE</div>
                   <div style="font-size: 10px; font-weight: 700; opacity: 0.5;">Contracting & Consulting Hub</div>
                </div>
            </div>
            <div class="inv-meta">
                <h1>INVOICE</h1>
                <p>REF: <strong>${invoiceNumber}</strong></p>
                <p>ISSUE DATE: <strong>${issueDate}</strong></p>
            </div>
          </div>

          <div class="bill-grid">
            <div class="bill-box">
                <h3>Bill From</h3>
                <p>DOGO ENGINEER (T) LIMITED</p>
                <p>Plot 45, Mlimani City Road</p>
                <p>Dar es Salaam, Tanzania</p>
                <p>TIN: 123-456-789</p>
            </div>
            <div class="bill-box" style="text-align: right;">
                <h3>Bill To</h3>
                <p>${clientName}</p>
                <p>${clientAddress}</p>
            </div>
          </div>

          <table class="table">
            <thead>
              <tr>
                <th>Operation Ref / Module</th>
                <th>Description</th>
                <th class="right">Quantity</th>
                <th class="right">Unit Amount</th>
                <th class="right">Total Line</th>
              </tr>
            </thead>
            <tbody>
              ${billingData.map(item => `
                <tr>
                   <td><div style="font-weight: 900;">${item.module}</div><div style="font-size: 10px; opacity: 0.5;">${item.reference}</div></td>
                   <td>${item.description}</td>
                   <td class="right">${item.quantity}</td>
                   <td class="right">TZS ${item.unit_price.toLocaleString()}</td>
                   <td class="right">TZS ${item.total_cost.toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="summary">
            <div class="sum-box">
                <div class="sum-row">
                    <span style="font-size: 10px; font-weight: 900; color: #94a3b8;">SUBTOTAL</span>
                    <span style="font-weight: 700;">TZS ${totalAmount.toLocaleString()}</span>
                </div>
                <div class="sum-row">
                    <span style="font-size: 10px; font-weight: 900; color: #94a3b8;">VAT (${taxRate}%)</span>
                    <span style="font-weight: 700;">TZS ${taxAmount.toLocaleString()}</span>
                </div>
                <div class="sum-row total">
                    <span>GRAND TOTAL</span>
                    <span>TZS ${grandTotal.toLocaleString()}</span>
                </div>
            </div>
          </div>

          <div class="signatures">
            <div class="sig-box">
                <div style="height: 60px;"></div>
                PREPARED BY (ACCOUNTANT)
            </div>
            <div class="sig-box">
                <div style="height: 60px;"></div>
                AUTHORIZED APPROVAL (MD)
            </div>
          </div>

          <div class="footer">
            DOGO ENGINEER (T) LIMITED | REG: 123456789 | VAT: 987654321<br>
            BANK: CRDB BANK | ACC: 01J123456789 (TZS)<br>
            * Generated automatically via SMART MINE Analysis Phase. *
          </div>
        </body>
      </html>
    `
    printWindow.document.write(html)
    printWindow.document.close()
    setTimeout(() => {
        printWindow.print()
    }, 500)
  }

  return (
    <Card className="border-0 shadow-3xl rounded-[3rem] overflow-hidden bg-white dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800">
      <CardHeader className="bg-slate-900 text-white p-10 flex flex-row items-center justify-between">
        <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20">
                <Building2 className="w-8 h-8 text-white" />
            </div>
            <div>
              <CardTitle className="text-3xl font-black uppercase tracking-tighter">Main Billing Process</CardTitle>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Consulting & Contracting Master Invoice</p>
            </div>
        </div>
        <div className="flex gap-3">
          <Button onClick={generatePDF} variant="outline" className="h-14 px-8 rounded-2xl bg-white/5 border-white/20 text-white font-black uppercase text-[10px] tracking-widest hover:bg-white hover:text-black transition-all">
             <Printer className="h-4 w-4 mr-2" /> PDF EXPORT
          </Button>
          <Button className="h-14 px-8 rounded-2xl bg-blue-600 hover:bg-blue-700 font-black uppercase text-[10px] tracking-widest shadow-xl shadow-blue-500/20 transition-all hover:scale-[1.02]">
             INDEX TO LEDGER
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-10 space-y-12">
        <div className="grid md:grid-cols-3 gap-10">
          <div className="space-y-4">
            <h4 className="font-black text-muted-foreground uppercase text-[10px] tracking-widest border-b pb-2">Internal Metadata</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-bold opacity-40">Invoice #</span>
                <span className="font-black font-mono">{invoiceNumber}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="font-bold opacity-40">Issue Cycle</span>
                <span className="font-bold">{format(new Date(issueDate), 'dd MMM yyyy')}</span>
              </div>
              <div className="flex justify-between text-xs">
                 <span className="font-bold opacity-40">Auth Status</span>
                 <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 uppercase text-[9px] font-black">{status}</Badge>
              </div>
            </div>
          </div>
          
          <div className="md:col-span-2 space-y-4 bg-slate-50/50 dark:bg-slate-900/50 p-6 rounded-3xl border-2 border-slate-100 dark:border-slate-800">
             <h4 className="font-black text-muted-foreground uppercase text-[10px] tracking-widest border-b pb-2">Client Configuration</h4>
             <div className="flex justify-between items-start">
                <div>
                   <p className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{clientName}</p>
                   <p className="text-xs font-bold text-muted-foreground mt-1 max-w-[250px]">{clientAddress}</p>
                </div>
                <div className="text-right flex flex-col items-end gap-2">
                   <div className="w-12 h-12 bg-white rounded-xl border-2 border-slate-100 flex items-center justify-center">
                      <QrCode className="w-6 h-6 text-slate-900" />
                   </div>
                   <span className="text-[9px] font-black text-slate-400 tracking-widest uppercase">Validate Process</span>
                </div>
             </div>
          </div>
        </div>

        <div className="border border-slate-100 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
            <Table>
              <TableHeader className="bg-slate-50 dark:bg-slate-900">
                <TableRow className="border-b-2">
                  <TableHead className="py-6 pl-8 font-black uppercase text-[10px] tracking-widest">Operational Service</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest">Description</TableHead>
                  <TableHead className="text-right font-black uppercase text-[10px] tracking-widest">Quantity</TableHead>
                  <TableHead className="text-right font-black uppercase text-[10px] tracking-widest pr-8">Total (TZS)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {billingData.map((item, idx) => (
                  <TableRow key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 border-b last:border-0 border-slate-50 dark:border-slate-800">
                    <TableCell className="pl-8 py-6">
                       <div className="font-black text-sm uppercase text-slate-900 dark:text-white">{item.module}</div>
                       <div className="text-[10px] font-bold text-muted-foreground uppercase mt-0.5">{item.reference}</div>
                    </TableCell>
                    <TableCell className="max-w-[300px] text-xs font-bold text-slate-700 dark:text-slate-300">{item.description}</TableCell>
                    <TableCell className="text-right font-black font-mono text-xs">{item.quantity}</TableCell>
                    <TableCell className="text-right pr-8 font-black font-mono text-sm text-slate-900 dark:text-white">{item.total_cost.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-end gap-8 pt-6 border-t-8 border-slate-100 dark:border-slate-900 mt-10">
           <div className="text-xs italic text-muted-foreground opacity-40 max-w-sm">
              * Legal Disclosure: This document serves as a Financial Records entry generated via the Main Operation Process. All values are final and authenticated.
           </div>
           <div className="w-full md:w-[400px] space-y-4">
              <div className="flex justify-between items-center text-sm">
                 <span className="font-black uppercase tracking-widest opacity-40">Subtotal Accumulation</span>
                 <span className="font-black text-slate-900 dark:text-white">TZS {totalAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                 <span className="font-black uppercase tracking-widest opacity-40">VAT Allocation ({taxRate}%)</span>
                 <span className="font-black text-slate-900 dark:text-white">TZS {taxAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center bg-slate-900 text-white p-8 rounded-[2rem] shadow-2xl shadow-slate-900/30">
                 <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Consolidated Grand Total</span>
                    <div className="text-4xl font-black tracking-tighter">TZS {grandTotal.toLocaleString()}</div>
                 </div>
                 <CreditCard className="w-10 h-10 opacity-20" />
              </div>
           </div>
        </div>
      </CardContent>
    </Card>
  )
}
