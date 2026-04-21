"use client"

import React, { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Mountain, ArrowRight, CheckCircle2, 
  Users, HardHat, Phone, Zap, ShieldCheck, Loader2, Menu, X,
  TrendingUp, BarChart3, Pickaxe, Map, BookOpen, Clock, Activity, Target, Truck,
  Smartphone, MessageSquare, ClipboardCheck, Package, 
  Compass, LayoutDashboard
} from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import dynamic from "next/dynamic"

const HeroSlider = dynamic(() => import("@/components/hero-slider").then(m => m.HeroSlider), { 
  ssr: false,
  loading: () => <div className="w-full h-full bg-slate-900 animate-pulse" />
})

// ─── Contact Form Component ──────────────────────────────────────────────
export const ContactForm = ({ vibe }: { vibe: () => void }) => {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    company: "",
    type: "Mchimbaji Mdogo",
    modules: [] as string[],
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
          company_name: formData.company,
          business_type: formData.type,
          modules_needed: formData.modules.join(", "),
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
      <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Hongera!</h3>
      <p className="text-sm font-bold text-slate-500">Tumepokea ombi lako. Tutakupigia hivi punde.</p>
      <Button onClick={() => setSuccess(false)} variant="ghost" className="text-[10px] font-black uppercase text-slate-400">Tuma Ombi Jingine</Button>
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-4">Majina Kamili *</label>
          <input required onClick={vibe} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Mfano: Juma Ramadhani" className="w-full h-12 px-6 rounded-2xl bg-accent border-0 text-sm font-bold placeholder:text-muted-foreground outline-none focus:ring-2 ring-amber-500 transition-all text-foreground" />
      </div>
      <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-4">Namba ya Simu *</label>
          <input required onClick={vibe} value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="Mfano: 0712 345 678" className="w-full h-12 px-6 rounded-2xl bg-accent border-0 text-sm font-bold placeholder:text-muted-foreground outline-none focus:ring-2 ring-amber-500 transition-all text-foreground" />
      </div>
      <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-4">Jina la Kampuni (Optional)</label>
          <input onClick={vibe} value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} placeholder="Mfano: Mwanza Mines Ltd" className="w-full h-12 px-6 rounded-2xl bg-accent border-0 text-sm font-bold placeholder:text-muted-foreground outline-none focus:ring-2 ring-amber-500 transition-all text-foreground" />
      </div>
      <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-4">Aina ya Biashara *</label>
          <select required value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full h-12 px-6 rounded-2xl bg-accent border-0 text-xs font-black uppercase tracking-widest text-foreground outline-none focus:ring-2 ring-amber-500 transition-all appearance-none cursor-pointer">
              <option>Mchimbaji Mdogo</option>
              <option>Mgodi wa Kati</option>
              <option>Mkandarasi</option>
              <option>Mshauri</option>
              <option>Mengineyo</option>
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
  const whatsappLink = "https://wa.me/255623310006?text=Habari! Nahitaji maelezo zaidi kuhusu mfumo wa SMART MINE."

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
        <nav className="hidden lg:flex items-center gap-6">
          <Link href="#modules" onClick={vibe} className="text-[8px] xl:text-[9px] font-black uppercase tracking-[0.15em] xl:tracking-[0.2em] text-muted-foreground hover:text-amber-500 transition-colors">Modules</Link>
          <Link href="#how-it-works" onClick={vibe} className="text-[8px] xl:text-[9px] font-black uppercase tracking-[0.15em] xl:tracking-[0.2em] text-muted-foreground hover:text-amber-500 transition-colors">Jinsi Inavyofanya Kazi</Link>
          <Link href="#contact" onClick={vibe} className="text-[8px] xl:text-[9px] font-black uppercase tracking-[0.15em] xl:tracking-[0.2em] text-muted-foreground hover:text-amber-400 transition-colors">Mawasiliano</Link>
          <div className="h-4 w-[1px] bg-border" />
          {/* Login button hidden as requested */}
          {/* 
          <div className="flex items-center gap-2">
            <Link href="/login" onClick={vibe}>
              <Button className="h-10 px-6 text-[10px] font-black uppercase tracking-widest bg-foreground text-background hover:bg-foreground/90 transition-all rounded-xl">INGIA MFUMONI</Button>
            </Link>
          </div>
          */}
        </nav>

        {isMenuOpen && (
          <div className="absolute top-20 left-0 w-full bg-background border-b border-border p-6 flex flex-col gap-6 lg:hidden animate-in slide-in-from-top duration-300 z-40">
            <Link href="#modules" onClick={() => { setIsMenuOpen(false); vibe(); }} className="text-xs font-black uppercase tracking-widest text-foreground py-2 border-b border-border/50">Modules</Link>
            <Link href="#how-it-works" onClick={() => { setIsMenuOpen(false); vibe(); }} className="text-xs font-black uppercase tracking-widest text-foreground py-2 border-b border-border/50">Jinsi Inavyofanya Kazi</Link>
            <Link href="#contact" onClick={() => { setIsMenuOpen(false); vibe(); }} className="text-xs font-black uppercase tracking-widest text-foreground py-2 border-b border-border/50">Mawasiliano</Link>
            {/* Mobile login button hidden as requested */}
            {/* 
            <div className="flex flex-col gap-3 pt-2">
              <Link href="/login" onClick={vibe}>
                <Button className="w-full h-12 text-[10px] font-black uppercase tracking-widest bg-foreground text-background rounded-xl">INGIA MFUMONI</Button>
              </Link>
            </div>
            */}
          </div>
        )}
      </header>

      <main className="flex-1">
        {/* ── HERO SECTION ── */}
        <section className="flex flex-col md:flex-row min-h-[calc(100vh-5rem)] overflow-hidden">
          {/* LEFT HALF: Slider */}
          <div className="relative w-full md:w-1/2 h-[40vh] md:h-auto flex-shrink-0 overflow-hidden">
            <HeroSlider />
          </div>

          {/* RIGHT HALF: Content */}
          <div className="w-full md:w-1/2 flex flex-col justify-center px-8 md:px-16 py-16 bg-background">
            <Badge variant="outline" className="self-start px-5 py-2 border-amber-500/50 bg-amber-500/10 text-amber-500 text-[10px] font-black uppercase tracking-[0.3em] rounded-full mb-8">
              SMART MINE TANZANIA
            </Badge>

            <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.88] uppercase italic mb-4 text-foreground">
              SMART MINE
            </h1>
            <h2 className="text-xl md:text-2xl font-bold text-amber-500 uppercase tracking-tight mb-6 italic">
              Mfumo Kamili wa Kusimamia Mgodi Wako
            </h2>

            <p className="text-lg text-muted-foreground font-medium leading-relaxed mb-10 max-w-lg">
              Tunakusanikia mfumo wa kisasa unaofaa biashara yako, ukubwa wake, na lugha yako ili uweze kusimamia mgodi wako bila usumbufu.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <a href={whatsappLink} target="_blank" rel="noreferrer" onClick={vibe} className="flex-1">
                <Button className="w-full h-16 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-emerald-500/10 flex items-center justify-center gap-3">
                  <MessageSquare className="w-5 h-5" /> WASILIANA NASI (WHATSAPP)
                </Button>
              </a>
              <Link href="#contact" onClick={vibe} className="flex-1">
                <Button variant="outline" className="w-full h-16 border-2 border-border font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-accent">
                  JAZA FOMU
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* ── MODULES GRID SECTION ── */}
        <section id="modules" className="py-24 bg-card/30 border-t border-border">
          <div className="container px-6 mx-auto">
            <div className="text-center mb-16">
              <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.3em] mb-4">SMART MINE ECOSYSTEM</Badge>
              <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter italic text-foreground mb-4">MODULES ZINAZOPATIKANA KWENYE SMART MINE</h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
              {[
                { label: "Shimo Leo (Pit Production)", icon: Pickaxe },
                { label: "Jackhammer (Drilling)", icon: Zap },
                { label: "Kulipua Mwamba (Blasting)", icon: Activity },
                { label: "Kutafuta Mshipa (Diamond Drilling)", icon: Compass },
                { label: "Matokeo ya Maabara (Assay Results)", icon: FlaskConical },
                { label: "Usafirishaji (Material Handling)", icon: Truck },
                { label: "Fleet Management (Mitambo na Magari)", icon: LayoutDashboard },
                { label: "Ghala (Inventory)", icon: Package },
                { label: "Mauzo (Sales)", icon: TrendingUp },
                { label: "Matumizi (Expenses)", icon: BarChart3 },
                { label: "Ajali (Safety Incidents)", icon: ShieldCheck },
                { label: "Mafuta (Fuel Management)", icon: Phone },
                { label: "Vibarua (Workers)", icon: Users },
                { label: "Ramani ya Shamba (Mine Map)", icon: Map },
                { label: "Ripoti (Reports)", icon: ClipboardCheck },
              ].map((m, i) => (
                <div key={i} className="flex flex-col items-center justify-center p-6 bg-card border-2 border-border rounded-[2rem] hover:border-amber-500/50 hover:shadow-xl transition-all group">
                   <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      {m.icon ? <m.icon className="w-6 h-6 text-amber-500" /> : <Pickaxe className="w-6 h-6 text-amber-500" />}
                   </div>
                   <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-center">{m.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS SECTION ── */}
        <section id="how-it-works" className="py-24 border-t border-border">
          <div className="container px-6 mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter italic text-foreground mb-4 font-mono">JINSI INAVYOFANYA KAZI</h2>
            </div>

            <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
              {[
                { step: "01", title: "WASILIANA NASI", desc: "Tuambie mahitaji yako kupitia WhatsApp au Fomu.", icon: MessageSquare },
                { step: "02", title: "CHAGUA MODULES", desc: "Tutakusaidia kuchagua modules zinazofaa biashara yako.", icon: ClipboardCheck },
                { step: "03", title: "PATA MFUMO WAKO", desc: "Tunakusanikia mfumo wako na kukupa mafunzo.", icon: Smartphone },
              ].map((s, i) => (
                <div key={i} className="relative p-8 bg-accent/20 rounded-[3rem] border border-border/50 text-center space-y-4">
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 rounded-2xl bg-foreground text-background flex items-center justify-center font-black text-lg">{s.step}</div>
                  <div className="w-16 h-16 rounded-3xl bg-amber-500/10 flex items-center justify-center mx-auto mb-2 text-amber-500">
                    <s.icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-black uppercase tracking-tight">{s.title}</h3>
                  <p className="text-sm font-medium text-muted-foreground leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CONTACT SECTION ── */}
        <section id="contact" className="py-24 border-t border-border bg-slate-900 text-white">
            <div className="container px-6 mx-auto">
                <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-16 items-center">
                    <div className="flex-1 space-y-8 text-left">
                        <Badge className="bg-amber-500 text-slate-950 font-black px-4 py-1.5 uppercase tracking-widest text-[10px]">TUKO TAYARI KUKUSAIDIA</Badge>
                        <h2 className="text-5xl font-black uppercase tracking-tighter leading-none italic">Anza Kuranishi <br /><span className="text-amber-500 not-italic">Mgodi Wako Leo!</span></h2>
                        <p className="text-slate-400 text-lg font-medium leading-relaxed">Kuwa na mfumo bora wa usimamizi ni hatua ya kwanza kuelekea ukuaji wa biashara yako ya madini. SMART MINE imejengwa kukuhudumia popote ulipo.</p>
                        
                        <div className="space-y-4 pt-6">
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center"><Phone className="w-5 h-5 text-amber-500" /></div>
                              <span className="font-bold">+255 623 310 006</span>
                           </div>
                           <a href={whatsappLink} target="_blank" rel="noreferrer" className="flex items-center gap-4 group cursor-pointer hover:bg-white/5 p-2 rounded-2xl transition-all">
                              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <MessageSquare className="w-6 h-6 text-emerald-500" />
                              </div>
                              <div className="flex flex-col">
                                <span className="font-black text-xs uppercase tracking-widest">Chat on WhatsApp</span>
                                <span className="text-[10px] text-slate-500 font-bold uppercase">BONYEZA KUANZA MAZUNGUMZO →</span>
                              </div>
                           </a>
                        </div>
                    </div>
                    <div className="w-full md:w-[500px] bg-background border-4 border-white/5 rounded-[4rem] p-10 text-foreground space-y-6 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-2 bg-amber-500" />
                        <h3 className="text-2xl font-black uppercase tracking-tighter italic">Oaza Maelezo / Usajili</h3>
                        <ContactForm vibe={vibe} />
                    </div>
                </div>
            </div>
        </section>
      </main>

      <a href={whatsappLink} 
         target="_blank" rel="noreferrer" onClick={vibe}
         className="fixed bottom-8 right-8 z-[100] group flex items-center gap-3">
          <div className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0">
             Wasiliana Nasi (WhatsApp)
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-emerald-500 rounded-2xl animate-ping opacity-20 scale-150" />
            <div className="relative w-16 h-16 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-2xl active:scale-90 transition-all">
                <svg className="w-9 h-9 fill-current" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.301-.15-1.767-.872-2.04-.971-.272-.099-.47-.15-.667.15-.198.301-.765.971-.937 1.171-.173.199-.346.223-.647.073-.3-.15-1.267-.467-2.413-1.49-.893-.797-1.495-1.782-1.67-2.083-.174-.301-.019-.464.131-.613.136-.134.3-.349.451-.523.15-.174.2-.3.3-.5.1-.199.05-.373-.025-.523-.075-.15-.667-1.609-.914-2.204-.24-.579-.481-.5-.667-.51-.183-.01-.39-.01-.597-.01-.206 0-.542.077-.825.385-.282.308-1.078 1.055-1.078 2.571 0 1.516 1.102 2.984 1.256 3.189.155.205 2.169 3.313 5.255 4.646.733.316 1.306.505 1.751.647.737.234 1.408.201 1.938.122.59-.088 1.815-.742 2.072-1.46.257-.718.257-1.332.18-1.46-.077-.128-.282-.204-.583-.355zM12.012 2c-5.523 0-10 4.477-10 10 0 1.777.472 3.444 1.294 4.891l-1.306 4.859 4.981-1.308c1.406.772 3.016 1.211 4.722 1.211 5.523 0 10-4.477 10-10s-4.477-10-10-10zm0 2c4.411 0 8 3.589 8 8s-3.589 8-8 8c-1.503 0-2.903-.419-4.102-1.144L6.15 19.82l.966-3.606C6.319 14.986 5.86 13.548 5.86 12c0-4.411 3.589-8 8-8z" />
                </svg>
            </div>
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
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">© 2026 SMART MINE Tanzania. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

const FlaskConical = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M10 2v7.5" /><path d="M14 2v7.5" /><path d="M8.5 2h7" /><path d="M14 11.5c.3 0 .6-.1.8-.3l4-4c.3-.3.7-.4 1.1-.4h.1c.3 0 .5.2.5.5v12.4c0 .3-.2.5-.5.5h-16c-.3 0-.5-.2-.5-.5v-12.4c0-.3.2-.5.5-.5h.1c.4 0 .8.1 1.1.4l4 4c.2.2.5.3.8.3z" />
    </svg>
)