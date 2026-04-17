"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { PhotoUploadField } from "@/components/photo-upload-field"
import { 
  ChevronLeft, Truck, Package, MapPin, 
  Map as MapIcon, Save, CheckCircle2, User, 
  TrendingUp, Clock
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

export default function UsafirishajiPage() {
  const router = useRouter()
  const [saved, setSaved] = useState(false)
  const [photos, setPhotos] = useState<string[]>([])
  const [form, setForm] = useState({
    source_area: "",
    bag_count: "",
    destination: "",
    driver_name: "",
    loading_time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    remarks: ""
  })

  const vibe = () => { if (typeof navigator !== 'undefined') navigator.vibrate?.(40) }

  const handleSave = () => {
    if (!form.source_area || !form.bag_count) return
    vibe()
    saveToQueue("logistics", { ...form, photos })
    pushChimboNotification({
      type: "system",
      title: "Taarifa Mpya – USAFIRISHAJI",
      body: "Data imehifadhiwa kwenye mfumo.",
      urgent: false,
    })
    
    setSaved(true)
    setTimeout(() => router.push("/chimbo/dashboard"), 2000)
  }

  if (saved) return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center gap-6 p-8 transition-colors duration-500">
      <div className="w-24 h-24 rounded-full bg-blue-500/20 flex items-center justify-center animate-bounce">
        <Truck className="w-12 h-12 text-blue-500" />
      </div>
      <div className="text-center space-y-2">
        <p className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">🚚 USAFIRISHAJI UMEREKODIWA!</p>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest italic tracking-tighter text-center">Rekodi ya usafirishaji imehifadhiwa.</p>
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
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">Kusafirisha Mche</h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest italic">Vifaa na Mche Logistics</p>
        </div>
      </div>

      <div className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-3xl border border-slate-200 dark:border-white/5 rounded-[2.5rem] p-8 space-y-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -translate-y-16 translate-x-16" />

        <div className="space-y-6">
            {/* Source */}
            <div className="space-y-3">
                <label className="block text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.3em] px-2 pl-4">Eneo la Mche (Source) *</label>
                <div className="relative">
                    <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-600 dark:text-blue-500 opacity-50" />
                    <input 
                      value={form.source_area} onChange={e => setForm({...form, source_area: e.target.value})}
                      placeholder="Mfano: Shimo la Babu"
                      className="w-full h-18 pl-16 pr-6 rounded-[2.5rem] bg-slate-100/30 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 focus:border-blue-500 text-slate-900 dark:text-white font-bold placeholder:text-slate-400 dark:placeholder:text-slate-700 outline-none transition-all shadow-inner" />
                </div>
            </div>

            {/* Bag Count */}
            <div className="space-y-3">
                <label className="block text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.3em] px-2 pl-4">Idadi ya Magunia *</label>
                <div className="relative">
                    <Package className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-600 dark:text-amber-500 opacity-50" />
                    <input 
                      type="number" value={form.bag_count} onChange={e => setForm({...form, bag_count: e.target.value})}
                      placeholder="0"
                      className="w-full h-20 pl-16 pr-6 rounded-[2.5rem] bg-slate-100/30 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 focus:border-amber-500 text-slate-900 dark:text-white font-black text-4xl outline-none transition-all shadow-inner" />
                </div>
            </div>

            <div className="h-px bg-slate-200 dark:bg-white/5" />

            {/* Destination */}
            <div className="space-y-3">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest pl-4">Iliyopelekwa Wapi? (Destination)</label>
                <div className="relative">
                    <MapIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-600" />
                    <input 
                      value={form.destination} onChange={e => setForm({...form, destination: e.target.value})}
                      placeholder="Mfano: Kinu cha Mzee Maulid"
                      className="w-full h-14 pl-12 pr-6 rounded-[2.5rem] bg-slate-100/30 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 focus:border-blue-500 text-slate-900 dark:text-white font-bold outline-none shadow-inner transition-all" />
                </div>
            </div>

            {/* Driver */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest pl-4">Dereva / Mbeba Mche</label>
                    <div className="relative">
                        <User className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-600" />
                        <input 
                          value={form.driver_name} onChange={e => setForm({...form, driver_name: e.target.value})}
                          placeholder="Jina"
                          className="w-full h-14 pl-12 pr-6 rounded-[2.5rem] bg-slate-100/30 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-bold outline-none shadow-inner transition-all" />
                    </div>
                </div>
                <div className="space-y-3">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest pl-4">Muda</label>
                    <div className="relative">
                        <Clock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-600" />
                        <input 
                          value={form.loading_time} readOnly
                          className="w-full h-14 pl-12 pr-6 rounded-[2.5rem] bg-slate-50/50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold outline-none cursor-default" />
                    </div>
                </div>
            </div>
        </div>

            {/* Photos Upload */}
            <div className="space-y-4 pt-2">
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] pl-4">Picha / Vielelezo (Hiari)</label>
                <div className="bg-slate-100/50 dark:bg-slate-900/30 p-4 rounded-[2rem] border border-slate-200 dark:border-white/5">
                <PhotoUploadField photos={photos} setPhotos={setPhotos} />
                </div>
            </div>
          <button onClick={handleSave} disabled={!form.source_area || !form.bag_count}
            className="w-full h-20 rounded-[2.5rem] bg-blue-600 hover:bg-blue-500 disabled:from-slate-200 disabled:to-slate-100 dark:disabled:from-slate-800 dark:disabled:to-slate-800 disabled:opacity-40 text-white font-black text-xl uppercase tracking-widest shadow-2xl shadow-blue-600/30 active:scale-95 transition-all flex items-center justify-center gap-3">
            <Save className="w-6 h-6" />
            VUNISHA MCHE SASA
        </button>
      </div>
    </div>
  )
}
