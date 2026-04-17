"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Coins, Calculator, TrendingUp, TrendingDown, Scale, Gem, ChevronLeft, ArrowUpRight } from "lucide-react"

export default function BeiYaDhahabu() {
  const router = useRouter()
  const [weight, setWeight] = useState("")
  const [purity, setPurity] = useState("24K")
  const [history, setHistory] = useState<any[]>([])
  const [price, setPrice] = useState(388500)
  const [change, setChange] = useState(2.3)

  useEffect(() => {
    // Fetch real gold price
    fetch("/api/gold-price")
      .then(res => res.json())
      .then(data => {
        if (data.price) setPrice(data.price)
        if (data.change !== undefined) setChange(data.change)
      })
      .catch(err => console.error("Error fetching gold price:", err))

    setHistory(JSON.parse(localStorage.getItem("chimbo_sales") || "[]"))
  }, [])

  const purityMult: Record<string, number> = { "24K": 1.0, "22K": 0.916, "18K": 0.75 }
  const estimatedValue = (Number(weight) || 0) * price * (purityMult[purity] || 1)


  return (
    <div className="p-4 space-y-6 pb-24">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center">
          <ChevronLeft className="w-5 h-5 text-slate-400" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-tighter">BEI YA DHAHABU</h1>
          <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em]">Soko la Dunia na Karati</p>
        </div>
      </div>

      {/* Live Price */}
      <div className="bg-gradient-to-br from-amber-900 to-amber-950 border border-amber-700/30 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full -mr-10 -mt-10 blur-3xl opacity-50" />
        <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
              <p className="text-[10px] font-black text-amber-400 uppercase tracking-[0.3em]">BEI YA LEO (24K) - LIVE MARKET</p>
            </div>
            <p className="text-5xl font-black text-white tracking-tighter">
                {price.toLocaleString()}<span className="text-sm text-amber-400 ml-1">/ Gramu</span>
            </p>
            <p className="text-[10px] font-bold text-amber-500/50 uppercase italic tracking-widest leading-relaxed">
              Hii ni bei ya soko inayotokana na MetalPrice API. 
              Uzito ni wa Gramu Moja ya dhahabu safi (24K).
            </p>
            <div className={`flex items-center gap-2 ${change >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {change >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                <span className="text-sm font-black uppercase tracking-widest">{change >= 0 ? "+" : ""}{change}% Tangu Jana</span>
            </div>
        </div>
      </div>


      {/* Calculator */}
      <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-6 space-y-6 shadow-2xl">
        <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-amber-500" />
            <span className="text-xs font-black text-white uppercase tracking-widest">Piga Mahesabu (Calculator)</span>
        </div>
        
        <div className="space-y-4">
            <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Scale className="w-3 h-3 text-amber-500" /> Uzito (Gramu)
                </label>
                <input type="number" value={weight} onChange={e => setWeight(e.target.value)}
                    placeholder="0.0"
                    className="w-full h-16 px-4 rounded-[2.5rem] bg-slate-800 border-2 border-slate-700 text-white text-3xl font-black outline-none focus:border-amber-500 transition-all placeholder:text-slate-600 shadow-inner"
                />
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Gem className="w-3 h-3 text-amber-500" /> Usafi (Karati)
                </label>
                <div className="grid grid-cols-3 gap-2">
                    {["24K", "22K", "18K"].map(k => (
                        <button key={k} onClick={() => setPurity(k)}
                            className={`h-14 rounded-2xl font-black text-sm uppercase tracking-widest border-2 transition-all ${purity === k ? "bg-amber-600 border-amber-600 text-white shadow-lg shadow-amber-600/20" : "bg-slate-800 border-slate-700 text-slate-500"}`}>
                            {k}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-[2.5rem] p-6 text-center">
                <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] mb-2">THAMANI YA DHAHABU YAKO</p>
                <p className="text-3xl font-black text-white">TSh {estimatedValue.toLocaleString()}/=</p>
            </div>
        </div>
      </div>

      {/* Sales History */}
      <div className="space-y-4">
          <h3 className="text-sm font-black text-white uppercase tracking-widest ml-1">Mauzo ya Karibuni</h3>
          <div className="space-y-2">
            {history.slice().reverse().slice(0, 3).map((item, idx) => (
                <div key={idx} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                            <ArrowUpRight className="w-5 h-5 text-emerald-500" />
                        </div>
                        <div>
                            <p className="text-xs font-black text-white uppercase">{item.weight} Gramu @ {item.price_per_gram.toLocaleString()}</p>
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{item.buyer_name} • {new Date(item.date).toLocaleDateString("sw-TZ")}</p>
                        </div>
                    </div>
                    <p className="font-black text-emerald-400">+{item.total_amount.toLocaleString()}</p>
                </div>
            ))}
            {history.length === 0 && <p className="text-center text-xs text-slate-600 font-bold italic">"Hujasajili mauzo bado..."</p>}
          </div>
      </div>
    </div>
  )
}
