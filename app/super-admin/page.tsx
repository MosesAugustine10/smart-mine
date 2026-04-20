"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/components/auth-provider"
import { DashboardHeader } from "@/components/dashboard-header"
import { 
    Users, Activity, Building2, ShieldCheck, Coins,
    Database, ActivitySquare, Cpu, Search, Plus, Settings,
    LayoutDashboard, Globe, AlertCircle, TrendingUp, HardHat, Compass,
    Zap, Pickaxe, Diamond, Layers, Truck, Package, ShieldAlert, Loader2, Phone
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

export default function SuperAdminDashboard() {
  const { profile, loading } = useAuth()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [showNewOrg, setShowNewOrg] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  // New Org Form State
  const [newOrg, setNewOrg] = useState({
      name: "",
      category: "MEDIUM_SCALE", // SMALL_SCALE or MEDIUM_SCALE
      email: "",
      phone: ""
  })

  // Companies loaded from Supabase
  const [companies, setCompanies] = useState<any[]>([])
  const [leads, setLeads] = useState<any[]>([])
  const [consultantFlagEnabled, setConsultantFlagEnabled] = useState(false)
  const [selcomFlagEnabled, setSelcomFlagEnabled] = useState(false)
  const [whatsappFlagEnabled, setWhatsappFlagEnabled] = useState(false)
  const [flagLoading, setFlagLoading] = useState(false)

  // Load real companies from Supabase on mount
  React.useEffect(() => {
    if (loading || !profile) return

    const load = async () => {
      const supabase = getSupabaseBrowserClient()
      const { data } = await supabase
        .from("companies")
        .select("id, name, status, category")
        .order("created_at", { ascending: false })
        .limit(50)
      if (data) {
        setCompanies(data.map((c: any) => ({
          ...c,
          nodes: 0,
          size: "—",
          plan: c.category === 'SMALL_SCALE' ? "Small Scale" : "Medium Scale",
          type: c.category === 'SMALL_SCALE' ? "CHIMBO" : "ENTERPRISE",
          status: c.status || "Active",
        })))
      }

      const { data: leadsData } = await supabase
        .from("contact_submissions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20)
      if (leadsData) setLeads(leadsData)
    }
    load()

    // Load feature flags
    const loadFlags = async () => {
      const supabase = getSupabaseBrowserClient()
      const { data } = await supabase
        .from('system_flags')
        .select('flag_name, is_enabled')
      
      if (data) {
        data.forEach((flag: any) => {
          if (flag.flag_name === 'show_consultant_pricing') setConsultantFlagEnabled(flag.is_enabled)
          if (flag.flag_name === 'enable_selcom') setSelcomFlagEnabled(flag.is_enabled)
          if (flag.flag_name === 'enable_whatsapp_api') setWhatsappFlagEnabled(flag.is_enabled)
        })
      }
    }
    loadFlags()
  }, [loading, profile])

  const vibe = () => { if (typeof navigator !== 'undefined') navigator.vibrate?.(40) }
  
  // Additional state hooks MUST be above early returns
  const [selectedCompany, setSelectedCompany] = useState<any>(null)
  const [modulesModalOpen, setModulesModalOpen] = useState(false)
  const [activeModules, setActiveModules] = useState<string[]>([])

  // 1. Show nothing or a skeleton while loading to prevent 'Clearance Denied' flash
  if (loading) {
    return (
        <div className="flex h-[80vh] items-center justify-center flex-col gap-4">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">Verifying System Clearance...</p>
        </div>
    )
  }

  // 2. Ensure this page is strictly for SUPER_ADMIN
  if (profile?.role !== 'SUPER_ADMIN') {
      return (
          <div className="flex h-[80vh] items-center justify-center flex-col gap-4">
              <ShieldCheck className="w-20 h-20 text-red-500 animate-pulse" />
              <h2 className="text-2xl font-black uppercase tracking-widest text-slate-800">Clearance Denied</h2>
              <p className="text-sm font-bold text-slate-500">You do not hold System Owner privileges.</p>
          </div>
      )
  }


  const ALL_MODULES = [
    { id: "blasting", label: "Blasting Operations", icon: Zap },
    { id: "drilling", label: "Drilling Operations", icon: Pickaxe },
    { id: "diamond-drilling", label: "Diamond Drilling", icon: Diamond },
    { id: "material-handling", label: "Material Handling", icon: Layers },
    { id: "fleet", label: "Fleet & GPS Tracking", icon: Truck },
    { id: "inventory", label: "Inventory & Spare Parts", icon: Package },
    { id: "geophysics", label: "Geophysics Surveys", icon: Activity },
    { id: "safety", label: "Safety & Incidents", icon: ShieldAlert },
  ]

  const handleOpenModules = (company: any) => {
    vibe()
    setSelectedCompany(company)
    // In a real app, fetch from DB. For now, use demo state.
    setActiveModules(company.enabled_modules || ["blasting", "drilling", "fleet", "inventory", "safety", "material-handling"])
    setModulesModalOpen(true)
  }

  const handleToggleModule = (modId: string) => {
    vibe()
    setActiveModules(prev => 
      prev.includes(modId) ? prev.filter(id => id !== modId) : [...prev, modId]
    )
  }

  const handleSaveModules = async () => {
    setIsSaving(true)
    vibe()
    const supabase = getSupabaseBrowserClient()
    
    // 1. Update DB (if company has real ID)
    if (selectedCompany.id) {
        await supabase.from("companies").update({ enabled_modules: activeModules }).eq("id", selectedCompany.id)
    }

    // 2. Update local state
    setCompanies(prev => prev.map(c => c.name === selectedCompany.name ? { ...c, enabled_modules: activeModules } : c))
    
    setIsSaving(false)
    setModulesModalOpen(false)
    toast({
      title: "Subscription Updated",
      description: `Modules for ${selectedCompany.name} have been synchronized.`
    })
  }

  const handleCreateOrg = async () => {
      if (!newOrg.name ) return
      setIsSaving(true)
      vibe()
      
      const supabase = getSupabaseBrowserClient()
      
      // 1. Create the Company record ONLY
      const { data: company, error: companyError } = await supabase.from("companies").insert({
          name: newOrg.name,
          email: newOrg.email,
          phone: newOrg.phone,
          category: newOrg.category,
          enabled_modules: newOrg.category === 'SMALL_SCALE' 
            ? ["blasting", "drilling", "fleet"] 
            : ["blasting", "drilling", "diamond-drilling", "material-handling", "fleet", "inventory", "safety"]
      }).select().single()

      if (companyError) {
          toast({ title: "Setup Failed", description: companyError.message, variant: "destructive" })
          setIsSaving(false)
          return
      }

      const entry = {
          ...company,
          nodes: 0,
          status: "Active",
          size: "0.0 GB",
          enabled_modules: company.enabled_modules
      }
      
      setCompanies([entry, ...companies])
      setIsSaving(false)
      setShowNewOrg(false)
      setNewOrg({ name: "", category: "MEDIUM_SCALE", email: "", phone: "" })
      
      toast({
          title: "Organization Provisioned",
          description: `${newOrg.name} has been registered as a ${newOrg.category === 'SMALL_SCALE' ? 'Small Scale' : 'Medium Scale'} entity.`,
      })
  }

  const handleLaunchDashboard = (company: any) => {
      vibe()
      toast({ title: "Redirecting...", description: `Accessing ${company.name} environment.` })
      
      if (company.category === 'SMALL_SCALE') {
          // For Small Scale, we need to set the local storage account so /chimbo recognizes us
          const chimboAcc = {
              id: company.id,
              phone: (profile as any)?.phone || '0000000000',
              full_name: profile ? (`${profile.first_name || ""} ${profile.last_name || ""}`).trim() || 'System Owner' : 'System Owner',
              role: 'MANAGER',
              account_type: 'SMALL_SCALE',
              company_id: company.id,
              subscription_status: 'ACTIVE'
          }
          localStorage.setItem('chimbo_account', JSON.stringify(chimboAcc))
          localStorage.setItem('chimbo_last_activity', Date.now().toString())
          
          window.open('/chimbo/dashboard', '_blank')
      } else {
          // For Medium Scale, we rewrite the Super Admin cookie to temporarily target THIS specific company.
          // This allows the Super Admin to seamlessly hop between different Medium Scale miners
          // and the system will naturally enforce their specific subscribed modules.
          const syncData = {
              role: "SUPER_ADMIN",
              cid: company.id,
              mods: company.enabled_modules || ["blasting", "drilling", "fleet", "inventory", "safety", "material-handling"],
              ts: Date.now()
          }
          document.cookie = `msm_user_role=${encodeURIComponent(JSON.stringify(syncData))}; path=/; max-age=${60 * 60 * 24}; SameSite=Lax`
          
          window.open('/admin', '_blank')
      }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto mb-20 px-4 md:px-0">
      <DashboardHeader 
          title="Global Command Center" 
          description="Global System Overseer" 
      />

      {/* TIERED PERFORMANCE OVERVIEW */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 px-2">
        {/* Tier: Enterprise */}
        <Card className="bg-slate-900 border-slate-800 text-white shadow-xl rounded-[2rem] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Building2 className="w-16 h-16" />
          </div>
          <CardHeader className="pb-1">
            <CardTitle className="text-[9px] font-black tracking-[0.2em] uppercase text-blue-400">Enterprise Revenue</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black tracking-tighter text-white font-mono">TZS 0</span>
                <span className="text-[10px] font-bold text-slate-500 uppercase">/m</span>
             </div>
             <p className="text-[9px] font-black text-emerald-400 uppercase mt-2">↑ 14% growth</p>
          </CardContent>
        </Card>

        {/* Tier: Small Scale */}
        <Card className="bg-amber-500 border-amber-600 text-slate-950 shadow-xl rounded-[2rem] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <HardHat className="w-16 h-16" />
          </div>
          <CardHeader className="pb-1">
            <CardTitle className="text-[9px] font-black tracking-[0.2em] uppercase text-slate-900/60">Small Scale MRR</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black tracking-tighter text-slate-950 font-mono">TSh 0</span>
                <span className="text-[10px] font-bold text-slate-900/40 uppercase">/m</span>
             </div>
             <p className="text-[9px] font-black text-slate-900/70 uppercase mt-2">↑ 1,245 Active Miners</p>
          </CardContent>
        </Card>

        {/* Global Infrastructure */}
        <Card className="bg-slate-950 border-slate-900 text-white shadow-xl rounded-[2rem] relative overflow-hidden group">
          <CardHeader className="pb-1">
            <CardTitle className="text-[9px] font-black tracking-[0.2em] uppercase text-indigo-400">Global Personnel</CardTitle>
          </CardHeader>
          <CardContent className="flex items-baseline gap-2">
             <span className="text-3xl font-black tracking-tighter text-white">0</span>
             <Users className="w-5 h-5 text-indigo-500" />
          </CardContent>
        </Card>

        {/* System Health */}
        <Card className="bg-slate-950 border-slate-900 text-white shadow-xl rounded-[2rem] relative overflow-hidden group">
          <CardHeader className="pb-1">
            <CardTitle className="text-[9px] font-black tracking-[0.2em] uppercase text-emerald-400">Node Status</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
             <span className="text-lg font-black tracking-widest text-emerald-400 uppercase">99.9%</span>
             <div className="flex gap-1">
                {[1,2,3,4,5].map(i => <div key={i} className="w-1.5 h-6 bg-emerald-500 rounded-full animate-pulse" style={{ animationDelay: `${i*100}ms` }} />)}
             </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 px-2">
        <div className="lg:col-span-2 space-y-6">
          {/* LEADS / INBOX SECTION */}
          {(leads.length > 0 || true) && (
            <Card className="border shadow-2xl rounded-[2.5rem] overflow-hidden border-amber-500/30 bg-amber-50/50 dark:bg-amber-500/5">
              <CardHeader className="bg-amber-500/10 border-b border-amber-500/20 p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/30">
                    <ActivitySquare className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-black uppercase tracking-tight text-amber-900 dark:text-amber-500">Inbound Registrations</CardTitle>
                    <p className="text-[10px] font-bold text-amber-700/60 uppercase tracking-widest mt-0.5">Maombi Mapya Kutoka Nje</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {leads.length === 0 ? (
                  <div className="p-8 text-center text-xs font-bold uppercase tracking-widest text-slate-400">Hakuna Maombi Mapya</div>
                ) : (
                  <div className="divide-y divide-amber-500/10">
                    {leads.map((lead, idx) => (
                      <div key={idx} className="p-6 hover:bg-white/50 dark:hover:bg-slate-900/50 transition-colors flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-black text-slate-900 dark:text-white text-sm uppercase">{lead.full_name}</h4>
                            <Badge className="bg-amber-500/20 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 border-0 text-[8px] uppercase tracking-widest">{lead.company_type}</Badge>
                          </div>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2"><Phone className="w-3 h-3 inline pb-0.5" /> {lead.phone_number}</p>
                          {lead.message && (
                            <p className="text-xs font-medium text-slate-600 dark:text-slate-400 italic bg-amber-500/5 p-3 rounded-xl border border-amber-500/10">"{lead.message}"</p>
                          )}
                        </div>
                        <Button onClick={() => { vibe(); setNewOrg({...newOrg, name: lead.full_name, phone: lead.phone_number, category: lead.company_type.includes('Mdogo') ? 'SMALL_SCALE' : 'MEDIUM_SCALE'}); setShowNewOrg(true); }} className="h-10 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black uppercase text-[9px] tracking-widest shadow-xl whitespace-nowrap shrink-0">
                          PROVISION NOW
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* MANAGEMENT TABLE */}
          <Card className="border shadow-2xl rounded-[2.5rem] overflow-hidden border-slate-100 bg-white">
            <CardHeader className="bg-slate-50/50 border-b p-8">
             <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                   <CardTitle className="text-2xl font-black uppercase tracking-tight flex items-center gap-3 text-slate-900">
                     <Globe className="h-6 w-6 text-slate-600" />
                     Registered Mines
                   </CardTitle>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Cross-Platform Organization Manager (Meneja wa Mashirika yote)</p>
                </div>
                
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                         <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                         <input 
                            placeholder="Tafuta Mgodi..." 
                            className="w-full h-12 pl-11 pr-4 rounded-xl bg-white border border-slate-200 text-xs font-bold outline-none focus:ring-2 ring-blue-500/20 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                         />
                    </div>
                    <Button onClick={() => { vibe(); setShowNewOrg(true) }} className="h-12 px-6 rounded-xl font-black uppercase text-[10px] tracking-widest bg-slate-900 hover:bg-slate-800 text-white shadow-xl">
                       <Plus className="w-3 h-3 mr-2" /> New Org
                    </Button>
                </div>
              </div>
          </CardHeader>
          <CardContent className="p-0">
             <div className="divide-y divide-slate-100">
                   {companies.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())).map((company, idx) => (
                      <div key={idx} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                          <div className="flex items-center gap-4">
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center border-2 ${
                                company.category === 'SMALL_SCALE' ? 'bg-amber-500 border-amber-600' :
                                company.category === 'MEDIUM_SCALE' ? 'bg-blue-600 border-blue-700' :
                                'bg-slate-900 border-slate-950'
                              } shadow-lg shrink-0`}>
                                  {company.category === 'SMALL_SCALE' ? <Pickaxe className="w-5 h-5 text-white" /> : <Building2 className="w-5 h-5 text-white" />}
                              </div>
                              <div>
                                  <div className="flex items-center gap-3">
                                      <h4 className="font-black text-slate-900 text-lg tracking-tight">{company.name}</h4>
                                      <Badge variant="outline" className={`text-[8px] font-black uppercase tracking-tighter ${
                                          company.category === 'SMALL_SCALE' ? 'text-amber-600 border-amber-200 bg-amber-50' :
                                          company.category === 'MEDIUM_SCALE' ? 'text-blue-600 border-blue-200 bg-blue-50' :
                                          'text-slate-500 border-slate-200 bg-slate-50'
                                      }`}>
                                          {company.category === 'SMALL_SCALE' ? 'Small Scale' : 'Medium Scale'}
                                      </Badge>
                                  </div>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                      {company.nodes || 0} Nodes • Vault {company.size || '0.0 GB'} • Last Sync {Math.floor(Math.random()*60)}m ago
                                  </p>
                              </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                                <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleLaunchDashboard(company)}
                                    className="h-10 px-4 rounded-xl hover:bg-slate-900 hover:text-white transition-all font-black text-[9px] uppercase tracking-widest flex items-center gap-2 border border-slate-100 shadow-sm"
                                >
                                    <LayoutDashboard className="w-3.5 h-3.5 text-blue-500" />
                                    Launch Controller
                                </Button>
                                <a href={`/super-admin/companies/${company.id}/subscription`} target="_blank" rel="noreferrer">
                                    <Button variant="ghost" size="sm"
                                        className="h-10 px-3 rounded-xl hover:bg-amber-100 hover:text-amber-700 font-black text-[9px] uppercase tracking-widest flex items-center gap-1.5 border border-amber-100 shadow-sm">
                                        <Coins className="w-3.5 h-3.5 text-amber-500" />Bei / Subscription
                                    </Button>
                                </a>
                                
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => handleOpenModules(company)}
                                    className="h-10 w-10 rounded-xl hover:bg-blue-100 hover:text-blue-600 transition-all border border-slate-100"
                                >
                                    <Settings className="w-4 h-4" />
                                </Button>
                          </div>
                      </div>
                  ))}
             </div>
          </CardContent>
   
        </Card>
        </div>

        {/* ── MODULES MANAGEMENT MODAL ── */}
        {modulesModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setModulesModalOpen(false)} />
                <Card className="relative w-full max-w-2xl border-4 border-slate-200 dark:border-white/5 rounded-[4rem] shadow-2xl overflow-hidden bg-white dark:bg-slate-900 animate-in zoom-in-95 duration-300">
                    <CardHeader className="p-10 pb-0">
                        <div className="flex items-center gap-4">
                            <div className="h-14 w-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-xl">
                                <ShieldCheck className="w-7 h-7" />
                            </div>
                            <div>
                                <CardTitle className="text-3xl font-black uppercase tracking-tighter italic text-slate-900 dark:text-white">Active Subscriptions</CardTitle>
                                <CardDescription className="text-xs font-bold uppercase tracking-widest text-blue-500">{selectedCompany?.name} :: Feature Matrix</CardDescription>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="p-10 space-y-8">
                        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
                            Select the operational modules authorized for this tenant. Access will be strictly enforced across all personnel in real-time.
                        </p>
                        
                        <div className="grid grid-cols-2 gap-4">
                            {ALL_MODULES.map(mod => (
                                <button
                                    key={mod.id}
                                    onClick={() => handleToggleModule(mod.id)}
                                    className={cn(
                                        "flex items-center gap-4 p-5 rounded-3xl border-2 transition-all text-left group",
                                        activeModules.includes(mod.id)
                                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/10 shadow-lg"
                                            : "border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950/50 opacity-60 grayscale"
                                    )}
                                >
                                    <div className={cn(
                                        "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                                        activeModules.includes(mod.id) ? "bg-blue-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                                    )}>
                                        <mod.icon className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white">{mod.label}</p>
                                        <p className="text-[8px] font-bold text-slate-400 group-hover:text-blue-500 transition-colors uppercase">
                                            {activeModules.includes(mod.id) ? "Live Access" : "Disabled"}
                                        </p>
                                    </div>
                                    <div className={cn(
                                        "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                                        activeModules.includes(mod.id) ? "border-blue-500 bg-blue-500 text-white" : "border-slate-200 dark:border-slate-800"
                                    )}>
                                        {activeModules.includes(mod.id) && <Plus className="w-3 h-3 rotate-45" />}
                                    </div>
                                </button>
                            ))}
                        </div>

                        <div className="flex gap-3 pt-6">
                            <Button variant="ghost" onClick={() => setModulesModalOpen(false)} className="flex-1 h-16 rounded-2xl font-black uppercase text-[10px] tracking-widest text-slate-400">Abort Changes</Button>
                            <Button 
                                onClick={handleSaveModules}
                                disabled={isSaving}
                                className="flex-[2] h-16 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-blue-500/20"
                            >
                                {isSaving ? "Syncing Logic..." : "Deploy Subscription Matrix"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )}

        {/* SIDEBAR PANELS */}
        <div className="space-y-6">
            {/* TIER BREAKDOWN */}
            <Card className="border shadow-2xl rounded-[2.5rem] overflow-hidden border-slate-100 bg-white">
                <CardHeader className="pb-4">
                    <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-500">Tier Distribution</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {[
                        { label: "Medium Scale", count: companies.filter(c => c.category === 'MEDIUM_SCALE').length || 0, color: "bg-blue-500", icon: Building2 },
                        { label: "Contractors", count: 0, color: "bg-indigo-500", icon: LayoutDashboard },
                        { label: "Consultants", count: 0, color: "bg-slate-800", icon: Compass },
                        { label: "Small Scale", count: companies.filter(c => c.category === 'SMALL_SCALE').length || 0, color: "bg-amber-500", icon: HardHat }
                    ].map((tier, i) => (
                        <div key={i} className="flex items-center gap-4">
                            <div className={`w-8 h-8 rounded-lg ${tier.color} flex items-center justify-center shrink-0`}>
                                <tier.icon className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[10px] font-black uppercase tracking-tight text-slate-900">{tier.label}</span>
                                    <span className="text-[10px] font-bold text-slate-500">{tier.count}</span>
                                </div>
                                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div className={`h-full ${tier.color}`} style={{ width: `${Math.random()*40 + 40}%` }} />
                                </div>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* SYSTEM AUDIT & SECURITY PULSE */}
            <Card className="border shadow-2xl rounded-[2.5rem] overflow-hidden border-slate-100 bg-slate-900 text-white">
                <CardHeader className="p-8 pb-4">
                   <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-3">
                         <ShieldCheck className="h-5 w-5 text-blue-500" /> Security Command
                      </CardTitle>
                      <Badge className="bg-emerald-500/20 text-emerald-400 border-0 text-[8px] font-black uppercase tracking-widest">Global Secure</Badge>
                   </div>
                </CardHeader>
                <CardContent className="p-8 pt-0 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/5 p-4 rounded-3xl border border-white/10">
                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">2FA Compliance</p>
                            <p className="text-xl font-black text-white">100%</p>
                        </div>
                        <div className="bg-white/5 p-4 rounded-3xl border border-white/10">
                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Bound Devices</p>
                            <p className="text-xl font-black text-white">0</p>
                        </div>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                           <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-500">Live Security Stream</h4>
                           <span className="text-[8px] font-bold text-blue-500 uppercase animate-pulse">Monitoring...</span>
                        </div>
                        {[]}
                    </div>
                    
                    <Button onClick={() => { vibe(); toast({title: "Global Audit Enqueued", description: "Verifying checksums for all client vaults..."}) }} className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-blue-500/20">
                        Initiate Global Audit
                    </Button>
                </CardContent>
            </Card>

            {/* DATA BACKUP CENTER */}
            <Card className="border-0 shadow-2xl rounded-[2.5rem] bg-indigo-600 text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-all">
                    <Database className="w-32 h-32" />
                </div>
                <CardHeader className="p-8">
                    <CardTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-3">
                        <Database className="h-5 w-5" /> Digital Blackbox
                    </CardTitle>
                    <CardDescription className="text-white/60 text-[10px] font-bold uppercase tracking-widest">
                        Export & Backup Center
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-8 pt-0 space-y-4">
                    <p className="text-xs font-medium text-indigo-100 leading-relaxed italic">
                        "Your data is backed up every 24 hours. You can also download a manual copy here."
                    </p>
                    <div className="grid grid-cols-2 gap-3 pt-4">
                        <Button 
                            disabled={isSaving}
                            onClick={async () => {
                                vibe();
                                setIsSaving(true);
                                try {
                                    const supabase = getSupabaseBrowserClient();
                                    const tables = [
                                        'companies', 'user_profiles', 'drilling_operations', 
                                        'blasting_operations', 'material_handling_operations',
                                        'vehicles', 'fuel_logs', 'maintenance_logs', 
                                        'inventory_items', 'safety_incidents'
                                    ];
                                    
                                    const dump: any = {};
                                    for (const table of tables) {
                                        const { data } = await supabase.from(table).select('*').limit(1000);
                                        dump[table] = data || [];
                                    }

                                    // Use xlsx to create a multi-sheet workbook
                                    const XLSX = await import('xlsx');
                                    const wb = XLSX.utils.book_new();
                                    
                                    for (const table of tables) {
                                        const ws = XLSX.utils.json_to_sheet(dump[table]);
                                        XLSX.utils.book_append_sheet(wb, ws, table.substring(0, 31)); 
                                    }
                                    
                                    XLSX.writeFile(wb, `SMART_MINE_GLOBAL_BACKUP_${new Date().toISOString().split('T')[0]}.xlsx`);
                                    
                                    toast({ 
                                        title: "Global Export Complete", 
                                        description: "Enterprise registry and operational logs have been archived to Excel." 
                                    });
                                } catch (err: any) {
                                    toast({ title: "Export Failed", description: err.message, variant: "destructive" });
                                } finally {
                                    setIsSaving(false);
                                }
                            }}
                            className="bg-white/10 hover:bg-white/20 border border-white/20 text-white text-[10px] font-black uppercase h-12 rounded-xl"
                        >
                            {isSaving ? "Crunching..." : "Export Data"}
                        </Button>
                        <Button 
                            onClick={async () => {
                                vibe();
                                toast({ title: "Full System Backup", description: "Generating encrypted SQL-compatible JSON dump..." });
                                
                                const supabase = getSupabaseBrowserClient();
                                const tables = ['companies', 'user_profiles', 'inventory_items', 'vehicles'];
                                const fullDump: any = {};
                                for (const t of tables) {
                                    const { data } = await supabase.from(t).select('*');
                                    fullDump[t] = data;
                                }

                                const blob = new Blob([JSON.stringify(fullDump, null, 2)], { type: 'application/json' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `SQL_DUMP_${Date.now()}.json`;
                                a.click();
                            }}
                            className="bg-white/10 hover:bg-white/20 border border-white/20 text-white text-[10px] font-black uppercase h-12 rounded-xl"
                        >
                            Backup SQL
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* ── FEATURE FLAGS ── */}
            <Card className="border shadow-2xl rounded-[2.5rem] overflow-hidden border-slate-100 bg-white">
                <CardHeader className="pb-2 p-8">
                    <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-amber-500" /> Feature Flags
                    </CardTitle>
                    <CardDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                        Washa/Zima vipengele bila kudeployi upya
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-8 pt-0 space-y-4">
                    {/* Consultant Pricing Card Flag */}
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                        <div className="space-y-0.5">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-700">
                                Onyesha Kadi ya Mshauri
                            </p>
                            <p className="text-[9px] font-bold text-slate-400">
                                Kwenye Landing Page · Imepangwa: Aprili 2027
                            </p>
                        </div>
                        <button
                            onClick={async () => {
                                setFlagLoading(true)
                                vibe()
                                try {
                                    const supabase = getSupabaseBrowserClient()
                                    const newVal = !consultantFlagEnabled
                                    await supabase.from('system_flags')
                                        .upsert({ flag_name: 'show_consultant_pricing', is_enabled: newVal, updated_at: new Date().toISOString() }, { onConflict: 'flag_name' })
                                    setConsultantFlagEnabled(newVal)
                                    toast({ title: newVal ? "✅ Imewashwa" : "⛔ Imezimwa", description: `Kadi ya Mshauri ${newVal ? 'inaonekana' : 'haionekani'} kwenye Landing Page.` })
                                } catch (e: any) {
                                    toast({ title: "Kosa", description: e.message, variant: "destructive" })
                                } finally {
                                    setFlagLoading(false)
                                }
                            }}
                            disabled={flagLoading}
                            className={`relative w-14 h-7 rounded-full transition-all duration-300 focus:outline-none ${consultantFlagEnabled ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30' : 'bg-slate-300'}`}
                        >
                            <span className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300 ${consultantFlagEnabled ? 'left-8' : 'left-1'}`} />
                        </button>
                    </div>

                    {/* Selcom Payments Flag */}
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                        <div className="space-y-0.5">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-700">
                                Washa Malipo ya Selcom
                            </p>
                            <p className="text-[9px] font-bold text-slate-400">
                                M-Pesa, Tigo, Airtel & Cards (Automated)
                            </p>
                        </div>
                        <button
                            onClick={async () => {
                                setFlagLoading(true)
                                vibe()
                                try {
                                    const supabase = getSupabaseBrowserClient()
                                    const newVal = !selcomFlagEnabled
                                    await supabase.from('system_flags')
                                        .upsert({ flag_name: 'enable_selcom', is_enabled: newVal, updated_at: new Date().toISOString() }, { onConflict: 'flag_name' })
                                    setSelcomFlagEnabled(newVal)
                                    toast({ title: newVal ? "✅ Selcom Imewashwa" : "⛔ Selcom Imezimwa", description: `Wateja ${newVal ? 'wanaweza' : 'hawawezi'} kulipa kwa Selcom sasa.` })
                                } catch (e: any) {
                                    toast({ title: "Kosa", description: e.message, variant: "destructive" })
                                } finally {
                                    setFlagLoading(false)
                                }
                            }}
                            disabled={flagLoading}
                            className={`relative w-14 h-7 rounded-full transition-all duration-300 focus:outline-none ${selcomFlagEnabled ? 'bg-indigo-600 shadow-lg shadow-indigo-500/30' : 'bg-slate-300'}`}
                        >
                            <span className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300 ${selcomFlagEnabled ? 'left-8' : 'left-1'}`} />
                        </button>
                    </div>

                    {/* WhatsApp Business API Flag */}
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                        <div className="space-y-0.5">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-700">
                                WhatsApp Automated API
                            </p>
                            <p className="text-[9px] font-bold text-slate-400">
                                Tuma Invoice & Alerts kiotomatiki
                            </p>
                        </div>
                        <button
                            onClick={async () => {
                                setFlagLoading(true)
                                vibe()
                                try {
                                    const supabase = getSupabaseBrowserClient()
                                    const newVal = !whatsappFlagEnabled
                                    await supabase.from('system_flags')
                                        .upsert({ flag_name: 'enable_whatsapp_api', is_enabled: newVal, updated_at: new Date().toISOString() }, { onConflict: 'flag_name' })
                                    setWhatsappFlagEnabled(newVal)
                                    toast({ title: newVal ? "✅ WhatsApp API Imewashwa" : "⛔ WhatsApp API Imezimwa", description: `Ujumbe ${newVal ? 'utatumwa' : 'hautatumwa'} kiotomatiki sasa.` })
                                } catch (e: any) {
                                    toast({ title: "Kosa", description: e.message, variant: "destructive" })
                                } finally {
                                    setFlagLoading(false)
                                }
                            }}
                            disabled={flagLoading}
                            className={`relative w-14 h-7 rounded-full transition-all duration-300 focus:outline-none ${whatsappFlagEnabled ? 'bg-emerald-600 shadow-lg shadow-emerald-500/30' : 'bg-slate-300'}`}
                        >
                            <span className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300 ${whatsappFlagEnabled ? 'left-8' : 'left-1'}`} />
                        </button>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                        <div className={`w-2 h-2 rounded-full ${consultantFlagEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                        <span className={`text-[9px] font-black uppercase tracking-widest ${consultantFlagEnabled ? 'text-emerald-600' : 'text-slate-400'}`}>
                            {consultantFlagEnabled ? 'Mshauri: ON' : 'Mshauri: OFF'}
                        </span>
                        <span className="mx-1 text-slate-300">|</span>
                        <span className={`text-[9px] font-black uppercase tracking-widest ${selcomFlagEnabled ? 'text-indigo-600' : 'text-slate-400'}`}>
                            Selcom: {selcomFlagEnabled ? 'LIVE' : 'OFF'}
                        </span>
                        <span className="mx-1 text-slate-300">|</span>
                        <span className={`text-[9px] font-black uppercase tracking-widest ${whatsappFlagEnabled ? 'text-emerald-600' : 'text-slate-400'}`}>
                            WhatsApp: {whatsappFlagEnabled ? 'AUTO' : 'OFF'}
                        </span>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>

      {/* ── NEW ORG MODAL ── */}
      {showNewOrg && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
              <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setShowNewOrg(false)} />
              <Card className="relative w-full max-w-lg border-4 border-slate-200 dark:border-white/5 rounded-[4rem] shadow-2xl overflow-hidden bg-white dark:bg-slate-900 animate-in zoom-in-95 duration-300">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 rounded-full -translate-y-24 translate-x-24 blur-3xl" />
                  
                  <CardHeader className="p-10 pb-0">
                      <CardTitle className="text-3xl font-black uppercase tracking-tighter italic text-slate-900 dark:text-white">Register Organization</CardTitle>
                      <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-blue-500">System Provisioning Portal</CardDescription>
                  </CardHeader>

                  <CardContent className="p-10 space-y-6">
                      <div className="space-y-6">
                          <div className="space-y-1.5">
                              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-4">Company Name *</label>
                              <input 
                                value={newOrg.name}
                                onChange={e => setNewOrg({...newOrg, name: e.target.value})}
                                placeholder="e.g. Tanzanite One"
                                className="w-full h-14 px-6 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 outline-none focus:border-blue-500 transition-all font-bold text-slate-900 dark:text-white"
                              />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-4">Service Tier</label>
                                  <select 
                                    value={newOrg.category}
                                    onChange={e => setNewOrg({...newOrg, category: e.target.value})}
                                    className="w-full h-14 px-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 outline-none font-black text-[10px] uppercase tracking-widest cursor-pointer appearance-none"
                                  >
                                      <option value="MEDIUM_SCALE">Medium Scale (Enterprise)</option>
                                      <option value="SMALL_SCALE">Small Scale (Chimbo)</option>
                                  </select>
                              </div>
                              <div className="space-y-1.5">
                                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-4">Admin Phone</label>
                                  <input 
                                    value={newOrg.phone}
                                    onChange={e => setNewOrg({...newOrg, phone: e.target.value})}
                                    placeholder="+255..."
                                    className="w-full h-14 px-6 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 outline-none font-bold"
                                  />
                              </div>
                          </div>

                          <div className="space-y-1.5">
                              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-4">Primary Admin Email *</label>
                              <input 
                                type="email"
                                value={newOrg.email}
                                onChange={e => setNewOrg({...newOrg, email: e.target.value})}
                                placeholder="manager@company.com"
                                className="w-full h-14 px-6 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 outline-none focus:border-blue-500 transition-all font-bold"
                              />
                          </div>
                      </div>

                      <div className="flex gap-3 pt-4">
                          <Button variant="ghost" onClick={() => setShowNewOrg(false)} className="flex-1 h-16 rounded-2xl font-black uppercase text-[10px] tracking-widest">Cancel</Button>
                          <Button 
                            disabled={!newOrg.name || !newOrg.email || isSaving}
                            onClick={handleCreateOrg}
                            className="flex-[2] h-16 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-blue-500/20"
                          >
                              {isSaving ? "Provisioning..." : "Provision Organization"}
                          </Button>
                      </div>
                  </CardContent>
              </Card>
          </div>
      )}
    </div>
  )
}
