"use client"

import { Download, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"

interface MaterialHandlingReportProps {
  data: any;
  companyName?: string;
  clientName?: string;
}

export function MaterialHandlingReportButton({ data, companyName = "DOGO ENGINEER", clientName = "Mining Client" }: MaterialHandlingReportProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const generatePDF = async () => {
    setLoading(true)
    try {
      const title = 'Material Handling Operational Report';
      
      const summary = {
        Operation_Ref: data.operation_number,
        Execution_Date: data.date ? format(new Date(data.date), "dd MMM yyyy") : "N/A",
        Sector_Region: data.region,
        Specific_Location: data.location,
        Total_Truck_Fleet: data.total_trucks || 0,
        Trips_Per_Day: data.trips_per_day || 0,
        Truck_Capacity: `${data.truck_capacity_tonnes || 0} Tonnes`,
        Daily_Production: `${data.production_per_day_tonnes || 0} MT`,
        Fuel_Consumed: `${data.total_fuel_consumed_l || 0} L`,
        Status: data.status?.toUpperCase() || "COMPLETED"
      };

      const columns = [
        { key: "parameter", label: "Operational Parameter" },
        { key: "value", label: "Captured Value" },
        { key: "notes", label: "Field Observations" }
      ];

      const reportData = [
        { parameter: "Total Fleet Active", value: data.total_trucks, notes: "Operational Trucks" },
        { parameter: "Average Trips/Truck", value: data.trips_per_day, notes: "Daily Cycle Count" },
        { parameter: "Total Production Mass", value: `${data.production_per_day_tonnes} MT`, notes: "Calculated Yield" },
        { parameter: "Fuel Efficiency", value: `${data.total_fuel_consumed_l} L`, notes: "Consumables Log" },
        { parameter: "Total Distance Covered", value: `${data.total_distance_km} KM`, notes: "Haulage Range" },
        { parameter: "Mechanical Downtime", value: `${data.downtime_hours} hrs`, notes: data.downtime_reason || "No downtime reported" },
        { parameter: "Field Challenges", value: "-", notes: data.challenges || "Normal operations" },
        { parameter: "Recommendations", value: "-", notes: data.recommendations || "Maintain current velocity" }
      ];

      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          summary,
          columns,
          data: reportData,
          company: {
            name: companyName,
            client: clientName,
            vault_ref: `SMP-MH-REP-${data.operation_number}-${Date.now().toString().slice(-4)}`
          },
          signatures: {
             operator: data.operator_signature,
             supervisor: data.supervisor_signature,
             manager: data.manager_signature
          }
        })
      });

      if (!response.ok) throw new Error("Generation failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `MH_Report_${data.operation_number}_${format(new Date(), "yyyyMMdd")}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Report Secured",
        description: "Professional PDF generated and exported to local storage."
      });
    } catch (err) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Protocol Violation",
        description: "PDF engine failed to render forensic data."
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div onClick={(e) => e.stopPropagation()}>
        <Button 
            variant="outline" 
            onClick={generatePDF}
            disabled={loading}
            className="w-full justify-start rounded-xl h-11 px-4 cursor-pointer border-0 hover:bg-blue-50 text-blue-600 font-bold gap-3"
        >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {loading ? "Generating..." : "Professional PDF"}
        </Button>
    </div>
  )
}
