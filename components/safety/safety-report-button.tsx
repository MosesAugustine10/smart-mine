"use client"

import { Button } from "@/components/ui/button"
import { Printer, ShieldAlert, Download, FileText, ShieldCheck, AlertTriangle } from "lucide-react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { format } from "date-fns"
import { useToast } from "@/components/ui/use-toast"
import { useTranslation } from "@/components/language-context"

interface SafetyReportButtonProps {
  incidents: any[]
  stats: {
    totalIncidents: number
    criticalIncidents: number
    pendingReviews: number
    injuryFreeDays: number
  }
}

export function SafetyReportButton({ incidents, stats }: SafetyReportButtonProps) {
  const { toast } = useToast()
  const { t } = useTranslation()

  const generatePDF = () => {
    toast({ title: t("loading"), description: t("reports") })
    
    const doc = new jsPDF()
    const now = new Date()
    const dateStr = format(now, "yyyy-MM-dd HH:mm")

    // 1. Detailed Header (Red Safety Theme)
    doc.setFillColor(153, 27, 27) // Red-800
    doc.rect(0, 0, 210, 45, "F")
    
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(24)
    doc.setFont("helvetica", "bold")
    doc.text("SAFETY COMPLIANCE Review", 15, 22)
    
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.text(`SMART MINE | OCCUPATIONAL HEALTH & GOVERNANCE`, 15, 32)
    doc.text(`CORPORATE RISK LEDGER | PERMANENT RECORD`, 15, 38)

    doc.setFontSize(30)
    doc.text(`${stats.injuryFreeDays}`, 140, 25)
    doc.setFontSize(10)
    doc.text(`DAYS INJURY FREE`, 140, 32)
    doc.text(`GENERATED: ${dateStr}`, 140, 38)

    // 2. Executive Scorecard
    doc.setTextColor(15, 23, 42)
    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.text("EXECUTIVE SAFETY SCORECARD", 15, 60)

    const kpiData = [
        ["Total Recorded Incidents", stats.totalIncidents.toString(), "Pending Management Reviews", stats.pendingReviews.toString()],
        ["Critical Level Events", stats.criticalIncidents.toString(), "Compliance Status", stats.criticalIncidents > 0 ? "ACTION REQUIRED" : "NORMAL"]
    ]

    autoTable(doc, {
        startY: 65,
        head: [],
        body: kpiData,
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 4 },
        columnStyles: { 
            0: { fontStyle: 'bold', fillColor: [248, 250, 252] },
            2: { fontStyle: 'bold', fillColor: [248, 250, 252] },
            3: { fontStyle: 'bold' } 
        },
        didParseCell: (data: any) => {
            if (data.section === 'body' && data.column.index === 3 && data.cell.text[0] === 'ACTION REQUIRED') {
                data.cell.styles.textColor = [153, 27, 27]
            }
        }
    })

    // 3. Incident Ledger
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.text("DETAILED INCIDENT List", 15, (doc as any).lastAutoTable.finalY + 15)

    const tableData = incidents.map(inc => [
        inc.incident_number,
        format(new Date(inc.incident_date), 'dd MMM yyyy'),
        inc.title,
        inc.location,
        inc.severity,
        inc.status
    ])

    autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 20,
        head: [['Process', 'DATE', 'DESIGNATION', 'LOCATION', 'SEVERITY', 'GOVERNANCE']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [153, 27, 27], fontSize: 8, fontStyle: 'bold' },
        styles: { fontSize: 7.5, cellPadding: 4 },
        columnStyles: { 
            0: { fontStyle: 'bold' },
            4: { fontStyle: 'bold' }
        },
        didParseCell: (data: any) => {
            if (data.section === 'body' && data.column.index === 4) {
               if (data.cell.text[0] === 'CRITICAL') data.cell.styles.textColor = [153, 27, 27]
               if (data.cell.text[0] === 'HIGH') data.cell.styles.textColor = [180, 83, 9]
            }
        }
    })

    // 4. Governance Footer (Signatures)
    const finalY = (doc as any).lastAutoTable.finalY + 30
    doc.setFontSize(10)
    doc.setFont("helvetica", "bold")
    doc.text("AUTHORITATIVE DISCLOSURE", 15, finalY)

    const sigLineY = finalY + 20
    doc.setDrawColor(200)
    doc.line(15, sigLineY, 70, sigLineY)
    doc.line(75, sigLineY, 130, sigLineY)
    doc.line(135, sigLineY, 195, sigLineY)

    doc.setFontSize(8)
    doc.text("SAFETY OFFICER", 15, sigLineY + 5)
    doc.text("OPERATIONS MANAGER", 75, sigLineY + 5)
    doc.text("CORPORATE ReviewOR", 135, sigLineY + 5)

    // 5. Global Footer
    const pageCount = (doc as any).internal.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(7)
        doc.setTextColor(150)
        doc.text(`Permanent Compliance Document | ID: ${Math.random().toString(36).substring(7).toUpperCase()}`, 15, 285)
        doc.text(`Page ${i} of ${pageCount} | Strategic Safety Governance Division`, 140, 285)
    }

    doc.save(`Safety_Compliance_Report_${format(now, "yyyyMMdd")}.pdf`)
  }

  return (
    <Button 
        onClick={generatePDF}
        className="h-12 px-8 rounded-2xl bg-slate-950 text-white font-black uppercase text-[10px] tracking-widest gap-2 shadow-xl shadow-slate-900/10 hover:bg-red-700 transition-all active:scale-95"
    >
        <Download className="w-4 h-4 text-emerald-500" />
        Generate Compliance List
    </Button>
  )
}
