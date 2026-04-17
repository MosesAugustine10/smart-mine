"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Loader2, X, Activity, DollarSign, CheckCircle, Clock } from "lucide-react"
import { DAYS_OF_WEEK } from "../../lib/constants"
import { ProfessionalSignature } from "@/components/professional-signature"
import { RegionSelect } from "@/components/ui/region-select"
import { useToast } from "@/components/ui/use-toast"
import { useTranslation } from "@/components/language-context"
import { PhotoUploadField } from "@/components/photo-upload-field"

interface MaterialHandlingFormProps {
  operationNumber?: string
}

export function MaterialHandlingForm({ operationNumber }: MaterialHandlingFormProps) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadingPhotos, setUploadingPhotos] = useState(false)
  const [photoFiles, setPhotoFiles] = useState<File[]>([])

  const today = new Date().toISOString().split("T")[0]

  const [formData, setFormData] = useState({
    operation_number: operationNumber || "",
    region: "",
    location: "",
    latitude: "",
    longitude: "",
    date: today,
    day: "",
    operator_names: "",
    machines: "",
    truck_capacity_tonnes: "",
    trips_per_day: "",
    total_trucks: "",
    total_fuel_consumed_l: "",
    total_distance_km: "",
    downtime_hours: "0",
    downtime_reason: "",
    challenges: "",
    recommendations: "",
    status: "in_progress",

    // Budgeting Fields
    planned_budget_tzs: "",
    cost_per_tonne_tzs: "",
    photo_urls: [] as string[]
  })

  const [calculations, setCalculations] = useState({
    productionPerDay: 0,
    fuelEfficiency: 0,
    calculatedTotalCost: 0
  })

  const [signatures, setSignatures] = useState({
    operator: null as any,
    supervisor: null as any,
    manager: null as any
  })

  useEffect(() => {
    const totalTrucks = Number.parseFloat(formData.total_trucks) || 0
    const tripsPerDay = Number.parseFloat(formData.trips_per_day) || 0
    const truckCapacity = Number.parseFloat(formData.truck_capacity_tonnes) || 0
    const totalDistance = Number.parseFloat(formData.total_distance_km) || 0
    const totalFuel = Number.parseFloat(formData.total_fuel_consumed_l) || 0
    const costPerTonne = Number.parseFloat(formData.cost_per_tonne_tzs) || 0

    const productionPerDay = totalTrucks * tripsPerDay * truckCapacity
    const fuelEfficiency = totalFuel > 0 ? totalDistance / totalFuel : 0
    const calculatedTotalCost = productionPerDay * costPerTonne

    setCalculations({ productionPerDay, fuelEfficiency, calculatedTotalCost })
  }, [
    formData.total_trucks,
    formData.trips_per_day,
    formData.truck_capacity_tonnes,
    formData.total_distance_km,
    formData.total_fuel_consumed_l,
    formData.cost_per_tonne_tzs,
  ])

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      setPhotoFiles((prev) => [...prev, ...newFiles])
    }
  }

  const removePhoto = (index: number) => {
    setPhotoFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const supabase = getSupabaseBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()

      const companyId = user?.user_metadata?.company_id || user?.id

      const photoUrls: string[] = []

      if (photoFiles.length > 0) {
        setUploadingPhotos(true)
        for (const file of photoFiles) {
          const fileExt = file.name.split(".").pop()
          const fileName = `${Math.random()}.${fileExt}`
          const filePath = `material-handling/${fileName}`

          const { error: uploadError } = await supabase.storage.from("operation-photos").upload(filePath, file)

          if (uploadError) throw uploadError

          const {
            data: { publicUrl },
          } = supabase.storage.from("operation-photos").getPublicUrl(filePath)

          photoUrls.push(publicUrl)
        }
        setUploadingPhotos(false)
      }

      const materialHandlingData = {
        operation_number: formData.operation_number,
        company_id: companyId,
        region: formData.region,
        location: formData.location,
        latitude: formData.latitude || null,
        longitude: formData.longitude || null,
        date: formData.date,
        day: formData.day,
        total_fuel_consumed_l: Number.parseFloat(formData.total_fuel_consumed_l),
        total_distance_km: Number.parseFloat(formData.total_distance_km),
        downtime_hours: Number.parseFloat(formData.downtime_hours) || 0,
        downtime_reason: formData.downtime_reason || null,
        challenges: formData.challenges || null,
        recommendations: formData.recommendations || null,
        photo_urls: photoUrls.length > 0 ? photoUrls : null,
        production_per_day_tonnes: calculations.productionPerDay,
        fuel_efficiency_km_per_l: calculations.fuelEfficiency,
        
        // Machine Data
        operator_names: formData.operator_names,
        machines: formData.machines,
        truck_capacity_tonnes: Number.parseFloat(formData.truck_capacity_tonnes),
        trips_per_day: Number.parseFloat(formData.trips_per_day),
        total_trucks: Number.parseFloat(formData.total_trucks),
        
        // Budget Constraints
        planned_budget_tzs: Number.parseFloat(formData.planned_budget_tzs) || 0,
        cost_per_tonne_tzs: Number.parseFloat(formData.cost_per_tonne_tzs) || 0,
        total_cost: calculations.calculatedTotalCost,
        status: formData.status,

        // Signatures
        operator_signature: signatures.operator,
        supervisor_signature: signatures.supervisor,
        manager_signature: signatures.manager,

        created_by: user?.id,
      }

      const { error } = await supabase.from("material_handling_operations").insert(materialHandlingData)
      if (error) throw error

      toast({ title: "✅ Haul Log Transmitted", description: `Operation ${formData.operation_number} synced to the system successfully.` })
      router.push("/material-handling")
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
      setUploadingPhotos(false)
    }
  }

  return (
    <Card className="border shadow-lg">
      <CardHeader className="bg-emerald-50/50 dark:bg-emerald-950/20 border-b">
        <CardTitle className="text-emerald-800 dark:text-emerald-400">Initialize Load {"&"} Haul Fleet</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Phase Selector & Op Info */}
          <div className="grid gap-4 md:grid-cols-3 bg-muted/50 p-4 rounded-lg border">
            <div className="space-y-2">
              <Label htmlFor="operation_number">Operation / Tag ID</Label>
              <Input
                id="operation_number"
                value={formData.operation_number}
                readOnly
                disabled
                className="bg-muted font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label>Hauling Phase</Label>
              <div className="flex gap-2">
                <Badge variant={formData.status === 'planned' ? 'default' : 'outline'}>1. Target/Budget</Badge>
                <Badge variant={formData.status === 'in_progress' ? 'default' : 'outline'}>2. Hauling</Badge>
                <Badge variant={formData.status === 'completed' ? 'default' : 'outline'}>3. Signed / Closed</Badge>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Route Status *</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planned">Planned Shift (Setup)</SelectItem>
                  <SelectItem value="in_progress">Shift Ongoing</SelectItem>
                  <SelectItem value="completed">Confirmed {"&"} Stockpiled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Budgeting Section */}
          <div className="space-y-4">
             <h3 className="text-lg font-semibold border-b pb-2 flex items-center gap-2 text-emerald-600">
               <DollarSign className="w-5 h-5"/> Cost Factor Tracking
             </h3>
             <div className="grid gap-4 md:grid-cols-3 bg-emerald-50/50 dark:bg-emerald-950/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900">
                <div className="space-y-2">
                   <Label htmlFor="planned_budget_tzs" className="font-bold">Allocated Haul Budget (TZS)*</Label>
                   <Input
                      id="planned_budget_tzs"
                      type="number"
                      value={formData.planned_budget_tzs}
                      onChange={(e) => setFormData({ ...formData, planned_budget_tzs: e.target.value })}
                      required
                      placeholder="Enter shift budget cap"
                      className="border-emerald-300 dark:border-emerald-700"
                   />
                </div>
                <div className="space-y-2">
                   <Label htmlFor="cost_per_tonne_tzs" className="font-bold">Fleet Cost / Tonne (TZS) *</Label>
                   <Input
                      id="cost_per_tonne_tzs"
                      type="number"
                      value={formData.cost_per_tonne_tzs}
                      onChange={(e) => setFormData({ ...formData, cost_per_tonne_tzs: e.target.value })}
                      required
                      placeholder="e.g. 1500"
                      className="border-emerald-300 dark:border-emerald-700"
                   />
                </div>
                <div className="space-y-2">
                   <Label className="font-bold text-muted-foreground text-xs uppercase">Est. Cumulative Expense (TZS)</Label>
                   <Input
                      value={calculations.calculatedTotalCost.toLocaleString()}
                      readOnly
                      disabled
                      className="bg-muted font-bold"
                   />
                </div>
             </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="region">{t('region')} *</Label>
              <RegionSelect
                value={formData.region}
                onChange={(value) => setFormData({ ...formData, region: value })}
                placeholder={t('select_region')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Site Location / Pit Name *</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                required
                disabled={loading}
                placeholder="Central Pit B"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="day">Operational Day *</Label>
              <Select
                value={formData.day}
                onValueChange={(value) => setFormData({ ...formData, day: value })}
                disabled={loading}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="e.g. Monday" />
                </SelectTrigger>
                <SelectContent>
                  {DAYS_OF_WEEK.map((day: string) => (
                    <SelectItem key={day} value={day}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="truck_capacity_tonnes">Haul Truck Capacity (Tonnes) *</Label>
              <Input
                id="truck_capacity_tonnes"
                type="number"
                step="0.01"
                value={formData.truck_capacity_tonnes}
                onChange={(e) => setFormData({ ...formData, truck_capacity_tonnes: e.target.value })}
                required
                disabled={loading}
                placeholder="40"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="total_trucks">Total Operational Trucks *</Label>
              <Input
                id="total_trucks"
                type="number"
                value={formData.total_trucks}
                onChange={(e) => setFormData({ ...formData, total_trucks: e.target.value })}
                required
                disabled={loading}
                placeholder="5"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="trips_per_day">Total Number of Trips (Fleet Total)*</Label>
              <Input
                id="trips_per_day"
                type="number"
                value={formData.trips_per_day}
                onChange={(e) => setFormData({ ...formData, trips_per_day: e.target.value })}
                required
                disabled={loading}
                placeholder="100"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="total_fuel_consumed_l">Total Diesel Consumed (L) *</Label>
              <Input
                id="total_fuel_consumed_l"
                type="number"
                step="0.01"
                value={formData.total_fuel_consumed_l}
                onChange={(e) => setFormData({ ...formData, total_fuel_consumed_l: e.target.value })}
                required
                disabled={loading}
                placeholder="1200"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="total_distance_km">Total Haul Cycle Distance (km)*</Label>
              <Input
                id="total_distance_km"
                type="number"
                step="0.01"
                value={formData.total_distance_km}
                onChange={(e) => setFormData({ ...formData, total_distance_km: e.target.value })}
                required
                disabled={loading}
                placeholder="150.5"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="downtime_hours">Downtime (Breakdowns / Delay hrs)</Label>
              <Input
                id="downtime_hours"
                type="number"
                step="0.01"
                value={formData.downtime_hours}
                onChange={(e) => setFormData({ ...formData, downtime_hours: e.target.value })}
                disabled={loading}
                placeholder="0.5"
              />
            </div>
          </div>

          {/* Computed Analytical Summary Dashboard */}
          {calculations.productionPerDay > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Automatic Yield Computations</h3>
              <div className="grid gap-4 md:grid-cols-3">
                <Card className="p-4 bg-blue-50/50 border-blue-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Activity className="h-4 w-4 text-blue-600" />
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Output Weight</p>
                  </div>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-400">{calculations.productionPerDay.toLocaleString()} t</p>
                </Card>
                <Card className="p-4 bg-orange-50/50 border-orange-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="h-4 w-4 text-orange-600" />
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Burn Profile</p>
                  </div>
                  <p className="text-2xl font-bold text-orange-900 dark:text-orange-400">{calculations.fuelEfficiency.toFixed(2)} km/L</p>
                </Card>
                 <Card className={`p-4 ${calculations.calculatedTotalCost > Number.parseFloat(formData.planned_budget_tzs) && formData.planned_budget_tzs !== "" ? "bg-red-500/10 border-red-500" : "bg-emerald-50/50 border-emerald-200"}`}>
                   <div className="flex items-center gap-2 mb-1">
                     <DollarSign className="h-4 w-4 text-emerald-600" />
                     <p className="text-[10px] uppercase font-bold text-muted-foreground">Estimated Haul Expense</p>
                   </div>
                   <p className="text-xl font-bold">TZS {calculations.calculatedTotalCost.toLocaleString()}</p>
                 </Card>
              </div>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
             <div className="space-y-4">
               <div className="space-y-2">
                 <Label htmlFor="operator_names">Operators / Drivers Assigned *</Label>
                 <Textarea
                   id="operator_names"
                   value={formData.operator_names}
                   onChange={(e) => setFormData({ ...formData, operator_names: e.target.value })}
                   required
                   disabled={loading}
                   placeholder="Driver 1, Driver 2..."
                   rows={3}
                 />
               </div>
               <div className="space-y-2">
                 <Label htmlFor="machines">Earth Moving Equipment Used *</Label>
                 <Textarea
                   id="machines"
                   value={formData.machines}
                   onChange={(e) => setFormData({ ...formData, machines: e.target.value })}
                   required
                   disabled={loading}
                   placeholder="Excavator CAT 336, Hauler Volvo A40G..."
                   rows={3}
                 />
               </div>
             </div>

             <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="challenges">Technical Hitches / Challenges observed</Label>
                  <Textarea
                    id="challenges"
                    value={formData.challenges}
                    onChange={(e) => setFormData({ ...formData, challenges: e.target.value })}
                    disabled={loading}
                    placeholder="Slippery haul ramp during morning..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recommendations">Recommendations for next shift</Label>
                  <Textarea
                    id="recommendations"
                    value={formData.recommendations}
                    onChange={(e) => setFormData({ ...formData, recommendations: e.target.value })}
                    disabled={loading}
                    placeholder="Grade the middle haul segment to boost traction..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="downtime_reason">Downtime Reason Context</Label>
                  <Input
                    id="downtime_reason"
                    value={formData.downtime_reason}
                    onChange={(e) => setFormData({ ...formData, downtime_reason: e.target.value })}
                    disabled={loading}
                    placeholder="E.g. Hydraulic failure on EX-02"
                  />
                </div>
             </div>
          </div>

          {/* Photo upload handling prioritized */}
          <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border-2 border-dashed border-slate-200">
            <PhotoUploadField 
              onPhotosChange={(urls) => setFormData({...formData, photo_urls: urls})} 
              label="Field Photo Verification (Optional Stockpile/Log Photos)"
              maxPhotos={5}
            />
          </div>

          {/* Signatures Section - Professional Digital Authorization */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">{t('signature')} — Multi-Tier Validation</h3>
            <div className="grid gap-6 md:grid-cols-3 bg-slate-50 dark:bg-slate-900 border p-6 rounded-xl">
              <div>
                <Label className="font-bold text-sm mb-3 block">Hauler Operator Endorsement</Label>
                <ProfessionalSignature
                  onSign={(sig) => setSignatures({ ...signatures, operator: sig })}
                  title="Operator Authorization"
                  required
                />
              </div>
              <div>
                <Label className="font-bold text-sm mb-3 block">Shift Supervisor Clearance</Label>
                <ProfessionalSignature
                  onSign={(sig) => setSignatures({ ...signatures, supervisor: sig })}
                  title="Supervisor Review"
                />
              </div>
              <div>
                <Label className="font-bold text-sm mb-3 block">Mine Manager Verification</Label>
                <ProfessionalSignature
                  onSign={(sig) => setSignatures({ ...signatures, manager: sig })}
                  title="Manager Authorization"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4 border-t">
            <Button type="submit" disabled={loading || uploadingPhotos} size="lg" className="w-full sm:w-auto hover:scale-[1.02] transition-transform">
              {(loading || uploadingPhotos) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-5 w-5" />}
              {uploadingPhotos ? "Uploading Field Records..." : "Transmit Haul Log"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading} size="lg" className="w-full sm:w-auto">
              Abort Entry
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
