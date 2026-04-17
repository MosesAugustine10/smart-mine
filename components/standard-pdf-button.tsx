"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Download, Loader2, FileCheck } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

interface StandardPDFButtonProps {
  data: any[]
  summary?: any
  title?: string
  filename?: string
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive"
  className?: string
}

export function StandardPDFButton({ 
  data, 
  summary, 
  title = "Enterprise Operations Report", 
  filename = "SMART_MINE_REPORT",
  variant = "outline",
  className = ""
}: StandardPDFButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const { toast } = useToast()

  const handleDownload = async () => {
    if (!data || data.length === 0) {
        toast({ title: "Empty Registry", description: "No data points located for transmission.", variant: "destructive" })
        return
    }

    setIsGenerating(true)
    try {
      const supabase = getSupabaseBrowserClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      let company = {
        name: "SMART MINE",
        vat_number: "CORP-VAT-999",
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

      // Automatically generate columns from data keys if not provided
      const columns = Object.keys(data[0] || {}).map(k => ({
         key: k, label: k.replace(/_/g, ' ').toUpperCase()
      }))

      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, summary, data, columns, company })
      })

      if (!response.ok) throw new Error("Registry Rendering Error")
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${filename}_${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)

      toast({
        title: "Report Transmitted",
        description: "Professional enterprise ledger generated successfully.",
      })
    } catch (err: any) {
        toast({ title: "Pipeline Error", description: err.message, variant: "destructive" })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Button 
      variant={variant}
      onClick={handleDownload}
      disabled={isGenerating}
      className={`rounded-full h-11 px-6 font-bold shadow-sm transition-all hover:shadow-lg ${className}`}
    >
      {isGenerating ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin text-purple-600" />
      ) : (
        <FileCheck className="mr-2 h-4 w-4" /> 
      )}
      {isGenerating ? "Compiling..." : "Professional PDF"}
    </Button>
  )
}
