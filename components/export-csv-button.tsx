"use client"

import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { downloadCSV } from "@/lib/csv-export"
import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"

interface ExportCSVButtonProps {
  data: any[]
  filename: string
  label?: string
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive"
  className?: string
}

export function ExportCSVButton({ 
  data, 
  filename, 
  label = "Export to CSV", 
  variant = "outline",
  className
}: ExportCSVButtonProps) {
  const [isExporting, setIsExporting] = useState(false)
  const { toast } = useToast()

  const handleExport = () => {
    if (!data || data.length === 0) {
      toast({
        title: "No Data",
        description: "There is no data available to export.",
        variant: "destructive"
      })
      return
    }

    try {
      setIsExporting(true)
      downloadCSV(data, filename)
      toast({
        title: "Export Successful",
        description: `${data.length} records exported to CSV.`,
      })
    } catch (error) {
       toast({
        title: "Export Failed",
        description: "An error occurred while exporting data.",
        variant: "destructive"
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Button 
      variant={variant} 
      onClick={handleExport} 
      disabled={isExporting || data.length === 0}
      className={className}
    >
      <Download className="mr-2 h-4 w-4" />
      {label}
    </Button>
  )
}
