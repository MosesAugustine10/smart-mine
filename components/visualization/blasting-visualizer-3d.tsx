"use client"

import { useRef, useState, useMemo } from "react"
import { Canvas, useFrame, ThreeEvent } from "@react-three/fiber"
import { OrbitControls, Html, Grid, Environment, Text } from "@react-three/drei"
import * as THREE from "three"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bomb, AlertTriangle, CheckCircle2, Info, Zap } from "lucide-react"

export interface BlastHole {
  id: string
  blast_number?: string
  row: number          // row in blast pattern
  col: number          // column in blast pattern
  burden_m: number     // B - burden (distance to free face)
  spacing_m: number    // S - spacing between holes
  depth_m: number      // total hole depth
  stemming_m: number   // inert stemming length at top
  charging_m: number   // explosive column length
  explosive_kg: number // mass of explosive
  powder_factor?: number // kg/t or kg/m³
  status: "loaded" | "fired" | "misfired" | "planned"
  delay_ms?: number    // initiation delay
  vibration_mms?: number
  unsafe?: boolean
}

const STATUS_COLORS: Record<BlastHole["status"], string> = {
  planned: "#3b82f6",
  loaded: "#f59e0b",
  fired: "#10b981",
  misfired: "#ef4444",
}

function BlastHoleMesh({ hole, onSelect, selected, maxExplosive }: {
  hole: BlastHole
  onSelect: (h: BlastHole | null) => void
  selected: boolean
  maxExplosive: number
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)

  const x = hole.col * hole.spacing_m
  const z = hole.row * hole.burden_m
  const totalDepth = hole.depth_m
  const chargingLen = Math.min(hole.charging_m, totalDepth)
  const stemmingLen = Math.min(hole.stemming_m, totalDepth - chargingLen)
  const radius = 0.3

  // Powder factor intensity for color glow
  const intensity = maxExplosive > 0 ? hole.explosive_kg / maxExplosive : 0

  useFrame(() => {
    if (meshRef.current && (hovered || selected)) {
      meshRef.current.scale.setScalar(hovered ? 1.2 : 1)
    } else if (meshRef.current) {
      meshRef.current.scale.setScalar(1)
    }
  })

  const color = hole.unsafe ? "#ef4444" : STATUS_COLORS[hole.status]

  return (
    <group position={[x, 0, z]}>
      {/* Stemming (inert zone — grey) */}
      <mesh position={[0, -stemmingLen / 2, 0]}>
        <cylinderGeometry args={[radius, radius, stemmingLen, 12]} />
        <meshStandardMaterial color="#94a3b8" opacity={0.5} transparent roughness={1} />
      </mesh>

      {/* Explosive column (colored) */}
      <mesh
        ref={meshRef}
        position={[0, -stemmingLen - chargingLen / 2, 0]}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true) }}
        onPointerOut={() => setHovered(false)}
        onClick={(e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); onSelect(selected ? null : hole) }}
        castShadow
      >
        <cylinderGeometry args={[radius, radius, chargingLen, 12]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.1 + intensity * 0.5}
          roughness={0.3}
          metalness={0.1}
        />
      </mesh>

      {/* Collar detonator cap */}
      <mesh position={[0, 0.5, 0]}>
        <sphereGeometry args={[0.4, 8, 8]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} />
      </mesh>

      {/* Unsafe zone glow */}
      {hole.unsafe && (
        <mesh position={[0, -totalDepth / 2, 0]}>
          <cylinderGeometry args={[hole.spacing_m / 2, hole.burden_m / 2, 0.1, 16]} />
          <meshStandardMaterial color="#ef4444" opacity={0.15} transparent />
        </mesh>
      )}

      {/* Hover tooltip */}
      {hovered && (
        <Html distanceFactor={25} position={[0, 2, 0]} center>
          <div className="bg-slate-900 text-white text-[10px] px-2 py-1 rounded-xl shadow-xl font-bold whitespace-nowrap border border-slate-700">
            Row {hole.row + 1}-{hole.col + 1} · {hole.explosive_kg.toFixed(0)}kg · {hole.status.toUpperCase()}
          </div>
        </Html>
      )}
    </group>
  )
}

function BlastScene({ holes, onSelect, selected }: {
  holes: BlastHole[]
  onSelect: (h: BlastHole | null) => void
  selected: BlastHole | null
}) {
  const maxExplosive = useMemo(() => Math.max(...holes.map(h => h.explosive_kg), 1), [holes])

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[30, 80, 30]} intensity={1.2} castShadow />
      <pointLight position={[0, 20, 0]} color="#f59e0b" intensity={0.8} />
      <Environment preset="night" />

      {/* Rock face/bench surface */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0.01, 0]}>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#1e293b" roughness={0.9} />
      </mesh>

      <Grid
        args={[150, 150]}
        cellSize={holes[0]?.spacing_m || 3}
        cellThickness={0.5}
        cellColor="#334155"
        sectionSize={holes[0]?.burden_m || 3}
        sectionColor="#475569"
        fadeDistance={120}
        position={[0, 0.05, 0]}
      />

      {holes.map((hole) => (
        <BlastHoleMesh
          key={hole.id}
          hole={hole}
          onSelect={onSelect}
          selected={selected?.id === hole.id}
          maxExplosive={maxExplosive}
        />
      ))}

      <OrbitControls makeDefault enableDamping dampingFactor={0.05} minDistance={5} maxDistance={250} />
    </>
  )
}

