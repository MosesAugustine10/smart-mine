"use client"

import { Button } from "@/components/ui/button"
import { Printer, Fuel, Activity, CheckCircle2, AlertTriangle } from "lucide-react"
import { format } from "date-fns"
import { useToast } from "@/components/ui/use-toast"

interface FuelReportButtonProps {
  data: any[]
  summary: {
    totalLogs: number
    totalFuel: number
    totalCost: number
    avgCostPerLiter: number
    uniqueVehicles: number
    todayLogs: number
  }
}

export function FuelReportButton({ data, summary }: FuelReportButtonProps) {
  const { toast } = useToast()

  const generatePDF = () => {
    toast({ title: "Archiving Fuel Metrics", description: "Standardized Fleet Consumption Report being finalized." })
    
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Fleet Fuel Consumption Report</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
            body { font-family: 'Inter', sans-serif; margin: 0; padding: 50px; color: #0f172a; }
            .header { display: flex; justify-between; border-bottom: 15px solid #3b82f6; padding-bottom: 30px; margin-bottom: 50px; }
            .brand h1 { font-size: 36px; font-weight: 900; margin: 0; letter-spacing: -2px; }
            .brand p { font-size: 10px; font-weight: 900; color: #3b82f6; text-transform: uppercase; letter-spacing: 2px; }
            .meta { text-align: right; }
            .meta div { font-size: 10px; font-weight: 900; color: #94a3b8; text-transform: uppercase; }
            .meta span { font-size: 16px; font-weight: 700; }
            .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 50px; }
            .kpi-card { background: #f8fafc; padding: 25px; border-radius: 24px; border: 1px solid #e2e8f0; text-align: center; }
            .kpi-label { font-size: 9px; font-weight: 900; text-transform: uppercase; color: #64748b; margin-bottom: 10px; }
            .kpi-value { font-size: 32px; font-weight: 900; color: #0f172a; }
            .section { margin-bottom: 50px; }
            .section-title { font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; color: #3b82f6; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid #f1f5f9; }
            .table { width: 100%; border-collapse: collapse; }
            .table th { padding: 15px; background: #f8fafc; text-align: left; font-size: 10px; font-weight: 900; text-transform: uppercase; color: #64748b; border-bottom: 2px solid #e2e8f0; }
            .table td { padding: 15px; font-size: 12px; border-bottom: 1px solid #f1f5f9; }
            .footer { margin-top: 100px; border-top: 1px solid #f1f5f9; padding-top: 30px; font-size: 10px; color: #94a3b8; text-align: center; line-height: 1.6; }
            .text-right { text-align: right; }
          \n@media print { @page { margin: 0; } }\n</style>
        </head>
        <body>
          <div class="header">
            <div class="brand">
                <h1>SMART MINE</h1>
                <p>Main Fleet Consumption List</p>
            </div>
            <div class="meta">
                <div>Report Archival Code</div>
                <span>FUEL-${Date.now()}</span>
                <div>Generation Timeline</div>
                <span>${format(new Date(), 'dd MMM yyyy / HH:mm')}</span>
            </div>
          </div>

          <div class="kpi-grid">
            <div class="kpi-card" style="border-top: 8px solid #3b82f6;">
                <div class="kpi-label">Total Fuel (L)</div>
                <div class="kpi-value" style="color: #3b82f6;">${summary.totalFuel.toFixed(2)}</div>
            </div>
            <div class="kpi-card" style="border-top: 8px solid #0f172a;">
                <div class="kpi-label">Total Cost (TZS)</div>
                <div class="kpi-value">${summary.totalCost.toLocaleString()}</div>
            </div>
            <div class="kpi-card" style="border-top: 8px solid #10b981;">
                <div class="kpi-label">Avg Cost/L</div>
                <div class="kpi-value" style="color: #10b981;">${summary.avgCostPerLiter.toFixed(2)}</div>
            </div>
            <div class="kpi-card" style="border-top: 8px solid #f59e0b;">
                <div class="kpi-label">Active Fleet</div>
                <div class="kpi-value" style="color: #f59e0b;">${summary.uniqueVehicles}</div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Fuel Transaction Log (Most Recent)</div>
            <table class="table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Vehicle</th>
                        <th>Driver</th>
                        <th>Location</th>
                        <th class="text-right">Quantity (L)</th>
                        <th class="text-right">Total Cost (TZS)</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.slice(0, 20).map(inc => `
                        <tr>
                            <td>${format(new Date(inc.date), 'dd MMM yyyy')}</td>
                            <td style="font-weight: 700;">${inc.vehicle?.vehicle_number || 'N/A'}</td>
                            <td>${inc.driver?.full_name || 'N/A'}</td>
                            <td>${inc.location}</td>
                            <td class="text-right">${inc.quantity_liters?.toFixed(2)}</td>
                            <td class="text-right" style="font-weight: 700;">${inc.total_cost?.toLocaleString()}</td>
                            <td style="font-weight: 900; font-size: 10px;">${inc.manager_signature ? 'AUTHENTICATED' : 'REVIEW PENDING'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
          </div>

          <div class="footer">
            Generated via SMART MINE Main Fleet Process. This document is a centralized Detailed record 
            of fuel consumption activities. Unauthorized reproduction is strictly prohibited.<br>
            Corporate Compliance Office | Fleet Operations Governance Division
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
        <Printer className="w-4 h-4 mr-2 text-blue-600" />
        Print Professional Fuel Report
    </Button>
  )
}
