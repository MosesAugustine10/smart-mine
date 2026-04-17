"use client"

import React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Mountain, ArrowRight, CheckCircle2, 
  Users, HardHat, Phone, Zap, ShieldCheck, Loader2, Menu, X,
  TrendingUp, BarChart3, Pickaxe, Map, BookOpen, Clock, Activity, Target, Truck
} from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { HeroSlider } from "@/components/hero-slider"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

// ─── Landing Page Form Component ──────────────────────────────────────────────
export const FormWrapper = ({ vibe }: { vibe: () => void }) => {
  const [loading, setLoading] = React.useState(false)
  const [success, setSuccess] = React.useState(false)
  const [formData, setFormData] = React.useState({
    name: "",
    phone: "",
    type: "Mchimbaji Mdogo",
    message: ""
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (vibe) vibe()
    setLoading(true)
    
    try {
      const supabase = getSupabaseBrowserClient()
      const { error } = await supabase
        .from('contact_submissions')
        .insert([{
          full_name: formData.name,
          phone_number: formData.phone,
          company_type: formData.type,
          message: formData.message
        }])

      if (error) throw error
      setSuccess(true)
    } catch (err: any) {
      alert("Samahani, kosa limetokea: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  if (success) return (
    <div className="py-10 text-center space-y-4 animate-in fade-in zoom-in duration-500">
      <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
        <CheckCircle2 className="w-10 h-10 text-emerald-600" />
      </div>
      <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Hongera!</h3>
      <p className="text-sm font-bold text-slate-500">Tumepokea ombi lako. Tutakupigia hivi punde.</p>
      <Button onClick={() => setSuccess(false)} variant="ghost" className="text-[10px] font-black uppercase text-slate-400">Tuma Ombi Jingine</Button>
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-4">Majina Kamili</label>
          <input required onClick={vibe} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Mfano: Juma Ramadhani" className="w-full h-14 px-6 rounded-2xl bg-accent border-0 text-sm font-bold placeholder:text-muted-foreground outline-none focus:ring-2 ring-amber-500 transition-all text-foreground" />
      </div>
      <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-4">Namba ya Simu</label>
          <input required onClick={vibe} value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="Mfano: 0712 345 678" className="w-full h-14 px-6 rounded-2xl bg-accent border-0 text-sm font-bold placeholder:text-muted-foreground outline-none focus:ring-2 ring-amber-500 transition-all text-foreground" />
      </div>
      <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-4">Aina ya Mgodi</label>
          <select required value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full h-14 px-6 rounded-2xl bg-accent border-0 text-xs font-black uppercase tracking-widest text-foreground outline-none focus:ring-2 ring-amber-500 transition-all appearance-none cursor-pointer">
              <option>Mchimbaji Mdogo</option>
              <option>Mgodi wa Kati</option>
              <option>Mkandarasi / Drilling</option>
              <option>Mshauri (Consultant)</option>
          </select>
      </div>
      <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-4">Ujumbe (Optional)</label>
          <textarea onClick={vibe} value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} placeholder="Andika kama una maelekezo ya ziada..." className="w-full h-24 px-6 py-4 rounded-2xl bg-accent border-0 text-sm font-bold placeholder:text-muted-foreground outline-none focus:ring-2 ring-amber-500 transition-all resize-none text-foreground" />
      </div>
      <Button type="submit" disabled={loading} className="w-full h-16 bg-foreground hover:bg-foreground/90 text-background font-black text-sm uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-foreground/10 active:scale-95 transition-all">
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "TUMA MAOMBI SASA"}
      </Button>
    </form>
  )
}

// ─── Main Landing Page Component ──────────────────────────────────────────────
export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false)
  const vibe = () => { if (typeof navigator !== 'undefined') navigator.vibrate?.(50) }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground selection:bg-amber-500/30">
      <header className="px-6 h-20 flex items-center border-b border-border sticky top-0 bg-background/80 backdrop-blur-xl z-50 justify-between">
        <Link className="flex items-center gap-3 group" href="/" onClick={vibe}>
          <div className="h-10 w-10 rounded-2xl bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Mountain className="h-6 w-6 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-2xl tracking-tighter uppercase text-foreground leading-none">
              SMART <span className="text-amber-500">MINE</span>
            </span>
            <span className="text-[7px] font-bold text-muted-foreground uppercase tracking-widest leading-none mt-1">(Mfumo wa Kisasa wa Kusimamia Mgodi)</span>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button 
            className="md:hidden p-2 text-foreground" 
            onClick={() => { setIsMenuOpen(!isMenuOpen); vibe(); }}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="#discover" onClick={vibe} className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-amber-500 transition-colors">Gundua Mfumo / Discover</Link>
          <Link href="#pricing" onClick={vibe} className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-amber-400 transition-colors">Bei Yetu</Link>
          <Link href="#contact" onClick={vibe} className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-amber-400 transition-colors">Mawasiliano</Link>
          <div className="h-4 w-[1px] bg-border" />
          <div className="flex items-center gap-2">
            <Link href="/chimbo" onClick={vibe}>
              <Button variant="outline" className="h-9 px-4 text-[9px] font-black uppercase tracking-widest border-amber-500/40 text-amber-500 hover:bg-amber-500 hover:text-slate-950 transition-all rounded-xl">Ingia: Wadogo</Button>
            </Link>
            <Link href="/auth/login" onClick={vibe}>
              <Button className="h-9 px-4 text-[9px] font-black uppercase tracking-widest bg-foreground text-background hover:bg-foreground/90 transition-all rounded-xl">Ingia: Kati</Button>
            </Link>
          </div>
        </nav>

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <div className="absolute top-20 left-0 w-full bg-background border-b border-border p-6 flex flex-col gap-6 md:hidden animate-in slide-in-from-top duration-300 z-40">
            <Link href="#discover" onClick={() => { setIsMenuOpen(false); vibe(); }} className="text-xs font-black uppercase tracking-widest text-foreground py-2 border-b border-border/50">Gundua Mfumo</Link>
            <Link href="#pricing" onClick={() => { setIsMenuOpen(false); vibe(); }} className="text-xs font-black uppercase tracking-widest text-foreground py-2 border-b border-border/50">Bei Yetu</Link>
            <Link href="#contact" onClick={() => { setIsMenuOpen(false); vibe(); }} className="text-xs font-black uppercase tracking-widest text-foreground py-2 border-b border-border/50">Mawasiliano</Link>
            <div className="flex flex-col gap-3 pt-2">
              <Link href="/chimbo" onClick={vibe}>
                <Button variant="outline" className="w-full h-12 text-[10px] font-black uppercase tracking-widest border-amber-500 text-amber-500 rounded-xl">Ingia: Wachimbaji Wadogo</Button>
              </Link>
              <Link href="/auth/login" onClick={vibe}>
                <Button className="w-full h-12 text-[10px] font-black uppercase tracking-widest bg-foreground text-background rounded-xl">Ingia: Migodi ya Kati</Button>
              </Link>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        {/* ── SPLIT-SCREEN HERO: Left = Slider | Right = Content ── */}
          <section className="flex flex-col md:flex-row md:h-[calc(100vh-5rem)] overflow-hidden">

          {/* ── LEFT HALF: Image Slider ── */}
          <div className="relative w-full md:w-1/2 h-[45vh] md:h-full flex-shrink-0 overflow-hidden">
            <HeroSlider />
          </div>

          {/* ── RIGHT HALF: All Text Content — solid bg, never affected by slider ── */}
          <div className="w-full md:w-1/2 flex flex-col justify-center px-8 md:px-14 py-12 bg-background overflow-y-auto flex-shrink-0">
            <Badge variant="outline" className="self-start px-5 py-2 border-amber-500/50 bg-amber-500/10 text-amber-500 text-[10px] font-black uppercase tracking-[0.3em] rounded-full mb-8">
              Soko la Kwanza la Madini Tanzania
            </Badge>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter leading-[0.88] uppercase italic mb-6 text-foreground">
              Simamia Mgodi Wako <br />
              <span className="text-amber-500 not-italic">Kwa Urahisi.</span>
            </h1>

            <p className="text-base md:text-lg text-muted-foreground font-medium leading-relaxed mb-10 max-w-lg">
              Mfumo wa kwanza Tanzania kuwasaidia{" "}
              <span className="text-foreground font-bold">Wachimbaji Wadogo</span> na{" "}
              <span className="text-foreground font-bold">Migodi ya Kati</span>{" "}
              kujua Gharama, Mauzo, na Usalama kwa simu yako.
            </p>

            {/* CTA Cards */}
            <div className="grid sm:grid-cols-2 gap-5">
              {/* Small Scale */}
              <div className="group flex flex-col bg-card border-2 border-border rounded-3xl p-7 hover:border-amber-500/60 hover:shadow-xl hover:shadow-amber-500/10 transition-all duration-500">
                <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-3">Wachimbaji Wadogo</p>
                <ul className="space-y-2 mb-6 flex-1">
                  {["Shimo Leo & Uzalishaji", "Kipeleka Mche & Osha", "Bei ya Dhahabu Leo"].map(item => (
                    <li key={item} className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> {item}
                    </li>
                  ))}
                </ul>
                <Link href="/chimbo" onClick={vibe}>
                  <Button className="w-full h-12 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl">
                    PAKUA APP YA SHIMO
                  </Button>
                </Link>
              </div>

              {/* Medium Scale */}
              <div className="group flex flex-col bg-card border-2 border-border rounded-3xl p-7 hover:border-blue-500/60 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-500">
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-3">Migodi ya Kati</p>
                <ul className="space-y-2 mb-6 flex-1">
                  {["Enterprise ERP Dashboards", "Advanced Fleet Analytics", "ISO Safety Reporting"].map(item => (
                    <li key={item} className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0" /> {item}
                    </li>
                  ))}
                </ul>
                <Link href="#contact" onClick={vibe}>
                  <Button className="w-full h-12 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-widest rounded-xl">
                    OMBA USAJILI
                  </Button>
                </Link>
              </div>
            </div>

            {/* Bottom nav link */}
            <div className="flex items-center gap-6 mt-8">
              <Link href="#pricing" onClick={vibe} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-amber-500 transition-colors">
                <ArrowRight className="w-3 h-3" /> Bei Yetu
              </Link>
              <Link href="#contact" onClick={vibe} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-amber-500 transition-colors">
                <ArrowRight className="w-3 h-3" /> Wasiliana Nasi
              </Link>
            </div>
          </div>

        </section>

        <section id="discover" className="py-32 bg-card/30 border-t border-border">
          <div className="container px-6 mx-auto">
            <div className="text-center mb-20">
              <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.3em] mb-4">SMART MINE MODULES</Badge>
              <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter italic text-foreground mb-4">Gundua Ndani ya Mfumo /<br /><span className="text-muted-foreground not-italic">Discover the Platform</span></h2>
              <p className="text-sm font-medium text-muted-foreground max-w-2xl mx-auto">Tunatoa masuluhisho bora maalum kwa ukubwa wa mgodi wako. / We provide tailored industrial solutions based on the scale of your operations.</p>
            </div>

            <div className="grid lg:grid-cols-2 gap-16 max-w-6xl mx-auto">
              {/* KISWAHILI: Small Scale */}
              <div className="space-y-8">
                 <div className="border-b-2 border-amber-500 pb-4">
                    <h3 className="text-2xl font-black uppercase tracking-tighter text-amber-500 flex items-center gap-3">
                       <Pickaxe className="w-6 h-6" /> Moduli za Wachimbaji Wadogo
                    </h3>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-2">Imeundwa Maalum Kuongeza Faida Haraka</p>
                 </div>
                 <div className="grid gap-4">
                    {[
                      { icon: TrendingUp, title: "1. Uzalishaji na Mauzo (Production)", desc: "Rekodi shimo linalotoa mzigo, idadi ya marumbesa yanayoingia kwenye josho, mpaka gramu za dhahabu zilizopatikana sokoni." },
                      { icon: BarChart3, title: "2. Matumizi na Ripoti (Finance & Cashbook)", desc: "Andika matumizi yako yote kama mafuta na vyakula kisha mfumo utakokotoa faida yako halisi (Net Profit) moja kwa moja." },
                      { icon: HardHat, title: "3. Usimamizi wa Vibarua (Personnel)", desc: "Dhibiti na fuatilia mahudhurio ya vibarua: ukubwa wa kazi waliofanya, lini walifanya, na kama wameshalipwa." },
                      { icon: ShieldCheck, title: "4. Usalama wa Mgodi (Safety/HSSE)", desc: "Ripoti hatari yoyote mgodini mara inapotokea (ajali au hitilafu) na uweke hatua zilizochukuliwa kulinda watu." },
                      { icon: Zap, title: "5. Ghala na Zana (Inventory)", desc: "Fuatilia nondo za drill, jackhammers, mafuta, na mabomu. Jua mara moja kipi kinaenda kuisha ili ununue mapema." }
                    ].map((m, i) => (
                       <div key={i} className="flex gap-4 p-5 rounded-2xl bg-card border-2 border-border hover:border-amber-500/50 shadow-sm transition-all hover:-translate-y-1">
                          <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                             <m.icon className="w-6 h-6 text-amber-500" />
                          </div>
                          <div>
                            <h4 className="text-sm font-black uppercase tracking-tight text-foreground">{m.title}</h4>
                            <p className="text-xs font-bold text-muted-foreground leading-relaxed mt-1">{m.desc}</p>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>

              {/* ENGLISH: Medium Scale */}
              <div className="space-y-8">
                 <div className="border-b-2 border-blue-500 pb-4">
                    <h3 className="text-2xl font-black uppercase tracking-tighter text-blue-500 flex items-center gap-3">
                       <Target className="w-6 h-6" /> Medium Scale Enterprise
                    </h3>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-2">Data-Driven Industrial Operations</p>
                 </div>
                 <div className="grid gap-4">
                    {[
                      { icon: Activity, title: "1. Drilling & Blasting Analytics", desc: "Plan, execute, and analyze rig telemetry, explosive consumption, and fragmentation metrics with robust offline-first form tracking." },
                      { icon: Map, title: "2. Geophysics & Core Logging", desc: "Extensive reporting tools tailored for exploration, diamond drilling RQDs, trench sampling, and centralized geological laboratory assays." },
                      { icon: Truck, title: "3. Fleet & Heavy Machinery", desc: "Complete oversight over quarry haulage, certified payload tracking, automated maintenance scheduling, and fuel delivery logistics." },
                      { icon: BookOpen, title: "4. Material Flow & Enterprise Inventory", desc: "A true ERP-level warehouse system. Track capital stock, fast-moving consumables (FMCG), and track transactions across multiple pit locations." },
                      { icon: Clock, title: "5. Financial Invoicing System", desc: "Fully automated, ISO-compliant invoice generators handling dynamic VAT matrices to bill exploration and extraction sub-contractors." }
                    ].map((m, i) => (
                       <div key={i} className="flex gap-4 p-5 rounded-2xl bg-card border-2 border-border hover:border-blue-500/50 shadow-sm transition-all hover:-translate-y-1">
                          <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                             <m.icon className="w-6 h-6 text-blue-500" />
                          </div>
                          <div>
                            <h4 className="text-sm font-black uppercase tracking-tight text-foreground">{m.title}</h4>
                            <p className="text-xs font-bold text-muted-foreground leading-relaxed mt-1">{m.desc}</p>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>
            </div>
          </div>
        </section>

        <section id="pricing" className="py-32 bg-accent/30 border-t border-border">
          <div className="container px-6 mx-auto">
            <div className="text-center mb-20">
                <Badge className="bg-accent text-muted-foreground border-border px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.3em] mb-4">Gharama za Mfumo</Badge>
                <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter italic text-foreground">Bei Inayoeleweka.</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                {[
                    { name: "Mchimbaji Mdogo", price: "Kuanzia TSh 15,000", period: "/Mwezi", features: ["15 Modules Simplified", "Offline Support", "Gold Price Calculator", "Daily SMS Reports"], cta: "Anza Bure Siku 30", route: "/chimbo" },
                    { name: "Mgodi wa Kati", price: "Kuanzia TSh 2,000,000", period: "/Mwaka", features: ["Full ERP Suite", "Unlimited Users", "Asset Telemetry", "Advanced Finance"], highlight: true, cta: "Ongea na Mauzo", route: "#contact" },
                    { name: "Consultant / Contractor", price: "Kuanzia TSh 650,000", period: "/Mwaka", features: ["Drilling/Blasting Only", "Read-Only Access", "Technical Audits", "Multi-Project Support"], cta: "Omba Usajili", route: "#contact" }
                ].map((tier, i) => (
                    <div key={i} className={`relative p-10 rounded-[2.5rem] border-2 flex flex-col ${tier.highlight ? "bg-amber-500 border-amber-600 shadow-2xl" : "bg-card/50 border-border"}`}>
                        <h3 className={`text-xl font-black uppercase tracking-tighter mb-2 ${tier.highlight ? "text-slate-950" : "text-foreground"}`}>{tier.name}</h3>
                        <div className="flex items-baseline gap-1 mb-8">
                            <span className={`text-4xl font-black tracking-tight ${tier.highlight ? "text-slate-950" : "text-foreground"}`}>{tier.price}</span>
                            <span className={`text-sm font-bold ${tier.highlight ? "text-slate-900/60" : "text-muted-foreground"}`}>{tier.period}</span>
                        </div>
                        <ul className="space-y-4 mb-10 flex-1">
                            {tier.features.map(f => (
                                <li key={f} className={`flex items-center gap-3 text-sm font-bold ${tier.highlight ? "text-slate-900" : "text-muted-foreground"}`}>
                                    <CheckCircle2 className={`w-4 h-4 ${tier.highlight ? "text-slate-950" : "text-emerald-500"}`} /> {f}
                                </li>
                            ))}
                        </ul>
                        <Link href={tier.route} onClick={vibe}>
                            <Button className={`w-full h-14 rounded-2xl font-black text-xs uppercase tracking-widest ${tier.highlight ? "bg-slate-950 hover:bg-slate-900 text-white" : "bg-accent hover:bg-accent/80 text-foreground"}`}>{tier.cta}</Button>
                        </Link>
                    </div>
                ))}
            </div>
          </div>
        </section>

        <section id="contact" className="py-32 border-t border-border">
            <div className="container px-6 mx-auto">
                <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-16 items-center">
                    <div className="flex-1 space-y-8 text-left">
                        <h2 className="text-5xl font-black uppercase tracking-tighter leading-none italic text-foreground">Anza Safari ya <br /><span className="text-amber-500 not-italic">Kidijitali Leo.</span></h2>
                        <p className="text-muted-foreground text-lg font-medium leading-relaxed">Wasiliana na timu yetu ya wataalamu upate akaunti ya mgodi wako au uombe maelezo zaidi kuhusu jinsi SMART MINE inaweza kuongeza faida yako.</p>
                    </div>
                    <div className="w-full md:w-[450px] bg-card border-2 border-border rounded-[3rem] p-10 text-foreground space-y-6 shadow-2xl relative overflow-hidden">
                        <h3 className="text-2xl font-black uppercase tracking-tighter">Omba Usajili</h3>
                        <FormWrapper vibe={vibe} />
                    </div>
                </div>
            </div>
        </section>
      </main>

      <a href="https://wa.me/255623310006?text=Habari! Nahitaji maelezo zaidi kuhusu mfumo wa SMART MINE." 
         target="_blank" rel="noreferrer" onClick={vibe}
         className="fixed bottom-8 right-8 z-[100] group">
          <div className="absolute inset-0 bg-emerald-500 rounded-2xl animate-ping opacity-20 scale-150" />
          <div className="relative w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-2xl">
              <svg className="w-9 h-9 text-white fill-current" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.301-.15-1.767-.872-2.04-.971-.272-.099-.47-.15-.667.15-.198.301-.765.971-.937 1.171-.173.199-.346.223-.647.073-.3-.15-1.267-.467-2.413-1.49-.893-.797-1.495-1.782-1.67-2.083-.174-.301-.019-.464.131-.613.136-.134.3-.349.451-.523.15-.174.2-.3.3-.5.1-.199.05-.373-.025-.523-.075-.15-.667-1.609-.914-2.204-.24-.579-.481-.5-.667-.51-.183-.01-.39-.01-.597-.01-.206 0-.542.077-.825.385-.282.308-1.078 1.055-1.078 2.571 0 1.516 1.102 2.984 1.256 3.189.155.205 2.169 3.313 5.255 4.646.733.316 1.306.505 1.751.647.737.234 1.408.201 1.938.122.59-.088 1.815-.742 2.072-1.46.257-.718.257-1.332.18-1.46-.077-.128-.282-.204-.583-.355zM12.012 2c-5.523 0-10 4.477-10 10 0 1.777.472 3.444 1.294 4.891l-1.306 4.859 4.981-1.308c1.406.772 3.016 1.211 4.722 1.211 5.523 0 10-4.477 10-10s-4.477-10-10-10zm0 2c4.411 0 8 3.589 8 8s-3.589 8-8 8c-1.503 0-2.903-.419-4.102-1.144L6.15 19.82l.966-3.606C6.319 14.986 5.86 13.548 5.86 12c0-4.411 3.589-8 8-8z" />
              </svg>
          </div>
      </a>

      <footer className="py-20 border-t border-border bg-background">
        <div className="container px-6 mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-12">
            <Link className="flex items-center gap-3" href="/" onClick={vibe}>
              <div className="h-8 w-8 rounded-xl bg-accent flex items-center justify-center">
                <Mountain className="h-5 w-5 text-foreground" />
              </div>
              <span className="font-black text-sm tracking-tight text-foreground uppercase italic">SMART <span className="text-amber-500">MINE</span></span>
            </Link>
            <div className="flex items-center gap-6">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">© 2026 Smart Mine Tanzania. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}