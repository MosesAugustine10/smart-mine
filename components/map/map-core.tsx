"use client"

// ─────────────────────────────────────────────────────────────────────────────
// MAP CORE — Smart Mine Command Center
// This file is dynamically imported (ssr: false) from live-tracker.tsx
// All react-leaflet hooks live here.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useCallback, useState } from "react"
import { MapContainer, TileLayer, Marker, Popup, Polyline,
  Circle, CircleMarker, Polygon, useMapEvents, useMap,
} from "react-leaflet"
import L from "leaflet"
import type { 
  Vehicle, VehicleType, VehicleStatus, Geofence, HeatPoint, BaseLayer,
  BlastLog, DrillLog, DiamondDrillLog, SafetyIncident
} from "./live-tracker"

// ─── Base Layers ──────────────────────────────────────────────────────────────
export const LAYER_CONFIG: Record<BaseLayer, { url: string; attribution: string; maxZoom: number }> = {
  osm: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "© <a href='https://osm.org/copyright'>OpenStreetMap</a> contributors",
    maxZoom: 19,
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles © Esri — Source: Esri, USGS, NOAA",
    maxZoom: 20,
  },
  topo: {
    // OpenTopoMap — shows elevation contours (essential for mining)
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution: "Map data: © OpenStreetMap contributors, SRTM | Map style: © OpenTopoMap (CC-BY-SA)",
    maxZoom: 17,
  },
}

// ─── Vehicle Colors & Status ──────────────────────────────────────────────────
export const VEHICLE_COLORS: Record<VehicleType, string> = {
  dump_truck:    "#f59e0b",
  excavator:     "#ef4444",
  drill_rig:     "#3b82f6",
  light_vehicle: "#10b981",
  water_truck:   "#06b6d4",
}

export const STATUS_COLORS: Record<VehicleStatus, string> = {
  moving:      "#10b981",
  idle:        "#f59e0b",
  loading:     "#3b82f6",
  maintenance: "#ef4444",
  offline:     "#6b7280",
}

