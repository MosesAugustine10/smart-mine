"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { DownloadCloud, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

interface PDFDownloadButtonProps {
  data: any[]
  title: string
  filename: string
}

export function PDFDownloadButton({ data, title, filename }: PDFDownloadButtonProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleDownload = async () => {
    setLoading(true)
    try {
      const supabase = getSupabaseBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      const { data: company } = await supabase
        .from('companies')
        .select('*')
        .eq('id', user?.user_metadata?.company_id || user?.id)
        .single()

      const columns = [
        { key: "survey_id", label: "SURVEY ID" },
        { key: "project_name", label: "PROJECT" },
        { key: "date_start", label: "START DATE" },
        { key: "survey_type", label: "METHOD" },
        { key: "location_name", label: "LOCATION" },
        { key: "planned_budget_tzs", label: "BUDGET (TZS)" },
        { key: "actual_cost_tzs", label: "ACTUAL (TZS)" },
        { key: "surveyor_signature", label: "SURVEYOR SIG" },
        { key: "geophysicist_signature", label: "GEOPHYSICIST SIG" },
        { key: "manager_signature", label: "MANAGER SIG" }
      ]

      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title,
          data: data,
          columns: columns,
          company: company,
          summary: {
             "Total_Surveys": data.length,
             "Total_Investment_TZS": data.reduce((sum, s) => sum + (Number(s.actual_cost_tzs) || 0), 0)
          }
        })
      })

      if (!response.ok) throw new Error('Report generation failed')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${filename}_${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      
      toast({
        title: "Success",
        description: "Professional PDF report generated."
      })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "PDF Error",
        description: error.message
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button 
      onClick={handleDownload} 
      disabled={loading}
      variant="outline"
      className="bg-purple-600 text-white hover:bg-purple-700 hover:text-white border-none shadow-lg transition-all hover:scale-105"
    >
      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <DownloadCloud className="mr-2 h-4 w-4" />}
      {loading ? "Initializing Engine..." : "Premium PDF Report"}
    </Button>
  )
}
