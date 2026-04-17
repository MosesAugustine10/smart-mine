"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Layers, Target, Zap, Circle } from "lucide-react"

export interface MapMarker {
  id: string
  lat: number
  lng: number
  type: "drill" | "blast" | "equipment"
  label: string
  status?: string
  data?: Record<string, any>
}

export interface MapZone {
  id: string
  bounds: [[number, number], [number, number]] // [[minLat, minLng], [maxLat, maxLng]]
  type: "drill_block" | "blast_block"
  label: string
  color: string
}

interface MapComponentProps {
  markers?: MapMarker[]
  zones?: MapZone[]
  center?: [number, number]
  zoom?: number
  onZoneSelect?: (zone: MapZone | null) => void
  onMarkerClick?: (marker: MapMarker) => void
  height?: string
}

// Dynamic Leaflet loading — safe for Next.js SSR
let L: any = null

export function MapComponent({
  markers = [],
  zones = [],
  center = [-2.5, 34.0], // Default: Tanzania mining belt
  zoom = 10,
  onZoneSelect,
  onMarkerClick,
  height = "500px"
}: MapComponentProps) {
  const mapRef = useRef<any>(null)
  const mapDivRef = useRef<HTMLDivElement>(null)
  const markersRef = useRef<any[]>([])
  const zonesRef = useRef<any[]>([])
  const [ready, setReady] = useState(false)
  const [selectedZone, setSelectedZone] = useState<MapZone | null>(null)

  useEffect(() => {
    // Dynamically load Leaflet only on client side
    if (typeof window === "undefined") return
    if (mapRef.current) return // Already initialized

    import("leaflet").then((leaflet) => {
      // Fix default icon paths for Next.js
      leaflet.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      })

      if (!mapDivRef.current || mapRef.current) return
      L = leaflet

      const map = leaflet.map(mapDivRef.current, {
        center,
        zoom,
        zoomControl: true,
        attributionControl: true,
      })

      // OpenStreetMap tile layer
      leaflet.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map)

      mapRef.current = map
      setReady(true)
    }).catch(console.error)

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  // Update markers when data changes
  useEffect(() => {
    if (!mapRef.current || !ready) return
    const map = mapRef.current

    // Clear old markers
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []

    markers.forEach(marker => {
      const statusColor = {
        "planned": "#3b82f6",
        "actual": "#10b981",
        "problematic": "#ef4444",
        "loaded": "#f59e0b",
        "fired": "#10b981",
        "misfired": "#ef4444",
      }[marker.status || "planned"] || "#64748b"

      const icon = L?.divIcon({
        html: `<div style="
          width: 12px; height: 12px; 
          border-radius: 50%; 
          background: ${statusColor}; 
          border: 2px solid white; 
          box-shadow: 0 2px 6px rgba(0,0,0,0.4);
          position: relative;
        "></div>`,
        className: "",
        iconSize: [12, 12],
        iconAnchor: [6, 6],
      })

      if (!L) return
      const m = L.marker([marker.lat, marker.lng], { icon })
        .addTo(map)
        .bindPopup(`
          <div style="font-family: monospace; font-size: 11px; min-width: 160px;">
            <strong style="font-size: 12px; display: block; margin-bottom: 6px;">${marker.label}</strong>
            <span style="background: ${statusColor}20; color: ${statusColor}; padding: 2px 8px; border-radius: 100px; font-size: 10px; font-weight: 900; text-transform: uppercase;">${marker.status || "—"}</span>
            ${marker.data ? Object.entries(marker.data).slice(0, 4).map(([k, v]) => `<div style="margin-top: 4px; color: #64748b;"><span style="font-weight: 700;">${k}:</span> ${v}</div>`).join("") : ""}
          </div>
        `)

      m.on("click", () => onMarkerClick?.(marker))
      markersRef.current.push(m)
    })
  }, [markers, ready, onMarkerClick])

  // Update zone rectangles
  useEffect(() => {
    if (!mapRef.current || !ready || !L) return
    const map = mapRef.current

    zonesRef.current.forEach(z => z.remove())
    zonesRef.current = []

    zones.forEach(zone => {
      const rect = L.rectangle(zone.bounds, {
        color: zone.color,
        fillColor: zone.color,
        fillOpacity: 0.15,
        weight: 2,
        dashArray: "6 4",
      })
        .addTo(map)
        .bindTooltip(`<strong>${zone.label}</strong>`, { permanent: false })

      rect.on("click", () => {
        setSelectedZone(prev => {
          const next = prev?.id === zone.id ? null : zone
          onZoneSelect?.(next)
          return next
        })
        rect.setStyle({ fillOpacity: 0.3, weight: 3 })
      })

      zonesRef.current.push(rect)
    })
  }, [zones, ready, onZoneSelect])

  return (
    <div className="relative w-full bg-slate-950 rounded-[2rem] overflow-hidden border border-slate-800" style={{ height }}>
      {/* Leaflet CSS */}
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
        crossOrigin=""
      />

      {/* Map overlay controls */}
      <div className="absolute top-4 left-4 z-[400] flex flex-col gap-2">
        <div className="bg-slate-900/90 backdrop-blur-sm rounded-2xl p-3 border border-slate-700 text-white space-y-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Active Layers</p>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-[10px] font-bold text-slate-300">Drill Collars</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500" />
            <span className="text-[10px] font-bold text-slate-300">Blast Zones</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-[10px] font-bold text-slate-300">Equipment</span>
          </div>
        </div>

        {selectedZone && (
          <div className="bg-amber-500/20 backdrop-blur-sm rounded-2xl p-3 border border-amber-500/40 text-white">
            <p className="text-[9px] font-black uppercase tracking-widest text-amber-400">Zone Selected</p>
            <p className="text-xs font-bold text-white mt-0.5">{selectedZone.label}</p>
            <button
              onClick={() => { setSelectedZone(null); onZoneSelect?.(null) }}
              className="text-[9px] text-amber-400 font-bold uppercase tracking-widest hover:underline mt-1"
            >
              Clear Selection
            </button>
          </div>
        )}
      </div>

      {/* Stats badge */}
      <div className="absolute top-4 right-4 z-[400] flex flex-col gap-2 text-right">
        <div className="bg-slate-900/90 backdrop-blur-sm rounded-2xl px-3 py-2 border border-slate-700 text-white">
          <p className="text-[9px] font-bold text-slate-400 uppercase">Markers</p>
          <p className="text-lg font-black text-white">{markers.length}</p>
        </div>
        <div className="bg-slate-900/90 backdrop-blur-sm rounded-2xl px-3 py-2 border border-slate-700 text-white">
          <p className="text-[9px] font-bold text-slate-400 uppercase">Zones</p>
          <p className="text-lg font-black text-white">{zones.length}</p>
        </div>
      </div>

      {/* Attribution hint */}
      <div className="absolute bottom-4 left-4 z-[400]">
        <span className="bg-slate-900/80 backdrop-blur-sm text-slate-500 text-[9px] font-bold px-2 py-1 rounded-lg uppercase tracking-widest">
          OpenStreetMap · Smart Mine
        </span>
      </div>

      {/* The actual map div */}
      <div ref={mapDivRef} className="w-full h-full" />
    </div>
  )
}
