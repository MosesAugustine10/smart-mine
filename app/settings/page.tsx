"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Upload, Building, ShieldCheck, Mail, MapPin, Archive, Download, ChevronRight } from "lucide-react"

export default function SettingsPage() {
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    address: "",
    email: "",
    phone: "",
    vat_number: "",
    logo_url: ""
  })

  const { toast } = useToast()

  useEffect(() => {
    async function loadCompanyData() {
      try {
        const supabase = getSupabaseBrowserClient()
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) return

        let companyId = session.user.user_metadata?.company_id || session.user.id

        const { data, error } = await supabase
          .from("companies")
          .select("*")
          .eq("id", companyId)
          .single()

        if (data) {
          setFormData({
            id: data.id,
            name: data.name || "",
            address: data.address || "",
            email: data.email || "",
            phone: data.phone || "",
            vat_number: data.vat_number || "",
            logo_url: data.logo_url || ""
          })
          if (data.logo_url) setPreviewUrl(data.logo_url)
        }
      } catch (err) {
        console.error("Failed to fetch company", err)
      } finally {
        setFetching(false)
      }
    }
    loadCompanyData()
  }, [])

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setLogoFile(file)
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const supabase = getSupabaseBrowserClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      let finalLogoUrl = formData.logo_url
      
      // Upload new logo if selected
      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop()
        const fileName = `company-${Date.now()}.${fileExt}`
        const filePath = `logos/${fileName}`
        
        const { error: uploadError } = await supabase.storage
          .from("company-assets")
          .upload(filePath, logoFile, { upsert: true })
          
        if (uploadError) throw uploadError
        
        const { data: { publicUrl } } = supabase.storage
          .from("company-assets")
          .getPublicUrl(filePath)
          
        finalLogoUrl = publicUrl
      }

      // Upsert company details
      const companyPayload = {
        name: formData.name,
        address: formData.address,
        email: formData.email,
        phone: formData.phone,
        vat_number: formData.vat_number,
        logo_url: finalLogoUrl
      }

      let error;
      
      if (formData.id) {
          const res = await supabase.from("companies").update(companyPayload).eq("id", formData.id)
          error = res.error
      } else if (session?.user?.id) {
          const res = await supabase.from("companies").insert({ ...companyPayload, id: session.user.id })
          error = res.error
          setFormData(prev => ({...prev, id: session.user.id, logo_url: finalLogoUrl}))
      }

      if (error) throw error

      toast({
        title: "Settings Saved",
        description: "Your company branding and reporting settings are securely updated.",
      })
      
    } catch (err: any) {
      toast({
        title: "Error Saving Settings",
        description: err.message,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
     return <div className="p-8"><Loader2 className="animate-spin h-8 w-8 text-muted-foreground" /></div>
  }

  return (
    <>
      <DashboardHeader title="Company Administrator Settings" description="Manage your enterprise global branding and PDF reporting preferences." />
      
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-3xl space-y-6">
          
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2"><Building className="h-5 w-5 text-primary" /> Corporate Identity</CardTitle>
              <CardDescription>
                These details will appear on all generated Puppeteer PDF reports and invoices.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Logo Upload Section */}
                <div className="space-y-4 border p-6 rounded-lg bg-slate-50 dark:bg-slate-900 border-dashed">
                  <div>
                    <Label className="text-base font-semibold">Reporting Engine Watermark / Branding Logo</Label>
                    <p className="text-sm text-muted-foreground mb-4">Upload a high-resolution PNG or JPG logo. This will be automatically faded as a watermark behind your PDF charts and Tables.</p>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="h-32 w-48 border bg-white dark:bg-black rounded border-slate-200 dark:border-slate-800 flex items-center justify-center overflow-hidden">
                      {previewUrl ? (
                         // eslint-disable-next-line @next/next/no-img-element
                        <img src={previewUrl} alt="Logo" className="max-h-full max-w-full object-contain p-2" />
                      ) : (
                        <span className="text-sm text-muted-foreground">No Logo Set</span>
                      )}
                    </div>
                    
                    <div>
                      <Input 
                        type="file" 
                        accept="image/png, image/jpeg" 
                        id="logo" 
                        className="hidden" 
                        onChange={handleLogoChange}
                      />
                      <Label htmlFor="logo" className="cursor-pointer inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 h-9 px-4 py-2">
                        <Upload className="mr-2 h-4 w-4" /> Upload Custom Logo
                      </Label>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Company Name *</Label>
                    <div className="relative">
                      <Building className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="name" 
                        value={formData.name} 
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        required
                        className="pl-9"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="vat_number">VAT REG / TIN Number *</Label>
                    <div className="relative">
                      <ShieldCheck className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="vat_number" 
                        value={formData.vat_number} 
                        onChange={e => setFormData({...formData, vat_number: e.target.value})}
                        required
                        className="pl-9"
                        placeholder="e.g. VAT-100-200"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Corporate Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="email" 
                        type="email"
                        value={formData.email} 
                        onChange={e => setFormData({...formData, email: e.target.value})}
                        className="pl-9"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Contact Phone</Label>
                    <Input 
                      id="phone" 
                      value={formData.phone} 
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                      placeholder="+255 700 000 000"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address">Headquarters Address</Label>
                    <div className="relative">
                      <MapPin className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
                      <Textarea 
                        id="address" 
                        value={formData.address} 
                        onChange={e => setFormData({...formData, address: e.target.value})}
                        className="pl-9"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>

                <Button type="submit" disabled={loading} size="lg">
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Branding Configuration
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Backup & Recovery Card */}
          <Card className="border-2 border-slate-900 overflow-hidden">
            <CardHeader className="bg-slate-950 text-white pb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                    <Archive className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-white text-lg font-black uppercase tracking-wider">Backup & Recovery</CardTitle>
                    <CardDescription className="text-white/40 text-xs mt-0.5">Forensic data protection for all operational records</CardDescription>
                  </div>
                </div>
                <Link href="/settings/backup">
                  <Button variant="outline" className="border-white/20 text-white bg-transparent hover:bg-white/10 gap-2 font-black uppercase text-[10px] tracking-widest">
                    Open <ChevronRight className="w-3 h-3" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-3 gap-4">
                {[
                  { icon: Download, label: "JSON Export", desc: "Full system backup" },
                  { icon: Download, label: "Excel Export", desc: "Spreadsheet format" },
                  { icon: Archive, label: "Auto-Backup", desc: "Daily / Weekly schedule" },
                ].map(({ icon: Icon, label, desc }) => (
                  <div key={label} className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <Icon className="w-5 h-5 text-slate-600 shrink-0" />
                    <div>
                      <p className="font-black text-xs uppercase tracking-wider text-slate-800">{label}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </>
  )
}
