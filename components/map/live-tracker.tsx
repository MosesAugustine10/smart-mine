"use client"

// ─────────────────────────────────────────────────────────────────────────────
// SMART MINE — COMMAND CENTER (MAP)
// Sections: Fleet | Heatmap | Geofences | Maintenance Alerts | Help Guide
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState, useRef, useCallback } from "react"
import dynamic from "next/dynamic"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import type { MapCoreProps } from "./map-core"
import {
  Truck, AlertTriangle, Wifi, WifiOff, MapPin, Gauge,
  Search, Flame, Shield, HelpCircle, Layers, X,
  Check, Activity, Bell, Eye, EyeOff, ChevronRight,
  Navigation, Crosshair, Square, TriangleAlert, BookOpen,
  Thermometer, Radio, Pencil, Trash2, Globe, Mountain,
  Clock, Wrench, PlusCircle, Circle as CircleIcon
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { haversine, polygonAreaHa, GEOFENCE_COLORS } from "./map-core"

// ─── Dynamic Import (SSR safe) ────────────────────────────────────────────────
const MapCore = dynamic(
  () => import("./map-core").then((m) => m.MapCore),
  { ssr: false, loading: () => <div className="w-full h-full bg-slate-950 animate-pulse" /> }
)

// ─── Types (exported for map-core) ───────────────────────────────────────────
export type VehicleType   = "dump_truck" | "excavator" | "drill_rig" | "light_vehicle" | "water_truck"
export type VehicleStatus = "moving" | "idle" | "loading" | "maintenance" | "offline"
export type BaseLayer     = "osm" | "satellite" | "topo"
export type MapTab        = "fleet" | "heatmap" | "geofences" | "alerts" | "help"

export interface Vehicle {
  id: string; plate: string; name: string; type: VehicleType; driver: string
  lat: number; lng: number; speed_kmh: number; heading: number
  fuel_pct: number; load_pct: number; status: VehicleStatus; task: string
  history: [number, number][]; last_ping: string; odometer_km: number; alerts: string[]
}

export interface Geofence {
  id: string; name: string; type: "pit" | "stockpile" | "crusher" | "hazard" | "office"
  shape: "polygon" | "circle"
  coordinates?: [number, number][]  // polygon points
  center?: [number, number]          // circle center
  radius?: number                    // circle radius in meters
}

export interface HeatPoint { lat: number; lng: number; intensity: number; label?: string }

export interface BlastLog {
  id: string; site_name: string; blast_date: string; blast_result: string;
  explosive_quantity_kg: number; latitude: number; longitude: number;
}

export interface DrillLog {
  id: string; site_name: string; operator_name: string; total_depth_m: number;
  drill_date: string; latitude: number; longitude: number;
}

export interface DiamondDrillLog {
  id: string; hole_id: string; sample_id: string; depth_from: number; depth_to: number;
  rqd: number; rock_type: string; collar_latitude: number; collar_longitude: number;
}

export interface SafetyIncident {
  id: string; incident_type: string; victim_name: string; incident_date: string;
  severity: string; body_part: string; latitude: number; longitude: number;
}

interface MaintenanceAlert {
  id: string; vehicle_id: string; plate: string; driver: string
  alert_type: "odometer" | "date" | "engine_hours"
  message: string; severity: "warning" | "critical"; created_at: string
}

// ─── Simulation Constants ─────────────────────────────────────────────────────
const MINE_CENTER: [number, number] = [-2.871, 32.907]

const ROUTES: [number, number][][] = [
  [[-2.871, 32.905], [-2.874, 32.910], [-2.878, 32.914], [-2.875, 32.919], [-2.869, 32.916], [-2.864, 32.910], [-2.866, 32.904]],
  [[-2.864, 32.908], [-2.861, 32.914], [-2.858, 32.919], [-2.855, 32.916], [-2.858, 32.910], [-2.862, 32.906]],
  [[-2.875, 32.903], [-2.879, 32.906], [-2.882, 32.910], [-2.880, 32.914], [-2.875, 32.912], [-2.872, 32.908]],
  [[-2.870, 32.908], [-2.873, 32.912], [-2.870, 32.916], [-2.867, 32.912]],
  [[-2.866, 32.906], [-2.869, 32.912], [-2.875, 32.915], [-2.878, 32.908], [-2.873, 32.902], [-2.868, 32.903]],
]

const FLEET_SEED: Omit<Vehicle, "lat" | "lng" | "heading" | "history" | "last_ping">[] = [
  { id: "T001", plate: "T 762 ERZ", name: "Dump Truck Alpha", type: "dump_truck",    driver: "Juma Mwalimu",   speed_kmh: 28, fuel_pct: 78, load_pct: 95, status: "moving",      task: "Pit → Crusher",       odometer_km: 14320, alerts: [] },
  { id: "T002", plate: "T 415 MNZ", name: "Dump Truck Beta",  type: "dump_truck",    driver: "Ali Hassan",     speed_kmh: 0,  fuel_pct: 52, load_pct: 0,  status: "loading",     task: "Loading at Pit 3",    odometer_km: 9870,  alerts: ["Idle > 15 min"] },
  { id: "E001", plate: "T 210 GTA", name: "Excavator Prime",  type: "excavator",     driver: "Samwel Kiptoo",  speed_kmh: 4,  fuel_pct: 64, load_pct: 0,  status: "moving",      task: "Bench 4 Excavation",  odometer_km: 3201,  alerts: [] },
  { id: "D001", plate: "T 891 SZA", name: "Drill Rig I",      type: "drill_rig",     driver: "Patrick Owino",  speed_kmh: 0,  fuel_pct: 43, load_pct: 0,  status: "idle",        task: "Hole BH-047 Active",  odometer_km: 1520,  alerts: ["Low Fuel < 50%"] },
  { id: "W001", plate: "T 331 KGM", name: "Water Truck",      type: "water_truck",   driver: "Amina Rashid",   speed_kmh: 22, fuel_pct: 88, load_pct: 60, status: "moving",      task: "Road Suppression",    odometer_km: 22100, alerts: [] },
  { id: "L001", plate: "T 673 HLP", name: "Inspection 4WD",   type: "light_vehicle", driver: "Robert Mutua",   speed_kmh: 35, fuel_pct: 91, load_pct: 5,  status: "moving",      task: "Safety Patrol",       odometer_km: 56300, alerts: [] },
  { id: "T003", plate: "T 504 BWY", name: "Dump Truck Gamma", type: "dump_truck",    driver: "Grace Nyambura", speed_kmh: 31, fuel_pct: 35, load_pct: 100,status: "moving",      task: "Crusher → Stacker",   odometer_km: 18900, alerts: ["Fuel Critical < 40%"] },
  { id: "E002", plate: "T 728 RZK", name: "Grader Unit",      type: "excavator",     driver: "Michael Ochieng",speed_kmh: 0,  fuel_pct: 72, load_pct: 0,  status: "maintenance", task: "Scheduled Service",   odometer_km: 7654,  alerts: ["Maintenance Due"] },
]

// ─── Mock Heatmap Data ────────────────────────────────────────────────────────
const GRADE_HEAT_POINTS: HeatPoint[] = [
  { lat: -2.869, lng: 32.906, intensity: 0.95, label: "Sector A — 8.2 g/t Au" },
  { lat: -2.872, lng: 32.909, intensity: 0.80, label: "Sector B — 6.7 g/t Au" },
  { lat: -2.875, lng: 32.911, intensity: 0.60, label: "Sector C — 4.1 g/t Au" },
  { lat: -2.878, lng: 32.914, intensity: 0.30, label: "Sector D — 1.8 g/t Au" },
  { lat: -2.864, lng: 32.912, intensity: 0.45, label: "Sector E — 2.9 g/t Au" },
  { lat: -2.867, lng: 32.907, intensity: 0.70, label: "Sector F — 5.3 g/t Au" },
  { lat: -2.873, lng: 32.903, intensity: 0.85, label: "Sector G — 7.1 g/t Au" },
]

const SAFETY_HEAT_POINTS: HeatPoint[] = [
  { lat: -2.874, lng: 32.912, intensity: 0.90, label: "3 incidents — Blasting Zone" },
  { lat: -2.862, lng: 32.910, intensity: 0.60, label: "2 incidents — Crusher Area" },
  { lat: -2.870, lng: 32.905, intensity: 0.40, label: "1 incident — Haul Road" },
  { lat: -2.879, lng: 32.908, intensity: 0.75, label: "2 incidents — Drill Site" },
]

// ─── Mock Maintenance Alerts ──────────────────────────────────────────────────
const MOCK_MAINTENANCE: MaintenanceAlert[] = [
  { id: "1", vehicle_id: "T001", plate: "T 762 ERZ", driver: "Juma Mwalimu",  alert_type: "odometer",      message: "Oil service due — 14,320 km (overdue by 320 km)",          severity: "critical", created_at: new Date().toISOString() },
  { id: "2", vehicle_id: "D001", plate: "T 891 SZA", driver: "Patrick Owino", alert_type: "engine_hours",  message: "Engine filter due — 2,150 hrs recorded (500-hr interval)",  severity: "warning",  created_at: new Date().toISOString() },
  { id: "3", vehicle_id: "T003", plate: "T 504 BWY", driver: "Grace Nyambura",alert_type: "date",          message: "Next service scheduled in 5 days — 15 Apr 2026",           severity: "warning",  created_at: new Date().toISOString() },
  { id: "4", vehicle_id: "E002", plate: "T 728 RZK", driver: "Michael Ochieng",alert_type: "odometer",    message: "Tyre rotation overdue — 7,654 km (interval: 7,500 km)",     severity: "critical", created_at: new Date().toISOString() },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
function lerp(a: number, b: number, t: number) { return a + (b - a) * t }

function bearing(from: [number, number], to: [number, number]): number {
  const dLng = (to[1] - from[1]) * Math.PI / 180
  const lat1 = from[0] * Math.PI / 180, lat2 = to[0] * Math.PI / 180
  const y = Math.sin(dLng) * Math.cos(lat2)
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng)
  return ((Math.atan2(y, x) * 180 / Math.PI) + 360) % 360
}

const STATUS_LABELS: Record<VehicleStatus, string> = { moving: "Moving", idle: "Idle", loading: "Loading", maintenance: "Maintenance", offline: "Offline" }
const STATUS_COLORS_CSS: Record<VehicleStatus, string> = { moving: "#10b981", idle: "#f59e0b", loading: "#3b82f6", maintenance: "#ef4444", offline: "#6b7280" }

const VEHICLE_EMOJI: Record<VehicleType, string> = {
  dump_truck: "🚛", excavator: "🏗️", drill_rig: "⚙️", light_vehicle: "🚙", water_truck: "🚒",
}

// ─── Tab Config ───────────────────────────────────────────────────────────────
const TABS: { id: MapTab; label: string; icon: any; shortLabel?: string }[] = [
  { id: "fleet",     label: "Fleet Tracking (Ufuatiliaji Magari)",  icon: Truck,        shortLabel: "Fleet" },
  { id: "heatmap",   label: "Grade Heatmap (Ramani ya Madini)",   icon: Flame,        shortLabel: "Heatmap" },
  { id: "geofences", label: "Geofences (Mipaka ya Mgodi)",        icon: MapPin,       shortLabel: "Zones" },
  { id: "alerts",    label: "Maint. Alerts (Taarifa za Marekebisho)",    icon: Bell,         shortLabel: "Alerts" },
  { id: "help",      label: "Help Guide (Maelekezo)",       icon: HelpCircle,   shortLabel: "Guide" },
]

const GEOFENCE_TYPES = ["pit", "stockpile", "crusher", "hazard", "office"] as const

// ─── Main Component ───────────────────────────────────────────────────────────
export function LiveTracker() {
  const [mounted,     setMounted]        = useState(false)
  const [activeTab,   setActiveTab]      = useState<MapTab>("fleet")
  const [baseLayer,   setBaseLayer]      = useState<BaseLayer>("osm")
  const [vehicles,    setVehicles]       = useState<Vehicle[]>([])
  const [selected,    setSelected]       = useState<string | null>(null)
  const [showTrails,  setShowTrails]     = useState(true)
  const [showZones,   setShowZones]      = useState(true)
  const [realtime,    setRealtime]       = useState(false)
  const [showHeatmap, setShowHeatmap]    = useState(false)
  const [heatType,    setHeatType]       = useState<"grade" | "safety">("grade")

  // Layer Visibility
  const [showBlasting, setShowBlasting] = useState(true)
  const [showDrilling, setShowDrilling] = useState(true)
  const [showDiamond,  setShowDiamond]  = useState(true)
  const [showSafety,   setShowSafety]   = useState(true)
  const [showFleet,    setShowFleet]    = useState(true)

  // Operational Data
  const [blasts,   setBlasts]   = useState<BlastLog[]>([])
  const [drills,   setDrills]   = useState<DrillLog[]>([])
  const [diamonds, setDiamonds] = useState<DiamondDrillLog[]>([])
  const [safety,   setSafety]   = useState<SafetyIncident[]>([])

  // Search state
  const [searchQuery,  setSearchQuery]   = useState("")
  const [searchResult, setSearchResult]  = useState<{ lat: number; lng: number; name: string } | null>(null)
  const [searching,    setSearching]     = useState(false)

  // Geofence state
  const [geofences,    setGeofences]     = useState<Geofence[]>([
    { id: "gf1", name: "Main Pit",      type: "pit",       shape: "circle",  center: [-2.871, 32.907], radius: 200 },
    { id: "gf2", name: "Crusher Area",  type: "crusher",   shape: "circle",  center: [-2.878, 32.914], radius: 120 },
    { id: "gf3", name: "Office Zone",   type: "office",    shape: "circle",  center: [-2.865, 32.904], radius: 80  },
  ])
  const [drawMode,     setDrawMode]      = useState<"polygon" | "circle" | null>(null)
  const [drawnPoints,  setDrawnPoints]   = useState<[number, number][]>([])
  const [newGfName,    setNewGfName]     = useState("")
  const [newGfType,    setNewGfType]     = useState<Geofence["type"]>("pit")

  // Measurement state
  const [measureMode,  setMeasureMode]   = useState<"distance" | "area" | null>(null)
  const [measurePoints,setMeasurePoints] = useState<[number, number][]>([])
  const measureDistStr = useCallback(() => {
    if (measurePoints.length < 2) return ""
    let total = 0
    for (let i = 0; i < measurePoints.length - 1; i++)
      total += haversine(measurePoints[i], measurePoints[i + 1])
    return total >= 1000 ? `${(total / 1000).toFixed(2)} km` : `${total.toFixed(0)} m`
  }, [measurePoints])

  // Maintenance
  const [mainAlerts] = useState<MaintenanceAlert[]>(MOCK_MAINTENANCE)

  const routeProgress = useRef<number[]>(FLEET_SEED.map(() => 0))
  const routeLine     = useRef<number[]>(FLEET_SEED.map((_, i) => i % ROUTES.length))

  // ── Init fleet + realtime ──────────────────────────────────────────────────
  useEffect(() => {
    setMounted(true)

    // Detect draw=true from URL
    const params = new URLSearchParams(window.location.search)
    if (params.get('draw') === 'true') {
      setActiveTab('geofences')
      setDrawMode('polygon')
    }

    const initial: Vehicle[] = FLEET_SEED.map((v, i) => {
      const route = ROUTES[i % ROUTES.length]
      const [lat, lng] = route[0]
      return { ...v, lat, lng, heading: 0, history: [[lat, lng]], last_ping: new Date().toISOString() }
    })
    setVehicles(initial)

    // Supabase Realtime — subscribe to live GPS from Phone (vehicle_locations) and Hardware (hardware_locations)
    const supabase = getSupabaseBrowserClient()
    const channel = supabase.channel("unified_locations_rt")
    
    channel.on("postgres_changes", {
        event: "*", schema: "public", table: "vehicle_locations",
      }, (payload) => {
        const d = payload.new as any
        setRealtime(true)
        setVehicles(prev => prev.map(v =>
          v.plate === d.vehicle_plate
            ? { ...v, lat: d.latitude, lng: d.longitude, speed_kmh: (d.speed_mps ?? 0) * 3.6,
                last_ping: d.recorded_at || new Date().toISOString(), history: [...v.history.slice(-60), [d.latitude, d.longitude]] }
            : v
        ))
      })

    channel.on("postgres_changes", {
        event: "*", schema: "public", table: "hardware_locations",
      }, async (payload) => {
        const d = payload.new as any
        setRealtime(true)
        
        // Find vehicle by tracker ID
        const { data: vInfo } = await supabase.from('vehicles').select('vehicle_number').eq('tracker_device_id', d.tracker_device_id).maybeSingle()
        if (vInfo) {
            setVehicles(prev => prev.map(v =>
              v.plate === vInfo.vehicle_number
                ? { ...v, lat: d.latitude, lng: d.longitude, speed_kmh: (d.speed ?? 0), 
                    // Update fuel level if available from hardware
                    fuel_pct: d.fuel_level_raw != null ? d.fuel_level_raw : v.fuel_pct,
                    last_ping: d.timestamp || new Date().toISOString(), 
                    history: [...v.history.slice(-60), [d.latitude, d.longitude]] }
                : v
            ))
        }
      })

    channel.subscribe()

    // Fetch Operational Layers
    const fetchOperationalData = async () => {
      const { data: b } = await supabase.from('blasting_logs').select('*')
      const { data: d } = await supabase.from('drilling_logs').select('*')
      const { data: dd } = await supabase.from('diamond_drilling_logs').select('*')
      const { data: s } = await supabase.from('safety_incidents').select('*')
      
      if (b) setBlasts(b)
      if (d) setDrills(d)
      if (dd) setDiamonds(dd)
      if (s) setSafety(s)
    }
    fetchOperationalData()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // ── Simulation animation loop ──────────────────────────────────────────────
  useEffect(() => {
    if (!mounted) return
    const interval = setInterval(() => {
      setVehicles(prev => prev.map((v, i) => {
        if (v.status === "maintenance" || v.status === "offline") return v
        if (v.status === "idle" || v.status === "loading") {
          return {
            ...v,
            lat: v.lat + (Math.random() - 0.5) * 0.00003,
            lng: v.lng + (Math.random() - 0.5) * 0.00003,
            speed_kmh: 0,
            last_ping: new Date().toISOString(),
          }
        }
        const route  = ROUTES[routeLine.current[i]]
        const segIdx = Math.floor(routeProgress.current[i])
        const segT   = routeProgress.current[i] - segIdx
        const from   = route[segIdx % route.length]
        const to     = route[(segIdx + 1) % route.length]
        const newLat = lerp(from[0], to[0], segT)
        const newLng = lerp(from[1], to[1], segT)
        const step   = (v.speed_kmh / 3600) * (1200 / 1000) / 111000 * 50
        routeProgress.current[i] = (routeProgress.current[i] + step) >= route.length - 1
          ? 0 : routeProgress.current[i] + step
        return {
          ...v,
          lat: newLat, lng: newLng,
          heading: bearing(from as [number,number], to as [number,number]),
          history: [...v.history.slice(-50), [newLat, newLng]],
          fuel_pct: Math.max(0, v.fuel_pct - 0.003),
          last_ping: new Date().toISOString(),
        }
      }))
    }, 1200)
    return () => clearInterval(interval)
  }, [mounted])

  // ── Geocoding Search (Nominatim — 100% Free) ──────────────────────────────
  // To use Google Geocoding later: replace URL with
  //   https://maps.googleapis.com/maps/api/geocode/json?address={query}&key={GOOGLE_MAPS_API_KEY}
  // To use Mapbox Geocoding:
  //   https://api.mapbox.com/geocoding/v5/mapbox.places/{query}.json?access_token={MAPBOX_TOKEN}
  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    setSearching(true)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1`,
        { headers: { "Accept-Language": "en" } }
      )
      const data = await res.json()
      if (data.length > 0) {
        setSearchResult({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), name: data[0].display_name })
      }
    } catch { /* handle gracefully */ }
    finally { setSearching(false) }
  }

  // ── Map click dispatch ────────────────────────────────────────────────────
  const handleMapClick = (lat: number, lng: number) => {
    if (drawMode === "polygon") {
      setDrawnPoints(prev => [...prev, [lat, lng]])
    } else if (drawMode === "circle") {
      // First click = center; show circle preview
      if (drawnPoints.length === 0) setDrawnPoints([[lat, lng]])
    } else if (measureMode) {
      setMeasurePoints(prev => [...prev, [lat, lng]])
    }
  }

  // ── Save geofence ────────────────────────────────────────────────────────
  const saveGeofence = async () => {
    if (!newGfName.trim() || drawnPoints.length < (drawMode === "polygon" ? 3 : 1)) return
    const newGf: Geofence = drawMode === "polygon"
      ? { id: crypto.randomUUID(), name: newGfName, type: newGfType, shape: "polygon", coordinates: drawnPoints }
      : { id: crypto.randomUUID(), name: newGfName, type: newGfType, shape: "circle",  center: drawnPoints[0], radius: 150 }
    setGeofences(prev => [...prev, newGf])

    // Save to Supabase: geofences table
    try {
      const supabase = getSupabaseBrowserClient()
      await supabase.from("geofences").insert({
        name: newGf.name, type: newGf.type, shape: newGf.shape,
        coordinates: newGf.coordinates ? JSON.stringify(newGf.coordinates) : null,
        center_lat: newGf.center?.[0] ?? null, center_lng: newGf.center?.[1] ?? null,
        radius_m: newGf.radius ?? null,
      })
    } catch { /* offline-safe */ }

    setDrawnPoints([]); setDrawMode(null); setNewGfName("")
  }

  // ── KPI summary ──────────────────────────────────────────────────────────
  const activeCount  = vehicles.filter(v => v.status === "moving").length
  const alertCount   = vehicles.reduce((s, v) => s + v.alerts.length, 0) + mainAlerts.filter(a => a.severity === "critical").length
  const avgSpeed     = vehicles.filter(v => v.speed_kmh > 0).reduce((s, v, _, a) => s + v.speed_kmh / a.length, 0)
  const selectedVeh  = vehicles.find(v => v.id === selected)
  const heatPoints   = heatType === "grade" ? GRADE_HEAT_POINTS : SAFETY_HEAT_POINTS

  if (!mounted) return <div className="w-full h-full bg-slate-950 animate-pulse rounded-lg" />

  return (
    <div className="flex flex-col h-full w-full bg-slate-950">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossOrigin="" />

      {/* ══ TOP CONTROL BAR ══════════════════════════════════════════════════ */}
      <div className="shrink-0 bg-slate-900 border-b border-slate-800">

        {/* Row 1: Status + Layer Controls */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                {realtime ? "GPS Live" : "Sim Mode"}
              </span>
            </div>
            <span className="h-3 w-px bg-slate-700" />
            <span className="text-slate-400 text-[10px] font-bold">{vehicles.length} Vehicles</span>
            <span className="text-emerald-400 text-[10px] font-bold">{activeCount} Active</span>
            {alertCount > 0 && (
              <span className="text-red-400 text-[10px] font-black flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />{alertCount} Alert{alertCount > 1 ? "s" : ""}
              </span>
            )}
            <span className="text-slate-500 text-[10px] font-bold">Avg {avgSpeed.toFixed(0)} km/h</span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Layer Selector */}
            {(["osm", "satellite", "topo"] as BaseLayer[]).map(l => (
              <button key={l}
                onClick={() => setBaseLayer(l)}
                className={`h-7 px-3 text-[9px] font-black uppercase rounded-full border transition-all ${
                  baseLayer === l
                    ? "bg-amber-500 text-white border-amber-500"
                    : "text-slate-400 border-slate-700 hover:border-slate-500 hover:text-slate-200"
                }`}
              >
                { l === "osm" ? "🗺 Street" : l === "satellite" ? "🛰 Satellite" : "⛰ Topo" }
              </button>
            ))}
            <span className="h-5 w-px bg-slate-700" />
            <button onClick={() => setShowTrails(!showTrails)}
              className={`h-7 px-3 text-[9px] font-black uppercase rounded-full border transition-all ${
                showTrails ? "text-blue-400 border-blue-500/40 bg-blue-500/10" : "text-slate-500 border-slate-700"
              }`}>
              {showTrails ? <Eye className="w-3 h-3 inline mr-1" /> : <EyeOff className="w-3 h-3 inline mr-1" />}
              Trails
            </button>
            <button onClick={() => setShowZones(!showZones)}
              className={`h-7 px-3 text-[9px] font-black uppercase rounded-full border transition-all ${
                showZones ? "text-amber-400 border-amber-500/40 bg-amber-500/10" : "text-slate-500 border-slate-700"
              }`}>
              Zones
            </button>
          </div>
        </div>

        {/* Row 2: Unified Layer Control (Checkbox Panel) */}
        <div className="flex items-center gap-4 px-4 py-2 border-b border-slate-800/40 bg-slate-800/20 overflow-x-auto no-scrollbar">
          <p className="text-[9px] font-black uppercase text-slate-500 whitespace-nowrap">Layers:</p>
          {[
            { label: "Fleet", val: showFleet, set: setShowFleet },
            { label: "Blasting", val: showBlasting, set: setShowBlasting },
            { label: "Drilling", val: showDrilling, set: setShowDrilling },
            { label: "Diamond Drill", val: showDiamond, set: setShowDiamond },
            { label: "Safety", val: showSafety, set: setShowSafety },
          ].map(layer => (
            <label key={layer.label} className="flex items-center gap-2 cursor-pointer group">
              <input type="checkbox" checked={layer.val} onChange={e => layer.set(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-slate-600 bg-slate-900 accent-amber-500" />
              <span className={`text-[10px] font-bold uppercase transition-colors ${layer.val ? "text-amber-400" : "text-slate-500 group-hover:text-slate-300"}`}>
                {layer.label}
              </span>
            </label>
          ))}
        </div>

        {/* Row 3: Tabs + Search */}
        <div className="flex items-center justify-between px-4 py-2">
          {/* Tab Bar */}
          <div className="flex items-center gap-0.5">
            {TABS.map(tab => (
              <button key={tab.id}
                onClick={() => { setActiveTab(tab.id); if (tab.id === "heatmap") setShowHeatmap(true) }}
                className={`flex items-center gap-1.5 h-8 px-3 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                  activeTab === tab.id
                    ? "bg-amber-500 text-white shadow-md shadow-amber-500/30"
                    : "text-slate-500 hover:text-slate-200 hover:bg-slate-800"
                }`}
              >
                <tab.icon className="w-3 h-3" />
                <span className="hidden sm:inline">{tab.shortLabel ?? tab.label}</span>
              </button>
            ))}
          </div>

          {/* Search Box (Nominatim) */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-800 rounded-lg border border-slate-700 px-3 h-8">
              <Search className="w-3.5 h-3.5 text-slate-500" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSearch()}
                placeholder="Search location..."
                className="bg-transparent text-[11px] text-slate-200 placeholder:text-slate-600 outline-none w-44"
              />
              {searchQuery && (
                <button onClick={() => { setSearchQuery(""); setSearchResult(null) }}>
                  <X className="w-3 h-3 text-slate-500 hover:text-slate-200" />
                </button>
              )}
            </div>
            <button onClick={handleSearch} disabled={searching}
              className="h-8 px-3 bg-violet-600 hover:bg-violet-500 text-white text-[10px] font-black uppercase rounded-lg transition-all disabled:opacity-50">
              {searching ? "..." : "Go"}
            </button>
          </div>
        </div>
      </div>

      {/* ══ MAIN LAYOUT ══════════════════════════════════════════════════════ */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* ── LEFT PANEL ─────────────────────────────────────────────────── */}
        <div className="w-72 shrink-0 bg-slate-900 border-r border-slate-800 overflow-y-auto flex flex-col hidden lg:flex">

          {/* ─── FLEET TAB ─────────────────────────────────────────────── */}
          {activeTab === "fleet" && (
            <>
              <div className="px-4 py-3 border-b border-slate-800">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Fleet Registry</p>
                <p className="text-[9px] text-slate-600 mt-0.5">Click marker on map or row to inspect</p>
              </div>
              <div className="flex-1 space-y-1 p-2">
                {vehicles.map((v) => {
                  const isSel = v.id === selected
                  return (
                    <button key={v.id} onClick={() => setSelected(isSel ? null : v.id)}
                      className={`w-full text-left p-3 rounded-xl transition-all border ${
                        isSel ? "bg-amber-500/10 border-amber-500/30" : "border-transparent hover:bg-slate-800 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{VEHICLE_EMOJI[v.type]}</span>
                          <div>
                            <p className="text-[11px] font-black text-white">{v.plate}</p>
                            <p className="text-[9px] text-slate-500 font-bold uppercase">{v.type.replace("_", " ")}</p>
                          </div>
                        </div>
                        <span className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: STATUS_COLORS_CSS[v.status], boxShadow: `0 0 6px ${STATUS_COLORS_CSS[v.status]}` }} />
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold truncate">{v.task}</p>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-[9px] font-bold text-slate-500">⚡ {v.speed_kmh.toFixed(0)} km/h</span>
                        <span className="text-[9px] font-black" style={{ color: v.fuel_pct < 40 ? "#ef4444" : "#64748b" }}>
                          ⛽ {v.fuel_pct.toFixed(0)}%
                        </span>
                        {v.alerts.length > 0 && <AlertTriangle className="w-3 h-3 text-red-400" />}
                      </div>
                      <div className="mt-1.5 space-y-1">
                        <div className="flex items-center gap-1">
                          <span className="text-[8px] text-slate-600 w-6">FUEL</span>
                          <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all"
                              style={{ width: `${v.fuel_pct}%`, backgroundColor: v.fuel_pct < 30 ? "#ef4444" : v.fuel_pct < 50 ? "#f59e0b" : "#10b981" }} />
                          </div>
                        </div>
                        {v.load_pct > 0 && (
                          <div className="flex items-center gap-1">
                            <span className="text-[8px] text-slate-600 w-6">LOAD</span>
                            <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                              <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${v.load_pct}%` }} />
                            </div>
                          </div>
                        )}
                      </div>
                      {v.alerts.map((al, ai) => (
                        <p key={ai} className="mt-1 text-[9px] text-red-400 font-bold">⚠ {al}</p>
                      ))}
                    </button>
                  )
                })}
              </div>
              <div className="p-3 border-t border-slate-800 grid grid-cols-3 gap-2">
                {[
                  { label: "Active", value: activeCount, color: "#10b981" },
                  { label: "Idle",   value: vehicles.filter(v => v.status === "idle" || v.status === "loading").length, color: "#f59e0b" },
                  { label: "Alerts", value: alertCount, color: alertCount > 0 ? "#ef4444" : "#64748b" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-slate-800 rounded-lg p-2 text-center">
                    <div className="text-lg font-black" style={{ color }}>{value}</div>
                    <div className="text-[9px] text-slate-500 font-bold uppercase">{label}</div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ─── HEATMAP TAB ──────────────────────────────────────────── */}
          {activeTab === "heatmap" && (
            <>
              <div className="px-4 py-3 border-b border-slate-800">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Heatmap Visualisation</p>
              </div>
              <div className="p-4 space-y-4">
                <div className="flex gap-2">
                  {(["grade", "safety"] as const).map(t => (
                    <button key={t} onClick={() => { setHeatType(t); setShowHeatmap(true) }}
                      className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${
                        heatType === t && showHeatmap
                          ? "bg-amber-500 text-white"
                          : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                      }`}
                    >{t === "grade" ? "⛏ Grade Map" : "🔴 Safety Map"}</button>
                  ))}
                </div>
                <button onClick={() => setShowHeatmap(!showHeatmap)}
                  className={`w-full py-2 rounded-lg text-[10px] font-black uppercase transition-all border ${
                    showHeatmap ? "border-red-500/40 text-red-400 bg-red-500/10" : "border-slate-700 text-slate-400"
                  }`}
                >
                  {showHeatmap ? "🔴 Hide Heatmap" : "👁 Show Heatmap"}
                </button>

                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase">Colour Key</p>
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex-1 h-3 rounded-full" style={{ background: "linear-gradient(90deg, rgba(59,130,246,0.8), rgba(16,185,129,0.8), rgba(239,180,68,0.8), rgba(239,68,68,0.8))" }} />
                  </div>
                  <div className="flex justify-between text-[9px] text-slate-500 font-bold">
                    <span>Low (Waste)</span>
                    <span>High (Gold)</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase">
                    {heatType === "grade" ? "Grade Data Points" : "Incident Hotspots"}
                  </p>
                  {(heatType === "grade" ? GRADE_HEAT_POINTS : SAFETY_HEAT_POINTS).map((pt, i) => (
                    <div key={i} className="flex items-center gap-2 bg-slate-800/60 rounded-lg p-2">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{
                        background: pt.intensity > 0.7 ? "#ef4444" : pt.intensity > 0.4 ? "#f59e0b" : "#3b82f6"
                      }} />
                      <div>
                        <p className="text-[10px] text-white font-bold">{pt.label}</p>
                        <p className="text-[9px] text-slate-500">
                          {pt.lat.toFixed(4)}, {pt.lng.toFixed(4)} • Intensity: {(pt.intensity * 100).toFixed(0)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-slate-800/40 rounded-lg p-3 border border-slate-700">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Data Format</p>
                  <code className="text-[9px] text-green-400">{"[lat, lng, intensity]"}</code>
                  <p className="text-[9px] text-slate-500 mt-1">Intensity: 0.0 (low) to 1.0 (high)</p>
                </div>
              </div>
            </>
          )}

          {/* ─── GEOFENCES TAB ─────────────────────────────────────────── */}
          {activeTab === "geofences" && (
            <>
              <div className="px-4 py-3 border-b border-slate-800">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Geofence Manager</p>
                <p className="text-[9px] text-slate-600 mt-0.5">Draw boundaries on the map</p>
              </div>
              <div className="p-3 space-y-3 flex-1 overflow-y-auto">
                {/* Draw Controls */}
                {!drawMode ? (
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => { setDrawMode("polygon"); setDrawnPoints([]) }}
                      className="py-2 bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/40 text-violet-400 text-[10px] font-black uppercase rounded-lg transition-all flex items-center justify-center gap-1.5">
                      <Pencil className="w-3 h-3" /> Polygon (Chora Mipaka Poligoni)
                    </button>
                    <button onClick={() => { setDrawMode("circle"); setDrawnPoints([]) }}
                      className="py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-400 text-[10px] font-black uppercase rounded-lg transition-all flex items-center justify-center gap-1.5">
                      <CircleIcon className="w-3 h-3" /> Circle (Chora Duara)
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2 bg-slate-800/60 border border-violet-500/30 rounded-xl p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-black text-violet-400 uppercase">
                        {drawMode === "polygon" ? "🖊 Click map to add vertices (Bofya ramani kuweka ncha)" : "🎯 Click to set center (Bofya kuweka kitovu)"}
                      </p>
                      <button onClick={() => { setDrawMode(null); setDrawnPoints([]) }}
                        className="text-slate-500 hover:text-red-400"><X className="w-3.5 h-3.5" /></button>
                    </div>
                    <p className="text-[9px] text-slate-400">{drawnPoints.length} point{drawnPoints.length !== 1 ? "s" : ""} placed</p>
                    <input value={newGfName} onChange={e => setNewGfName(e.target.value)}
                      placeholder="Geofence name (e.g. Pit 3)"
                      className="w-full bg-slate-700 text-slate-200 text-[10px] px-2.5 py-2 rounded-lg border border-slate-600 outline-none placeholder:text-slate-500" />
                    <select value={newGfType} onChange={e => setNewGfType(e.target.value as any)}
                      className="w-full bg-slate-700 text-slate-200 text-[10px] px-2.5 py-2 rounded-lg border border-slate-600 outline-none">
                      {GEOFENCE_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                    </select>
                    <div className="flex gap-2">
                      {drawnPoints.length >= (drawMode === "polygon" ? 3 : 1) && newGfName && (
                        <button onClick={saveGeofence}
                          className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase rounded-lg transition-all flex items-center justify-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Save
                        </button>
                      )}
                      {drawnPoints.length > 0 && (
                        <button onClick={() => setDrawnPoints(prev => prev.slice(0, -1))}
                          className="py-2 px-3 bg-slate-700 text-slate-300 text-[10px] font-black uppercase rounded-lg hover:bg-slate-600 transition-all">
                          Undo
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Measurement Tools */}
                <div className="border-t border-slate-800 pt-3">
                  <p className="text-[10px] font-black text-slate-500 uppercase mb-2">Measurement Tools</p>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <button onClick={() => { setMeasureMode(measureMode === "distance" ? null : "distance"); setMeasurePoints([]) }}
                      className={`py-2 text-[10px] font-black uppercase rounded-lg border transition-all flex items-center justify-center gap-1 ${
                        measureMode === "distance" ? "bg-amber-500 text-white border-amber-500" : "border-slate-700 text-slate-400 hover:border-slate-500"
                      }`}>
                      <Navigation className="w-3 h-3" /> Distance
                    </button>
                    <button onClick={() => { setMeasureMode(measureMode === "area" ? null : "area"); setMeasurePoints([]) }}
                      className={`py-2 text-[10px] font-black uppercase rounded-lg border transition-all flex items-center justify-center gap-1 ${
                        measureMode === "area" ? "bg-amber-500 text-white border-amber-500" : "border-slate-700 text-slate-400 hover:border-slate-500"
                      }`}>
                      <Crosshair className="w-3 h-3" /> Area
                    </button>
                  </div>
                  {measureMode && (
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-2 text-center">
                      <p className="text-[9px] text-amber-400 font-bold">
                        {measureMode === "distance" ? "Click points on map to measure distance" : "Click ≥3 points to measure area (hectares)"}
                      </p>
                      {measureMode === "distance" && measureDistStr() && (
                        <p className="text-amber-300 font-black text-sm mt-1">{measureDistStr()}</p>
                      )}
                      {measureMode === "area" && measurePoints.length >= 3 && (
                        <p className="text-amber-300 font-black text-sm mt-1">{polygonAreaHa(measurePoints).toFixed(2)} ha</p>
                      )}
                      <button onClick={() => setMeasurePoints([])} className="text-[9px] text-slate-500 mt-1 hover:text-slate-300">Clear points</button>
                    </div>
                  )}
                </div>

                {/* Geofence List */}
                <div className="border-t border-slate-800 pt-3">
                  <p className="text-[10px] font-black text-slate-500 uppercase mb-2">
                    Active Geofences ({geofences.length})
                  </p>
                  {geofences.map(gf => (
                    <div key={gf.id} className="flex items-center gap-2 p-2 bg-slate-800/40 rounded-lg mb-1.5">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: GEOFENCE_COLORS[gf.type] ?? "#6366f1" }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black text-white truncate">{gf.name}</p>
                        <p className="text-[9px] text-slate-500 uppercase">{gf.type} · {gf.shape}</p>
                      </div>
                      <button onClick={() => setGeofences(prev => prev.filter(g => g.id !== gf.id))}
                        className="text-slate-600 hover:text-red-400 transition-all">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ─── MAINTENANCE ALERTS TAB ────────────────────────────────── */}
          {activeTab === "alerts" && (
            <>
              <div className="px-4 py-3 border-b border-slate-800">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Maintenance Alerts</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-[9px] font-black rounded-full uppercase">
                    {mainAlerts.filter(a => a.severity === "critical").length} Critical
                  </span>
                  <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-[9px] font-black rounded-full uppercase">
                    {mainAlerts.filter(a => a.severity === "warning").length} Warning
                  </span>
                </div>
              </div>
              <div className="flex-1 p-3 space-y-2 overflow-y-auto">
                {mainAlerts.map(alert => (
                  <div key={alert.id}
                    className={`p-3 rounded-xl border transition-all ${
                      alert.severity === "critical"
                        ? "bg-red-500/8 border-red-500/30"
                        : "bg-amber-500/8 border-amber-500/30"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1.5">
                        <AlertTriangle className={`w-3.5 h-3.5 shrink-0 ${alert.severity === "critical" ? "text-red-400" : "text-amber-400"}`} />
                        <p className="text-[11px] font-black text-white">{alert.plate}</p>
                      </div>
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                        alert.severity === "critical" ? "bg-red-500/20 text-red-400" : "bg-amber-500/20 text-amber-400"
                      }`}>{alert.severity}</span>
                    </div>
                    <p className="text-[10px] text-slate-300 font-bold mb-1">{alert.message}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] text-slate-500">Driver: {alert.driver}</span>
                      <span className="text-[9px] text-slate-600 uppercase font-bold">{alert.alert_type.replace("_", " ")}</span>
                    </div>
                  </div>
                ))}

                <div className="border-t border-slate-800 pt-3">
                  <p className="text-[10px] font-black text-slate-500 uppercase mb-2">Alert Logic (Cron)</p>
                  <div className="space-y-1.5 text-[9px]">
                    {[
                      ["🔢 Odometer", "current_km ≥ last_service + interval"],
                      ["📅 Date",     "next_service_date ≤ TODAY + 7 days"],
                      ["⚙️ Engine Hrs","engine_hrs ≥ last_service_hrs + interval"],
                    ].map(([label, logic]) => (
                      <div key={label} className="flex items-start gap-2 bg-slate-800/40 rounded-lg p-2">
                        <span className="text-slate-300 font-bold shrink-0 w-24">{label}</span>
                        <code className="text-green-400 text-[8px] break-all">{logic}</code>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ─── HELP GUIDE TAB ───────────────────────────────────────── */}
          {activeTab === "help" && <HelpPanel />}
        </div>

        {/* ── MAP AREA ─────────────────────────────────────────────────────── */}
        <div className="flex-1 relative min-h-0 min-w-0">
          <MapCore
            vehicles={vehicles}
            selected={selected}
            baseLayer={baseLayer}
            showTrails={showTrails}
            showZones={showZones}
            geofences={geofences}
            drawMode={drawMode}
            drawnPoints={drawnPoints}
            measureMode={measureMode}
            measurePoints={measurePoints}
            searchResult={searchResult}
            showHeatmap={showHeatmap && activeTab === "heatmap"}
            heatPoints={heatPoints}
            
            // Operational Layers
            blasts={blasts}
            drills={drills}
            diamonds={diamonds}
            safetyData={safety}
            showFleet={showFleet}
            showBlasting={showBlasting}
            showDrilling={showDrilling}
            showDiamond={showDiamond}
            showSafety={showSafety}

            onVehicleClick={id => setSelected(id === selected ? null : id)}
            onMapClick={handleMapClick}
          />

          {/* MAP HUD - Legend */}
          <div className="absolute top-3 right-3 z-[500] pointer-events-none">
            <div className="bg-slate-900/95 backdrop-blur-md rounded-xl p-3 border border-slate-700 min-w-[150px] shadow-xl">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2">Fleet Legend</p>
              {(["dump_truck","excavator","drill_rig","light_vehicle","water_truck"] as VehicleType[]).map(type => (
                <div key={type} className="flex items-center gap-2 py-0.5">
                  <span className="text-xs">{VEHICLE_EMOJI[type]}</span>
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{
                    backgroundColor: { dump_truck:"#f59e0b",excavator:"#ef4444",drill_rig:"#3b82f6",light_vehicle:"#10b981",water_truck:"#06b6d4" }[type]
                  }} />
                  <span className="text-[9px] text-slate-400 capitalize">{type.replace("_"," ")}</span>
                </div>
              ))}
            </div>
          </div>

          {/* MAP HUD - Status footer */}
          <div className="absolute bottom-3 left-3 z-[500] pointer-events-none">
            <div className="bg-slate-900/80 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-slate-800 flex items-center gap-2">
              {realtime
                ? <><Wifi className="w-3 h-3 text-purple-400" /><span className="text-[9px] text-purple-400 font-bold uppercase">GPS Live · Supabase Realtime</span></>
                : <><Radio className="w-3 h-3 text-slate-500" /><span className="text-[9px] text-slate-500 font-bold uppercase">Simulation · Supabase Ready · OpenStreetMap</span></>
              }
            </div>
          </div>

          {/* Active mode indicator */}
          {(drawMode || measureMode) && (
            <div className="absolute top-3 left-3 z-[500]">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase border shadow-lg ${
                drawMode ? "bg-violet-900/90 border-violet-500/50 text-violet-300" : "bg-amber-900/90 border-amber-500/50 text-amber-300"
              }`}>
                {drawMode ? <Pencil className="w-3.5 h-3.5" /> : <Crosshair className="w-3.5 h-3.5" />}
                {drawMode ? `Draw Mode: ${drawMode} (Chora Mpakani: ${drawMode})` : `Measure: ${measureMode} (Vipimo: ${measureMode})`}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Help Guide Panel (Bilingual) ─────────────────────────────────────────────
function HelpPanel() {
  const [lang, setLang] = useState<"en" | "sw">("en")

  const content = {
    en: {
      sections: [
        {
          title: "Map Navigation",
          items: [
            "🖱 Scroll wheel / pinch — Zoom in & out",
            "✋ Click & drag — Pan the map",
            "🔍 Search box (top right) — Fly to any location",
            "Double-click — Zoom in to that point",
          ],
        },
        {
          title: "Base Layer Switching",
          items: [
            "🗺 Street Map — Roads & labels (default)",
            "🛰 Satellite — ESRI high-res aerial imagery",
            "⛰ Topographic — Elevation contour lines (ideal for pit design)",
            "Select from the top bar buttons",
          ],
        },
        {
          title: "Measure Distance & Area",
          items: [
            "Go to Geofences tab → Measurement Tools",
            "Distance: Click two or more points on haul road",
            "Area: Click 3+ points around pit boundary — result in hectares",
            "Click 'Clear points' to reset",
          ],
        },
        {
          title: "Draw a Geofence",
          items: [
            "Go to Geofences tab → click Polygon or Circle",
            "Click on the map to place vertices",
            "After 3+ points, name the zone and select type (Pit/Crusher/Hazard/etc.)",
            "Click Save — boundary stored in Supabase",
          ],
        },
        {
          title: "Reading the Heatmap",
          items: [
            "Go to Heatmap tab → select Grade or Safety",
            "🔵 Blue = Low grade / Low incident area",
            "🟡 Yellow = Medium intensity",
            "🔴 Red = High grade gold / High incident frequency",
            "Use with Satellite view for best field correlation",
          ],
        },
        {
          title: "Driver GPS Tracking (Phone)",
          items: [
            "1. Open the Driver App on your smartphone",
            "2. Allow location permissions when prompted",
            "3. Tap 'Start Trip' — GPS sends every 10 seconds",
            "4. Your vehicle marker updates live on the Command Center",
            "5. Tap 'End Trip' when finished",
          ],
        },
      ],
    },
    sw: {
      sections: [
        {
          title: "Jinsi ya Kutumia Ramani",
          items: [
            "🖱 Gurudumu la kipanya / pinch — Kukuza na kupunguza",
            "✋ Bonyeza na buruta — Sogeza ramani",
            "🔍 Sanduku la tafuta (juu kulia) — Nenda mahali popote",
            "Bonyeza mara mbili — Kukuza eneo husika",
          ],
        },
        {
          title: "Kubadilisha Aina ya Ramani",
          items: [
            "🗺 Ramani ya Barabara — Njia na majina",
            "🛰 Picha ya Satellite — Picha ya angani ya ESRI",
            "⛰ Ramani ya Milima — Mistari ya urefu (muhimu kwa mgodi)",
            "Chagua kitufe juu ya ukurasa",
          ],
        },
        {
          title: "Kupima Umbali na Eneo",
          items: [
            "Nenda kwenye kichupo cha Geofences → Zana za Kupima",
            "Umbali: Bonyeza pointi mbili au zaidi kwenye barabara ya kukimbia",
            "Eneo: Bonyeza pointi 3+ kuzunguka shimo — matokeo katika hekta",
            "Bonyeza 'Clear points' kuanza upya",
          ],
        },
        {
          title: "Kuchora Mipaka (Geofence)",
          items: [
            "Nenda kwenye kichupo cha Geofences → bonyeza Polygon au Circle",
            "Bonyeza ramani kuweka pointi",
            "Baada ya pointi 3+, weka jina na chagua aina (Shimo/Crusher/Hatari/n.k.)",
            "Bonyeza Hifadhi — mipaka huhifadhiwa kwenye Supabase",
          ],
        },
        {
          title: "Kusoma Ramani ya Joto (Heatmap)",
          items: [
            "Nenda kwenye kichupo cha Heatmap → chagua Dhahabu au Usalama",
            "🔵 Bluu = Daraja ndogo ya madini / Eneo salama",
            "🟡 Njano = Kiwango cha kati",
            "🔴 Nyekundu = Daraja kubwa ya dhahabu / Matukio mengi ya usalama",
            "Tumia na Ramani ya Satellite kwa ulinganisho bora",
          ],
        },
        {
          title: "Msukosuko wa GPS kwa Dereva (Simu)",
          items: [
            "1. Fungua Programu ya Dereva kwenye simu yako",
            "2. Ruhusu ruhusa za eneo unapoombwa",
            "3. Bonyeza 'Anza Safari' — GPS inasindika kila sekunde 10",
            "4. Alama yako ya gari inasasishwa moja kwa moja kwenye Kituo cha Amri",
            "5. Bonyeza 'Maliza Safari' unapomaliza",
          ],
        },
      ],
    },
  }

  const sections = content[lang].sections

  return (
    <>
      <div className="px-4 py-3 border-b border-slate-800">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Help Guide / Mwongozo</p>
        <div className="flex gap-2 mt-2">
          {(["en", "sw"] as const).map(l => (
            <button key={l} onClick={() => setLang(l)}
              className={`flex-1 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all ${
                lang === l ? "bg-amber-500 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"
              }`}
            >{l === "en" ? "🇬🇧 English" : "🇹🇿 Kiswahili"}</button>
          ))}
        </div>
      </div>
      <div className="flex-1 p-3 space-y-4 overflow-y-auto">
        {sections.map((section, si) => (
          <div key={si} className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <p className="text-[10px] font-black text-amber-400 uppercase tracking-wide">{section.title}</p>
            </div>
            {section.items.map((item, ii) => (
              <div key={ii} className="flex items-start gap-2 pl-3">
                <ChevronRight className="w-2.5 h-2.5 text-slate-600 shrink-0 mt-0.5" />
                <p className="text-[10px] text-slate-400 leading-relaxed">{item}</p>
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  )
}
