"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { PhotoUploadField } from "@/components/photo-upload-field"
import { 
  ChevronLeft, Save, CreditCard, Utensils,
  Shield, Pickaxe, Settings, Camera,
  CheckCircle2, ShoppingBag
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

export default function MatumiziPage() {
  const router = useRouter()
  const [saved, setSaved] = useState(false)
  const [photo, setPhoto] = useState<string | null>(null)
  const [photos, setPhotos] = useState<string[]>([])
  const [form, setForm] = useState({
    category: "chakula",
    amount: "",
    description: "",
    date: new Date().toISOString().split("T")[0]
  })

  const [account, setAccount] = useState<any>(null)

  useEffect(() => {
    const acc = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("chimbo_account") || "null") : null
    if (!acc || acc.role !== "BOSS") {
      router.replace("/chimbo/dashboard")
      return
    }
    setAccount(acc)
  }, [router])

  const vibe = () => { if (typeof navigator !== 'undefined') navigator.vibrate?.(40) }

  const handleSave = () => {
    if (!form.amount) return
    vibe()
    saveToQueue("expenses", { ...form, photo })
    pushChimboNotification({
      type: "alert",
      title: "Taarifa Mpya – MATUMIZI",
      body: "Data imehifadhiwa kwenye mfumo.",
      urgent: false,
    })
    
    setSaved(true)
    setTimeout(() => router.push("/chimbo/dashboard"), 2000)
  }

  const handlePhoto = () => {
    vibe()
    // Simulated camera capture
    setPhoto("https://images.unsplash.com/photo-1554224155-1696413565d3?w=400")
  }

  if (!account) return null

  if (saved) return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center gap-6 p-8 transition-colors duration-500">
      <div className="w-24 h-24 rounded-full bg-red-500/20 flex items-center justify-center animate-bounce">
        <CreditCard className="w-12 h-12 text-red-500" />
      </div>
      <div className="text-center space-y-2">
        <p className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">📉 MATUMIZI YAMEHIFADHIWA</p>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest italic tracking-tighter text-center">Gharama imesajiliwa kwenye ripoti ya wiki.</p>
      </div>
    </div>
  )

  const categories = [
    { id: "chakula", label: "Chakula", icon: Utensils, color: "text-orange-600 dark:text-orange-400" },
    { id: "ulinzi", label: "Ulinzi", icon: Shield, color: "text-blue-600 dark:text-blue-400" },
    { id: "vibarua", label: "Vibarua", icon: "👷", color: "text-amber-600 dark:text-amber-400" },
    { id: "vifaa", label: "Vifaa", icon: Settings, color: "text-indigo-600 dark:text-indigo-400" },
    { id: "mafuta", label: "Mafuta", icon: Pickaxe, color: "text-red-600 dark:text-red-400" },
  ]

  return (
    <div className="p-4 space-y-6 pb-20 bg-slate-50 dark:bg-slate-950 transition-colors duration-500 min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-3 pt-2">
        <button onClick={() => router.back()} className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-900 dark:text-white shadow-sm">
            <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">Matumizi ya Leo</h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest italic">Rekodi ya Pesa Zinazotoka</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Category Selector */}
        <div className="space-y-3">
          <label className="block text-[10px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-[0.3em] px-2">Aina ya Matumizi</label>
          <div className="grid grid-cols-3 gap-3">
            {categories.map(c => (
                <button 
                  key={c.id} 
                  onClick={() => { vibe(); setForm({...form, category: c.id}) }}
                  className={`flex flex-col items-center justify-center p-4 rounded-3xl border-2 transition-all ${
                    form.category === c.id 
                      ? "bg-slate-900 dark:bg-white border-slate-900 dark:border-white text-white dark:text-slate-950 scale-95 shadow-lg" 
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 shadow-sm"
                  }`}
                >
                  {typeof c.icon === "string" ? <span className="text-xl mb-2">{c.icon}</span> : <c.icon className={`w-6 h-6 mb-2 ${form.category === c.id ? "text-white dark:text-slate-950" : c.color}`} />}
                  <span className="text-[10px] font-black uppercase tracking-tighter">{c.label}</span>
                </button>
            ))}
          </div>
        </div>

        {/* Amount Input */}
        <div className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-3xl border border-slate-200 dark:border-white/5 rounded-[2.5rem] p-8 space-y-6 shadow-xl relative overflow-hidden">
            <div className="space-y-3">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Kiasi cha Fedha (TSh) *</label>
                <div className="relative">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-400 dark:text-slate-700 font-mono">TSH</span>
                    <input 
                      type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})}
                      placeholder="0.00"
                      className="w-full h-24 pl-24 pr-6 rounded-[2rem] bg-slate-100/30 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 focus:border-red-500 text-slate-900 dark:text-white font-black text-4xl outline-none transition-all shadow-inner" />
                </div>
            </div>

            <div className="space-y-3">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Maelezo Kamili</label>
                <textarea 
                  value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                  placeholder="Mfano: Kununua mchele na mboga za vibarua wa usiku..."
                  rows={3}
                  className="w-full p-6 rounded-[2rem] bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-medium outline-none focus:border-red-500 transition-all resize-none shadow-inner" />
            </div>

            {/* Photo Capture */}
            <div className="space-y-3">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Picha ya Risiti (Optional)</label>
                <div className="bg-slate-100/50 dark:bg-slate-900/30 p-4 rounded-[2.5rem] border border-slate-200 dark:border-white/5">
                <PhotoUploadField photos={photos} setPhotos={setPhotos} />
                </div>
            </div>

          <button onClick={handleSave} disabled={!form.amount}
                className="w-full h-20 rounded-[2rem] bg-red-600 hover:bg-red-500 disabled:from-slate-200 disabled:to-slate-100 dark:disabled:from-slate-800 dark:disabled:to-slate-800 disabled:opacity-40 text-white font-black text-xl uppercase tracking-widest shadow-2xl shadow-red-600/30 active:scale-95 transition-all flex items-center justify-center gap-3">
                <CheckCircle2 className="w-6 h-6" />
                HIFADHI MATUMIZI
            </button>
        </div>
      </div>
    </div>
  )
}
