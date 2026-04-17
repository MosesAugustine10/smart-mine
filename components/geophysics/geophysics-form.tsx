"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, MapPin, Radio, FileText, BadgeCheck, DollarSign, Activity } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { DAYS_OF_WEEK } from "../../lib/constants"
import { ProfessionalSignature } from "@/components/professional-signature"
import { RegionSelect } from "@/components/ui/region-select"
import { Badge } from "@/components/ui/badge"

const surveyMethods = [
  "Induced Polarization (IP)",
  "Magnetic",
  "Resistivity",
  "Electromagnetic (EM)",
  "Seismic",
  "Gravity",
  "Radiometrics"
]

const equipmentOptions = [
  "IP Transmitter", "IP Receiver", "Magnetometer", "Gradiometer",
  "Resistivity Meter", "EM Meter", "Seismograph", "GPS",
  "Data Logger", "Field Computer", "Power Generator", "Cables"
]

interface GeophysicsFormProps {
  surveyId?: string
}

export function GeophysicsForm({ surveyId }: GeophysicsFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    survey_id: surveyId || "",
    project_name: "",
    survey_type: "",
    location_name: "",
    region: "",
    date_start: new Date().toISOString().split('T')[0],
    date_end: "",
    team_leader: "",
    team_members: "",
    equipment: [] as string[],
    line_spacing: "",
    station_spacing: "",
    grid_reference: "",
    start_time: "",
    end_time: "",
    weather: "",
    notes: "",
    status: "planned",
    
    // Budgeting Fields
    planned_budget_tzs: "",
    actual_cost_tzs: "0"
  })

  const [signatures, setSignatures] = useState({
    surveyor: null as any,
    geophysicist: null as any,
    manager: null as any
  })

  const toggleEquipment = (item: string) => {
    setFormData(prev => ({
      ...prev,
      equipment: prev.equipment.includes(item)
        ? prev.equipment.filter(e => e !== item)
        : [...prev.equipment, item]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = getSupabaseBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()

      // 1. Get Project ID (Optional mapping if project matches exactly)
      const { data: project } = await supabase
        .from("projects")
        .select("id")
        .ilike("name", formData.project_name)
        .limit(1)
        .single()

      const surveyData = {
        company_id: user?.user_metadata?.company_id || user?.id,
        project_id: project?.id || null, // Map to project if found
        survey_id: formData.survey_id,
        project_name: formData.project_name,
        survey_type: formData.survey_type,
        location_name: formData.location_name,
        region: formData.region,
        date_start: formData.date_start,
        date_end: formData.date_end || null,
        team_leader: formData.team_leader,
        team_members: formData.team_members,
        equipment: formData.equipment.join(','),
        line_spacing: Number.parseFloat(formData.line_spacing) || null,
        station_spacing: Number.parseFloat(formData.station_spacing) || null,
        grid_reference: formData.grid_reference,
        weather: formData.weather,
        notes: formData.notes,
        status: formData.status,
        
        // Premium Fields
        planned_budget_tzs: Number.parseFloat(formData.planned_budget_tzs) || 0,
        actual_cost_tzs: Number.parseFloat(formData.actual_cost_tzs) || 0,
        surveyor_signature: signatures.surveyor,
        geophysicist_signature: signatures.geophysicist,
        manager_signature: signatures.manager,
        
        created_by: user?.id
      }

      const { error } = await supabase.from("geophysics_surveys").insert(surveyData)
      if (error) throw error

      toast({
        title: "Success",
        description: "Survey operation has been logged into the system."
      })

      router.push("/geophysics/dashboard")
      router.refresh()
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      })
    } finally {
      setLoading(false)
    }
  }

  const isOverBudget = Number.parseFloat(formData.actual_cost_tzs) > Number.parseFloat(formData.planned_budget_tzs) && formData.planned_budget_tzs !== ""

  return (
    <Card className="w-full shadow-2xl border-purple-100 dark:border-purple-900 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-purple-800 to-indigo-900 text-white p-8">
        <div className="flex justify-between items-center">
            <div>
                <CardTitle className="text-3xl font-bold tracking-tight">Geophysical Survey Initialization</CardTitle>
                <p className="text-purple-100 mt-2 opacity-80">Phase: Data Acquisition & Field Mapping</p>
            </div>
            <div className="hidden md:block">
                <Radio className="w-16 h-16 text-white/20 animate-pulse" />
            </div>
        </div>
      </CardHeader>
      <CardContent className="p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Status & ID Header */}
          <div className="grid gap-6 md:grid-cols-3 bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Survey Registry ID</Label>
              <Input value={formData.survey_id} disabled className="bg-white dark:bg-black font-mono font-bold text-purple-600" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Survey Maturity</Label>
              <div className="flex items-center gap-2 pt-2">
                <Badge variant={formData.status === 'planned' ? 'default' : 'outline'} className="bg-yellow-500/10 text-yellow-600 border-yellow-200">1. Planned</Badge>
                <Badge variant={formData.status === 'in_progress' ? 'default' : 'outline'} className="bg-blue-500/10 text-blue-600 border-blue-200">2. Ongoing</Badge>
                <Badge variant={formData.status === 'completed' ? 'default' : 'outline'} className="bg-green-500/10 text-green-600 border-green-200">3. Verified</Badge>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Current Phase</Label>
              <Select
                value={formData.status}
                onValueChange={v => setFormData({...formData, status: v})}
              >
                <SelectTrigger className="bg-white dark:bg-black border-slate-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planned">Pre-Op Logistics</SelectItem>
                  <SelectItem value="in_progress">Field Acquisition</SelectItem>
                  <SelectItem value="completed">Data Processing (Closed)</SelectItem>
                  <SelectItem value="cancelled">Aborted (Lost Log)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Budgeting System - PREMIUM Integration */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2 text-indigo-700">
              <DollarSign className="w-5 h-5" /> Financial & Cost Tracking
            </h3>
            <div className={`grid gap-6 md:grid-cols-3 p-6 rounded-2xl border transition-colors ${isOverBudget ? 'bg-red-50 border-red-200' : 'bg-green-50/50 border-green-200 dark:bg-green-900/10 dark:border-green-800'}`}>
              <div className="space-y-2">
                <Label className="font-bold">Allocated Survey Budget (TZS)*</Label>
                <Input
                  type="number"
                  value={formData.planned_budget_tzs}
                  onChange={e => setFormData({...formData, planned_budget_tzs: e.target.value})}
                  placeholder="e.g. 5,000,000"
                  className="bg-white dark:bg-black font-bold border-green-300"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="font-bold">Field Execution Cost (TZS)</Label>
                <Input
                  type="number"
                  value={formData.actual_cost_tzs}
                  onChange={e => setFormData({...formData, actual_cost_tzs: e.target.value})}
                  className="bg-white dark:bg-black font-bold"
                />
              </div>
              <div className="flex flex-col justify-end">
                <div className={`p-3 rounded-lg text-sm font-bold flex items-center justify-between ${isOverBudget ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'}`}>
                  <span>{isOverBudget ? 'OVER BUDGET' : 'WITHIN BUDGET'}</span>
                  <span>{(Number.parseFloat(formData.planned_budget_tzs) - Number.parseFloat(formData.actual_cost_tzs)).toLocaleString()} TZS Left</span>
                </div>
              </div>
            </div>
          </div>

          {/* Project Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2 text-purple-700">
              <Activity className="w-5 h-5" /> Geographic & Project Context
            </h3>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label>System Project Name *</Label>
                <Input
                  value={formData.project_name}
                  onChange={e => setFormData({...formData, project_name: e.target.value})}
                  placeholder="Select or type project"
                  className="border-slate-300"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Survey Methodology *</Label>
                <Select
                  value={formData.survey_type}
                  onValueChange={v => setFormData({...formData, survey_type: v})}
                  required
                >
                  <SelectTrigger className="border-slate-300">
                    <SelectValue placeholder="Select Method" />
                  </SelectTrigger>
                  <SelectContent>
                    {surveyMethods.map(m => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Operational Region *</Label>
                <RegionSelect
                  value={formData.region}
                  onChange={v => setFormData({...formData, region: v})}
                  placeholder="Select Region"
                />
              </div>
              <div className="space-y-2">
                <Label>Precise Location / Block *</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-10 border-slate-300"
                    value={formData.location_name}
                    onChange={e => setFormData({...formData, location_name: e.target.value})}
                    placeholder="e.g., North Block C"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Acquisition Metadata */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold border-b pb-2">Acquisition Metadata</h3>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Line Spacing (m)</Label>
                <Input
                  type="number"
                  value={formData.line_spacing}
                  onChange={e => setFormData({...formData, line_spacing: e.target.value})}
                  placeholder="100"
                />
              </div>
              <div className="space-y-2">
                <Label>Station Spacing (m)</Label>
                <Input
                  type="number"
                  value={formData.station_spacing}
                  onChange={e => setFormData({...formData, station_spacing: e.target.value})}
                  placeholder="25"
                />
              </div>
              <div className="space-y-2">
                <Label>Grid Ref / UTM</Label>
                <Input
                  value={formData.grid_reference}
                  onChange={e => setFormData({...formData, grid_reference: e.target.value})}
                  placeholder="36M 784XXX"
                />
              </div>
            </div>
          </div>

          {/* Digital Signatures - Professional 3-Tier Authorization */}
          <div className="space-y-4 border-t pt-8 mt-8">
            <h3 className="text-xl font-bold text-center mb-8">Multi-Stakeholder Authorization</h3>
            <div className="grid gap-8 md:grid-cols-3 bg-slate-50 dark:bg-slate-900 border p-8 rounded-3xl">
              <div className="space-y-3">
                <Label className="text-sm font-bold uppercase tracking-widest text-center block mb-4">Lead Surveyor</Label>
                <ProfessionalSignature
                  onSign={(sig) => setSignatures({...signatures, surveyor: sig})}
                  title="Field Surveyor Authorization"
                  required
                />
                {signatures.surveyor && (
                  <div className="flex items-center gap-2 justify-center text-emerald-600 mt-2 font-bold animate-in fade-in">
                    <BadgeCheck className="w-5 h-5" /> <span className="text-xs">FIELD VERIFIED</span>
                  </div>
                )}
              </div>
              
              <div className="space-y-3">
                <Label className="text-sm font-bold uppercase tracking-widest text-center block mb-4">Senior Geophysicist</Label>
                <ProfessionalSignature
                  onSign={(sig) => setSignatures({...signatures, geophysicist: sig})}
                  title="Data Integrity Approval"
                />
                {signatures.geophysicist && (
                  <div className="flex items-center gap-2 justify-center text-indigo-600 mt-2 font-bold">
                    <BadgeCheck className="w-5 h-5" /> <span className="text-xs">DATA VALIDATED</span>
                  </div>
                )}
              </div>
              
              <div className="space-y-3">
                <Label className="text-sm font-bold uppercase tracking-widest text-center block mb-4">Principal Mine Manager</Label>
                <ProfessionalSignature
                  onSign={(sig) => setSignatures({...signatures, manager: sig})}
                  title="Project Management Clearance"
                />
                {signatures.manager && (
                  <div className="flex items-center gap-2 justify-center text-emerald-700 mt-2 font-bold">
                    <BadgeCheck className="w-5 h-5" /> <span className="text-xs">PROJECT AUTHORIZED</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-4 pt-10">
            <Button type="submit" disabled={loading} size="lg" className="w-full bg-gradient-to-r from-purple-700 to-indigo-800 hover:scale-[1.02] transition-transform h-14 text-lg">
              {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <BadgeCheck className="mr-2 h-6 w-6" />}
              Transmit Survey Logs
            </Button>
            <Button type="button" variant="outline" size="lg" className="h-14" onClick={() => router.back()}>
              Abort & Return
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
