"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  ChevronLeft, Package, Plus, Minus, Search, 
  Camera, Save, History, Truck, User, 
  Tag, MoreHorizontal, Filter, Mountain
} from "lucide-react"

function getLocalData(key: string) {
  if (typeof window === "undefined") return []
  try { return JSON.parse(localStorage.getItem(key) || "[]") } catch { return [] }
}
import { pushChimboNotification } from "@/components/chimbo/chimbo-notifications"
import { PhotoUploadField } from "@/components/photo-upload-field"

function saveLocalData(key: string, data: any[]) {
  localStorage.setItem(key, JSON.stringify(data))
}

export default function GhalaPage() {
  const router = useRouter()
  const [tab, setTab] = useState<"inventory" | "action">("inventory")
  const [inventory, setInventory] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [photos, setPhotos] = useState<string[]>([])
  const [form, setForm] = useState({
    item_name: "",
    category: "vifaa",
    type: "in", // "in" = nimepokea, "out" = nimetoa
    quantity: "",
    person: "",
    remarks: "",
    photo: null as string | null
  })

  useEffect(() => {
    const data = getLocalData("chimbo_inventory_ledger")
    setInventory(data)
  }, [])

  const vibe = () => { if (typeof navigator !== 'undefined') navigator.vibrate?.(40) }

  const handleAction = () => {
    if (!form.item_name || !form.quantity) return
    vibe()
    
    // Add to ledger
    const ledger = getLocalData("chimbo_inventory_history")
    ledger.push({ ...form, photos, date: new Date().toISOString() })
    saveLocalData("chimbo_inventory_history", ledger)

    // Update stock levels
    const updatedInv = [...inventory]
    const idx = updatedInv.findIndex(i => i.item_name.toLowerCase() === form.item_name.toLowerCase())
    const qty = Number(form.quantity)
    
    if (idx > -1) {
      updatedInv[idx].quantity += (form.type === "in" ? qty : -qty)
    } else {
      updatedInv.push({ id: Date.now(), item_name: form.item_name, category: form.category, quantity: qty })
    }
    
    setInventory(updatedInv)
    saveLocalData("chimbo_inventory_ledger", updatedInv)
    pushChimboNotification({
      type: "system",
      title: `Ghala: ${form.type === "in" ? "Imeongezwa" : "Imetolewa"} – ${form.item_name}`,
      body: `Idadi: ${form.quantity}. Mtu: ${form.person || "Haijabainishwa"}. Aina: ${form.category}.`,
      urgent: form.type === "out",
    })
    setTab("inventory")
    setForm({ item_name: "", category: "vifaa", type: "in", quantity: "", person: "", remarks: "", photo: null })
  }

  const filtered = inventory.filter(i => i.item_name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="p-4 space-y-6 pb-20 bg-slate-50 dark:bg-slate-950 transition-colors duration-500 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-900 dark:text-white shadow-sm">
                <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">Ghala Yangu</h1>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest italic">Usimamizi wa Stoo</p>
            </div>
        </div>
        <div className="flex gap-2">
            <button onClick={() => { setTab("inventory"); vibe() }} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${tab === "inventory" ? "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30" : "bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-800"}`}>
                <Package className="w-4 h-4" />
            </button>
            <button onClick={() => { setTab("action"); vibe() }} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${tab === "action" ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30" : "bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-800"}`}>
                <Plus className="w-4 h-4" />
            </button>
        </div>
      </div>

      {tab === "inventory" ? (
        <div className="space-y-6">
            {/* Search */}
            <div className="relative group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 group-focus-within:text-amber-500 transition-colors" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Tafuta kifaa kwenye stoo..."
                    className="w-full h-14 pl-12 pr-6 rounded-[2.5rem] bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 group-focus-within:border-amber-500/50 text-slate-900 dark:text-white text-sm font-bold placeholder:text-slate-400 dark:placeholder:text-slate-600 outline-none shadow-sm transition-all" />
            </div>

            {/* Stock List */}
            <div className="space-y-3">
                {filtered.map(item => (
                    <div key={item.id} className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-white/5 rounded-[2rem] p-6 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                                <Mountain className={`w-6 h-6 ${item.quantity < 5 ? "text-red-500 animate-pulse" : "text-amber-600 dark:text-amber-500/50"}`} />
                            </div>
                            <div>
                                <h4 className="font-black text-slate-900 dark:text-white text-base tracking-tight">{item.item_name}</h4>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{item.category}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className={`text-2xl font-black ${item.quantity < 5 ? "text-red-500" : "text-emerald-600 dark:text-emerald-400"}`}>{item.quantity}</p>
                            <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">Zilizopo</p>
                        </div>
                    </div>
                ))}
            </div>
            
            <button onClick={() => router.push("/chimbo/ghala/history")} className="w-full h-14 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center gap-2 text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-widest hover:border-amber-500/50 hover:text-amber-500 transition-all">
                <History className="w-4 h-4" /> Fungua Daftari la Historia
            </button>
        </div>
      ) : (
        <div className="space-y-6 animate-in slide-in-from-right duration-300">
            {/* In/Out Toggle */}
            <div className="flex gap-3 bg-slate-100/50 dark:bg-slate-900/50 p-1.5 rounded-[2rem] border border-slate-200 dark:border-slate-800">
                <button onClick={() => setForm({...form, type: "in"})}
                    className={`flex-1 h-12 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest transition-all ${form.type === "in" ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20" : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400"}`}>
                    📥 NIMEPOKEA
                </button>
                <button onClick={() => setForm({...form, type: "out"})}
                    className={`flex-1 h-12 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest transition-all ${form.type === "out" ? "bg-red-500 text-white shadow-md shadow-red-500/20" : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400"}`}>
                    📤 NIMETOA
                </button>
            </div>

            <div className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-3xl border border-slate-200 dark:border-white/5 rounded-[2.5rem] p-8 space-y-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl -translate-y-16 translate-x-16" />
                
                <div>
                   <label className="block text-[10px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-widest mb-2 pl-2">Jina la Kitu *</label>
                   <div className="relative">
                      <Tag className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                      <input value={form.item_name} onChange={e => setForm({...form, item_name: e.target.value})}
                        placeholder="Mfano: Mafuta ya Mix"
                        className="w-full h-14 pl-12 pr-6 rounded-[2.5rem] bg-slate-50/50 dark:bg-slate-850 border-2 border-slate-100 dark:border-slate-800 focus:border-amber-500 text-slate-900 dark:text-white font-bold outline-none shadow-inner transition-all" />
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 pl-2">Idadi *</label>
                        <input type="number" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})}
                            placeholder="0"
                            className="w-full h-14 px-6 rounded-[2.5rem] bg-slate-50/50 dark:bg-slate-850 border-2 border-slate-100 dark:border-slate-800 focus:border-amber-500 text-slate-900 dark:text-white font-black text-2xl outline-none shadow-inner transition-all" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 pl-2">Aina</label>
                        <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}
                            className="w-full h-14 px-6 rounded-[2.5rem] bg-slate-50/50 dark:bg-slate-850 border-2 border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white font-black text-[10px] uppercase outline-none shadow-inner transition-all appearance-none cursor-pointer">
                            <option value="vifaa">Vifaa vya Kazi</option>
                            <option value="mafuta">Mafuta</option>
                            <option value="nguo">Nguo za Kinga</option>
                            <option value="chakula">Chakula</option>
                        </select>
                    </div>
                </div>

                <div>
                   <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 pl-2">Mtu Aliyepokea/Kuchukua</label>
                   <div className="relative">
                      <User className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                      <input value={form.person} onChange={e => setForm({...form, person: e.target.value})}
                        placeholder="Nani anahusika?"
                        className="w-full h-14 pl-12 pr-6 rounded-[2.5rem] bg-slate-50/50 dark:bg-slate-850 border-2 border-slate-100 dark:border-slate-800 focus:border-amber-500 text-slate-900 dark:text-white font-bold outline-none shadow-inner transition-all" />
                   </div>
                </div>

                <div>
                   <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 pl-2">Maelezo Kamili</label>
                   <textarea value={form.remarks} onChange={e => setForm({...form, remarks: e.target.value})}
                    placeholder="Sababu ya kutoa au kupokea..."
                    className="w-full p-5 rounded-[2rem] bg-slate-50/50 dark:bg-slate-850 border-2 border-slate-100 dark:border-slate-800 focus:border-amber-500 text-slate-900 dark:text-white font-medium outline-none shadow-inner transition-all resize-none" rows={2} />
                </div>

                {/* Photo Trigger */}
                <div className="space-y-4 pt-2">
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] pl-4">Picha ya Kitu / Risti (Hiari)</label>
                  <div className="bg-slate-50/50 dark:bg-slate-900/30 p-4 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
                    <PhotoUploadField photos={photos} setPhotos={setPhotos} />
                  </div>
                </div>

                <button onClick={handleAction} disabled={!form.item_name || !form.quantity}
                    className={`w-full h-18 rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3 ${form.type === "in" ? "bg-emerald-500 text-slate-950 shadow-emerald-500/30" : "bg-red-600 text-white shadow-red-600/30"}`}>
                    <Save className="w-5 h-5" />
                    {form.type === "in" ? "POKEA GHALANI" : "TOA GHALANI"}
                </button>
            </div>
        </div>
      )}
    </div>
  )
}
