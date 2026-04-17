"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { PhotoUploadField } from "@/components/photo-upload-field"
import { 
  ChevronLeft, AlertTriangle, ShieldAlert, 
  MapPin, Camera, Save, 
  CheckCircle2, Info, Siren, HardHat,
  AlertCircle, DollarSign
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

export default function AjaliPage() {
  const router = useRouter()
  const [saved, setSaved] = useState(false)
  const [photo, setPhoto] = useState<string | null>(null)
  const [photos, setPhotos] = useState<string[]>([])
  const [form, setForm] = useState({
    victim_name: "",
    area: "",
    accident_type: "Kuanguka Shimoni",
    body_part: "",
    first_aid: "",
    medical_cost: "",
    used_ppe: "Ndiyo",
    severity: "low",
    date: new Date().toISOString().split("T")[0]
  })

  const vibe = () => { if (typeof navigator !== 'undefined') navigator.vibrate?.([50, 50, 50]) }

  const handleSave = () => {
    if (!form.area) return
    vibe()
    saveToQueue("safety", { ...form, photos: [photo, ...photos].filter(Boolean) })
    // Push instant notification to Boss
    pushChimboNotification({
      type: "safety",
      title: `⚠️ AJALI IMETOKEA – ${form.accident_type}`,
      body: `Eneo: ${form.area}. Aliyeumia: ${form.victim_name || "Haijabainishwa"}. Uzito: ${form.severity?.toUpperCase()}.`,
      urgent: form.severity === "high" || form.severity === "critical",
    })
    setSaved(true)
    setTimeout(() => router.push("/chimbo/dashboard"), 2000)
  }

  if (saved) return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-8 transition-colors duration-500">
      <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mb-6">
        <ShieldAlert className="w-10 h-10 text-red-500" />
      </div>
      <p className="text-2xl font-black text-slate-900 dark:text-white uppercase italic">TAARIFA IMETUMWA!</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020617] pb-20 font-sans">
      <nav className="p-4 flex items-center gap-4 bg-white dark:bg-slate-900 border-b-2 border-rose-500/20 shadow-sm rounded-b-[2.5rem]">
        <button onClick={() => router.back()} className="h-12 w-12 rounded-[1.5rem] bg-rose-50 dark:bg-slate-800 flex items-center justify-center text-rose-500 shadow-sm">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-black uppercase text-rose-600">Ripoti ya Ajali</h1>
      </nav>

      <div className="p-4 space-y-6">
        <div className="bg-rose-500/10 border-2 border-rose-500/20 p-5 rounded-[2.5rem] flex items-center gap-3">
           <AlertTriangle className="w-8 h-8 text-rose-500 shrink-0 animate-pulse" />
           <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest leading-relaxed">ONYO: Taarifa hii itatumwa kwa Uongozi (Boss) mara moja kwa msaada wa haraka.</p>
        </div>

        <div>
          <label className="block text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2 pl-4">Jina la Mtu Aliyeumia</label>
          <input value={form.victim_name} onChange={e => setForm({...form, victim_name: e.target.value})}
            placeholder="Mfano: Hamisi Juma"
            className="w-full h-14 px-6 rounded-[2.5rem] bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 font-bold outline-none focus:border-rose-500 transition-all text-sm" />
        </div>

        <div>
          <label className="block text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2 pl-4">Eneo la Ajali (Wapi?)</label>
          <input value={form.area} onChange={e => setForm({...form, area: e.target.value})}
            placeholder="Mfano: Shimo la Kati"
            className="w-full h-14 px-6 rounded-[2.5rem] bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 font-bold outline-none focus:border-rose-500 transition-all text-sm" />
        </div>

        <div>
          <label className="block text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2 pl-4">Aina ya Ajali</label>
          <select value={form.accident_type} onChange={e => setForm({...form, accident_type: e.target.value})}
            className="w-full h-14 px-6 rounded-[2.5rem] bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 font-bold outline-none focus:border-rose-500 transition-all text-sm appearance-none">
            <option>Kuanguka Shimoni</option>
            <option>Kusagwa na Mwamba</option>
            <option>Kukatwa na Kifaa</option>
            <option>Kuvuta Moshi</option>
            <option>Maji Kujaa / Kufunika</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2 pl-2">Sehemu ya Mwili</label>
            <input value={form.body_part} onChange={e => setForm({...form, body_part: e.target.value})}
              placeholder="Mfano: Mkono"
              className="w-full h-14 px-5 rounded-[2.5rem] bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 font-bold outline-none focus:border-rose-500 transition-all text-sm" />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2 pl-2">Vifaa vya Kinga?</label>
            <select value={form.used_ppe} onChange={e => setForm({...form, used_ppe: e.target.value})}
              className="w-full h-14 px-5 rounded-[2.5rem] bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 font-bold outline-none focus:border-rose-500 transition-all text-sm appearance-none">
              <option>Ndiyo</option>
              <option>Hapana</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2 pl-4">Msaada wa Kwanza (First Aid)</label>
          <input value={form.first_aid} onChange={e => setForm({...form, first_aid: e.target.value})}
            placeholder="Mfano: Tumefunga bandeji"
            className="w-full h-14 px-6 rounded-[2.5rem] bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 font-bold outline-none focus:border-rose-500 transition-all text-sm" />
        </div>

        <div>
          <label className="block text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2 pl-4">Gharama za Matibabu (TSh)</label>
          <input type="number" value={form.medical_cost} onChange={e => setForm({...form, medical_cost: e.target.value})}
            placeholder="Gharama ya hospitali"
            className="w-full h-14 px-6 rounded-[2.5rem] bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 font-black text-rose-600 outline-none focus:border-rose-500 transition-all text-lg tracking-tight" />
        </div>

        <div>
           <label className="block text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2 pl-4">Picha za Tukio (Muhimu Clicks)</label>
           <div className="bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-6 text-center">
             <PhotoUploadField photos={photos} setPhotos={setPhotos} maxPhotos={3} label="Picha ya Ajali" />
           </div>
        </div>

        <div className="pt-6 flex flex-col gap-5">
          <button onClick={handleSave} disabled={!form.area || !form.victim_name}
            className="w-full h-16 mt-4 rounded-[2.5rem] bg-rose-600 hover:bg-rose-700 text-white font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-rose-600/30 flex items-center justify-center gap-3 active:scale-95 transition-all">
            <Save className="w-5 h-5" />
            TUMA RIPOTI MARA MOJA
          </button>
        </div>
      </div>
    </div>
  )
}
