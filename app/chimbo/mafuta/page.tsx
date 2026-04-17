"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { PhotoUploadField } from "@/components/photo-upload-field"
import { 
  ChevronLeft, Fuel, Droplet, MapPin, 
  Save, CheckCircle2, FlaskConical,
  Zap, Settings2
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

export default function MafutaPage() {
  const router = useRouter()
  const [saved, setSaved] = useState(false)
  const [photos, setPhotos] = useState<string[]>([])
  const [form, setForm] = useState({
    usage_area: "shimo",
    liters: "",
    fuel_type: "dizeli",
    remarks: ""
  })

  const vibe = () => { if (typeof navigator !== 'undefined') navigator.vibrate?.(40) }

  const handleSave = () => {
    if (!form.liters) return
    vibe()
    saveToQueue("fuel", { ...form, photos })
    pushChimboNotification({
      type: "fuel",
      title: "Taarifa Mpya – MAFUTA",
      body: "Data imehifadhiwa kwenye mfumo.",
      urgent: false,
    })
    
    setSaved(true)
    setTimeout(() => router.push("/chimbo/dashboard"), 2000)
  }

  if (saved) return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center gap-6 p-8 transition-colors duration-500">
      <div className="w-24 h-24 rounded-full bg-blue-500/20 flex items-center justify-center animate-bounce">
        <Droplet className="w-12 h-12 text-blue-500" />
      </div>
      <div className="text-center space-y-2">
        <p className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">⛽ MAFUTA YAMEHIFADHIWA!</p>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest italic tracking-tighter text-center">Matumizi ya mafuta yamesajiliwa.</p>
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
            <h1 className="text-2xl font-black text-blue-600 dark:text-blue-500 tracking-tighter uppercase italic">MAFUTA (FUEL)</h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest italic tracking-tighter">Gharama za Nishati</p>
        </div>
      </div>

      <div className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-3xl border border-slate-200 dark:border-white/5 rounded-[2.5rem] p-8 space-y-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -translate-y-16 translate-x-16" />

        <div className="space-y-6">
            {/* Usage Area */}
            <div className="space-y-3">
                <label className="block text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.3em] px-2">Yatumika Wapi? (Usage Area) *</label>
                <div className="grid grid-cols-3 gap-2">
                    {[
                        { id: "shimo", label: "Pampu", icon: Droplet },
                        { id: "kompresa", label: "Kompresa", icon: Zap },
                        { id: "mwaloni", label: "Mwaloni", icon: Settings2 }
                    ].map(a => (
                        <button key={a.id} onClick={() => { vibe(); setForm({...form, usage_area: a.id}) }}
                            className={`h-24 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all border-2 ${
                              form.usage_area === a.id 
                                ? "bg-slate-900 dark:bg-white border-slate-900 dark:border-white text-white dark:text-slate-950 scale-95 shadow-lg" 
                                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 shadow-sm"
                            }`}>
                            <a.icon className={`w-6 h-6 mb-1 ${form.usage_area === a.id ? "text-white dark:text-slate-950" : "text-blue-600 dark:text-blue-500/50"}`} />
                            <span className="text-[10px] font-black uppercase tracking-widest leading-none text-center">{a.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Liters */}
            <div className="space-y-3">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Idadi ya Lita *</label>
                <div className="relative">
                    <Fuel className="absolute left-6 top-1/2 -translate-y-1/2 w-8 h-8 text-blue-600 dark:text-blue-500 opacity-50" />
                    <input type="number" value={form.liters} onChange={e => setForm({...form, liters: e.target.value})}
                        placeholder="0.0"
                        className="w-full h-24 pl-20 pr-6 rounded-[2rem] bg-slate-100/30 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 focus:border-blue-500 text-slate-900 dark:text-white font-black text-5xl outline-none transition-all shadow-inner" />
                </div>
            </div>

            {/* Fuel Type */}
            <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Aina ya Mafuta</label>
                <div className="grid grid-cols-2 gap-3">
                    {["Dizeli", "Dizeli ya Mix"].map(t => (
                        <button key={t} onClick={() => { vibe(); setForm({...form, fuel_type: t.toLowerCase()}) }}
                            className={`h-14 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border-2 ${
                              form.fuel_type === t.toLowerCase() 
                                ? "bg-slate-900 dark:bg-white border-slate-900 dark:border-white text-white dark:text-slate-950 shadow-lg" 
                                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400"
                            }`}>
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            {/* Remarks */}
            <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Kumbukumbu (Remarks)</label>
                <textarea value={form.remarks} onChange={e => setForm({...form, remarks: e.target.value})}
                    placeholder="Maelezo ya ziada..."
                    className="w-full p-6 rounded-[2.5rem] bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-medium outline-none focus:border-blue-500 transition-all resize-none shadow-inner" rows={2} />
            </div>

            {/* Photos Upload */}
            <div className="space-y-4 pt-2">
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] pl-4">Picha / Vielelezo (Hiari)</label>
                <div className="bg-slate-100/50 dark:bg-slate-900/30 p-4 rounded-[2rem] border border-slate-200 dark:border-white/5">
                <PhotoUploadField photos={photos} setPhotos={setPhotos} />
                </div>
            </div>
          <button onClick={handleSave} disabled={!form.liters}
                className="w-full h-20 rounded-[2.5rem] bg-blue-600 hover:bg-blue-500 disabled:from-slate-200 disabled:to-slate-100 dark:disabled:from-slate-800 dark:disabled:to-slate-800 disabled:opacity-40 text-white font-black text-xl uppercase tracking-widest shadow-2xl shadow-blue-600/30 active:scale-95 transition-all flex items-center justify-center gap-3">
                <Save className="w-6 h-6" />
                HIFADHI REKODI YA MAFUTA
            </button>
        </div>
      </div>
    </div>
  )
}
