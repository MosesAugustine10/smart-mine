"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { PhotoUploadField } from "@/components/photo-upload-field"
import { 
  ChevronLeft, Zap, Bomb, MapPin, 
  Save, CheckCircle2, AlertOctagon, 
  Flame, Sliders
} from "lucide-react"
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

export default function KulipuaPage() {
  const router = useRouter()
  const [saved, setSaved] = useState(false)
  const [photos, setPhotos] = useState<string[]>([])
  const [form, setForm] = useState({
    area: "",
    hole_count: "",
    explosive_type: "watergel",
    result: "nzuri" // nzuri, nusu, imetosa
  })

  const vibe = () => { if (typeof navigator !== 'undefined') navigator.vibrate?.(60) }

  const handleSave = () => {
    if (!form.area || !form.hole_count) return
    vibe()
    saveToQueue("blasting", { ...form, photos })
    pushChimboNotification({
      type: "alert",
      title: "Taarifa Mpya – KULIPUA",
      body: "Data imehifadhiwa kwenye mfumo.",
      urgent: true,
    })
    
    setSaved(true)
    setTimeout(() => router.push("/chimbo/dashboard"), 2000)
  }

  if (saved) return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center gap-6 p-8 transition-colors duration-500">
      <div className="w-24 h-24 rounded-full bg-red-600/20 flex items-center justify-center animate-ping">
        <Bomb className="w-12 h-12 text-red-600" />
      </div>
      <div className="text-center space-y-2">
        <p className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">💥 KULIPUA KUREKODIWA!</p>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest italic tracking-tighter">Rekodi ya baruti imewekwa kwenye mfumo.</p>
      </div>
    </div>
  )

  return (
    <div className="p-4 space-y-6 pb-20 bg-slate-50 dark:bg-slate-950 transition-colors duration-500 min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-3 pt-2">
        <button onClick={() => router.back()} className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-900 dark:text-white shadow-sm">
            <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
            <h1 className="text-2xl font-black text-red-600 tracking-tighter uppercase italic">KULIPUA (BLASTING)</h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest italic">Usimamizi wa Baruti</p>
        </div>
      </div>

      <div className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-3xl border border-slate-200 dark:border-white/5 rounded-[2.5rem] p-8 space-y-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/5 rounded-full blur-3xl -translate-y-16 translate-x-16" />

        <div className="space-y-6">
            {/* Area */}
            <div className="space-y-3">
                <label className="block text-[10px] font-black text-red-600 uppercase tracking-[0.3em] px-2">Eneo la Kulipua *</label>
                <div className="relative">
                    <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-red-600 opacity-50" />
                    <input value={form.area} onChange={e => setForm({...form, area: e.target.value})}
                        placeholder="Mfano: Shimo la Babu (Level 2)"
                        className="w-full h-18 pl-16 pr-6 rounded-[2.5rem] bg-slate-100/50 dark:bg-slate-850 border-2 border-slate-200 dark:border-slate-800 focus:border-red-600 text-slate-900 dark:text-white font-bold outline-none transition-all shadow-inner" />
                </div>
            </div>

            {/* Hole Count */}
            <div className="space-y-3">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Idadi ya Matundu (Holes) *</label>
                <div className="relative">
                    <Sliders className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-600 dark:text-amber-500 opacity-50" />
                    <input type="number" value={form.hole_count} onChange={e => setForm({...form, hole_count: e.target.value})}
                        placeholder="0"
                        className="w-full h-18 pl-16 pr-6 rounded-[2.5rem] bg-slate-100/50 dark:bg-slate-850 border-2 border-slate-200 dark:border-slate-800 focus:border-amber-500 text-slate-900 dark:text-white font-black text-3xl outline-none shadow-inner" />
                </div>
            </div>

            {/* Explosive Type */}
            <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Aina ya Baruti</label>
                <select value={form.explosive_type} onChange={e => setForm({...form, explosive_type: e.target.value})}
                    className="w-full h-14 px-6 rounded-[2.5rem] bg-slate-100/50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-black text-[10px] uppercase outline-none shadow-inner">
                    <option value="watergel">Watergel (Emulite)</option>
                    <option value="dynamite">Dynamite (Vijiti)</option>
                    <option value="anfo">ANFO (Chumvi)</option>
                </select>
            </div>

            {/* Result */}
            <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-white/5">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Matokeo ya Lipu (Result)</label>
                <div className="grid grid-cols-3 gap-2">
                    {[
                        { id: "nzuri", label: "Imetikisa", desc: "Good Blast", col: "bg-emerald-500" },
                        { id: "nusu", label: "Nusu", desc: "Partial", col: "bg-amber-500" },
                        { id: "imetosa", label: "Imetosa", desc: "Misfire!", col: "bg-red-600" }
                    ].map(r => (
                        <button key={r.id} onClick={() => { vibe(); setForm({...form, result: r.id}) }}
                            className={`h-24 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all border-2 ${form.result === r.id ? `${r.col} text-slate-950 border-white/20 scale-95 shadow-xl` : "bg-slate-50 dark:bg-slate-950 text-slate-500 border-slate-200 dark:border-slate-800"}`}>
                            <span className="text-[10px] font-black uppercase tracking-widest leading-none">{r.label}</span>
                            <span className="text-[8px] opacity-60 font-bold uppercase">{r.desc}</span>
                        </button>
                    ))}
                </div>
            </div>

                       {/* Photos Upload */}
          <div className="space-y-4 pb-4">
            <label className="block text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] pl-4">Picha / Vielelezo (Hiari)</label>
            <div className="bg-slate-100/50 dark:bg-slate-900/30 p-4 rounded-[2rem] border border-slate-200 dark:border-white/5">
              <PhotoUploadField photos={photos} setPhotos={setPhotos} />
            </div>
          </div>
          <button onClick={handleSave} disabled={!form.area || !form.hole_count}
                className="w-full h-20 rounded-[2.5rem] bg-red-600 hover:bg-red-500 disabled:from-slate-200 disabled:to-slate-100 dark:disabled:from-slate-800 dark:disabled:to-slate-800 disabled:opacity-40 text-white font-black text-xl uppercase tracking-widest shadow-2xl shadow-red-600/30 active:scale-95 transition-all flex items-center justify-center gap-3">
                <Save className="w-6 h-6" />
                HIFADHI REKODI YA LIPU
            </button>
        </div>
      </div>
    </div>
  )
}