// ─── Custom SVG Icon Factory ──────────────────────────────────────────────────
// Professional SVG icons — NO default blue Leaflet markers
export function buildVehicleIcon(v: Vehicle, isSelected: boolean): L.DivIcon {
  const color  = VEHICLE_COLORS[v.type]
  const size   = isSelected ? 48 : 38
  const rotate = v.heading - 45

  const svgBody: Record<VehicleType, string> = {
    dump_truck: `
      <!-- Haul Truck SVG -->
      <rect x="2" y="10" width="16" height="8" rx="2" fill="white" opacity="0.9"/>
      <rect x="14" y="6" width="6" height="12" rx="1" fill="white" opacity="0.7"/>
      <circle cx="5" cy="19" r="2.5" fill="#334155"/>
      <circle cx="15" cy="19" r="2.5" fill="#334155"/>
      <rect x="3" y="10" width="8" height="5" rx="1" fill="${color}" opacity="0.5"/>`,

    excavator: `
      <!-- Excavator SVG -->
      <rect x="3" y="12" width="14" height="6" rx="2" fill="white" opacity="0.9"/>
      <rect x="13" y="6" width="5" height="10" rx="1" fill="white" opacity="0.7"/>
      <line x1="16" y1="8" x2="20" y2="4" stroke="white" stroke-width="2" stroke-linecap="round"/>
      <circle cx="6" cy="19" r="2.5" fill="#334155"/>
      <circle cx="14" cy="19" r="2.5" fill="#334155"/>`,

    drill_rig: `
      <!-- Drill Rig SVG -->
      <rect x="7" y="2" width="6" height="18" rx="1" fill="white" opacity="0.9"/>
      <rect x="4" y="16" width="12" height="5" rx="2" fill="white" opacity="0.7"/>
      <circle cx="8" cy="22" r="2" fill="#334155"/>
      <circle cx="12" cy="22" r="2" fill="#334155"/>
      <rect x="9" y="20" width="2" height="3" fill="white"/>`,

    light_vehicle: `
      <!-- Light Vehicle (4WD) SVG -->
      <rect x="2" y="11" width="16" height="7" rx="2" fill="white" opacity="0.9"/>
      <rect x="5" y="7" width="10" height="6" rx="2" fill="white" opacity="0.7"/>
      <circle cx="5" cy="19" r="2.5" fill="#334155"/>
      <circle cx="15" cy="19" r="2.5" fill="#334155"/>
      <rect x="6" y="8" width="8" height="4" rx="1" fill="${color}" opacity="0.4"/>`,

    water_truck: `
      <!-- Water Truck SVG -->
      <ellipse cx="10" cy="13" rx="8" ry="5" fill="white" opacity="0.9"/>
      <rect x="14" y="8" width="5" height="10" rx="1" fill="white" opacity="0.7"/>
      <circle cx="4" cy="19" r="2.5" fill="#334155"/>
      <circle cx="16" cy="19" r="2.5" fill="#334155"/>
      <text x="7" y="16" font-size="6" fill="${color}" font-weight="bold">H₂O</text>`,
  }

  const alert = (v.alerts || []).length > 0
    ? `<circle cx="18" cy="2" r="5" fill="#ef4444" stroke="white" stroke-width="1.5"/>
       <text x="18" y="6" text-anchor="middle" font-size="7" fill="white" font-weight="bold">!</text>`
    : ""

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="11" fill="${color}" opacity="${isSelected ? 1 : 0.85}"/>
      <circle cx="12" cy="12" r="9" fill="${color}" opacity="0.3" stroke="${isSelected ? "white" : color}" stroke-width="${isSelected ? 2 : 1}"/>
      ${svgBody[v.type]}
      ${alert}
    </svg>`

  return L.divIcon({
    html: `<div style="transform:rotate(${rotate}deg);filter:drop-shadow(0 4px 8px ${color}80);transition:all 0.4s ease;">${svg}</div>`,
    className: "",
    iconSize:   [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  })
}

// ─── Static Site/Zone Icon Factory ───────────────────────────────────────────
export function buildOperationalIcon(type: "blasting" | "drilling" | "diamond" | "safety"): L.DivIcon {
  const configs = {
    blasting: {
      color: "#f59e0b", size: 36,
      svg: `<text x="12" y="17" text-anchor="middle" font-size="14">💥</text>`, // Explosion Icon
    },
    drilling: {
      color: "#78350f", size: 36,
      svg: `<text x="12" y="17" text-anchor="middle" font-size="14">⛏</text>`, // Drill Bit
    },
    diamond: {
      color: "#3b82f6", size: 36,
      svg: `<text x="12" y="17" text-anchor="middle" font-size="14">💎</text>`, // Diamond
    },
    safety: {
      color: "#ef4444", size: 40,
      svg: `<text x="12" y="17" text-anchor="middle" font-size="16" fill="white">⚠</text>`, // Warning Triangle
    },
  }
  const cfg = (configs as any)[type]
  return L.divIcon({
    html: `
      <svg xmlns="http://www.w3.org/2000/svg" width="${cfg.size}" height="${cfg.size}" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="11" fill="${cfg.color}" opacity="0.9" stroke="white" stroke-width="1.5"/>
        ${cfg.svg}
      </svg>`,
    className: "",
    iconSize:   [cfg.size, cfg.size],
    iconAnchor: [cfg.size / 2, cfg.size / 2],
    popupAnchor: [0, -cfg.size / 2],
  })
}

export function buildSiteIcon(type: "mining_site" | "blasting_zone" | "safety_incident"): L.DivIcon {
  const configs = {
    mining_site: {
      color: "#f59e0b", size: 36,
      svg: `<text x="12" y="17" text-anchor="middle" font-size="14">⛏</text>`,
    },
    blasting_zone: {
      color: "#ef4444", size: 36,
      svg: `<text x="12" y="17" text-anchor="middle" font-size="14">💥</text>`,
    },
    safety_incident: {
      color: "#ef4444", size: 40,
      svg: `
        <rect x="8" y="5" width="8" height="14" rx="2" fill="white"/>
        <rect x="5" y="9" width="14" height="6" rx="2" fill="white"/>`,
    },
  }
  const cfg = configs[type]
  return L.divIcon({
    html: `
      <svg xmlns="http://www.w3.org/2000/svg" width="${cfg.size}" height="${cfg.size}" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="11" fill="${cfg.color}" opacity="0.9"/>
        ${cfg.svg}
      </svg>`,
    className: "",
    iconSize:   [cfg.size, cfg.size],
    iconAnchor: [cfg.size / 2, cfg.size / 2],
  })
}

// ─── Search Marker Icon ───────────────────────────────────────────────────────
export const SEARCH_ICON = L.divIcon({
  html: `
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="44" viewBox="0 0 36 44">
      <ellipse cx="18" cy="40" rx="6" ry="3" fill="rgba(0,0,0,0.2)"/>
      <path d="M18 0 C9 0 2 7 2 16 C2 28 18 42 18 42 C18 42 34 28 34 16 C34 7 27 0 18 0Z" fill="#8b5cf6"/>
      <circle cx="18" cy="16" r="8" fill="white" opacity="0.9"/>
      <circle cx="18" cy="16" r="5" fill="#8b5cf6"/>
    </svg>`,
  className: "",
  iconSize:   [36, 44],
  iconAnchor: [18, 44],
  popupAnchor: [0, -44],
})

// ─── Geofence Color Map ───────────────────────────────────────────────────────
export const GEOFENCE_COLORS: Record<string, string> = {
  pit:       "#ef4444",
  stockpile: "#f59e0b",
  crusher:   "#8b5cf6",
  hazard:    "#ec4899",
  office:    "#10b981",
}

// ─── Haversine distance (meters) ─────────────────────────────────────────────
export function haversine(a: [number, number], b: [number, number]): number {
  const R = 6371000
  const φ1 = a[0] * Math.PI / 180, φ2 = b[0] * Math.PI / 180
  const Δφ = (b[0] - a[0]) * Math.PI / 180
  const Δλ = (b[1] - a[1]) * Math.PI / 180
  const s = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s))
}

// ─── Polygon area (hectares) ──────────────────────────────────────────────────
export function polygonAreaHa(pts: [number, number][]): number {
  if (pts.length < 3) return 0
  let area = 0
  for (let i = 0; i < pts.length; i++) {
    const j = (i + 1) % pts.length
    area += pts[i][1] * pts[j][0]
    area -= pts[j][1] * pts[i][0]
  }
  const m2 = Math.abs(area / 2) * 111320 * 111320
  return m2 / 10000
}

// ─── Heatmap gradient ─────────────────────────────────────────────────────────
function heatColor(intensity: number): string {
  // Blue (0) → Green (0.5) → Yellow (0.7) → Red (1.0)
  if (intensity < 0.5) {
    const t = intensity * 2
    return `rgba(${Math.round(59 + t * 100)}, ${Math.round(130 + t * 50)}, ${Math.round(246 - t * 246)}, 0.55)`
  }
  const t = (intensity - 0.5) * 2
  return `rgba(${Math.round(239 + t * 16)}, ${Math.round(180 - t * 120)}, 68, 0.55)`
}

// ─── Inner: Layer Switcher ────────────────────────────────────────────────────
function LayerControl({ baseLayer }: { baseLayer: BaseLayer }) {
  const map = useMap()
  const tileRef = useRef<L.TileLayer | null>(null)

  useEffect(() => {
    if (tileRef.current) { map.removeLayer(tileRef.current) }
    const cfg = LAYER_CONFIG[baseLayer]
    tileRef.current = L.tileLayer(cfg.url, { attribution: cfg.attribution, maxZoom: cfg.maxZoom }).addTo(map)
    return () => { if (tileRef.current) map.removeLayer(tileRef.current) }
  }, [baseLayer, map])

  return null
}

// ─── Inner: Map Click Handler ─────────────────────────────────────────────────
function ClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (e) => onMapClick(e.latlng.lat, e.latlng.lng) })
  return null
}

// ─── Inner: Fly-to Search Result ─────────────────────────────────────────────
function FlyTo({ target }: { target: { lat: number; lng: number } | null }) {
  const map = useMap()
  useEffect(() => {
    if (target) map.flyTo([target.lat, target.lng], 16, { duration: 1.2 })
  }, [target, map])
  return null
}

// ─── Inner: Heatmap Layer (canvas-rendered circles) ──────────────────────────
function HeatmapLayer({ points }: { points: HeatPoint[] }) {
  return (
    <>
      {points.map((pt, i) => (
        <CircleMarker
          key={i}
          center={[pt.lat, pt.lng]}
          radius={24 * pt.intensity}
          pathOptions={{
            fillColor: heatColor(pt.intensity),
            fillOpacity: 0.65,
            color: "none",
            weight: 0,
          }}
        />
      ))}
    </>
  )
}

// ─── Main MapCore Props ───────────────────────────────────────────────────────
export interface MapCoreProps {
  vehicles: Vehicle[]
  selected:      string | null
  baseLayer:     BaseLayer
  showTrails:    boolean
  showZones:     boolean
  geofences:     Geofence[]
  drawMode:      "polygon" | "circle" | null
  drawnPoints:   [number, number][]
  measureMode:   "distance" | "area" | null
  measurePoints: [number, number][]
  searchResult:  { lat: number; lng: number; name: string } | null
  showHeatmap:   boolean
  heatPoints:    HeatPoint[]
  
  // New Operational Props
  blasts?:        BlastLog[]
  drills?:        DrillLog[]
  diamonds?:      DiamondDrillLog[]
  safetyData?:    SafetyIncident[]
  
  showFleet:      boolean
  showBlasting:   boolean
  showDrilling:   boolean
  showDiamond:    boolean
  showSafety:     boolean

  onVehicleClick: (id: string) => void
  onMapClick:     (lat: number, lng: number) => void
}

// ─── Mine Zones (static operational circles) ─────────────────────────────────
const MINE_ZONES = [
  { center: [-2.871, 32.907] as [number,number], radius: 200, color: "#ef4444", label: "Main Pit Zone",      desc: "Restricted Heavy Traffic Area" },
  { center: [-2.878, 32.914] as [number,number], radius: 120, color: "#f59e0b", label: "Crusher Station",   desc: "Active Processing Zone" },
  { center: [-2.861, 32.914] as [number,number], radius: 150, color: "#3b82f6", label: "Waste Dump",        desc: "Authorised Dump Only" },
  { center: [-2.879, 32.902] as [number,number], radius: 90,  color: "#8b5cf6", label: "Drill Block A",     desc: "Active Drilling Sector" },
  { center: [-2.865, 32.904] as [number,number], radius: 80,  color: "#10b981", label: "Office Complex",    desc: "Admin & Safety Hub" },
]

const MINE_CENTER: [number, number] = [-2.871, 32.907]

// ─── MapCore Component ────────────────────────────────────────────────────────
export function MapCore(props: MapCoreProps) {
  const {
    vehicles = [], selected, baseLayer = 'osm', showTrails = true, showZones = true,
    geofences = [], drawMode, drawnPoints = [],
    measureMode, measurePoints = [],
    searchResult, showHeatmap, heatPoints = [],
    onVehicleClick, onMapClick,
  } = props

  const [L_ref, setL_ref] = useState<typeof L | null>(null)

  useEffect(() => {
    import("leaflet").then((leaflet) => {
      leaflet.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      })
      setL_ref(leaflet)
    })
  }, [])

  // ── Measurement display ─────────────────────────────────────────────────────
  let measureLabel = ""
  if (measureMode === "distance" && measurePoints.length >= 2) {
    let total = 0
    for (let i = 0; i < measurePoints.length - 1; i++) {
      total += haversine(measurePoints[i], measurePoints[i + 1])
    }
    measureLabel = total >= 1000 ? `${(total / 1000).toFixed(2)} km` : `${total.toFixed(0)} m`
  } else if (measureMode === "area" && measurePoints.length >= 3) {
    measureLabel = `${polygonAreaHa(measurePoints).toFixed(2)} ha`
  }

  return (
    <MapContainer
      center={MINE_CENTER}
      zoom={14}
      scrollWheelZoom
      style={{ height: "100%", width: "100%", background: "#0f172a", cursor: (drawMode || measureMode) ? "crosshair" : "grab" }}
      zoomControl={false}
    >
      {/* ── Base Layer (switchable) ─────────────────────────────────────── */}
      <LayerControl baseLayer={baseLayer} />

      {/* ── Map events ─────────────────────────────────────────────────── */}
      <ClickHandler onMapClick={onMapClick} />

      {/* ── Fly to search result ─────────────────────────────────────── */}
      <FlyTo target={searchResult} />

      {/* ── Heatmap layer ──────────────────────────────────────────────── */}
      {showHeatmap && <HeatmapLayer points={heatPoints} />}

      {/* ── Mine operation zones ───────────────────────────────────────── */}
      {showZones && MINE_ZONES.map((z, i) => (
        <Circle
          key={i}
          center={z.center}
          radius={z.radius}
          pathOptions={{ color: z.color, fillColor: z.color, fillOpacity: 0.07, weight: 2, dashArray: "6 4" }}
        >
          <Popup>
            <div className="font-sans">
              <p className="font-black text-slate-900 text-sm">{z.label}</p>
              <p className="text-[11px] text-slate-500">{z.desc}</p>
            </div>
          </Popup>
        </Circle>
      ))}

      {/* ── Saved Geofences ────────────────────────────────────────────── */}
      {geofences.map((gf) => {
        const color = GEOFENCE_COLORS[gf.type] ?? "#6366f1"
        if (gf.shape === "circle" && gf.center && gf.radius) {
          return (
            <Circle key={gf.id} center={gf.center} radius={gf.radius}
              pathOptions={{ color, fillColor: color, fillOpacity: 0.12, weight: 2.5, dashArray: "8 4" }}>
              <Popup>
                <div className="font-sans">
                  <p className="font-black text-sm text-slate-900">{gf.name}</p>
                  <p className="text-[11px] text-slate-500 uppercase font-bold">{gf.type} Zone</p>
                  <p className="text-[11px] text-slate-400">Radius: {gf.radius}m</p>
                </div>
              </Popup>
            </Circle>
          )
        }
        if (gf.shape === "polygon" && gf.coordinates) {
          return (
            <Polygon key={gf.id} positions={gf.coordinates as any}
              pathOptions={{ color, fillColor: color, fillOpacity: 0.12, weight: 2.5, dashArray: "8 4" }}>
              <Popup>
                <div className="font-sans">
                  <p className="font-black text-sm text-slate-900">{gf.name}</p>
                  <p className="text-[11px] text-slate-500 uppercase font-bold">{gf.type} Zone</p>
                </div>
              </Popup>
            </Polygon>
          )
        }
        return null
      })}

      {/* ── Drawing preview (polygon being drawn) ──────────────────────── */}
      {drawMode === "polygon" && drawnPoints.length > 0 && (
        <>
          {drawnPoints.map((pt, i) => (
            <CircleMarker key={i} center={pt} radius={5}
              pathOptions={{ color: "#6366f1", fillColor: "#6366f1", fillOpacity: 0.9, weight: 2 }} />
          ))}
          {drawnPoints.length > 1 && (
            <Polyline positions={[...drawnPoints, drawnPoints[0]]}
              pathOptions={{ color: "#6366f1", weight: 2, dashArray: "6 4" }} />
          )}
        </>
      )}

      {/* ── Measurement display ─────────────────────────────────────────── */}
      {measurePoints.length > 0 && (
        <>
          {measurePoints.map((pt, i) => (
            <CircleMarker key={i} center={pt} radius={5}
              pathOptions={{ color: "#f59e0b", fillColor: "#f59e0b", fillOpacity: 1, weight: 2 }} />
          ))}
          {measurePoints.length > 1 && (
            <Polyline
              positions={measureMode === "area" ? [...measurePoints, measurePoints[0]] : measurePoints}
              pathOptions={{ color: "#f59e0b", weight: 2, dashArray: measureMode === "area" ? undefined : "8 4" }}
            />
          )}
        </>
      )}

      {/* ── Search result marker ────────────────────────────────────────── */}
      {searchResult && (
        <Marker position={[searchResult.lat, searchResult.lng]} icon={SEARCH_ICON}>
          <Popup>
            <div className="font-sans">
              <p className="font-black text-slate-900">{searchResult.name}</p>
              <p className="text-[10px] text-slate-400">
                {searchResult.lat.toFixed(5)}, {searchResult.lng.toFixed(5)}
              </p>
            </div>
          </Popup>
        </Marker>
      )}

      {/* ── Operational Markers ─────────────────────────────────────────── */}
      {props.showBlasting && props.blasts?.map(b => (
        <Marker key={b.id} position={[b.latitude, b.longitude]} icon={buildOperationalIcon("blasting")}>
          <Popup>
            <div className="font-sans min-w-[180px]">
              <p className="font-black text-slate-900 text-sm border-b pb-1 mb-1">Blasting Site</p>
              <p className="text-[11px] text-slate-700 font-bold">Name: {b.site_name}</p>
              <p className="text-[10px] text-slate-500">Date: {b.blast_date}</p>
              <p className="text-[10px] text-slate-500">Result: <span className={b.blast_result === "Good" ? "text-emerald-600" : "text-amber-600"}>{b.blast_result}</span></p>
              <p className="text-[10px] text-slate-500">Explosive: {b.explosive_quantity_kg} kg</p>
            </div>
          </Popup>
        </Marker>
      ))}

      {props.showDrilling && props.drills?.map(d => (
        <Marker key={d.id} position={[d.latitude, d.longitude]} icon={buildOperationalIcon("drilling")}>
          <Popup>
            <div className="font-sans min-w-[180px]">
              <p className="font-black text-slate-900 text-sm border-b pb-1 mb-1">Drilling Site (Jackhammer)</p>
              <p className="text-[11px] text-slate-700 font-bold">Site: {d.site_name}</p>
              <p className="text-[10px] text-slate-500">Operator: {d.operator_name}</p>
              <p className="text-[10px] text-slate-500">Depth: {d.total_depth_m} m</p>
              <p className="text-[10px] text-slate-500">Date: {d.drill_date}</p>
            </div>
          </Popup>
        </Marker>
      ))}

      {props.showDiamond && props.diamonds?.map(dd => (
        <Marker key={dd.id} position={[dd.collar_latitude, dd.collar_longitude]} icon={buildOperationalIcon("diamond")}>
          <Popup>
            <div className="font-sans min-w-[180px]">
              <p className="font-black text-slate-900 text-sm border-b pb-1 mb-1">Diamond Drilling Hole</p>
              <p className="text-[11px] text-slate-700 font-bold">Hole ID: {dd.hole_id}</p>
              <p className="text-[10px] text-slate-500">Sample ID: {dd.sample_id}</p>
              <p className="text-[10px] text-slate-500">Range: {dd.depth_from} - {dd.depth_to} m</p>
              <p className="text-[10px] text-slate-500">RQD: {dd.rqd}%</p>
              <p className="text-[10px] text-slate-500">Rock: {dd.rock_type}</p>
            </div>
          </Popup>
        </Marker>
      ))}

      {props.showSafety && props.safetyData?.map(s => (
        <Marker key={s.id} position={[s.latitude, s.longitude]} icon={buildOperationalIcon("safety")}>
          <Popup>
            <div className="font-sans min-w-[180px]">
              <p className="font-black text-red-600 text-sm border-b pb-1 mb-1">Safety Incident</p>
              <p className="text-[11px] text-slate-700 font-bold">Type: {s.incident_type}</p>
              <p className="text-[10px] text-slate-500">Victim: {s.victim_name}</p>
              <p className="text-[10px] text-slate-500">Date: {s.incident_date}</p>
              <p className="text-[10px] text-red-500 font-bold">Severity: {s.severity}</p>
              <p className="text-[10px] text-slate-500">Injury: {s.body_part}</p>
            </div>
          </Popup>
        </Marker>
      ))}

      {/* ── Vehicle markers + route trails ─────────────────────────────── */}
      {L_ref && props.showFleet && vehicles.map((v) => {
        const icon = buildVehicleIcon(v, v.id === selected)
        const trailColor = VEHICLE_COLORS[v.type]
        const history = v.history || []
        const alerts = v.alerts || []
        return (
          <div key={v.id}>
            {showTrails && history.length > 2 && (
              <Polyline positions={history}
                pathOptions={{
                  color: trailColor, weight: 2.5, opacity: 0.5,
                  dashArray: v.status === "moving" ? undefined : "6 6",
                }} />
            )}
            <Marker
              position={[v.lat, v.lng]}
              icon={icon}
              eventHandlers={{ click: () => onVehicleClick(v.id) }}
            >
              <Popup minWidth={240} className="leaflet-popup-vehicle">
                <div className="font-sans p-1">
                  <div className="flex items-center gap-2 pb-2 mb-2 border-b border-slate-100">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-base"
                      style={{ backgroundColor: VEHICLE_COLORS[v.type] }}>
                      {v.type === "dump_truck" ? "🚛" : v.type === "excavator" ? "🏗️" :
                       v.type === "drill_rig" ? "⚙️" : v.type === "light_vehicle" ? "🚙" : "🚒"}
                    </div>
                    <div>
                      <p className="font-black text-slate-900 text-sm leading-tight">{v.plate}</p>
                      <p className="text-[10px] text-slate-500 uppercase font-bold">{v.type.replace("_", " ")}</p>
                    </div>
                    <span className="ml-auto px-2 py-0.5 rounded-full text-[9px] font-black uppercase text-white shrink-0"
                      style={{ backgroundColor: STATUS_COLORS[v.status] }}>{v.status}</span>
                  </div>
                  {([
                    ["Driver",     v.driver],
                    ["Task",       v.task],
                    ["Speed",      `${v.speed_kmh.toFixed(0)} km/h`],
                    ["Fuel Level", `${v.fuel_pct.toFixed(0)}%`],
                    ["Payload",    `${v.load_pct}%`],
                    ["Odometer",   `${v.odometer_km.toLocaleString()} km`],
                    ["Last Ping",  new Date(v.last_ping).toLocaleTimeString()],
                  ] as [string, string][]).map(([k, val]) => (
                    <div key={k} className="flex justify-between py-0.5 text-[10px]">
                      <span className="text-slate-400 font-bold uppercase">{k}</span>
                      <span className="font-black text-slate-800">{val}</span>
                    </div>
                  ))}
                  {alerts.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-100 space-y-1">
                      {alerts.map((al: string, i: number) => (
                        <p key={i} className="text-red-500 text-[10px] font-black">⚠ {al}</p>
                      ))}
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          </div>
        )
      })}
    </MapContainer>
  )
}
