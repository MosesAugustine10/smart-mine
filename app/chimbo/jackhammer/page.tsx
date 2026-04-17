"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { PhotoUploadField } from "@/components/photo-upload-field"
import { 
  ChevronLeft, Pickaxe, Settings, Fuel, 
  Settings2, Save, CheckCircle2, AlertTriangle, 
  Construction, User, MapPin
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

export default function JackhammerPage() {
  const router = useRouter()
  const [saved, setSaved] = useState(false)
  const [photos, setPhotos] = useState<string[]>([])
  const [form, setForm] = useState({
    driller_name: "",
    machine_no: "",
    site_area: "",
    rods_drilled: "",
    mix_fuel_liters: "",
    bits_broken: "",
    condition: "vizuri" // vizuri, nusu, mbovu
  })

  const vibe = () => { if (typeof navigator !== 'undefined') navigator.vibrate?.(40) }

  const handleSave = () => {
    if (!form.driller_name || !form.rods_drilled) return
    vibe()
    saveToQueue("drilling", { ...form, photos })
    pushChimboNotification({
      type: "system",
      title: "Taarifa Mpya – JACKHAMMER",
      body: "Data imehifadhiwa kwenye mfumo.",
      urgent: false,
    })
    
    setSaved(true)
    setTimeout(() => router.push("/chimbo/dashboard"), 2000)
  }

  if (saved) return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center gap-6 p-8 transition-colors duration-500">
      <div className="w-24 h-24 rounded-full bg-orange-500/20 flex items-center justify-center animate-[spin_3s_linear_infinite]">
        <Settings className="w-12 h-12 text-orange-500" />
      </div>
      <div className="text-center space-y-2">
        <p className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">⚙️ KAZI IMEIFADHIWA!</p>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest italic text-center">Rekodi ya Jackhammer imewekwa kwenye mfumo.</p>
      </div>
    </div>
  )

  return (
    <div className="p-4 space-y-6 pb-24 bg-slate-50 dark:bg-slate-950 transition-colors duration-500 min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-3 pt-2">
        <button onClick={() => router.back()} className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-900 dark:text-white shadow-sm">
            <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">Jackhammer</h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest italic">Uchimba na Matumizi</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-3xl border border-slate-200 dark:border-white/5 rounded-[2.5rem] p-8 space-y-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-3xl -translate-y-16 translate-x-16" />

            {/* Personnel & Machine */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Jina la Mpigaji *</label>
                    <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                        <input value={form.driller_name} onChange={e => setForm({...form, driller_name: e.target.value})}
                            placeholder="Mpigaji" className="w-full h-14 pl-12 pr-4 rounded-[2.5rem] bg-slate-100/50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold outline-none focus:border-orange-500 transition-all shadow-inner" />
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Jackhammer #</label>
                    <input value={form.machine_no} onChange={e => setForm({...form, machine_no: e.target.value})}
                        placeholder="Na: 02" className="w-full h-14 px-4 rounded-[2.5rem] bg-slate-100/50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold outline-none shadow-inner" />
                </div>
            </div>

            {/* Area */}
            <div className="space-y-3">
                <label className="block text-[10px] font-black text-orange-600 dark:text-orange-500 uppercase tracking-[0.3em] px-2">Eneo la Kazi *</label>
                <div className="relative">
                    <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-orange-600 dark:text-orange-500 opacity-50" />
                    <input value={form.site_area} onChange={e => setForm({...form, site_area: e.target.value})}
                        placeholder="Mfano: Shimo la Kati"
                        className="w-full h-18 pl-16 pr-6 rounded-[2.5rem] bg-slate-100/50 dark:bg-slate-850 border-2 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-bold outline-none focus:border-orange-500 transition-all shadow-inner" />
                </div>
            </div>

            <div className="h-px bg-slate-200 dark:bg-white/5" />

            {/* Drilled Stats */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Fimbo Ngapi? *</label>
                    <div className="relative">
                        <Construction className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-600 dark:text-amber-500 opacity-50" />
                        <input type="number" value={form.rods_drilled} onChange={e => setForm({...form, rods_drilled: e.target.value})}
                            placeholder="0" className="w-full h-20 pl-14 pr-4 rounded-[2rem] bg-slate-100/30 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-black text-4xl outline-none focus:border-amber-500 shadow-inner" />
                    </div>
                </div>
                <div className="space-y-3">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Lita za Mix</label>
                    <div className="relative">
                        <Fuel className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-red-600 dark:text-red-500 opacity-50" />
                        <input type="number" value={form.mix_fuel_liters} onChange={e => setForm({...form, mix_fuel_liters: e.target.value})}
                            placeholder="0" className="w-full h-20 pl-14 pr-4 rounded-[2rem] bg-slate-100/30 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-black text-4xl outline-none focus:border-red-500 shadow-inner" />
                    </div>
                </div>
            </div>

            {/* Broken Bits */}
            <div className="space-y-3">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Biti Ngapi Zimekufa? (Broken Bits)</label>
                <div className="flex gap-4">
                    <button onClick={() => { vibe(); setForm({...form, bits_broken: String(Math.max(0, Number(form.bits_broken || 0) + 1)) }) }}
                        className="h-14 flex-1 rounded-[2.5rem] bg-red-600/10 dark:bg-red-600/20 text-red-600 dark:text-red-500 font-black text-xs uppercase tracking-widest border border-red-500/20">
                        🔨 ONGEZA BITI
                    </button>
                    <input readOnly value={form.bits_broken || 0}
                        className="w-20 h-14 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-black text-2xl text-center shadow-inner" />
                </div>
            </div>

            {/* Condition */}
            <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-white/5">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Hali ya Mashine</label>
                <div className="grid grid-cols-3 gap-2">
                    {[
                        { id: "vizuri", label: "Inakata", col: "bg-emerald-500" },
                        { id: "nusu", label: "Inasumbua", col: "bg-amber-500" },
                        { id: "mbovu", label: "Imeharibika", col: "bg-red-500" }
                    ].map(c => (
                        <button key={c.id} onClick={() => { vibe(); setForm({...form, condition: c.id}) }}
                            className={`h-16 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all border-2 ${form.condition === c.id ? `${c.col} text-slate-950 border-white/20` : "bg-slate-50 dark:bg-slate-950 text-slate-500 border-slate-200 dark:border-slate-800"}`}>
                            <span className="text-[10px] font-black uppercase tracking-widest">{c.label}</span>
                        </button>
                    ))}
                </div>
            </div>

                       {/* Photos Upload */}
          <div className="space-y-4 pb-4">
            <label className="block text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] pl-4">Picha / Vielelezo (Hiari)</label>
            <div className="bg-slate-100/50 dark:bg-slate-900/30 p-4 rounded-[2rem] border border-slate-200 dark:border-white/5">
              <PhotoUploadField onPhotosChange={(urls) => setPhotos(urls)} label="Picha za Eneo" />
            </div>
          </div>
          <button onClick={handleSave} disabled={!form.driller_name || !form.rods_drilled}
                className="w-full h-20 rounded-[2.5rem] bg-orange-600 hover:bg-orange-500 disabled:from-slate-200 disabled:to-slate-100 dark:disabled:from-slate-800 dark:disabled:to-slate-800 disabled:opacity-40 text-white font-black text-xl uppercase tracking-widest shadow-2xl shadow-orange-600/30 active:scale-95 transition-all flex items-center justify-center gap-3">
                <Save className="w-6 h-6" />
                HIFADHI KAZI LEO
            </button>
        </div>
      </div>
    </div>
  )
}
