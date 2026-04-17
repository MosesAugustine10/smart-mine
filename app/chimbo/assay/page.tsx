"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { PhotoUploadField } from "@/components/photo-upload-field"
import { 
  ChevronLeft, Beaker, Ruler, Scale, 
  MapPin, Save, CheckCircle2, FlaskConical, 
  Layers, GlassWater, Microscope
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

export default function AssayPage() {
  const router = useRouter()
  const [saved, setSaved] = useState(false)
  const [photos, setPhotos] = useState<string[]>([])
  const [form, setForm] = useState({
    sample_no: "",
    weight_grams: "",
    grade_estimate: "",
    status: "anasubiri" // anasubiri, tayari
  })

  const vibe = () => { if (typeof navigator !== 'undefined') navigator.vibrate?.(40) }

  const handleSave = () => {
    if (!form.sample_no || !form.weight_grams) return
    vibe()
    saveToQueue("assay", { ...form, photos })
    pushChimboNotification({
      type: "production",
      title: "Taarifa Mpya – ASSAY",
      body: "Data imehifadhiwa kwenye mfumo.",
      urgent: false,
    })
    
    setSaved(true)
    setTimeout(() => router.push("/chimbo/dashboard"), 2000)
  }

  if (saved) return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center gap-6 p-8 transition-colors duration-500">
      <div className="w-24 h-24 rounded-full bg-violet-500/20 flex items-center justify-center animate-pulse">
        <Microscope className="w-12 h-12 text-violet-500" />
      </div>
      <div className="text-center space-y-2">
        <p className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic text-center">🧪 SAMPLE IMEREKODIWA!</p>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest italic tracking-tighter text-center">Matokeo ya maabara yataonekana kwenye ripoti.</p>
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
            <h1 className="text-2xl font-black text-violet-600 dark:text-violet-400 tracking-tighter uppercase italic">MAABARA (ASSAY)</h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest italic">Uchambuzi wa Mawe</p>
        </div>
      </div>

      <div className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-3xl border border-slate-200 dark:border-white/5 rounded-[2.5rem] p-8 space-y-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/5 rounded-full blur-3xl -translate-y-16 translate-x-16" />

        <div className="space-y-6">
            {/* Sample No */}
            <div className="space-y-3">
                <label className="block text-[10px] font-black text-violet-600 dark:text-violet-400 uppercase tracking-[0.3em] px-2 pl-4">Namba ya Sample *</label>
                <div className="relative">
                    <Beaker className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-violet-600 dark:text-violet-500 opacity-50" />
                    <input value={form.sample_no} onChange={e => setForm({...form, sample_no: e.target.value})}
                        placeholder="Mfano: SH-001"
                        className="w-full h-20 pl-16 pr-6 rounded-[2.5rem] bg-slate-100/30 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 focus:border-violet-500 text-slate-900 dark:text-white font-black text-2xl outline-none shadow-inner transition-all" />
                </div>
            </div>

            {/* Weight & Grade */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 pl-4">Uzito (Gramu) *</label>
                    <div className="relative">
                        <Scale className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-600 dark:text-indigo-500 opacity-50" />
                        <input type="number" value={form.weight_grams} onChange={e => setForm({...form, weight_grams: e.target.value})}
                            placeholder="0.0" className="w-full h-20 pl-14 pr-4 rounded-[2rem] bg-slate-100/30 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 focus:border-violet-500 text-slate-900 dark:text-white font-black text-3xl outline-none shadow-inner transition-all" />
                    </div>
                </div>
                <div className="space-y-3">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 pl-4">Grade (g/t)</label>
                    <div className="relative">
                        <Layers className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-600 dark:text-amber-500 opacity-50" />
                        <input type="number" value={form.grade_estimate} onChange={e => setForm({...form, grade_estimate: e.target.value})}
                            placeholder="0.5" className="w-full h-20 pl-14 pr-4 rounded-[2rem] bg-slate-100/30 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 focus:border-violet-500 text-slate-900 dark:text-white font-black text-3xl outline-none shadow-inner transition-all" />
                    </div>
                </div>
            </div>

            {/* Status */}
            <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-white/5">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 pl-4">Hali ya Sample (Status)</label>
                <div className="grid grid-cols-2 gap-3">
                    {[
                        { id: "anasubiri", label: "Inasubiri", col: "bg-amber-500" },
                        { id: "tayari", label: "Imetoka", col: "bg-emerald-500" }
                    ].map(s => (
                        <button key={s.id} onClick={() => { vibe(); setForm({...form, status: s.id}) }}
                            className={`h-16 rounded-2xl flex items-center justify-center transition-all border-2 ${
                              form.status === s.id 
                                ? `${s.col} text-slate-950 border-white/20 scale-95 shadow-xl` 
                                : "bg-white dark:bg-slate-950 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800"
                            }`}>
                            <span className="text-[10px] font-black uppercase tracking-widest">{s.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Photos Upload */}
            <div className="space-y-4 pt-2">
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] pl-4">Picha / Vielelezo (Hiari)</label>
                <div className="bg-slate-100/50 dark:bg-slate-900/30 p-4 rounded-[2rem] border border-slate-200 dark:border-white/5">
                <PhotoUploadField photos={photos} setPhotos={setPhotos} />
                </div>
            </div>
          <button onClick={handleSave} disabled={!form.sample_no || !form.weight_grams}
                className="w-full h-20 rounded-[2.5rem] bg-violet-600 hover:bg-violet-500 disabled:from-slate-200 disabled:to-slate-100 dark:disabled:from-slate-800 dark:disabled:to-slate-800 disabled:opacity-40 text-white font-black text-xl uppercase tracking-widest shadow-2xl shadow-violet-600/30 active:scale-95 transition-all flex items-center justify-center gap-3">
                <Save className="w-6 h-6" />
                HIFADHI MATOKEO
            </button>
        </div>
      </div>
    </div>
  )
}
