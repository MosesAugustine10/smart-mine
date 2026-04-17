"use client"

import { Button } from "@/components/ui/button"
import { FileText, Download, Printer, ShieldCheck, PieChart } from "lucide-react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { format } from "date-fns"
import { Vehicle, SparePart } from "@/lib/types"

interface FleetReportProps {
  vehicles?: Vehicle[]
  inventory?: SparePart[]
  type: "fleet_status" | "inventory_Review"
}

export function FleetReportButton({ vehicles, inventory, type }: FleetReportProps) {
  const generateReport = () => {
    const doc = new jsPDF()
    const now = new Date()
    const dateStr = format(now, "yyyy-MM-dd HH:mm")

    // Brand Header
    doc.setFillColor(15, 23, 42) // Slate-900
    doc.rect(0, 0, 210, 40, "F")
    
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(22)
    doc.setFont("helvetica", "bold")
    doc.text("SMART MINE", 15, 20)
    
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.text("Main FLEET GOVERNANCE & ASSET List", 15, 30)
    
    doc.setFontSize(8)
    doc.text(`REPORT ID: ${type.toUpperCase()}-${now.getTime()}`, 160, 20)
    doc.text(`GENERATED: ${dateStr}`, 160, 25)

    if (type === "fleet_status" && vehicles) {
      doc.setTextColor(15, 23, 42)
      doc.setFontSize(16)
      doc.setFont("helvetica", "bold")
      doc.text("STRATEGIC FLEET READINESS REPORT", 15, 55)

      autoTable(doc, {
        startY: 65,
        head: [['VEHICLE #', 'TYPE', 'MAKE/MODEL', 'STATUS', 'LOCATION', 'ODOMETER']],
        body: (vehicles || []).map(v => [
          String(v.vehicle_number || ''),
          String(v.vehicle_type || ''),
          String(`${v.make || ''} ${v.model || ''}`),
          String((v.status || '').toUpperCase()),
          String(v.current_location || v.region || ''),
          String(`${v.odometer_reading?.toLocaleString() || 0} KM`)
        ]),
        headStyles: { fillColor: [15, 23, 42], fontSize: 9, fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 4 },
        alternateRowStyles: { fillColor: [248, 250, 252] }
      })

      const finalY = (doc as any).lastAutoTable.finalY + 20
      doc.setFontSize(12)
      doc.text("EXECUTIVE SUMMARY", 15, finalY)
      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")
      doc.text(`Total Commissioned Assets: ${vehicles.length}`, 15, finalY + 10)
      doc.text(`Operational Readiness: ${vehicles.filter(v => v.status === 'operational').length}`, 15, finalY + 18)
      doc.text(`Active Technical Debt (Breakdowns): ${vehicles.filter(v => v.status === 'breakdown').length}`, 15, finalY + 26)

    } else if (type === "inventory_Review" && inventory) {
      doc.setTextColor(15, 23, 42)
      doc.setFontSize(16)
      doc.setFont("helvetica", "bold")
      doc.text("INVENTORY FISCAL Review & STOCK STATUS", 15, 55)

      const totalValue = inventory.reduce((sum, p) => sum + (p.current_stock * p.unit_cost), 0)

      autoTable(doc, {
        startY: 65,
        head: [['SKU #', 'DESIGNATION', 'CATEGORY', 'STOCK', 'UNIT COST', 'TOTAL VALUE']],
        body: (inventory || []).map(p => [
          String(p.item_code || ''),
          String(p.name || ''),
          String((p.category || '').toUpperCase()),
          String(p.current_stock ?? 0),
          String(`TZS ${p.unit_cost.toLocaleString()}`),
          String(`TZS ${(p.current_stock * p.unit_cost).toLocaleString()}`)
        ]),
        headStyles: { fillColor: [37, 99, 235], fontSize: 9, fontStyle: 'bold' }, // Blue-600
        styles: { fontSize: 8, cellPadding: 4 },
        alternateRowStyles: { fillColor: [248, 250, 252] }
      })

      const finalY = (doc as any).lastAutoTable.finalY + 20
      doc.setFontSize(12)
      doc.text("FINANCIAL RECAPITULATION", 15, finalY)
      doc.setFontSize(10)
      doc.setFont("helvetica", "bold")
      doc.text(`TOTAL INVENTORY VALUATION: TZS ${totalValue.toLocaleString()}`, 15, finalY + 10)
      
      doc.setFont("helvetica", "normal")
      doc.text(`Unique Technical SKUs Indexed: ${inventory.length}`, 15, finalY + 20)
      doc.text(`Critical Threshold Breaches: ${inventory.filter(p => p.current_stock < p.minimum_stock).length}`, 15, finalY + 28)
    }

    // 5. Governance Chain (Detailed Signatures)
    const pageHeight = doc.internal.pageSize.height
    const footerY = pageHeight - 50
    
    doc.setDrawColor(200)
    doc.line(15, footerY, 70, footerY)
    doc.line(75, footerY, 130, footerY)
    doc.line(135, footerY, 195, footerY)
    
    doc.setFontSize(8)
    doc.setTextColor(15, 23, 42)
    doc.setFont("helvetica", "bold")
    doc.text("TECHNICAL OFFICER", 15, footerY + 5)
    doc.text("OPERATIONS MANAGER", 75, footerY + 5)
    doc.text("DIRECTOR / ReviewOR", 135, footerY + 5)
    
    doc.setFont("helvetica", "normal")
    doc.setFontSize(7)
    doc.text("Asset Verification Signature", 15, footerY + 10)
    doc.text("Compliance Approval", 75, footerY + 10)
    doc.text("Strategic Authorization", 135, footerY + 10)

    doc.setFontSize(8)
    doc.setTextColor(150)
    doc.text(`Digital Verification Code: ${Math.random().toString(36).substring(7).toUpperCase()}`, 15, pageHeight - 15)
    doc.text(`Page 1 of 1 | Smart Mine Main Asset List`, 140, pageHeight - 15)

    doc.save(`SMART-MINE-${type.toUpperCase()}-${format(now, "yyyyMMdd")}.pdf`)
  }

  return (
    <Button 
      onClick={generateReport}
      className={`h-12 px-6 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg transition-all active:scale-95 ${
        type === "fleet_status" 
          ? "bg-slate-900 hover:bg-black text-white" 
          : "bg-blue-600 hover:bg-blue-700 text-white"
      }`}
    >
      <Download className="w-4 h-4 mr-2" />
      {type === "fleet_status" ? "Download Fleet Status" : "Export Inventory Review"}
    </Button>
  )
}
