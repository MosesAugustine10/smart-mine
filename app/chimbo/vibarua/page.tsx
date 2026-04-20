"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  ChevronLeft, Plus, User, Phone, CheckCircle2, 
  Trash2, Search, Briefcase, Users
} from "lucide-react"
import { PhotoUploadField } from "@/components/photo-upload-field"
import { pushChimboNotification } from "@/components/chimbo/chimbo-notifications"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createInvite, getInvites, getActiveAccount, type ChimboInvite } from "@/lib/chimbo-auth"
import { Copy, RefreshCw, Smartphone, Key, Calendar } from "lucide-react"

function getLocalData(key: string) {
  if (typeof window === "undefined") return []
  try { return JSON.parse(localStorage.getItem(key) || "[]") } catch { return [] }
}

function saveLocalData(key: string, data: any[]) {
  localStorage.setItem(key, JSON.stringify(data))
}

export default function VibaruaPage() {
  const router = useRouter()
  const [workers, setWorkers] = useState<any[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [search, setSearch] = useState("")
  
  const [photos, setPhotos] = useState<string[]>([])
  const [newWorker, setNewWorker] = useState({
    name: "",
    role: "mchimba",
    phone: "",
    is_present: true
  })
  
  // Supervisor management
  const [invites, setInvites] = useState<ChimboInvite[]>([])
  const [account, setAccount] = useState<any>(null)
  
  useEffect(() => {
    const acc = getActiveAccount()
    setAccount(acc)
    setInvites(getInvites())
  }, [])

  const handleCreateInvite = () => {
    if (!account) return
    vibe()
    createInvite(account.phone, account.company_id)
    setInvites(getInvites())
  }

  useEffect(() => {
    const data = getLocalData("chimbo_workers")
    setWorkers(data)
  }, [])

  const vibe = () => { if (typeof navigator !== 'undefined') navigator.vibrate?.(40) }

  const toggleAttendance = (id: number) => {
    vibe()
    const updated = workers.map(w => w.id === id ? { ...w, is_present: !w.is_present } : w)
    setWorkers(updated)
    saveLocalData("chimbo_workers", updated)
  }

  const handleAdd = () => {
    if (!newWorker.name) return
    vibe()
    const updated = [{ ...newWorker, photos, id: Date.now() }, ...workers]
    setWorkers(updated)
    saveLocalData("chimbo_workers", updated)
    pushChimboNotification({
      type: "system",
      title: `Kibarua Mpya: ${newWorker.name}`,
      body: `Kazi: ${newWorker.role}. Simu: ${newWorker.phone || "Haijabainishwa"}. Watu sasa: ${updated.length}.`,
      urgent: false,
    })
    setNewWorker({ name: "", role: "mchimba", phone: "", is_present: true })
    setPhotos([])
    setShowAdd(false)
  }

  const deleteWorker = (id: number) => {
    vibe()
    if (!confirm("Je, una uhakika unataka kumfuta huyu?")) return
    const updated = workers.filter(w => w.id !== id)
    setWorkers(updated)
    saveLocalData("chimbo_workers", updated)
  }

  const filtered = workers.filter(w => w.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-500 pb-20">
      <nav className="p-4 flex items-center justify-between bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-amber-500 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-black uppercase text-slate-900 dark:text-white tracking-tighter italic">Vibarua na Watendaji</h1>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none">Usimamizi wa Mahudhurio</p>
          </div>
        </div>
        <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-amber-500" />
        </div>
      </nav>

      <div className="p-4">
        <Tabs defaultValue="vibarua" className="w-full">
          <TabsList className="w-full h-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 rounded-2xl mb-6">
            <TabsTrigger value="vibarua" className="flex-1 rounded-xl text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-amber-500 data-[state=active]:text-slate-950">
              Vibarua (Field Staff)
            </TabsTrigger>
            <TabsTrigger value="supervisors" className="flex-1 rounded-xl text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-amber-500 data-[state=active]:text-slate-950">
              Wasimamizi (Supervisors)
            </TabsTrigger>
          </TabsList>

          <TabsContent value="vibarua" className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex-1 relative group">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-amber-500 transition-colors" />
                 <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Tafuta jina..."
                    className="w-full h-14 pl-12 pr-6 rounded-[2.5rem] bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 font-bold outline-none focus:border-amber-500/50 shadow-sm transition-all text-sm" />
              </div>
              <button onClick={() => { vibe(); setShowAdd(!showAdd) }} 
                className={`h-14 w-14 rounded-2xl flex items-center justify-center shadow-lg transition-all active:scale-95 ${showAdd ? "bg-rose-500 text-white shadow-rose-500/20" : "bg-amber-500 text-slate-950 shadow-amber-500/20"}`}>
                 <Plus className={`w-6 h-6 transition-transform duration-300 ${showAdd ? "rotate-45" : ""}`} />
              </button>
            </div>

            {showAdd && (
              <div className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-3xl p-8 rounded-[2.5rem] border border-slate-200 dark:border-white/5 space-y-6 shadow-2xl animate-in slide-in-from-top duration-300">
                 {/* ... existing add worker UI ... */}
                 <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                        <User className="w-5 h-5 text-slate-950" />
                    </div>
                    <h3 className="text-sm font-black uppercase text-slate-900 dark:text-white italic">Sajili Kibarua Mpya</h3>
                 </div>
                 <div className="space-y-5">
                    <div className="space-y-2">
                       <label className="block text-[10px] font-black uppercase text-slate-500 tracking-widest pl-4">Jina Kamili *</label>
                       <input value={newWorker.name} onChange={e => setNewWorker({...newWorker, name: e.target.value})}
                        placeholder="Weka Jina"
                        className="w-full h-14 px-6 rounded-[2rem] bg-slate-50/50 dark:bg-slate-950/50 border-2 border-slate-100 dark:border-slate-800 font-bold outline-none focus:border-amber-500/50 transition-all shadow-inner" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <label className="block text-[10px] font-black uppercase text-slate-500 tracking-widest pl-4">Kitengo/Role</label>
                          <select value={newWorker.role} onChange={e => setNewWorker({...newWorker, role: e.target.value})}
                              className="w-full h-14 px-6 rounded-[2rem] bg-slate-50/50 dark:bg-slate-950/50 border-2 border-slate-100 dark:border-slate-800 font-bold outline-none focus:border-amber-500/50 transition-all text-xs appearance-none">
                              <option value="mchimba">Mchimba</option>
                              <option value="mkokotoa">Mkokotoa</option>
                              <option value="mshushi">Mshushi</option>
                              <option value="mpigaji">Mpigaji</option>
                          </select>
                       </div>
                       <div className="space-y-2">
                          <label className="block text-[10px] font-black uppercase text-slate-500 tracking-widest pl-4">Simu (Phone)</label>
                          <input value={newWorker.phone} onChange={e => setNewWorker({...newWorker, phone: e.target.value})}
                              placeholder="07..."
                              className="w-full h-14 px-6 rounded-[2rem] bg-slate-50/50 dark:bg-slate-950/50 border-2 border-slate-100 dark:border-slate-800 font-bold outline-none focus:border-amber-500/50 transition-all shadow-inner" />
                       </div>
                    </div>
                    <button onClick={handleAdd} className="w-full h-16 bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 font-black text-xs uppercase rounded-[2rem] shadow-xl shadow-amber-500/10 active:scale-95 transition-all flex items-center justify-center gap-3">
                       <CheckCircle2 className="w-5 h-5" /> HIFADHI KIBARUA SASA
                    </button>
                 </div>
              </div>
            )}

            <div className="space-y-3">
               {filtered.length > 0 ? filtered.map((w: any) => (
                 <div key={w.id} className={`bg-white dark:bg-slate-900 p-5 rounded-[2rem] border-2 transition-all shadow-sm flex items-center justify-between ${w.is_present ? "border-emerald-500/30 shadow-emerald-500/5" : "border-slate-100 dark:border-slate-800/50"}`}>
                    <div className="flex items-center gap-4">
                       <div className="h-16 w-16 rounded-[1.5rem] bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center overflow-hidden shadow-inner shrink-0">
                          {w.photos?.[0] ? <img src={w.photos[0]} className="w-full h-full object-cover" /> : <User className="w-8 h-8 text-slate-300 dark:text-slate-700" />}
                       </div>
                       <div className="min-w-0">
                          <h4 className="font-black text-slate-900 dark:text-white uppercase text-sm tracking-tight truncate">{w.name}</h4>
                          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase flex items-center gap-2">
                             <span className="text-amber-500">{w.role}</span>
                             <span>•</span>
                             <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {w.phone || "No Phone"}</span>
                          </p>
                       </div>
                    </div>
                    <div className="flex items-center gap-1">
                       <button onClick={() => toggleAttendance(w.id)}
                          className={`h-12 px-5 rounded-2xl text-[10px] font-black uppercase transition-all active:scale-90 shadow-sm ${w.is_present ? "bg-emerald-500 text-white shadow-emerald-500/20" : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600"}`}>
                          {w.is_present ? "Tayari" : "Pending"}
                       </button>
                       <button onClick={() => deleteWorker(w.id)} className="h-12 w-12 flex items-center justify-center text-rose-500 hover:bg-rose-500/10 rounded-2xl transition-all">
                          <Trash2 className="w-5 h-5" />
                       </button>
                    </div>
                 </div>
               )) : (
                 <div className="text-center py-20 px-10">
                    <Users className="w-10 h-10 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest italic">Hakuna vibarua.</h3>
                 </div>
               )}
            </div>
          </TabsContent>

          <TabsContent value="supervisors" className="space-y-6">
            <div className="bg-slate-900 rounded-[2.5rem] p-8 border border-white/5 shadow-2xl space-y-6 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl -translate-y-10 translate-x-10" />
               <div className="space-y-2 relative z-10">
                  <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Mwaliko wa Wasimamizi</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                    Generate msimbo (code) wa kumpa msimamizi wako ili aweze kujiunga na mgodi huu. Msimbo utadumu kwa masaa 48.
                  </p>
               </div>
               <button onClick={handleCreateInvite} className="h-16 w-full bg-amber-500 text-slate-950 font-black uppercase text-xs rounded-2xl shadow-xl shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-3">
                  <RefreshCw className="w-5 h-5" /> GENERATE INVITATION CODE
               </button>
            </div>

            <div className="space-y-4">
               <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-4">Mialiko Inayotumika</h3>
               {invites.length > 0 ? invites.filter((i: any) => !i.used && new Date(i.expires_at) > new Date()).map((i: any) => (
                 <div key={i.code} className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 p-6 rounded-[2.2rem] flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                          <Key className="w-6 h-6 text-amber-500" />
                       </div>
                       <div>
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">INVITE CODE</p>
                          <p className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] font-mono">{i.code}</p>
                       </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-2">
                       <button onClick={() => { vibe(); navigator.clipboard.writeText(i.code) }} className="h-10 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-[10px] font-black uppercase text-slate-600 dark:text-slate-400 hover:text-amber-500 transition-colors flex items-center gap-2">
                          <Copy className="w-3.5 h-3.5" /> NAKILI
                       </button>
                       <p className="text-[8px] font-bold text-slate-400 uppercase flex items-center gap-1 leading-none">
                          <Calendar className="w-2.5 h-2.5" /> {new Date(i.expires_at).toLocaleDateString()}
                       </p>
                    </div>
                 </div>
               )) : (
                 <div className="bg-slate-50 dark:bg-slate-900/40 p-10 rounded-[2.2rem] border-2 border-dashed border-slate-200 dark:border-slate-800 text-center">
                    <Smartphone className="w-10 h-10 text-slate-300 mx-auto mb-4 opacity-50" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hakuna mialiko inayotumika. Bonyeza "Generate" kuanza.</p>
                 </div>
               )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
