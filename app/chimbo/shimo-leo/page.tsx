"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { 
  ChevronLeft, Save, CheckCircle2 
} from "lucide-react"
import { PhotoUploadField } from "@/components/photo-upload-field"
import { pushChimboNotification } from "@/components/chimbo/chimbo-notifications"
import { ModuleHelpNotebook } from "@/components/module-help-notebook"

function saveToQueue(tableName: string, data: any) {
  const queue = JSON.parse(localStorage.getItem("chimbo_sync_queue") || "[]")
  const record = { ...data, table_name: tableName, local_id: "local_" + crypto.randomUUID(), sync_status: "PENDING", created_locally_at: new Date().toISOString() }
  queue.push(record)
  localStorage.setItem("chimbo_sync_queue", JSON.stringify(queue))
  const existing = JSON.parse(localStorage.getItem(`chimbo_${tableName}`) || "[]")
  existing.push(record)
  localStorage.setItem(`chimbo_${tableName}`, JSON.stringify(existing))
}

export default function ShimoLeoPage() {
  const router = useRouter()
  const [saved, setSaved] = useState(false)
  const [photos, setPhotos] = useState<string[]>([])

  const vibe = () => { if (typeof navigator !== 'undefined') navigator.vibrate?.([50, 50, 50]) }
  const [form, setForm] = useState({
    site_name: "", 
    date: new Date().toISOString().split("T")[0],
    shift: "mchana", 
    soil_type: "mche",
    load_count: "", 
    load_unit: "magunia",
    workers: "", 
    daily_cost: "", 
    remarks: ""
  })

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = () => {
    if (!form.site_name || !form.load_count) return
    vibe()
    saveToQueue("production", { ...form, photos })
    pushChimboNotification({
      type: "production",
      title: "Taarifa Mpya – SHIMO-LEO",
      body: "Data imehifadhiwa kwenye mfumo.",
      urgent: false,
    })
    
    setSaved(true)
    setTimeout(() => { router.push("/chimbo/dashboard") }, 1500)
  }

  if (saved) return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-8 transition-colors">
      <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mb-6">
         <CheckCircle2 className="w-10 h-10 text-emerald-400" />
      </div>
      <p className="text-2xl font-black text-slate-900 dark:text-white uppercase italic">IMEHIFADHIWA!</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020617] pb-20">
      <nav className="p-4 flex items-center gap-4 bg-white dark:bg-slate-900 border-b-2 border-slate-200/50 shadow-sm rounded-b-[2.5rem]">
        <button onClick={() => router.back()} className="h-12 w-12 rounded-[1.5rem] bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-500 shadow-sm">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-black uppercase text-amber-600 flex-1">Uzalishaji LEO</h1>
        <ModuleHelpNotebook moduleTitle="Shimo" />
      </nav>

      <div className="p-4 space-y-6">
        <div>
          <label className="block text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2 pl-4">Arena / Jina la Shimo</label>
          <input value={form.site_name} onChange={e => set("site_name", e.target.value)}
            placeholder="Weka Jina la Shimo"
            className="w-full h-14 px-6 rounded-[2.5rem] bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 font-bold outline-none focus:border-amber-500 transition-all text-sm" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2 pl-4">Shift (Zamu)</label>
            <select value={form.shift} onChange={e => set("shift", e.target.value)}
              className="w-full h-14 px-6 rounded-[2.5rem] bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 font-bold outline-none focus:border-amber-500 transition-all text-sm appearance-none">
              <option value="mchana">Mchana</option>
              <option value="usiku">Usiku</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2 pl-4">Aina ya Mawe</label>
            <select value={form.soil_type} onChange={e => set("soil_type", e.target.value)}
              className="w-full h-14 px-6 rounded-[2.5rem] bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 font-bold outline-none focus:border-amber-500 transition-all text-sm appearance-none">
              <option value="mche">Mche (Dhabahu nyingi)</option>
              <option value="jalada">Jalada (Kawaida)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2 pl-4">Idadi ya Mizigo</label>
            <input type="number" value={form.load_count} onChange={e => set("load_count", e.target.value)}
              placeholder="0"
              className="w-full h-14 px-6 rounded-[2.5rem] bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 font-black text-amber-600 outline-none focus:border-amber-500 transition-all text-lg" />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2 pl-4">Kipimo</label>
            <select value={form.load_unit} onChange={e => set("load_unit", e.target.value)}
              className="w-full h-14 px-6 rounded-[2.5rem] bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 font-bold outline-none focus:border-amber-500 transition-all text-sm appearance-none">
              <option value="magunia">Magunia</option>
              <option value="madebe">Madebe</option>
              <option value="mikokoteni">Mikokoteni</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2 pl-4">Idadi ya Vibarua (Leo)</label>
          <input type="number" value={form.workers} onChange={e => set("workers", e.target.value)}
            placeholder="Watu wangapi"
            className="w-full h-14 px-6 rounded-[2.5rem] bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 font-bold outline-none focus:border-amber-500 transition-all text-sm" />
        </div>

        <div>
          <label className="block text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2 pl-4">Gharama za Leo (TSH)</label>
          <input type="number" value={form.daily_cost} onChange={e => set("daily_cost", e.target.value)}
            placeholder="Mfano: 50,000"
            className="w-full h-14 px-6 rounded-[2.5rem] bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 font-black text-rose-600 outline-none focus:border-amber-500 transition-all text-lg" />
        </div>

        <div>
          <label className="block text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2 pl-4">Maoni (Remarks)</label>
          <textarea value={form.remarks} onChange={e => set("remarks", e.target.value)}
            placeholder="Maelezo yoyote..."
            className="w-full h-32 p-6 rounded-[2.5rem] bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 font-bold outline-none focus:border-amber-500 transition-all text-sm resize-none" />
        </div>

        <div>
           <label className="block text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2 pl-4">Picha za Leo</label>
           <div className="bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-6 text-center">
             <PhotoUploadField photos={photos} setPhotos={setPhotos} maxPhotos={5} label="Picha ya Shimo" />
           </div>
        </div>

        <div className="pt-6 flex flex-col gap-5">
          <button onClick={handleSave} disabled={!form.site_name || !form.load_count}
            className="w-full h-16 mt-4 rounded-[2.5rem] bg-amber-500 disabled:opacity-50 text-slate-950 font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-amber-500/30 flex items-center justify-center gap-3 active:scale-95 transition-all">
            <Save className="w-5 h-5" />
            HIFADHI DATA MARA MOJA
          </button>
        </div>
      </div>
    </div>
  )
}
