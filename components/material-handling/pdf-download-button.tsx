"use client"
import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Download, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

interface PDFDownloadButtonProps {
  data: any[]
  summary: any
  title?: string
}

export function PDFDownloadButton({ data, summary, title = "Material Handling Report" }: PDFDownloadButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const { toast } = useToast ? useToast() : { toast: console.log }

  const handleDownload = async () => {
    setIsGenerating(true)
    try {
      const supabase = getSupabaseBrowserClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      let company = {
        name: "Geita Gold Mine Ltd.",
        vat_number: "VAT-2391000",
        logo_url: ""
      }

      if (session?.user?.id) {
          const { data: companyData } = await supabase
             .from("companies")
             .select("*")
             .eq("id", session.user.user_metadata?.company_id || session.user.id)
             .single()
             
          if (companyData) company = companyData
      }

      // Filter columns that might be binary or heavy
      const columns = [
        { key: "operation_number", label: "OP #" },
        { key: "date", label: "DATE" },
        { key: "day", label: "DAY" },
        { key: "location", label: "SITE" },
        { key: "production_per_day_tonnes", label: "YIELD (t)" },
        { key: "total_fuel_consumed_l", label: "FUEL (L)" },
        { key: "total_cost", label: "COST (TZS)" },
        { key: "operator_signature", label: "OPERATOR SIG" },
        { key: "supervisor_signature", label: "SUPERVISOR SIG" },
        { key: "manager_signature", label: "MANAGER SIG" }
      ]

      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title,
          summary,
          data,
          columns,
          company
        })
      })

      if (!response.ok) throw new Error("Failed to generate PDF")
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${title.replace(/\s+/g, '_')}_${new Date().toLocaleDateString()}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)

      toast({
        title: "Success",
        description: "Professional PDF generated securely.",
      })
    } catch (err: any) {
       toast({
         title: "Error Generating PDF",
         description: err.message,
         variant: "destructive"
       })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Button 
      variant="outline" 
      onClick={handleDownload}
      disabled={isGenerating}
      className="bg-white/50 dark:bg-slate-900 shadow-sm border"
    >
      {isGenerating ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Download className="mr-2 h-4 w-4 text-emerald-500" /> 
      )}
      {isGenerating ? "Rendering Engine..." : "Premium PDF"}
    </Button>
  )
}
