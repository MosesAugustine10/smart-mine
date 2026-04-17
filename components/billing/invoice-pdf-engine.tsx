"use client"

import { Button } from "@/components/ui/button"
import { Download, FileText, Globe, Landmark, ShieldCheck } from "lucide-react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { format } from "date-fns"
import { Invoice, InvoiceItem } from "@/lib/types"

interface InvoicePDFProps {
  invoice: Invoice;
  items: InvoiceItem[];
}

export function InvoicePDFButton({ invoice, items }: InvoicePDFProps) {
  const generatePDF = () => {
    const doc = new jsPDF()
    const now = new Date()
    const dateStr = format(now, "yyyy-MM-dd HH:mm")

    // 1. Sleek Modern Header
    doc.setFillColor(30, 41, 59) // Slate-800
    doc.rect(0, 0, 210, 60, "F")
    
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(26)
    doc.setFont("helvetica", "bold")
    doc.text("CONSULTING INVOICE", 15, 25)
    
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.text(`SMART MINE | System Solutions`, 15, 35)
    doc.text(`TANZANIA | MINING CONSULTANCY List`, 15, 42)

    doc.setFontSize(30)
    doc.text(`#${invoice.invoice_number}`, 140, 35)
    doc.setFontSize(10)
    doc.text(`ISSUED: ${format(new Date(invoice.issue_date), "MMM dd, yyyy")}`, 140, 45)
    if (invoice.due_date) {
        doc.text(`DUE: ${format(new Date(invoice.due_date), "MMM dd, yyyy")}`, 140, 52)
    }

    // 2. Client & Contractor Identity
    doc.setTextColor(30, 41, 59)
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.text("BILL TO (CLIENT):", 15, 75)
    doc.text("ISSUED BY (CONTRACTOR):", 110, 75)

    doc.setFont("helvetica", "normal")
    doc.setFontSize(10)
    doc.text([
        invoice.client_name,
        invoice.client_address || "",
        invoice.client_email || ""
    ], 15, 82)

    doc.text([
        "AMOGTECH MINING SERVICES",
        "Headquarters, Dar es Salaam",
        "finance@amogtech.com",
        "TIN: 123-456-789"
    ], 110, 82)

    // 3. Line Items Table
    const tableData = items.map(item => [
        item.description,
        item.quantity,
        `TZS ${item.unit_price.toLocaleString()}`,
        `TZS ${item.amount.toLocaleString()}`
    ])

    autoTable(doc, {
        startY: 110,
        head: [['DESCRIPTION OF SERVICES / PERFORMANCE', 'QTY', 'UNIT RATE', 'LINE TOTAL']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [30, 41, 59], fontSize: 9, fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 5 },
        columnStyles: { 0: { cellWidth: 90 }, 3: { halign: 'right', fontStyle: 'bold' } }
    })

    // 4. Financial Reconciliation
    const finalY = (doc as any).lastAutoTable.finalY + 10
    
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.text("SUBTOTAL:", 140, finalY)
    doc.text(`VAT (${invoice.tax_rate}%):`, 140, finalY + 7)
    
    doc.setFont("helvetica", "bold")
    doc.text(`TZS ${invoice.subtotal.toLocaleString()}`, 180, finalY, { align: 'right' })
    doc.text(`TZS ${invoice.tax_amount.toLocaleString()}`, 180, finalY + 7, { align: 'right' })
    
    doc.setFillColor(30, 41, 59)
    doc.rect(130, finalY + 12, 70, 15, "F")
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(14)
    doc.text("TOTAL DUE:", 135, finalY + 22)
    doc.text(`TZS ${invoice.total_amount.toLocaleString()}`, 195, finalY + 22, { align: 'right' })

    // 5. Terms & Banking
    doc.setTextColor(30, 41, 59)
    doc.setFontSize(10)
    doc.setFont("helvetica", "bold")
    doc.text("SETTLEMENT TERMS:", 15, finalY + 15)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)
    doc.text(invoice.payment_terms || "N/A", 15, finalY + 22)

    doc.setFontSize(10)
    doc.setFont("helvetica", "bold")
    doc.text("BANKING INFORMATION:", 15, finalY + 35)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)
    doc.text(invoice.bank_details || "N/A", 15, finalY + 42)

    // 6. Detailed Footer
    const pageCount = (doc as any).internal.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(150)
        doc.text(`Authorized Signatory: _________________________`, 15, 285)
        doc.text(`Fiscal Reference: ${invoice.id.substring(0, 8).toUpperCase()}`, 70, 285)
        doc.text(`Page ${i} of ${pageCount} | Smart Mine Billing List`, 140, 285)
    }

    doc.save(`Invoice_${invoice.invoice_number}_${format(now, "yyyyMMdd")}.pdf`)
  }

  return (
    <Button 
      onClick={generatePDF}
      className="h-12 px-8 rounded-2xl bg-slate-900 border-2 border-slate-900 text-white font-black uppercase text-[10px] tracking-widest gap-2 hover:bg-white hover:text-slate-900 transition-all shadow-xl shadow-slate-900/10"
    >
      <Download className="w-4 h-4" />
      Download Consulting Invoice
    </Button>
  )
}
