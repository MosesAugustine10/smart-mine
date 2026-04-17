"use client"
import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Download, FileText, FileSpreadsheet, Calendar as CalendarIcon } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import * as XLSX from "xlsx"
import { format } from "date-fns"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Simplified date filtering implementation
export function ReportExportButtons({ data, columns, title, filename }: any) {
  const { toast } = useToast ? useToast() : { toast: console.log }
  const [filterStartDate, setFilterStartDate] = useState<Date | undefined>(undefined)
  const [filterEndDate, setFilterEndDate] = useState<Date | undefined>(undefined)

  const downloadExcel = () => {
    try {
      const filteredData = filterDataByDate(data)
      const worksheetUrl = filteredData.map(item => {
        let mapped: any = {}
        columns.forEach((col: any) => {
          mapped[col.label] = item[col.key]
        })
        return mapped
      })

      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(worksheetUrl)

      // Column widths based on title len
      const wscols = columns.map((col: any) => ({ wch: Math.max(col.label.length, 12) }))
      ws['!cols'] = wscols

      XLSX.utils.book_append_sheet(wb, ws, "Report Data")
      XLSX.writeFile(wb, `${filename}_${format(new Date(), 'yyyyMMdd')}.xlsx`)

      toast({
         title: "Export Success",
         description: "Enterprise Excel File generated successfully"
      })
    } catch(err: any) {
        toast({
           title: "Export Failed",
           variant: "destructive"
        })
    }
  }

  const downloadCSV = () => {
    try {
      const filteredData = filterDataByDate(data)
      const ws = XLSX.utils.json_to_sheet(filteredData.map(item => {
         let mapped: any = {}
         columns.forEach((col: any) => { mapped[col.label] = item[col.key] })
         return mapped
      }))
      const csvOutput = XLSX.utils.sheet_to_csv(ws)
      const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement("a")
      link.href = URL.createObjectURL(blob)
      link.download = `${filename}_${format(new Date(), 'yyyyMMdd')}.csv`
      link.click()
      link.remove()
      
      toast({ title: "Export Success", description: "CSV File generated securely" })
    } catch(err) {
       toast({ title: "Failed", variant: "destructive" })
    }
  }

  const filterDataByDate = (payload: any[]) => {
      if(!filterStartDate && !filterEndDate) return payload;
      return payload.filter(row => {
          const rowDate = new Date(row.date || row.created_at)
          if(filterStartDate && rowDate < filterStartDate) return false;
          if(filterEndDate && rowDate > filterEndDate) return false;
          return true;
      })
  }

  return (
    <div className="flex gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" /> Export Data
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={downloadExcel} className="cursor-pointer">
            <FileSpreadsheet className="mr-2 h-4 w-4 text-emerald-600" />
            Excel (.xlsx)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={downloadCSV} className="cursor-pointer">
            <FileText className="mr-2 h-4 w-4 text-slate-600" />
            CSV (.csv)
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
