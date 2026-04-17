"use client"

import { FileText, Download, ShieldCheck, Printer, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"

interface QuarryReportProps {
  type: 'checklist' | 'payload';
  data: any;
  contractorName?: string;
  clientName?: string;
}

export function QuarryReportButton({ type, data, contractorName = "Contractor", clientName = "Client" }: QuarryReportProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const generatePDF = async () => {
    setLoading(true)
    try {
      const title = type === 'checklist' ? 'QF-01: Equipment Inspection Report' : 'QF-02: Equipment Payload Registry';
      
      const summary = type === 'checklist' ? {
        Asset_VIN: data.machine_name,
        Inspection_Date: data.inspection_date,
        Shift: data.shift,
        Operator: data.operator_name,
        Health_Score: `${data.health_score || 0}%`,
        Status: data.health_score > 80 ? "OPERATIONAL" : "MAINTENANCE REQUIRED"
      } : {
        Asset_VIN: data.machine_name,
        Execution_Date: data.payload_date,
        Total_Trips: (data.trips || []).length,
        Total_Tonnage: `${data.total_tonnage} MT`,
        Average_Payload: `${data.average_tonnage} MT`,
        Spotter: data.operator_name
      };

      const columns = type === 'checklist' ? [
        { key: "parameter", label: "Parameter" },
        { key: "status", label: "Status" },
        { key: "category", label: "Category" }
      ] : [
        { key: "trip_number", label: "Trip" },
        { key: "tonnage", label: "Tonnage (MT)" },
        { key: "bench", label: "Bench/Location" }
      ];

      const reportData = type === 'checklist' ? (data.checklist_items || []).map((item: any) => ({
        parameter: item.en,
        status: item.status.toUpperCase(),
        category: item.category
      })) : (data.trips || []).map((t: any) => ({
        trip_number: t.trip_number,
        tonnage: t.tonnage,
        bench: t.bench || "N/A"
      }));

      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          summary,
          columns,
          data: reportData,
          company: {
            name: contractorName,
            client: clientName,
            vault_ref: `SMP-QR-${type.toUpperCase()}-${Math.random().toString(36).substring(7).toUpperCase()}`
          }
        })
      });

      if (!response.ok) throw new Error("Generation failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Quarry_${type}_${format(new Date(), "yyyyMMdd")}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Success",
        description: "Professional Forensic Report generated successfully."
      });
    } catch (err) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Protocol Error",
        description: "Failed to generate professional report via Puppeteer engine."
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button 
       variant="outline" 
       onClick={generatePDF}
       disabled={loading}
       className="h-12 px-6 rounded-2xl border-2 font-black uppercase text-[10px] tracking-widest gap-2 bg-white hover:bg-slate-50 transition-all border-slate-200"
    >
       {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 text-blue-600" />}
       {loading ? "Archiving..." : "Generate Professional PDF"}
    </Button>
  )
}
