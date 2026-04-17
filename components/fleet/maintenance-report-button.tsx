"use client"

import { Button } from "@/components/ui/button"
import { Printer, Wrench, Activity, CheckCircle2, AlertTriangle } from "lucide-react"
import { format } from "date-fns"
import { useToast } from "@/components/ui/use-toast"

interface MaintenanceReportButtonProps {
  data: any[]
  summary: {
    totalLogs: number
    totalCost: number
    upcomingServices: number
    overdueServices: number
    avgCostPerLog: number
  }
}

export function MaintenanceReportButton({ data, summary }: MaintenanceReportButtonProps) {
  const { toast } = useToast()

  const generatePDF = () => {
    toast({ title: "Archiving Maintenance History", description: "Standardized Fleet Reliability Report being finalized." })
    
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Fleet Maintenance Activity Report</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
            body { font-family: 'Inter', sans-serif; margin: 0; padding: 50px; color: #0f172a; }
            .header { display: flex; justify-between; border-bottom: 15px solid #eab308; padding-bottom: 30px; margin-bottom: 50px; }
            .brand h1 { font-size: 36px; font-weight: 900; margin: 0; letter-spacing: -2px; }
            .brand p { font-size: 10px; font-weight: 900; color: #eab308; text-transform: uppercase; letter-spacing: 2px; }
            .meta { text-align: right; }
            .meta div { font-size: 10px; font-weight: 900; color: #94a3b8; text-transform: uppercase; }
            .meta span { font-size: 16px; font-weight: 700; }
            .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 50px; }
            .kpi-card { background: #f8fafc; padding: 25px; border-radius: 24px; border: 1px solid #e2e8f0; text-align: center; }
            .kpi-label { font-size: 9px; font-weight: 900; text-transform: uppercase; color: #64748b; margin-bottom: 10px; }
            .kpi-value { font-size: 32px; font-weight: 900; color: #0f172a; }
            .section { margin-bottom: 50px; }
            .section-title { font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; color: #eab308; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid #f1f5f9; }
            .table { width: 100%; border-collapse: collapse; }
            .table th { padding: 15px; background: #f8fafc; text-align: left; font-size: 10px; font-weight: 900; text-transform: uppercase; color: #64748b; border-bottom: 2px solid #e2e8f0; }
            .table td { padding: 15px; font-size: 12px; border-bottom: 1px solid #f1f5f9; }
            .footer { margin-top: 100px; border-top: 1px solid #f1f5f9; padding-top: 30px; font-size: 10px; color: #94a3b8; text-align: center; line-height: 1.6; }
            .severity { padding: 4px 12px; border-radius: 100px; font-size: 9px; font-weight: 900; color: white; background: #eab308; }
            .text-right { text-align: right; }
          \n@media print { @page { margin: 0; } }\n</style>
        </head>
        <body>
          <div class="header">
            <div class="brand">
                <h1>SMART MINE</h1>
                <p>Main Fleet Reliability List</p>
            </div>
            <div class="meta">
                <div>Report Archival Code</div>
                <span>MAINT-${Date.now()}</span>
                <div>Generation Timeline</div>
                <span>${format(new Date(), 'dd MMM yyyy / HH:mm')}</span>
            </div>
          </div>

          <div class="kpi-grid">
            <div class="kpi-card" style="border-top: 8px solid #eab308;">
                <div class="kpi-label">Total Services</div>
                <div class="kpi-value" style="color: #eab308;">${summary.totalLogs}</div>
            </div>
            <div class="kpi-card" style="border-top: 8px solid #0f172a;">
                <div class="kpi-label">Cumulative Cost</div>
                <div class="kpi-value">TZS ${summary.totalCost.toLocaleString()}</div>
            </div>
            <div class="kpi-card" style="border-top: 8px solid #ef4444;">
                <div class="kpi-label">Overdue Alerts</div>
                <div class="kpi-value" style="color: #ef4444;">${summary.overdueServices}</div>
            </div>
            <div class="kpi-card" style="border-top: 8px solid #10b981;">
                <div class="kpi-label">Scheduled</div>
                <div class="kpi-value" style="color: #10b981;">${summary.upcomingServices}</div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Maintenance Activity Log (Most Recent)</div>
            <table class="table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Vehicle</th>
                        <th>Type</th>
                        <th>Description</th>
                        <th class="text-right">Cost (TZS)</th>
                        <th>Next Service</th>
                        <th>Auth Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.slice(0, 20).map(inc => `
                        <tr>
                            <td>${format(new Date(inc.date), 'dd MMM yyyy')}</td>
                            <td style="font-weight: 700;">${inc.vehicle?.vehicle_number || 'N/A'}</td>
                            <td><span class="severity">${inc.maintenance_type}</span></td>
                            <td>${inc.description}</td>
                            <td class="text-right" style="font-weight: 700;">${inc.cost?.toLocaleString()}</td>
                            <td>${inc.next_service_date ? format(new Date(inc.next_service_date), 'dd MMM yyyy') : 'N/A'}</td>
                            <td style="font-weight: 900; font-size: 10px;">${inc.manager_signature ? 'APPROVED' : 'PENDING'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
          </div>

          <div class="footer">
            Generated via SMART MINE Main Maintenance Process. This document is a centralized Detailed record 
            of vehicle reliability and upkeep. Unauthorized reproduction is strictly prohibited.<br>
            Corporate Compliance Office | Fleet Maintenance Division
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
    <Button 
        onClick={generatePDF}
        variant="outline" 
        className="h-12 px-6 rounded-2xl border-2 font-black uppercase text-[10px] tracking-widest bg-white dark:bg-slate-900 shadow-sm transition-all hover:bg-slate-50"
    >
        <Printer className="w-4 h-4 mr-2 text-amber-600" />
        Print Maintenance Report
    </Button>
  )
}
