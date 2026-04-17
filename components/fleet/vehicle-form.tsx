"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Truck, Gauge, MapPin, Calendar, ShieldCheck, Activity } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { Vehicle, VehicleStatus } from "@/lib/types"
import { TANZANIA_REGIONS } from "@/lib/constants"

interface VehicleFormProps {
  vehicle?: Vehicle
}

export function VehicleForm({ vehicle }: VehicleFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    vehicle_number: vehicle?.vehicle_number || "",
    vehicle_type: vehicle?.vehicle_type || "",
    make: vehicle?.make || "",
    model: vehicle?.model || "",
    year: vehicle?.year?.toString() || "",
    status: (vehicle?.status || "operational") as VehicleStatus,
    region: vehicle?.region || "",
    current_location: vehicle?.current_location || "",
    fuel_capacity: vehicle?.fuel_capacity?.toString() || "",
    odometer_reading: vehicle?.odometer_reading?.toString() || "",
    tracking_method: vehicle?.tracking_method || "PHONE_GPS",
    tracker_device_id: vehicle?.tracker_device_id || "",
    tracker_protocol: vehicle?.tracker_protocol || "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = getSupabaseBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()

      const vehicleData = {
        company_id: user?.id,
        vehicle_number: formData.vehicle_number,
        vehicle_type: formData.vehicle_type,
        make: formData.make || null,
        model: formData.model || null,
        year: formData.year ? parseInt(formData.year) : null,
        status: formData.status,
        region: formData.region,
        current_location: formData.current_location || null,
        fuel_capacity: formData.fuel_capacity ? parseFloat(formData.fuel_capacity) : null,
        odometer_reading: formData.odometer_reading ? parseFloat(formData.odometer_reading) : null,
        tracking_method: formData.tracking_method,
        tracker_device_id: formData.tracker_device_id || null,
        tracker_protocol: formData.tracker_protocol || null,
      }

      if (vehicle) {
        const { error } = await supabase.from("vehicles").update(vehicleData).eq("id", vehicle.id)
        if (error) throw error
        toast({ title: "Asset Updated", description: "Vehicle parameters have been recalibrated in the List." })
      } else {
        const { error } = await supabase.from("vehicles").insert(vehicleData)
        if (error) throw error
        toast({ title: "Asset Registered", description: "New vehicle has been commissioned into the mining fleet." })
      }

      router.push("/fleet/vehicles")
      router.refresh()
    } catch (err: any) {
      toast({ title: "Registration Failure", description: err.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-10 pb-20">
      <Card className="border-0 shadow-3xl rounded-[3.5rem] overflow-hidden border-t-8 border-t-slate-900">
        <CardHeader className="bg-slate-950 text-white p-12 relative">
          <div className="flex justify-between items-center relative z-10">
            <div>
              <CardTitle className="text-4xl font-black uppercase tracking-tighter">
                {vehicle ? "Asset Calibration" : "Fleet Commissioning"}
              </CardTitle>
              <p className="opacity-70 font-semibold mt-1 italic text-slate-400">
                Strategic Vehicle List {"&"} Multi-Tenant Asset Tracking
              </p>
            </div>
            <Truck className="w-20 h-20 opacity-10 animate-pulse text-white" />
          </div>
        </CardHeader>

        <CardContent className="p-12 bg-slate-50/30">
          <div className="space-y-12">
            
            {/* Section 1: Identification */}
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-8 w-1 bg-slate-900 rounded-full" />
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">1. Detailed Identification</h3>
              </div>
              <div className="grid md:grid-cols-2 gap-8 bg-white p-10 rounded-[3rem] border-2 border-slate-100 shadow-sm">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase opacity-40">Registration Number *</Label>
                  <Input 
                    value={formData.vehicle_number} 
                    onChange={e => setFormData({...formData, vehicle_number: e.target.value})} 
                    className="h-14 border-2 rounded-2xl font-black text-xl" 
                    placeholder="E.g., TRK-990-ALPHA" 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase opacity-40">Asset Category *</Label>
                  <Input 
                    value={formData.vehicle_type} 
                    onChange={e => setFormData({...formData, vehicle_type: e.target.value})} 
                    className="h-14 border-2 rounded-2xl font-bold" 
                    placeholder="E.g., Haul Truck, LHD, Drill Rig" 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase opacity-40">Make</Label>
                  <Input value={formData.make} onChange={e => setFormData({...formData, make: e.target.value})} className="h-14 border-2 rounded-2xl font-bold" placeholder="E.g., Caterpillar" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase opacity-40">Model</Label>
                  <Input value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} className="h-14 border-2 rounded-2xl font-bold" placeholder="E.g., 793F" />
                </div>
              </div>
            </div>

            {/* Section 2: Operational Parameters */}
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-8 w-1 bg-blue-500 rounded-full" />
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">2. Operational Parameters</h3>
              </div>
              <div className="grid md:grid-cols-3 gap-8 bg-white p-10 rounded-[3rem] border-2 border-slate-100 shadow-sm">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase opacity-40">Commissioning Year</Label>
                  <Input type="number" value={formData.year} onChange={e => setFormData({...formData, year: e.target.value})} className="h-14 border-2 rounded-2xl font-bold" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase opacity-40">Fuel Capacity (L)</Label>
                  <div className="relative">
                    <Input type="number" value={formData.fuel_capacity} onChange={e => setFormData({...formData, fuel_capacity: e.target.value})} className="h-14 border-2 rounded-2xl font-black text-xl text-blue-600" placeholder="0.00" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase opacity-40">Initial Odometer (KM)</Label>
                  <div className="relative">
                    <Gauge className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input type="number" value={formData.odometer_reading} onChange={e => setFormData({...formData, odometer_reading: e.target.value})} className="h-14 pl-12 border-2 rounded-2xl font-black text-xl" placeholder="0.00" />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Strategic Deployment */}
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-8 w-1 bg-emerald-500 rounded-full" />
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">3. Strategic Deployment</h3>
              </div>
              <div className="grid md:grid-cols-2 gap-8 bg-white p-10 rounded-[3rem] border-2 border-slate-100 shadow-sm">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase opacity-40">Jurisdiction Region *</Label>
                  <Select value={formData.region} onValueChange={v => setFormData({...formData, region: v})} required>
                    <SelectTrigger className="h-14 border-2 rounded-2xl font-bold">
                      <SelectValue placeholder="Select Territory" />
                    </SelectTrigger>
                    <SelectContent>
                      {TANZANIA_REGIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase opacity-40">Tactical Assignment (Location)</Label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input value={formData.current_location} onChange={e => setFormData({...formData, current_location: e.target.value})} className="h-14 pl-12 border-2 rounded-2xl font-bold" placeholder="E.g., North Pit Alpha" />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 4: Lifecycle Governance */}
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-8 w-1 bg-amber-500 rounded-full" />
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">4. Lifecycle Governance</h3>
              </div>
              <div className="bg-slate-900 p-12 rounded-[3.5rem] shadow-2xl space-y-8">
                 <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase opacity-40 text-amber-500">Asset Operational Status *</Label>
                    <Select value={formData.status} onValueChange={v => setFormData({...formData, status: v as VehicleStatus})} required>
                      <SelectTrigger className="h-16 border-2 border-white/10 bg-white/5 text-white rounded-3xl font-black uppercase tracking-widest text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="operational">Operational (Mission Ready)</SelectItem>
                        <SelectItem value="maintenance">Maintenance (Scheduled Upkeep)</SelectItem>
                        <SelectItem value="breakdown">Breakdown (Immediate Repair)</SelectItem>
                        <SelectItem value="retired">Retired (Decommissioned)</SelectItem>
                      </SelectContent>
                    </Select>
                 </div>
              </div>
            </div>

             {/* Section 5: Telemetry & Tracking */}
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-8 w-1 bg-purple-500 rounded-full" />
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">5. Telemetry & Tracking</h3>
              </div>
              <div className="grid md:grid-cols-2 gap-8 bg-white p-10 rounded-[3rem] border-2 border-slate-100 shadow-sm">
                <div className="space-y-2 col-span-full">
                  <Label className="text-[10px] font-black uppercase opacity-40">Tracking Method *</Label>
                  <Select value={formData.tracking_method} onValueChange={v => setFormData({...formData, tracking_method: v as 'PHONE_GPS' | 'HARDWARE_TRACKER'})} required>
                    <SelectTrigger className="h-14 border-2 rounded-2xl font-bold bg-slate-50">
                      <SelectValue placeholder="Select Tracking Method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PHONE_GPS">Driver Phone GPS (Basic)</SelectItem>
                      <SelectItem value="HARDWARE_TRACKER">Hardware GPS Tracker (Pro)</SelectItem>
                    </SelectContent>
                  </Select>
                  {formData.tracking_method === 'PHONE_GPS' && (
                     <p className="text-[10px] font-bold text-slate-400 mt-2 italic">
                       Don't have a tracker? <a href="/contact" className="text-purple-600 underline">Contact us for recommended suppliers in Tanzania.</a>
                     </p>
                  )}
                </div>

                {formData.tracking_method === 'HARDWARE_TRACKER' && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase opacity-40 text-purple-600">Tracker Device IMEI / Serial *</Label>
                      <Input 
                        value={formData.tracker_device_id} 
                        onChange={e => setFormData({...formData, tracker_device_id: e.target.value})} 
                        className="h-14 border-2 border-purple-200 bg-purple-50 rounded-2xl font-black text-purple-900" 
                        placeholder="E.g., 123456789012345" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase opacity-40 text-purple-600">Tracker Protocol / Make</Label>
                      <Select value={formData.tracker_protocol} onValueChange={v => setFormData({...formData, tracker_protocol: v})}>
                        <SelectTrigger className="h-14 border-2 border-purple-200 bg-purple-50 rounded-2xl font-bold text-purple-900">
                          <SelectValue placeholder="Select Protocol" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="teltonika">Teltonika</SelectItem>
                          <SelectItem value="concox">Concox</SelectItem>
                          <SelectItem value="ruptela">Ruptela</SelectItem>
                          <SelectItem value="other">Other / Traccar Generic</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="flex gap-6 pt-10 border-t-4 border-slate-100">
              <Button type="submit" disabled={loading} className="flex-1 h-24 bg-slate-900 hover:bg-black text-white rounded-[2.5rem] text-2xl font-black uppercase tracking-tighter shadow-3xl transition-all">
                {loading ? <Loader2 className="w-10 h-10 animate-spin" /> : (vehicle ? "Finalize Recalibration" : "Authorize Commissioning")}
              </Button>
            </div>

          </div>
        </CardContent>
      </Card>
    </form>
  )
}
