"use client"

import { useRef, useState, useMemo } from "react"
import { Canvas, useFrame, ThreeEvent } from "@react-three/fiber"
import { OrbitControls, Html, Grid, Environment, Text } from "@react-three/drei"
import * as THREE from "three"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Drill, Target, AlertTriangle, CheckCircle2, Info } from "lucide-react"

export interface DrillHole {
  id: string
  hole_id?: string
  x: number
  y: number
  z: number
  depth: number
  diameter?: number
  inclination?: number // degrees from horizontal (90 = vertical)
  azimuth?: number    // degrees clockwise from north
  status: "planned" | "actual" | "problematic"
  deviation_m?: number
  cost_tzs?: number
  penetration_rate?: number
  rock_type?: string
}

const STATUS_COLORS: Record<DrillHole["status"], string> = {
  planned: "#3b82f6",     // blue
  actual: "#10b981",      // green
  problematic: "#ef4444", // red
}

const STATUS_EMISSIVE: Record<DrillHole["status"], string> = {
  planned: "#1d4ed8",
  actual: "#065f46",
  problematic: "#991b1b",
}

function DrillHoleMesh({ hole, onSelect, selected }: {
  hole: DrillHole
  onSelect: (h: DrillHole | null) => void
  selected: boolean
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)
  const depth = hole.depth || 10
  const radius = (hole.diameter || 76) / 1000 / 2 * 5 // scale up for visibility

  // Convert inclination/azimuth to rotation
  const inclRad = THREE.MathUtils.degToRad(90 - (hole.inclination ?? 90))
  const azimRad = THREE.MathUtils.degToRad(hole.azimuth ?? 0)

  const rotation = useMemo(() => {
    const euler = new THREE.Euler(inclRad, azimRad, 0, "YXZ")
    return euler
  }, [inclRad, azimRad])

  useFrame(() => {
    if (meshRef.current) {
      const scale = hovered || selected ? 1.15 : 1
      meshRef.current.scale.setScalar(scale)
    }
  })

  const color = STATUS_COLORS[hole.status]
  const emissive = selected ? STATUS_EMISSIVE[hole.status] : "#000000"

  return (
    <group position={[hole.x, hole.z ?? 0, hole.y]}>
      <mesh
        ref={meshRef}
        rotation={rotation}
        position={[0, -depth / 2, 0]}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true) }}
        onPointerOut={() => setHovered(false)}
        onClick={(e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); onSelect(selected ? null : hole) }}
        castShadow
      >
        <cylinderGeometry args={[radius, radius, depth, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={emissive}
          emissiveIntensity={selected ? 0.4 : 0}
          transparent
          opacity={hole.status === "planned" ? 0.6 : 1}
          roughness={0.4}
          metalness={0.2}
        />
      </mesh>

      {/* Collar marker at surface */}
      <mesh position={[0, 0.3, 0]}>
        <sphereGeometry args={[radius * 1.5, 8, 8]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} />
      </mesh>

      {/* Label */}
      {hovered && (
        <Html distanceFactor={30} position={[0, 2, 0]} center>
          <div className="bg-slate-900 text-white text-[10px] px-2 py-1 rounded-xl shadow-xl font-bold whitespace-nowrap border border-slate-700">
            {hole.hole_id || hole.id} · {depth.toFixed(1)}m · {hole.status.toUpperCase()}
          </div>
        </Html>
      )}
    </group>
  )
}

function Scene({ holes, onSelect, selected }: {
  holes: DrillHole[]
  onSelect: (h: DrillHole | null) => void
  selected: DrillHole | null
}) {
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[50, 100, 50]} intensity={1} castShadow />
      <pointLight position={[-50, 50, -50]} intensity={0.5} color="#60a5fa" />
      <Environment preset="city" />

      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#1e293b" opacity={0.7} transparent roughness={1} />
      </mesh>

      <Grid
        args={[200, 200]}
        cellSize={5}
        cellThickness={0.5}
        cellColor="#334155"
        sectionSize={20}
        sectionThickness={1}
        sectionColor="#475569"
        fadeDistance={150}
        position={[0, 0.05, 0]}
      />

      {holes.map((hole) => (
        <DrillHoleMesh
          key={hole.id}
          hole={hole}
          onSelect={onSelect}
          selected={selected?.id === hole.id}
        />
      ))}

      <OrbitControls
        makeDefault
        minDistance={10}
        maxDistance={300}
        enableDamping
        dampingFactor={0.05}
      />
    </>
  )
}