export function BlastingVisualizer3D({ holes }: { holes: BlastHole[] }) {
  const [selected, setSelected] = useState<BlastHole | null>(null)

  const stats = useMemo(() => {
    if (holes.length === 0) return null
    const totalExplosive = holes.reduce((s, h) => s + (h.explosive_kg || 0), 0)
    // Volume using burden × spacing × depth
    const totalVolume = holes.reduce((s, h) => s + (h.burden_m * h.spacing_m * h.depth_m), 0)
    const density = 2.65 // t/m³ typical rock
    const tonnage = totalVolume * density
    const avgPf = tonnage > 0 ? totalExplosive / tonnage : 0
    const unsafe = holes.filter(h => h.unsafe).length
    const misfired = holes.filter(h => h.status === "misfired").length
    return { totalExplosive, totalVolume, tonnage, avgPf, unsafe, misfired, count: holes.length }
  }, [holes])

  if (holes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px] bg-slate-950 rounded-[2rem] border border-slate-800">
        <div className="text-center space-y-3">
          <Bomb className="w-16 h-16 text-slate-600 mx-auto" />
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No Blast Pattern Loaded</p>
          <p className="text-slate-600 text-[10px]">Submit a blasting operation to populate the 3D blast visualizer</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* KPI Strip */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {[
            { label: "Holes", value: stats.count, color: "text-amber-400" },
            { label: "Explosive (kg)", value: stats.totalExplosive.toFixed(0), color: "text-orange-400" },
            { label: "Blast Volume (m³)", value: stats.totalVolume.toFixed(0), color: "text-blue-400" },
            { label: "Tonnage (t)", value: stats.tonnage.toFixed(0), color: "text-purple-400" },
            { label: "Avg. Powder Factor", value: `${stats.avgPf.toFixed(3)} kg/t`, color: "text-emerald-400" },
            { label: "Unsafe Zones", value: stats.unsafe, color: stats.unsafe > 0 ? "text-red-400" : "text-slate-400" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-slate-800 rounded-2xl p-3 text-center">
              <div className={`text-xl font-black ${color}`}>{value}</div>
              <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 3D Canvas */}
        <div className="lg:col-span-2 relative bg-slate-950 rounded-[2rem] overflow-hidden border border-slate-800" style={{ height: "520px" }}>
          <div className="absolute top-4 left-4 z-10 flex gap-2 flex-wrap">
            <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest">● Planned</span>
            <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest">● Loaded</span>
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest">● Fired</span>
            <span className="bg-red-500/20 text-red-300 border border-red-500/30 px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest">● Misfire / Unsafe</span>
          </div>
          <div className="absolute top-4 right-4 z-10 text-[9px] text-slate-500 font-bold uppercase">Grey = Stemming · Color = Explosive Column</div>
          <Canvas camera={{ position: [20, 30, 20], fov: 60, near: 0.1, far: 1000 }} shadows gl={{ antialias: true }}>
            <BlastScene holes={holes} onSelect={setSelected} selected={selected} />
          </Canvas>
        </div>

        {/* Detail + Legend */}
        <div className="space-y-4">
          {selected ? (
            <Card className="border-0 bg-slate-900 text-white rounded-[2rem] overflow-hidden">
              <CardHeader className="bg-white/5 border-b border-white/10 p-5">
                <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                  <Info className="w-4 h-4 text-amber-400" />
                  Blast Hole R{selected.row + 1}-C{selected.col + 1}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-2">
                {[
                  { label: "Status", value: selected.status.toUpperCase() },
                  { label: "Depth", value: `${selected.depth_m.toFixed(1)} m` },
                  { label: "Burden (B)", value: `${selected.burden_m.toFixed(1)} m` },
                  { label: "Spacing (S)", value: `${selected.spacing_m.toFixed(1)} m` },
                  { label: "Explosive Load", value: `${selected.explosive_kg.toFixed(1)} kg` },
                  { label: "Stemming Length", value: `${selected.stemming_m.toFixed(1)} m` },
                  { label: "Charge Column", value: `${selected.charging_m.toFixed(1)} m` },
                  { label: "Powder Factor", value: selected.powder_factor ? `${selected.powder_factor.toFixed(3)} kg/t` : "—" },
                  { label: "Delay", value: selected.delay_ms != null ? `${selected.delay_ms} ms` : "—" },
                  { label: "Vibration", value: selected.vibration_mms != null ? `${selected.vibration_mms.toFixed(2)} mm/s` : "—" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-[10px] text-slate-500 uppercase font-bold">{label}</span>
                    <span className="text-xs font-bold text-white">{value}</span>
                  </div>
                ))}
                {selected.unsafe && (
                  <div className="mt-3 flex items-center gap-2 p-2 bg-red-500/10 rounded-xl border border-red-500/20">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                    <span className="text-[10px] font-bold text-red-400 uppercase">Unsafe / Non-compliant Zone</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="bg-slate-900 rounded-[2rem] p-6 text-center border border-slate-800">
              <Zap className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Click a blast hole</p>
              <p className="text-slate-600 text-[10px] mt-1">Inspect explosive load, delay, and compliance data</p>
            </div>
          )}

          <Card className="border-0 bg-slate-900 text-white rounded-[2rem]">
            <CardContent className="p-5 space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Zone View Guide</p>
              <p className="text-[10px] text-slate-400 font-bold">🔵 <span className="text-slate-300">Blue section</span> = Stemming (inert)</p>
              <p className="text-[10px] text-slate-400 font-bold">🟡 <span className="text-slate-300">Warm glow</span> = High explosive concentration</p>
              <p className="text-[10px] text-slate-400 font-bold">🔴 <span className="text-slate-300">Red halo</span> = Unsafe burden/spacing ratio</p>
              <p className="text-[10px] text-slate-400 font-bold">⚫ <span className="text-slate-300">Sphere at top</span> = Detonator collar marker</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
