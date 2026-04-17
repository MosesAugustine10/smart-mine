"use client"

import { Button } from "@/components/ui/button"
import { Printer, Download, ShieldCheck, QrCode } from "lucide-react"
import { format } from "date-fns"
import { useToast } from "@/components/ui/use-toast"

interface InventoryItem {
  item_code: string
  item_name: string
  category: string
  current_stock: number
  minimum_stock: number
  unit: string
  status: string
}

interface InventoryReportButtonProps {
  items: InventoryItem[]
  categoryName: string
}

export function InventoryReportButton({ items, categoryName }: InventoryReportButtonProps) {
  const { toast } = useToast()

  const generatePDF = () => {
    toast({ title: "Archiving Inventory Analytics", description: "Generating professional asset ledger PDF..." })
    
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Asset Inventory Ledger - ${categoryName}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
            body { font-family: 'Inter', sans-serif; margin: 0; padding: 50px; color: #0f172a; }
            .header { display: flex; justify-between; border-bottom: 8px solid #3b82f6; padding-bottom: 30px; margin-bottom: 40px; }
            .title-area h1 { font-size: 32px; font-weight: 900; margin: 0; text-transform: uppercase; letter-spacing: -1px; }
            .title-area p { font-size: 10px; font-weight: 900; color: #64748b; text-transform: uppercase; margin-top: 5px; }
            .meta-area { text-align: right; }
            .meta-area div { font-size: 10px; font-weight: 900; text-transform: uppercase; color: #94a3b8; }
            .meta-area span { font-size: 14px; font-weight: 700; color: #0f172a; }
            .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 40px; }
            .stat-box { background: #f8fafc; padding: 20px; border-radius: 16px; border: 1px solid #e2e8f0; }
            .stat-label { font-size: 9px; font-weight: 900; text-transform: uppercase; color: #94a3b8; margin-bottom: 10px; }
            .stat-value { font-size: 24px; font-weight: 900; color: #0f172a; }
            .table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            .table th { padding: 15px; background: #f8fafc; text-align: left; font-size: 10px; font-weight: 900; text-transform: uppercase; color: #64748b; border-bottom: 2px solid #e2e8f0; }
            .table td { padding: 15px; font-size: 12px; border-bottom: 1px solid #f1f5f9; }
            .table td.font-mono { font-family: monospace; font-weight: 700; }
            .status-badge { padding: 4px 12px; border-radius: 100px; font-size: 9px; font-weight: 900; text-transform: uppercase; display: inline-block; }
            .status-healthy { background: #d1fae5; color: #065f46; }
            .status-low { background: #fef3c7; color: #92400e; }
            .status-critical { background: #fee2e2; color: #991b1b; }
            .footer { margin-top: 100px; border-top: 1px solid #f1f5f9; padding-top: 20px; font-size: 9px; color: #94a3b8; text-align: center; }
          \n@media print { @page { margin: 0; } }\n</style>
        </head>
        <body>
          <div class="header">
            <div class="title-area">
                <h1>Asset Inventory Ledger</h1>
                <p>Main Resource Monitoring Process - ${categoryName}</p>
            </div>
            <div class="meta-area">
                <div>Archive Sequence</div>
                <span>${format(new Date(), 'yyyy-MM-dd / HH:mm')}</span>
            </div>
          </div>

          <div class="stats-grid">
            <div class="stat-box">
                <div class="stat-label">Total SKUs</div>
                <div class="stat-value">${items.length}</div>
            </div>
            <div class="stat-box">
                <div class="stat-label">Low Stock Alerts</div>
                <div class="stat-value">${items.filter(i => i.status === 'low').length}</div>
            </div>
            <div class="stat-box">
                <div class="stat-label">Critical Shortage</div>
                <div class="stat-value" style="color: #ef4444;">${items.filter(i => i.status === 'critical').length}</div>
            </div>
            <div class="stat-box">
                <div class="stat-label">System Health</div>
                <div class="stat-value" style="color: #10b981;">OPTIMAL</div>
            </div>
          </div>

          <table class="table">
            <thead>
              <tr>
                <th>Item Code</th>
                <th>Designation</th>
                <th>Category</th>
                <th>Stock Level</th>
                <th>Min. Required</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${items.map(item => `
                <tr>
                   <td class="font-mono">${item.item_code}</td>
                   <td><strong>${item.item_name}</strong></td>
                   <td>${item.category}</td>
                   <td>${item.current_stock} ${item.unit}</td>
                   <td>${item.minimum_stock} ${item.unit}</td>
                   <td>
                      <span class="status-badge status-${item.status}">
                         ${item.status}
                      </span>
                   </td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="footer">
            Generated by SMART MINE Main Inventory Module. Confidential Operational Asset Report.
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
        className="h-10 px-6 rounded-xl border-2 font-black uppercase text-[9px] tracking-widest hover:bg-slate-50 shadow-sm"
    >
        <Printer className="w-3.5 h-3.5 mr-2" />
        Print Professional Ledger
    </Button>
  )
}