export function DrillingVisualizer3D({ holes }: { holes: DrillHole[] }) {
  const [selected, setSelected] = useState<DrillHole | null>(null)

  const stats = useMemo(() => {
    const planned = holes.filter(h => h.status === "planned").length
    const actual = holes.filter(h => h.status === "actual").length
    const problematic = holes.filter(h => h.status === "problematic").length
    const totalMeters = holes.reduce((s, h) => s + (h.depth || 0), 0)
    const totalCost = holes.reduce((s, h) => s + (h.cost_tzs || 0), 0)
    const avgDeviation = holes.filter(h => h.deviation_m != null)
      .reduce((s, h, _, arr) => s + (h.deviation_m || 0) / arr.length, 0)
    return { planned, actual, problematic, totalMeters, totalCost, avgDeviation }
  }, [holes])

  if (holes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px] bg-slate-950 rounded-[2rem] border border-slate-800">
        <div className="text-center space-y-3">
          <Drill className="w-16 h-16 text-slate-600 mx-auto" />
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No Drill Holes Available</p>
          <p className="text-slate-600 text-[10px]">Add GPS-enabled drilling operations to populate the 3D view</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-slate-800 rounded-2xl p-3 text-center">
          <div className="text-2xl font-black text-blue-400">{stats.planned}</div>
          <div className="text-[10px] font-bold text-blue-300 uppercase tracking-widest">Planned</div>
        </div>
        <div className="bg-slate-800 rounded-2xl p-3 text-center">
          <div className="text-2xl font-black text-emerald-400">{stats.actual}</div>
          <div className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest">Drilled</div>
        </div>
        <div className="bg-slate-800 rounded-2xl p-3 text-center">
          <div className="text-2xl font-black text-red-400">{stats.problematic}</div>
          <div className="text-[10px] font-bold text-red-300 uppercase tracking-widest">Anomalies</div>
        </div>
        <div className="bg-slate-800 rounded-2xl p-3 text-center">
          <div className="text-2xl font-black text-white">{stats.totalMeters.toFixed(0)}</div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Meters</div>
        </div>
        <div className="bg-slate-800 rounded-2xl p-3 text-center">
          <div className="text-lg font-black text-amber-400">TZS {(stats.totalCost / 1e6).toFixed(1)}M</div>
          <div className="text-[10px] font-bold text-amber-300 uppercase tracking-widest">Drill Cost</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 3D Canvas */}
        <div className="lg:col-span-2 relative bg-slate-950 rounded-[2rem] overflow-hidden border border-slate-800" style={{ height: "520px" }}>
          <div className="absolute top-4 left-4 z-10 flex gap-2">
            <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest">● Planned</span>
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest">● Actual</span>
            <span className="bg-red-500/20 text-red-300 border border-red-500/30 px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest">● Anomaly</span>
          </div>
          <div className="absolute top-4 right-4 z-10 text-[9px] text-slate-500 font-bold uppercase">Drag to orbit • Scroll to zoom</div>
          <Canvas
            camera={{ position: [30, 40, 30], fov: 60, near: 0.1, far: 1000 }}
            shadows
            gl={{ antialias: true }}
          >
            <Scene holes={holes} onSelect={setSelected} selected={selected} />
          </Canvas>
        </div>

        {/* Detail Panel */}
        <div className="space-y-4">
          {selected ? (
            <Card className="border-0 bg-slate-900 text-white rounded-[2rem] overflow-hidden">
              <CardHeader className="bg-white/5 border-b border-white/10 p-5">
                <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                  <Info className="w-4 h-4 text-amber-400" />
                  Hole Detail: {selected.hole_id || selected.id}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-3">
                <DetailRow label="Status" value={selected.status.toUpperCase()} accent={STATUS_COLORS[selected.status]} />
                <DetailRow label="Depth" value={`${selected.depth.toFixed(1)} m`} />
                <DetailRow label="Diameter" value={`${selected.diameter ?? 76} mm`} />
                <DetailRow label="Inclination" value={`${selected.inclination ?? 90}°`} />
                <DetailRow label="Azimuth" value={`${selected.azimuth ?? 0}°`} />
                {selected.deviation_m != null && (
                  <DetailRow label="Deviation" value={`${selected.deviation_m.toFixed(2)} m`} accent={selected.deviation_m > 0.5 ? "#ef4444" : "#10b981"} />
                )}
                {selected.penetration_rate != null && (
                  <DetailRow label="Avg ROP" value={`${selected.penetration_rate.toFixed(2)} m/hr`} />
                )}
                {selected.rock_type && (
                  <DetailRow label="Lithology" value={selected.rock_type} />
                )}
                {selected.cost_tzs != null && (
                  <DetailRow label="Drill Cost" value={`TZS ${selected.cost_tzs.toLocaleString()}`} />
                )}
                <DetailRow label="Coordinates" value={`X:${selected.x} Y:${selected.y} Z:${selected.z}`} />
              </CardContent>
            </Card>
          ) : (
            <div className="bg-slate-900 rounded-[2rem] p-6 text-center border border-slate-800">
              <Target className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Click a drill hole</p>
              <p className="text-slate-600 text-[10px] mt-1">Select any hole in the 3D view to inspect its data</p>
            </div>
          )}

          {/* Legend */}
          <Card className="border-0 bg-slate-900 text-white rounded-[2rem] overflow-hidden">
            <CardContent className="p-5 space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Engineering Legend</p>
              {[
                { color: "#3b82f6", label: "Planned Holes", icon: Target },
                { color: "#10b981", label: "Executed Holes", icon: CheckCircle2 },
                { color: "#ef4444", label: "Deviating / Anomalous", icon: AlertTriangle },
              ].map(({ color, label, icon: Icon }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
                  <Icon className="w-3.5 h-3.5 shrink-0" style={{ color }} />
                  <span className="text-[10px] font-bold text-slate-300">{label}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function DetailRow({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="flex justify-between items-center py-1.5 border-b border-white/5">
      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</span>
      <span className="text-xs font-bold" style={{ color: accent || "white" }}>{value}</span>
    </div>
  )
}
