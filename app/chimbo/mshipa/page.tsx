"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { 
  ChevronLeft, Diamond, Ruler, Box, 
  MapPin, Save, CheckCircle2, Waves, 
  Layers, HardHat, Pickaxe
} from "lucide-react"
import { PhotoUploadField } from "@/components/photo-upload-field"
import { pushChimboNotification } from "@/components/chimbo/chimbo-notifications"

function saveToQueue(tableName: string, data: any) {
  const queue = JSON.parse(localStorage.getItem("chimbo_sync_queue") || "[]")
  const record = { ...data, table_name: tableName, local_id: "local_" + crypto.randomUUID(), sync_status: "PENDING", created_locally_at: new Date().toISOString() }
  queue.push(record)
  localStorage.setItem("chimbo_sync_queue", JSON.stringify(queue))
  const existing = JSON.parse(localStorage.getItem(`chimbo_${tableName}`) || "[]")
  existing.push(record)
  localStorage.setItem(`chimbo_${tableName}`, JSON.stringify(existing))
}

export default function MshipaPage() {
  const router = useRouter()
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({
    bag_no: "",
    depth_start: "",
    depth_end: "",
    rock_type: "",
    core_status: "mzima", // mzima, kakatika, mchanga
    site_photos: [] as string[]
  })

  const vibe = () => { if (typeof navigator !== 'undefined') navigator.vibrate?.(40) }

  const handleSave = () => {
    if (!form.bag_no || !form.depth_end) return
    vibe()
    saveToQueue("mshipa", form)
    pushChimboNotification({
      type: "production",
      title: "Taarifa Mpya – MSHIPA",
      body: "Data imehifadhiwa kwenye mfumo.",
      urgent: false,
    })
    
    setSaved(true)
    setTimeout(() => router.push("/chimbo/dashboard"), 2000)
  }

  if (saved) return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center gap-6 p-8 transition-colors duration-500">
      <div className="w-24 h-24 rounded-full bg-indigo-500/20 flex items-center justify-center animate-pulse">
        <Diamond className="w-12 h-12 text-indigo-500" />
      </div>
      <div className="text-center space-y-2">
        <p className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">💎 MSHIPA UMEREKODIWA!</p>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest italic tracking-tighter">Taarifa ya mlingoti imehifadhiwa.</p>
      </div>
    </div>
  )

  const coreStatusOptions = [
    { id: "mzima", label: "Mzima", desc: "Full Core", col: "bg-emerald-500" },
    { id: "kakatika", label: "Kakatika", desc: "Broken", col: "bg-amber-500" },
    { id: "mchanga", label: "Mchanga", desc: "Sand/Fines", col: "bg-indigo-500" }
  ]

  return (
    <div className="p-4 space-y-6 pb-20 bg-slate-50 dark:bg-slate-950 transition-colors duration-500 min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-3 pt-2">
        <button onClick={() => router.back()} className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-900 dark:text-white shadow-sm">
            <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">Kutafuta Mshipa</h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest italic">Diamond Drilling Logic</p>
        </div>
      </div>

      <div className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-3xl border border-slate-200 dark:border-white/5 rounded-[2.5rem] p-8 space-y-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -translate-y-16 translate-x-16" />

        <div className="space-y-6">
            {/* Bag No */}
            <div className="space-y-3">
                <label className="block text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.3em] px-2">Namba ya Mfuko (Core Bag) *</label>
                <div className="relative">
                    <Box className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-600 dark:text-indigo-500 opacity-50" />
                    <input value={form.bag_no} onChange={e => setForm({...form, bag_no: e.target.value})}
                        placeholder="Na: 001"
                        className="w-full h-18 pl-16 pr-6 rounded-[2.5rem] bg-slate-100/50 dark:bg-slate-850 border-2 border-slate-200 dark:border-slate-800 focus:border-indigo-500 text-slate-900 dark:text-white font-black text-2xl placeholder:text-slate-400 outline-none transition-all shadow-inner" />
                </div>
            </div>

            {/* Depths */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Kina Anzia (m)</label>
                    <div className="relative">
                        <Ruler className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 font-bold" />
                        <input type="number" value={form.depth_start} onChange={e => setForm({...form, depth_start: e.target.value})}
                            placeholder="0" className="w-full h-18 pl-12 pr-4 rounded-[2.5rem] bg-slate-100/30 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-black text-2xl outline-none shadow-inner" />
                    </div>
                </div>
                <div className="space-y-3">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Kina Mwisho (m)</label>
                    <div className="relative">
                        <Waves className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 font-bold" />
                        <input type="number" value={form.depth_end} onChange={e => setForm({...form, depth_end: e.target.value})}
                            placeholder="1.5" className="w-full h-18 pl-12 pr-4 rounded-[2.5rem] bg-slate-100/30 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-black text-2xl outline-none focus:border-indigo-500 shadow-inner" />
                    </div>
                </div>
            </div>

            <div className="h-px bg-slate-200 dark:bg-white/5" />

            {/* Rock Type */}
            <div className="space-y-3">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Aina ya Mwamba (Lithology)</label>
                <div className="relative">
                    <Layers className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input value={form.rock_type} onChange={e => setForm({...form, rock_type: e.target.value})}
                        placeholder="Mfano: Boxite (Mekundu)"
                        className="w-full h-14 pl-12 pr-4 rounded-[2.5rem] bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-bold outline-none shadow-inner" />
                </div>
            </div>

            {/* Core Status */}
            <div className="space-y-3">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Hali ya Mche (Core Recovery)</label>
                <div className="grid grid-cols-3 gap-2">
                    {coreStatusOptions.map(o => (
                        <button key={o.id} onClick={() => { vibe(); setForm({...form, core_status: o.id}) }}
                            className={`h-22 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all border-2 ${form.core_status === o.id ? `${o.col} text-slate-950 border-white/20 scale-95 shadow-xl` : "bg-slate-50 dark:bg-slate-950 text-slate-500 border-slate-200 dark:border-slate-800"}`}>
                            <span className="text-[10px] font-black uppercase tracking-widest leading-none">{o.label}</span>
                            <span className="text-[8px] opacity-60 font-bold uppercase">{o.desc}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Photo Upload (Optional) */}
            <div className="pt-2">
                <div className="bg-slate-100/50 dark:bg-slate-900/30 p-4 rounded-[2rem] border border-slate-200 dark:border-white/5">
                    <PhotoUploadField 
                        onPhotosChange={(urls) => setForm({...form, site_photos: urls})} 
                        label="Picha ya Mche / Visual Evidence"
                        maxPhotos={3}
                    />
                </div>
            </div>

            <button onClick={handleSave} disabled={!form.bag_no || !form.depth_end}
                className="w-full h-20 rounded-[2.5rem] bg-indigo-600 hover:bg-indigo-500 disabled:from-slate-200 disabled:to-slate-100 dark:disabled:from-slate-800 dark:disabled:to-slate-800 disabled:opacity-40 text-white font-black text-xl uppercase tracking-widest shadow-2xl shadow-indigo-600/30 active:scale-95 transition-all flex items-center justify-center gap-3">
                <Save className="w-6 h-6" />
                HIFADHI REKODI YA MSHIPA
            </button>
        </div>
      </div>
    </div>
  )
}
