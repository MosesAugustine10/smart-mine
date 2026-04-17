"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { 
  Loader2, 
  CheckCircle, 
  Truck, 
  Clock, 
  Calendar,
  ChevronRight,
  TrendingUp,
  Target,
  BarChart3,
  ShieldCheck
} from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { ProfessionalSignature } from "@/components/professional-signature"
import { useOffline } from "@/components/offline-provider"

interface Machine {
  id: string
  vehicle_number: string
  vehicle_type: string
}

interface TripData {
  trip: number
  tonnage: string
  bench: string
  isComplete: boolean
}

const MAX_TRIPS = 100

interface EquipmentPayloadFormProps {
  machines: Machine[];
  contractorName?: string;
  clientName?: string;
}

export function EquipmentPayloadForm({ machines, contractorName = "Contractor", clientName = "Client" }: EquipmentPayloadFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { offlineWrite } = useOffline()
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    machine_id: "",
    operator_name: "",
    shift: "DAY",
    payload_date: new Date().toISOString().split('T')[0],
    entry_mode: "manual" as "manual" | "auto"
  })
  
  const [trips, setTrips] = useState<TripData[]>(() => 
    Array.from({ length: MAX_TRIPS }, (_, i) => ({
      trip: i + 1,
      tonnage: "",
      bench: "",
      isComplete: false
    }))
  )
  
  const [lastCompletedTrip, setLastCompletedTrip] = useState(0)
  const [signatures, setSignatures] = useState({
    operator: null as string | null,
    contractor: null as string | null,
    client: null as string | null
  })

  // Calculate Productivity Stats
  const stats = (() => {
    const completed = trips.filter(t => t.isComplete && t.tonnage)
    const totalTonnage = completed.reduce((sum, t) => sum + (parseFloat(t.tonnage) || 0), 0)
    const avgTonnage = completed.length > 0 ? totalTonnage / completed.length : 0
    const efficiency = (completed.length / MAX_TRIPS) * 100
    
    return { 
        count: completed.length, 
        totalTonnage: totalTonnage.toFixed(1), 
        avgTonnage: avgTonnage.toFixed(1), 
        efficiency 
    }
  })()

  // High-Speed Manual Mode Logic
  const updateTripManual = (tripNumber: number, field: 'tonnage' | 'bench', value: string) => {
    const index = tripNumber - 1
    const newTrips = [...trips]
    newTrips[index][field] = value
    
    if (field === 'tonnage' && value) {
        newTrips[index].isComplete = true
        if (tripNumber > lastCompletedTrip) setLastCompletedTrip(tripNumber)
    }
    
    setTrips(newTrips)
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>, tripNumber: number, field: string) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (field === 'tonnage') {
        document.getElementById(`bench-${tripNumber}`)?.focus()
      } else if (field === 'bench' && tripNumber < MAX_TRIPS) {
        document.getElementById(`tonnage-${tripNumber + 1}`)?.focus()
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!signatures.operator) {
      toast({ title: "Authorization Required", description: "Operator signature is mandatory.", variant: "destructive" })
      return
    }

    setLoading(true)
    try {
      const supabase = getSupabaseBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("company_id")
        .eq("id", user?.id)
        .single()

      const machine = machines.find(m => m.id === formData.machine_id)

      const payload = {
        company_id: profile?.company_id,
        payload_date: formData.payload_date,
        machine_name: machine?.vehicle_number,
        machine_type: machine?.vehicle_type,
        operator_name: formData.operator_name,
        shift: formData.shift,
        trips: trips.filter(t => t.isComplete && t.tonnage).map(t => ({
           trip_number: t.trip,
           tonnage: parseFloat(t.tonnage) || 0,
           bench: t.bench
        })),
        last_completed_trip: parseInt(stats.count.toString()),
        total_tonnage: parseFloat(stats.totalTonnage),
        average_tonnage: parseFloat(stats.avgTonnage),
        efficiency_percentage: stats.efficiency,
        entry_mode: formData.entry_mode,
        operator_signature: signatures.operator,
        contractor_signature: signatures.contractor,
        client_signature: signatures.client,
        is_completed: stats.count === MAX_TRIPS,
        created_by: user?.id
      }

      const { queued } = await offlineWrite("equipment_payloads", "insert", payload)
      if (queued) {
        toast({ title: "Saved Offline", description: "Payload queued and will sync when online." })
        router.push("/fleet/quarry/trips")
        return
      }

      const { error } = await supabase.from("equipment_payloads").insert(payload)
      if (error) throw error

      toast({ title: "Success", description: "Payload records committed successfully." })
      router.push("/fleet/quarry/trips")
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6 max-w-screen-xl mx-auto">
      
      {/* Form Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-[10px] font-bold px-2 py-0">QF-02</Badge>
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Production Active</span>
          </div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">Execution Payload Log</h1>
          <p className="text-xs text-slate-500">Mineral resource load & trip tracking registry</p>
        </div>
        <div className="flex items-center gap-3">
          <Tabs value={formData.entry_mode} onValueChange={v => setFormData({...formData, entry_mode: v as any})}>
            <TabsList className="h-8 p-1 bg-slate-100 dark:bg-slate-800">
               <TabsTrigger value="manual" className="text-[10px] font-bold px-3 py-0 h-6">MANUAL</TabsTrigger>
               <TabsTrigger value="auto" className="text-[10px] font-bold px-3 py-0 h-6">TURBO</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button type="submit" disabled={loading} size="sm" className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs px-6 h-9 rounded-md">
            {loading ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : null}
            COMMIT LOGS
          </Button>
        </div>
      </div>

      {/* Main Form Body */}
      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Left Column: Information */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <CardHeader className="p-4 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider">Session Details</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date</Label>
                <Input type="date" value={formData.payload_date} onChange={e => setFormData({...formData, payload_date: e.target.value})} className="h-9 text-sm" required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Shift Schedule</Label>
                <Select value={formData.shift} onValueChange={v => setFormData({...formData, shift: v as any})}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DAY">☀️ Day Session</SelectItem>
                    <SelectItem value="NIGHT">🌙 Night Session</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Spotter / Operator</Label>
                <Input value={formData.operator_name} onChange={e => setFormData({...formData, operator_name: e.target.value})} className="h-9 text-sm" placeholder="Full Name" required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assigned Asset</Label>
                <Select value={formData.machine_id} onValueChange={v => setFormData({...formData, machine_id: v})} required>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Select Fleet Unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {machines.map(m => (
                      <SelectItem key={m.id} value={m.id}>{m.vehicle_number} · {m.vehicle_type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Productivity Stats Sidebar */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Trips", val: `${stats.count}/${MAX_TRIPS}`, icon: Truck, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/10" },
              { label: "Tonnage", val: stats.totalTonnage, icon: BarChart3, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/10" },
              { label: "Yield %", val: `${stats.efficiency.toFixed(0)}%`, icon: Target, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-900/10" },
              { label: "Avg Load", val: stats.avgTonnage, icon: TrendingUp, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-900/10" },
            ].map((s) => (
              <Card key={s.label} className="border-slate-100 dark:border-slate-800 shadow-sm">
                <CardContent className="p-3">
                  <div className={`h-7 w-7 rounded-md ${s.bg} flex items-center justify-center mb-2`}>
                    <s.icon className={`h-3.5 w-3.5 ${s.color}`} />
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{s.label}</p>
                  <p className="text-base font-bold text-slate-800 dark:text-white leading-tight">{s.val}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Signatures */}
          <Card className="border-slate-100 dark:border-slate-800 shadow-sm">
            <CardHeader className="p-4 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider">Authorizations</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-4">
                <div className="flex flex-col items-center gap-2 p-3 border border-dashed border-slate-200 dark:border-slate-700 rounded-lg">
                  <ProfessionalSignature onSign={sig => setSignatures({...signatures, operator: sig})} title="Spotter / Operator Authorization" required />
                  <p className="text-[10px] font-bold text-slate-400 tracking-wider">SPOTTER/OPERATOR (REQUIRED)</p>
                </div>
                <div className="flex flex-col items-center gap-2 p-3 border border-dashed border-slate-200 dark:border-slate-700 rounded-lg">
                  <ProfessionalSignature onSign={sig => setSignatures({...signatures, contractor: sig})} title="Contractor Authorization" />
                  <p className="text-[10px] font-bold text-slate-400 tracking-wider">CONTRACTOR VERIFIER</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Trip Ledger Table */}
        <div className="lg:col-span-2">
          <Card className="border border-slate-100 dark:border-slate-800 shadow-sm h-full flex flex-col">
            <CardHeader className="p-4 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider">Trip Ledger</CardTitle>
              <Badge variant="outline" className="text-[10px] font-bold">AVG: {stats.avgTonnage} t</Badge>
            </CardHeader>
            <CardContent className="p-0 flex-1 relative">
              <div className="absolute inset-0 overflow-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-900/50 sticky top-0 z-10">
                    <tr>
                      <th className="p-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-16 border-b">#</th>
                      <th className="p-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b">Tonnage (MT)</th>
                      <th className="p-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b">Bench / Location</th>
                      <th className="p-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-20 text-center border-b">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {trips.map((t) => (
                      <tr key={t.trip} className={`hover:bg-amber-50/30 dark:hover:bg-amber-900/5 transition-colors ${t.trip === lastCompletedTrip + 1 ? 'bg-amber-50/50 dark:bg-amber-900/10' : ''}`}>
                        <td className="p-3">
                          <span className={`text-xs font-bold ${t.isComplete ? 'text-amber-600' : 'text-slate-300'}`}>
                            {t.trip.toString().padStart(2, '0')}
                          </span>
                        </td>
                        <td className="p-2">
                          <Input 
                            id={`tonnage-${t.trip}`}
                            type="number" 
                            step="0.1" 
                            value={t.tonnage} 
                            onChange={e => updateTripManual(t.trip, 'tonnage', e.target.value)}
                            onKeyPress={e => handleKeyPress(e, t.trip, 'tonnage')}
                            className="h-8 text-xs px-2 border-slate-200 focus:ring-1 focus:ring-amber-500 w-full" 
                            placeholder="0.0"
                          />
                        </td>
                        <td className="p-2">
                          <Input 
                            id={`bench-${t.trip}`}
                            type="text" 
                            value={t.bench} 
                            onChange={e => updateTripManual(t.trip, 'bench', e.target.value)}
                            onKeyPress={e => handleKeyPress(e, t.trip, 'bench')}
                            className="h-8 text-xs px-2 border-slate-200 focus:ring-1 focus:ring-amber-500 w-full" 
                            placeholder="Bench ID"
                          />
                        </td>
                        <td className="p-2 text-center">
                          {t.isComplete ? (
                            <CheckCircle className="w-4 h-4 text-emerald-500 mx-auto" />
                          ) : (
                            <div className={`w-4 h-4 rounded-full border-2 mx-auto ${t.trip === lastCompletedTrip + 1 ? 'border-amber-500 animate-pulse' : 'border-slate-100'}`} />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  )
}
