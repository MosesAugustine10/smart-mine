"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { PhotoUploadField } from "@/components/photo-upload-field"
import { 
  ChevronLeft, Save, TrendingUp, User,
  Calendar, Pickaxe, Landmark, CheckCircle2,
  DollarSign
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

export default function MauzoPage() {
  const router = useRouter()
  const [saved, setSaved] = useState(false)
  const [photos, setPhotos] = useState<string[]>([])
  const [form, setForm] = useState({
    wash_date: new Date().toISOString().split("T")[0],
    weight_grams: "",
    price_per_gram: "385000",
    total_amount: 0,
    buyer_name: ""
  })

  const [account, setAccount] = useState<any>(null)

  useEffect(() => {
    const acc = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("chimbo_account") || "null") : null
    if (!acc || acc.role !== "BOSS") {
      router.replace("/chimbo/dashboard")
      return
    }
    setAccount(acc)

    const total = (Number(form.weight_grams) || 0) * (Number(form.price_per_gram) || 0)
    setForm(f => ({ ...f, total_amount: total }))
  }, [form.weight_grams, form.price_per_gram, router])

  const vibe = () => { if (typeof navigator !== 'undefined') navigator.vibrate?.(50) }

  const handleSave = () => {
    if (!form.weight_grams || !form.price_per_gram) return
    vibe()
    saveToQueue("sales", { ...form, photos })
    pushChimboNotification({
      type: "sales",
      title: `💰 Mauzo Mapya – ${form.weight_grams}g`,
      body: `Mnunuzi: ${form.buyer_name || "Haijabainishwa"}. Jumla: TSh ${Number(form.total_amount).toLocaleString()}/=`,
      urgent: false,
    })
    setSaved(true)
    setTimeout(() => router.push("/chimbo/dashboard"), 2000)
  }

  if (!account) return null; // Will redirect

  if (saved) return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center gap-6 p-8 transition-colors duration-500">
      <div className="w-24 h-24 rounded-full bg-emerald-500/20 flex items-center justify-center animate-bounce">
        <DollarSign className="w-12 h-12 text-emerald-500" />
      </div>
      <div className="text-center space-y-2">
        <p className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">💰 PESA IMEREKODIWA!</p>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest italic tracking-tighter text-center">Mauzo ya Osha yamehifadhiwa ghalani.</p>
      </div>
    </div>
  )

  return (
    <div className="p-4 space-y-6 pb-20 bg-slate-50 dark:bg-slate-950 transition-colors duration-500 min-h-screen relative overflow-hidden">
      {/* ── Background Glows ── */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <div className="flex items-center gap-4 pt-4 relative z-10">
        <button onClick={() => router.back()} className="w-12 h-12 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-900 dark:text-white backdrop-blur-md active:scale-90 transition-all shadow-sm">
            <ChevronLeft className="w-6 h-6" />
        </button>
        <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic leading-none">Mauzo ya Osha</h1>
            <p className="text-[10px] font-black text-amber-600 dark:text-amber-500/60 uppercase tracking-[0.3em] mt-1 italic">Daftari la Mauzo ya Dhahabu</p>
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-white/80 dark:bg-slate-900/40 backdrop-blur-3xl border border-slate-200 dark:border-white/10 rounded-[3.5rem] p-8 md:p-12 space-y-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] dark:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] relative z-10">
        
        <div className="space-y-8">
            {/* Weight Input */}
            <div className="space-y-4">
                <label className="block text-[10px] font-black text-amber-600 dark:text-amber-500/80 uppercase tracking-[0.4em] pl-6 italic">Uzito (Gramu) *</label>
                <div className="relative group">
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center">
                      <Pickaxe className="w-4 h-4 text-amber-600 dark:text-amber-500" />
                    </div>
                    <input type="number" value={form.weight_grams} onChange={e => setForm({...form, weight_grams: e.target.value})}
                        placeholder="0.00"
                        className="w-full h-24 pl-20 pr-8 rounded-[3rem] bg-slate-100/50 dark:bg-slate-950/50 border-2 border-slate-200 dark:border-white/5 focus:border-amber-500/50 text-slate-900 dark:text-white font-black text-4xl placeholder:text-slate-300 dark:placeholder:text-slate-800 outline-none transition-all shadow-inner" />
                </div>
            </div>

            {/* Price Input */}
            <div className="space-y-4">
                <label className="block text-[10px] font-black text-emerald-600 dark:text-emerald-500/80 uppercase tracking-[0.4em] pl-6 italic">Bei kwa Gramu (TSh) *</label>
                <div className="relative group">
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                      <Landmark className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
                    </div>
                    <input type="number" value={form.price_per_gram} onChange={e => setForm({...form, price_per_gram: e.target.value})}
                        className="w-full h-24 pl-20 pr-8 rounded-[3rem] bg-slate-100/50 dark:bg-slate-950/50 border-2 border-slate-200 dark:border-white/5 focus:border-emerald-500/50 text-slate-900 dark:text-white font-black text-3xl outline-none transition-all shadow-inner" />
                </div>
                <div className="flex items-center gap-2 pl-6">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-[10px] text-slate-500 font-bold italic uppercase tracking-wider">Bei ya soko leo: ~388,500/=</p>
                </div>
            </div>

            {/* Total Display (Auto) */}
            <div className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 rounded-[3rem] p-10 border border-slate-200 dark:border-white/10 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl" />
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.5em] text-center mb-4 italic">THAMANI YA OSHA LEO</p>
                <h2 className="text-4xl md:text-6xl font-black text-emerald-600 dark:text-emerald-400 text-center tracking-tighter leading-none italic group-hover:scale-105 transition-transform duration-500">
                    TSh {form.total_amount.toLocaleString()}/=
                </h2>
                <div className="h-1.5 bg-emerald-500/20 w-32 mx-auto rounded-full mt-8 overflow-hidden">
                    <div className="h-full bg-emerald-500 animate-shimmer w-1/2" />
                </div>
            </div>

            {/* Other fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-4">Tarehe ya Kuosha</label>
                    <div className="relative">
                        <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500/50" />
                        <input type="date" value={form.wash_date} onChange={e => setForm({...form, wash_date: e.target.value})}
                            className="w-full h-16 pl-14 pr-6 rounded-[2.5rem] bg-slate-100/50 dark:bg-slate-950/50 border-2 border-slate-200 dark:border-white/5 text-slate-900 dark:text-white font-bold outline-none focus:border-amber-500/20 transition-all" />
                    </div>
                </div>
                <div className="space-y-3">
                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-4">Mnunuzi / Broker</label>
                    <div className="relative">
                        <User className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500/50" />
                        <input type="text" value={form.buyer_name} onChange={e => setForm({...form, buyer_name: e.target.value})}
                            placeholder="Mfano: Mzee Chilo"
                            className="w-full h-16 pl-14 pr-6 rounded-[2.5rem] bg-slate-100/50 dark:bg-slate-950/50 border-2 border-slate-200 dark:border-white/5 text-slate-900 dark:text-white font-bold placeholder:text-slate-300 dark:placeholder:text-slate-800 outline-none focus:border-amber-500/20 transition-all" />
                    </div>
                </div>
            </div>
        </div>

          {/* Photos Upload */}
          <div className="space-y-5 pt-4">
            <div className="flex items-center gap-3 pl-4">
               <div className="w-1 h-4 bg-amber-500 rounded-full" />
               <label className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.3em]">Picha & Vielelezo</label>
            </div>
            <div className="bg-slate-100/30 dark:bg-slate-950/30 p-4 rounded-[2.5rem] border border-slate-200 dark:border-white/5">
                <PhotoUploadField photos={photos} setPhotos={setPhotos} />
            </div>
          </div>

          <button onClick={handleSave} disabled={!form.weight_grams || !form.price_per_gram}
            className="w-full h-24 rounded-[3rem] bg-gradient-to-r from-amber-600 to-amber-400 hover:from-amber-500 hover:to-amber-300 disabled:from-slate-200 disabled:to-slate-100 dark:disabled:from-slate-800 dark:disabled:to-slate-800 disabled:opacity-40 text-slate-950 font-black text-2xl uppercase tracking-[0.2em] shadow-[0_20px_40px_-10px_rgba(245,158,11,0.3)] active:scale-[0.98] transition-all flex items-center justify-center gap-4 group">
            <div className="w-10 h-10 rounded-full bg-slate-950/10 flex items-center justify-center group-active:rotate-12 transition-transform">
              <Save className="w-6 h-6" />
            </div>
            HIFADHI MAUZO
        </button>
      </div>
    </div>
  )
}
