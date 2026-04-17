"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Map as MapIcon, Navigation, MapPin, Pickaxe, ShieldAlert, Zap, ChevronLeft, LocateFixed, Layers } from "lucide-react"

export default function RamaniYaShamba() {
  const router = useRouter()
  const [loc, setLoc] = useState({ lat: -5.123, lng: 34.567 })
  const [pins, setPins] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const handleCapture = () => {
    setLoading(true)
    // Simulate GPS capture
    setTimeout(() => {
        setLoading(false)
        setPins([...pins, { type: "shimo", lat: loc.lat, lng: loc.lng, title: "Shimo Jipya" }])
        alert("GPS Imechukuliwa! (-5.123, 34.567)")
    }, 1200)
  }

  return (
    <div className="p-0 flex flex-col h-screen bg-slate-950 pb-20">
      {/* Header (Floating) */}
      <div className="absolute top-4 left-4 right-4 z-40 bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-4 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center">
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-xl font-black text-white uppercase tracking-tighter">RAMANI</h1>
            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Shamba Lako (GPS)</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-slate-800 text-slate-400`}>
                <Layers className="w-4 h-4" />
            </div>
        </div>
      </div>

      {/* Map (Mock Satellite) */}
      <div className="flex-1 relative bg-slate-900 overflow-hidden">
        {/* Placeholder for real map */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&q=80&w=2000')] bg-cover bg-center opacity-60 grayscale-[0.5] contrast-[1.2]">
            <div className="absolute inset-0 bg-blue-900/10 mix-blend-overlay" />
        </div>
        
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none" />

        {/* Pins */}
        {pins.map((p, i) => {
            const colors: Record<string, string> = { shimo: "text-emerald-500", safety: "text-red-500", blast: "text-amber-500" }
            const Icons: Record<string, any> = { shimo: Pickaxe, safety: ShieldAlert, blast: Zap }
            const Icon = Icons[p.type] || MapPin
            
            // Randomly offset for demo
            const top = 40 + (i * 15) % 40
            const left = 30 + (i * 20) % 50
            
            return (
                <div key={i} className="absolute flex flex-col items-center" style={{ top: `${top}%`, left: `${left}%` }}>
                    <div className={`p-2 rounded-xl bg-slate-900 border-2 border-slate-700 shadow-2xl transition-all hover:scale-110 active:scale-90`}>
                        <Icon className={`w-6 h-6 ${colors[p.type]}`} />
                    </div>
                    <div className="bg-slate-900 border border-slate-800 px-2 py-1 rounded-full mt-1">
                        <p className="text-[8px] font-black text-white uppercase whitespace-nowrap">{p.title}</p>
                    </div>
                </div>
            )
        })}

        {/* Current Location */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center animate-pulse">
                <div className="w-6 h-6 rounded-full bg-blue-500 border-4 border-white shadow-2xl" />
            </div>
            <p className="text-[10px] font-black text-blue-400 bg-slate-950/80 px-2 py-1 rounded-full mt-2 uppercase">Upo Hapa</p>
        </div>
      </div>

      {/* Floating Action Button */}
      <div className="absolute bottom-24 left-6 right-6 z-40 space-y-3">
          <button onClick={() => {}} className="w-14 h-14 bg-slate-900 rounded-[2.5rem] flex items-center justify-center ml-auto border-2 border-slate-800 shadow-2xl active:scale-95 transition-all text-white">
            <LocateFixed className="w-6 h-6" />
          </button>
          
          <button 
                onClick={handleCapture} disabled={loading}
                className="w-full h-16 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black text-lg uppercase tracking-widest rounded-[2.5rem] shadow-2xl shadow-emerald-500/30 transition-all active:scale-95 flex items-center justify-center gap-4"
          >
                {loading ? "Inakamata..." : <><Navigation className="w-6 h-6" /> WEKA ALAMA YA SHIMO HAPA</>}
          </button>
      </div>

      {/* Stats overlay */}
      <div className="absolute bottom-4 left-6 z-40">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Lat: {loc.lat} | Lng: {loc.lng}</p>
      </div>
    </div>
  )
}
