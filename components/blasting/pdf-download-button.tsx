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

export function PDFDownloadButton({ data, summary, title = "SMART MINE - Report" }: PDFDownloadButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const { toast } = useToast ? useToast() : { toast: console.log }

  const handleDownload = async () => {
    setIsGenerating(true)
    try {
      // Setup the supabase client to fetch the user's company dynamically
      const supabase = getSupabaseBrowserClient()
      const { data: { session } } = await supabase.auth.getSession()

      let company = {
        name: "Geita Gold Mine Ltd.",
        vat_number: "VAT-2391000",
        logo_url: ""
      }

      // Automatically attach company settings if a user is logged in
      if (session?.user?.id) {
        const { data: companyData } = await supabase
          .from("companies")
          .select("*")
          .eq("id", session.user.user_metadata?.company_id || session.user.id)
          .single()

        if (companyData) company = companyData
      }

      const columns = Object.keys(data[0] || {}).map(k => ({
        key: k, label: k.replace(/_/g, ' ').toUpperCase()
      }))

      // Call the brand new Puppeteer Engine
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

      // Because the response is a binary PDF buffer
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
    >
      {isGenerating ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Download className="mr-2 h-4 w-4" />
      )}
      {isGenerating ? "Rendering Engine..." : "Professional PDF"}
    </Button>
  )
}
