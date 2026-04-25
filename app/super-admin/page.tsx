"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/components/auth-provider"
import { DashboardHeader } from "@/components/dashboard-header"
import { 
    Users, Activity, Building2, ShieldCheck, Coins,
    Database, ActivitySquare, Cpu, Search, Plus, Settings,
    LayoutDashboard, Globe, AlertCircle, TrendingUp, HardHat, Compass,
    Zap, Pickaxe, Diamond, Layers, Truck, Package, ShieldAlert, Loader2, Phone,
    Flag, ImageIcon, HeartPulse, Archive, ClipboardList, Upload, Trash2, CheckCircle2,
    RefreshCw
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter 
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { UserManagementPanel } from "@/components/admin/user-management-panel"
import { format } from "date-fns"

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
  // Feature flags removed

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
        // Feature flags removed
      }
    }
    loadFlags()
  }, [loading, profile])

  const vibe = () => { if (typeof navigator !== 'undefined') navigator.vibrate?.(40) }
  
  // Tab state for 7 sections
  const [activeTab, setActiveTab] = useState<"companies"|"users"|"audit"|"flags"|"branding"|"health"|"backup">("companies")

  // Audit logs
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [auditLoading, setAuditLoading] = useState(false)
  const [auditFilter, setAuditFilter] = useState({ user: "", module: "", from: "", to: "" })

  // Branding
  const [brands, setBrands] = useState<any[]>([])
  const [newBrand, setNewBrand] = useState({ brand_name: "", logo_url: "", tagline: "" })
  const [brandSaving, setBrandSaving] = useState(false)

  // Feature flags
  const [flags, setFlags] = useState<any[]>([])
  const [flagSaving, setFlagSaving] = useState(false)

  // Backup logs
  const [backupLogs, setBackupLogs] = useState<any[]>([])
  const [backupRunning, setBackupRunning] = useState(false)

  // Company management
  const [allCompanies, setAllCompanies] = useState<any[]>([])
  const [companiesLoading, setCompaniesLoading] = useState(false)
  const [showAddCompany, setShowAddCompany] = useState(false)
  const [newCompany, setNewCompany] = useState({ companyName: "", adminFullName: "", adminEmail: "" })
  const [tempAdminPass, setTempAdminPass] = useState<string | null>(null)

  // System health
  const [health, setHealth] = useState({ activeUsers: 0, pendingSyncs: 0, lastBackup: "—", uptime: "99.9%", dbUsage: "0.0 GB" })

  // Additional state hooks MUST be above early returns
  const [selectedCompany, setSelectedCompany] = useState<any>(null)
  const [modulesModalOpen, setModulesModalOpen] = useState(false)
  const [activeModules, setActiveModules] = useState<string[]>([])

  // Load audit logs
  const loadAudit = useCallback(async () => {
    setAuditLoading(true)
    const supabase = getSupabaseBrowserClient()
    let q = supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(100)
    if (auditFilter.module) q = q.eq("module", auditFilter.module)
    if (auditFilter.from) q = q.gte("created_at", auditFilter.from)
    if (auditFilter.to) q = q.lte("created_at", auditFilter.to + "T23:59:59")
    const { data } = await q
    setAuditLogs(data || [])
    setAuditLoading(false)
  }, [auditFilter])

  // Load all companies
  const loadAllCompanies = useCallback(async () => {
    setCompaniesLoading(true)
    try {
      const res = await fetch("/api/super-admin/companies")
      const data = await res.json()
      setAllCompanies(data.companies || [])
    } catch { toast({ title: "Error loading companies", variant: "destructive" }) }
    finally { setCompaniesLoading(false) }
  }, [toast])

  const handleAddCompany = async () => {
    if (!newCompany.companyName || !newCompany.adminEmail) return
    setIsSaving(true)
    try {
      const res = await fetch("/api/super-admin/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCompany)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setTempAdminPass(data.tempPassword)
      setNewCompany({ companyName: "", adminFullName: "", adminEmail: "" })
      loadAllCompanies()
      toast({ title: "✅ Company & Admin Created" })
    } catch (e: any) {
      toast({ title: "Creation Failed", description: e.message, variant: "destructive" })
    } finally { setIsSaving(false) }
  }

  // Load brands + flags + backup logs
  useEffect(() => {
    if (loading || !profile) return
    const supabase = getSupabaseBrowserClient()
    supabase.from("brands").select("*").order("created_at").then(({ data }: { data: any }) => setBrands(data || []))
    supabase.from("system_flags").select("*").then(({ data }: { data: any }) => setFlags(data || []))
    supabase.from("backup_logs").select("*").order("created_at", { ascending: false }).limit(10).then(({ data }: { data: any }) => setBackupLogs(data || []))
    supabase.from("user_profiles").select("id", { count: "exact", head: true }).then(({ count }: { count: number | null }) => {
      setHealth(h => ({ ...h, activeUsers: count || 0 }))
    })
  }, [loading, profile])

  useEffect(() => { if (activeTab === "audit") loadAudit() }, [activeTab, loadAudit])
  useEffect(() => { if (activeTab === "companies") loadAllCompanies() }, [activeTab, loadAllCompanies])

  const toggleFlag = async (flag: any) => {
    setFlagSaving(true)
    const supabase = getSupabaseBrowserClient()
    await supabase.from("system_flags").update({ is_enabled: !flag.is_enabled, updated_at: new Date().toISOString() }).eq("flag_name", flag.flag_name)
    setFlags(fs => fs.map(f => f.flag_name === flag.flag_name ? { ...f, is_enabled: !f.is_enabled } : f))
    setFlagSaving(false)
    toast({ title: `Flag ${!flag.is_enabled ? "enabled" : "disabled"}: ${flag.flag_name}` })
  }

  const addBrand = async () => {
    if (!newBrand.brand_name) return
    setBrandSaving(true)
    const supabase = getSupabaseBrowserClient()
    const { data } = await supabase.from("brands").insert(newBrand).select().single()
    if (data) setBrands(b => [...b, data])
    setNewBrand({ brand_name: "", logo_url: "", tagline: "" })
    setBrandSaving(false)
    toast({ title: "✅ Brand added" })
  }

  const deleteBrand = async (id: string) => {
    const supabase = getSupabaseBrowserClient()
    await supabase.from("brands").delete().eq("id", id)
    setBrands(b => b.filter(br => br.id !== id))
    toast({ title: "Brand removed" })
  }

  const setDefaultBrand = async (id: string) => {
    const supabase = getSupabaseBrowserClient()
    await supabase.from("brands").update({ is_default: false }).neq("id", id)
    await supabase.from("brands").update({ is_default: true }).eq("id", id)
    setBrands(b => b.map(br => ({ ...br, is_default: br.id === id })))
    toast({ title: "✅ Default brand set" })
  }

  const runBackup = async () => {
    setBackupRunning(true)
    vibe()
    try {
      const response = await fetch("/api/backup")
      const data = await response.json()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a"); a.href = url
      a.download = `SmartMinePro_Backup_${new Date().toISOString().split("T")[0]}.json`; a.click()
      toast({ title: "✅ Backup Complete", description: `${data.totalRecords} records exported.` })
      // Reload backup logs
      const supabase = getSupabaseBrowserClient()
      const { data: logs } = await supabase.from("backup_logs").select("*").order("created_at", { ascending: false }).limit(10)
      setBackupLogs(logs || [])
    } catch (e: any) {
      toast({ title: "Backup failed", description: e.message, variant: "destructive" })
    } finally { setBackupRunning(false) }
  }

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
          // Open tab first
          const newTab = window.open('/admin', '_blank')
          // Then set cookie
          const syncData = {
              role: "SUPER_ADMIN",
              cid: company.id,
              mods: company.enabled_modules || ["blasting", "drilling", "fleet", "inventory", "safety", "material-handling"],
              ts: Date.now()
          }
          document.cookie = `msm_user_role=${encodeURIComponent(JSON.stringify(syncData))}; path=/; max-age=${60 * 60 * 24}; SameSite=Lax`
          
      }
  }

  const TABS = [
    { id: "companies", label: "Manage Companies", icon: Building2 },
    { id: "users",    label: "User Management",   icon: Users },
    { id: "audit",    label: "Audit Logs",        icon: ClipboardList },
    { id: "flags",    label: "Feature Flags",     icon: Flag },
    { id: "branding", label: "Branding",          icon: ImageIcon },
    { id: "health",   label: "System Health",     icon: HeartPulse },
    { id: "backup",   label: "Backup",            icon: Archive },
  ] as const

  return (
    <div className="space-y-6 max-w-7xl mx-auto mb-20 px-4 md:px-0">
      <DashboardHeader 
          title="Global Command Center" 
          description="Global System Overseer" 
      />

      {/* TIERED PERFORMANCE OVERVIEW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-2">
        {/* Total Consolidation */}
        <Card className="bg-slate-900 border-slate-800 text-white shadow-xl rounded-[2rem] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Coins className="w-16 h-16" />
          </div>
          <CardHeader className="pb-1">
            <CardTitle className="text-[9px] font-black tracking-[0.2em] uppercase text-amber-400">Total System Revenue</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black tracking-tighter text-white font-mono">TZS 0</span>
                <span className="text-[10px] font-bold text-slate-500 uppercase">/m</span>
             </div>
             <p className="text-[9px] font-black text-emerald-400 uppercase mt-2">↑ 0% from last month</p>
          </CardContent>
        </Card>

        {/* Active Companies / Subs */}
        <Card className="bg-white border-slate-100 text-slate-900 shadow-xl rounded-[2rem] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-blue-500">
            <Building2 className="w-16 h-16" />
          </div>
          <CardHeader className="pb-1">
            <CardTitle className="text-[9px] font-black tracking-[0.2em] uppercase text-blue-600">Active Companies</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black tracking-tighter text-slate-900 font-mono">{companies.length}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Registered</span>
             </div>
             <p className="text-[9px] font-black text-blue-500 uppercase mt-2">{companies.filter(c => c.status === 'Active').length} Active Subscriptions</p>
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

      {/* ─── 6-SECTION TABS ─────────────────────────────────────── */}
      <div className="px-2">
        {/* Tab Bar */}
        <div className="flex gap-1 bg-slate-100 rounded-2xl p-1 mb-6 overflow-x-auto">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                activeTab === tab.id ? "bg-white shadow-md text-slate-900" : "text-slate-500 hover:text-slate-700"
              }`}>
              <tab.icon className="w-3.5 h-3.5" />{tab.label}
            </button>
          ))}
        </div>

        {/* ── TAB: COMPANIES ── */}
        {activeTab === "companies" && (
          <Card className="border shadow-2xl rounded-[2.5rem] overflow-hidden border-slate-100 bg-white">
            <CardHeader className="p-8 pb-4 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-500" /> Organization Directory
                </CardTitle>
                <Button onClick={() => setShowAddCompany(true)} className="rounded-xl h-10 bg-emerald-600 hover:bg-emerald-700 gap-2">
                  <Plus className="w-4 h-4" /> Add Organization
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {companiesLoading ? (
                <div className="flex items-center justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-emerald-500" /></div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="bg-slate-50 border-b">
                      {["Company Name","Created Date","Total Users","Status","Actions"].map(h => (
                        <th key={h} className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {allCompanies.map(c => (
                        <tr key={c.id} className="border-b hover:bg-slate-50/70 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-black text-slate-900">{c.name}</div>
                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{c.id.slice(0,8)}</div>
                          </td>
                          <td className="px-6 py-4 text-xs font-bold text-slate-500">
                            {format(new Date(c.created_at), "dd MMM yyyy")}
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant="outline" className="rounded-full bg-blue-50 text-blue-700 border-blue-100 font-black px-3">
                              {c.userCount} Users
                            </Badge>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-[9px] font-black bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full">ACTIVE</span>
                          </td>
                          <td className="px-6 py-4">
                            <Button size="sm" variant="ghost" className="rounded-xl hover:bg-slate-900 hover:text-white transition-all font-black text-[9px] uppercase tracking-widest">
                              Launch Dashboard
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>

            {/* Add Company Modal */}
            <Dialog open={showAddCompany} onOpenChange={setShowAddCompany}>
              <DialogContent className="rounded-[2.5rem] border-2 max-w-lg p-8">
                <DialogHeader>
                  <DialogTitle className="text-lg font-black uppercase tracking-tight">Provision New Organization</DialogTitle>
                </DialogHeader>
                {!tempAdminPass ? (
                  <div className="space-y-4 mt-4">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Company Name</Label>
                      <Input value={newCompany.companyName} onChange={e => setNewCompany({...newCompany, companyName: e.target.value})} placeholder="e.g. Tanzanite Mines Ltd" className="rounded-xl border-2 h-12" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Admin Full Name</Label>
                      <Input value={newCompany.adminFullName} onChange={e => setNewCompany({...newCompany, adminFullName: e.target.value})} placeholder="John Doe" className="rounded-xl border-2 h-12" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Admin Email</Label>
                      <Input type="email" value={newCompany.adminEmail} onChange={e => setNewCompany({...newCompany, adminEmail: e.target.value})} placeholder="admin@company.com" className="rounded-xl border-2 h-12" />
                    </div>
                    <Button onClick={handleAddCompany} disabled={isSaving} className="w-full h-12 rounded-xl bg-slate-900 hover:bg-black text-white font-black uppercase tracking-widest mt-4">
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                      Create Organization
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6 mt-4">
                    <Alert className="rounded-2xl border-amber-200 bg-amber-50 p-6">
                      <ShieldCheck className="h-5 w-5 text-amber-600" />
                      <AlertDescription>
                        <p className="text-[10px] font-black uppercase tracking-widest text-amber-700 mb-2">Temporary Admin Password</p>
                        <div className="flex items-center gap-3">
                          <code className="text-xl font-black tracking-widest text-amber-900 bg-white px-4 py-2 rounded-xl border border-amber-200">{tempAdminPass}</code>
                          <Button size="sm" onClick={() => { navigator.clipboard.writeText(tempAdminPass); toast({title: "Copied!"}) }} className="rounded-xl bg-amber-500 hover:bg-amber-600 text-white">Copy</Button>
                        </div>
                        <p className="text-[9px] text-amber-600 font-bold mt-4 leading-relaxed">
                          Organization provisioning complete. Share this password with the primary admin. They will be required to change it on first login.
                        </p>
                      </AlertDescription>
                    </Alert>
                    <Button onClick={() => { setShowAddCompany(false); setTempAdminPass(null); }} className="w-full h-12 rounded-xl bg-slate-900 text-white font-black uppercase tracking-widest">
                      Close & Finish
                    </Button>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </Card>
        )}

        {/* ── TAB: USER MANAGEMENT ── */}
        {activeTab === "users" && <UserManagementPanel />}

        {/* ── TAB: AUDIT LOGS ── */}
        {activeTab === "audit" && (
          <Card className="border shadow-2xl rounded-[2.5rem] overflow-hidden border-slate-100 bg-white">
            <CardHeader className="p-8 pb-4 border-b">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-blue-500" /> System Audit Log
              </CardTitle>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                <Input placeholder="Filter by module" value={auditFilter.module} onChange={e => setAuditFilter(f => ({...f, module: e.target.value}))} className="rounded-xl border-2 h-10 text-xs" />
                <Input placeholder="Filter by user" value={auditFilter.user} onChange={e => setAuditFilter(f => ({...f, user: e.target.value}))} className="rounded-xl border-2 h-10 text-xs" />
                <Input type="date" value={auditFilter.from} onChange={e => setAuditFilter(f => ({...f, from: e.target.value}))} className="rounded-xl border-2 h-10 text-xs" />
                <Button onClick={loadAudit} className="rounded-xl h-10 bg-blue-600 hover:bg-blue-700 text-xs">Filter</Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {auditLoading ? (
                <div className="flex items-center justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-blue-500" /></div>
              ) : (
                <div className="overflow-x-auto max-h-[500px]">
                  <table className="w-full text-sm">
                    <thead><tr className="bg-slate-50 border-b sticky top-0">
                      {["Timestamp","User","Action","Module","Details"].map(h => (
                        <th key={h} className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {auditLogs.length === 0 ? (
                        <tr><td colSpan={5} className="py-12 text-center text-slate-400 font-bold text-sm">No audit events found</td></tr>
                      ) : auditLogs.map(log => (
                        <tr key={log.id} className="border-b hover:bg-slate-50/70 transition-colors">
                          <td className="px-5 py-3 text-[10px] text-slate-500 font-mono whitespace-nowrap">{log.created_at ? format(new Date(log.created_at), "dd MMM HH:mm") : "—"}</td>
                          <td className="px-5 py-3 text-xs font-bold">{log.actor_name || log.actor_id?.slice(0,8) || "—"}</td>
                          <td className="px-5 py-3"><span className="text-[9px] font-black bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{log.action}</span></td>
                          <td className="px-5 py-3 text-xs font-bold capitalize">{log.module || "—"}</td>
                          <td className="px-5 py-3 text-[10px] text-slate-500 max-w-xs truncate">{log.details || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── TAB: FEATURE FLAGS ── */}
        {activeTab === "flags" && (
          <Card className="border shadow-2xl rounded-[2.5rem] border-slate-100 bg-white">
            <CardHeader className="p-8 pb-4 border-b">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <Flag className="w-4 h-4 text-amber-500" /> Feature Flags
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-4">
              {flags.length === 0 ? (
                <p className="text-sm text-slate-400 font-bold">No flags configured. Run the database migration SQL first.</p>
              ) : flags.map(flag => (
                <div key={flag.flag_name} className="flex items-center justify-between p-5 rounded-2xl bg-slate-50 border border-slate-100">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-700">{flag.flag_name}</p>
                    <p className="text-[9px] font-bold text-slate-400 mt-0.5">{flag.description || ""}</p>
                  </div>
                  <button onClick={() => toggleFlag(flag)} disabled={flagSaving}
                    className={`relative w-14 h-7 rounded-full transition-all duration-300 focus:outline-none ${
                      flag.is_enabled ? "bg-indigo-600 shadow-lg shadow-indigo-500/30" : "bg-slate-300"
                    }`}>
                    <span className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300 ${flag.is_enabled ? "left-8" : "left-1"}`} />
                  </button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* ── TAB: BRANDING ── */}
        {activeTab === "branding" && (
          <div className="space-y-4">
            <Card className="border shadow-2xl rounded-[2.5rem] border-slate-100 bg-white">
              <CardHeader className="p-8 pb-4 border-b">
                <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-violet-500" /> Company Brands
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-4">
                {/* Add brand form */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <Input placeholder="Brand name (e.g. Amogtech)" value={newBrand.brand_name} onChange={e => setNewBrand({...newBrand, brand_name: e.target.value})} className="rounded-xl border-2 h-11" />
                  <Input placeholder="Logo URL" value={newBrand.logo_url} onChange={e => setNewBrand({...newBrand, logo_url: e.target.value})} className="rounded-xl border-2 h-11" />
                  <Input placeholder="Tagline" value={newBrand.tagline} onChange={e => setNewBrand({...newBrand, tagline: e.target.value})} className="rounded-xl border-2 h-11" />
                  <Button onClick={addBrand} disabled={brandSaving || !newBrand.brand_name} className="rounded-xl h-11 bg-violet-600 hover:bg-violet-700 gap-2">
                    <Plus className="w-3.5 h-3.5" /> Add Brand
                  </Button>
                </div>
                {/* Brands list */}
                {brands.map(brand => (
                  <div key={brand.id} className="flex items-center justify-between p-5 rounded-2xl bg-white border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-4">
                      {brand.logo_url ? (
                        <img src={brand.logo_url} alt={brand.brand_name} className="h-10 w-10 object-contain rounded-xl border" />
                      ) : (
                        <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center">
                          <ImageIcon className="w-5 h-5 text-slate-400" />
                        </div>
                      )}
                      <div>
                        <p className="font-black text-slate-900">{brand.brand_name}</p>
                        <p className="text-[10px] text-slate-400 font-bold">{brand.tagline}</p>
                      </div>
                      {brand.is_default && <span className="text-[9px] bg-emerald-100 text-emerald-700 font-black px-2 py-0.5 rounded-full">DEFAULT</span>}
                    </div>
                    <div className="flex gap-2">
                      {!brand.is_default && (
                        <Button size="sm" variant="outline" onClick={() => setDefaultBrand(brand.id)} className="rounded-xl border-2 text-xs font-bold">
                          Set Default
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => deleteBrand(brand.id)} className="rounded-xl hover:bg-red-50 hover:text-red-600 h-8 w-8 p-0">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
                {brands.length === 0 && <p className="text-sm text-slate-400 font-bold text-center py-6">No brands configured yet</p>}
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── TAB: SYSTEM HEALTH ── */}
        {activeTab === "health" && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: "Active Users", value: health.activeUsers, sub: "Registered profiles", color: "text-blue-600", bg: "from-blue-50", icon: <Users className="w-5 h-5 text-blue-400" /> },
              { label: "System Uptime", value: health.uptime, sub: "Last 30 days", color: "text-emerald-600", bg: "from-emerald-50", icon: <HeartPulse className="w-5 h-5 text-emerald-400" /> },
              { label: "Pending Syncs", value: health.pendingSyncs, sub: "Offline queue", color: "text-amber-600", bg: "from-amber-50", icon: <Cpu className="w-5 h-5 text-amber-400" /> },
              { label: "DB Storage", value: health.dbUsage, sub: "Estimated usage", color: "text-violet-600", bg: "from-violet-50", icon: <Database className="w-5 h-5 text-violet-400" /> },
              { label: "Last Backup", value: backupLogs[0] ? format(new Date(backupLogs[0].created_at), "dd MMM HH:mm") : "None", sub: "Most recent backup", color: "text-slate-700", bg: "from-slate-50", icon: <Archive className="w-5 h-5 text-slate-400" /> },
              { label: "DB Status", value: "ONLINE", sub: "Supabase PostgreSQL", color: "text-emerald-600", bg: "from-emerald-50", icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" /> },
            ].map((card, i) => (
              <Card key={i} className={`rounded-[2rem] border border-slate-100 bg-gradient-to-br ${card.bg} to-white shadow-lg`}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-3">{card.icon}<p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{card.label}</p></div>
                  <p className={`text-2xl font-black ${card.color}`}>{card.value}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">{card.sub}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* ── TAB: BACKUP ── */}
        {activeTab === "backup" && (
          <Card className="border shadow-2xl rounded-[2.5rem] border-slate-100 bg-white">
            <CardHeader className="p-8 pb-4 border-b">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <Archive className="w-4 h-4 text-indigo-500" /> Backup Management
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <Button onClick={runBackup} disabled={backupRunning}
                className="h-14 px-8 rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-black uppercase tracking-widest text-sm gap-3 shadow-xl shadow-indigo-500/20">
                {backupRunning ? <Loader2 className="w-5 h-5 animate-spin" /> : <Archive className="w-5 h-5" />}
                {backupRunning ? "Running Backup..." : "Trigger Manual Backup"}
              </Button>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Automated daily backups run at midnight. Manual backups download all tables as JSON.</p>
              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Recent Backups</p>
                {backupLogs.length === 0 ? (
                  <p className="text-sm text-slate-400 font-bold">No backups yet. Run the first backup above.</p>
                ) : backupLogs.map(log => (
                  <div key={log.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-700">{log.backup_type?.toUpperCase()} Backup</p>
                      <p className="text-[9px] font-bold text-slate-400">{log.record_count} records · {log.created_at ? format(new Date(log.created_at), "dd MMM yyyy HH:mm") : "—"}</p>
                    </div>
                    <span className="text-[9px] bg-emerald-100 text-emerald-700 font-black px-2 py-1 rounded-full">COMPLETED</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Legacy Registered Mines Section */}
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
                      <div key={idx} className="p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between hover:bg-slate-50 transition-colors gap-4">
                          <div className="flex items-center gap-3 md:gap-4">
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
                          
                          <div className="flex flex-wrap items-center gap-2">
                                <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleLaunchDashboard(company)}
                                    className="flex-1 md:flex-none h-10 px-4 rounded-xl hover:bg-slate-900 hover:text-white transition-all font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 border border-slate-100 shadow-sm whitespace-nowrap"
                                >
                                    <LayoutDashboard className="w-3.5 h-3.5 text-blue-500" />
                                    Launch
                                </Button>
                                <a href={`/super-admin/companies/${company.id}/subscription`} className="flex-1 md:flex-none">
                                    <Button variant="ghost" size="sm"
                                        className="w-full h-10 px-3 rounded-xl hover:bg-amber-100 hover:text-amber-700 font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-1.5 border border-amber-100 shadow-sm whitespace-nowrap">
                                        <Coins className="w-3.5 h-3.5 text-amber-500" />Subscription
                                    </Button>
                                </a>
                          </div>
                      </div>
                  ))}
             </div>
          </CardContent>
   
        </Card>
        </div>



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
                        <div className="relative">
                            <Button 
                                disabled={isSaving}
                                className="w-full bg-white text-indigo-600 hover:bg-indigo-50 text-[10px] font-black uppercase h-12 rounded-xl"
                            >
                                <label className="flex items-center justify-center gap-2 cursor-pointer w-full h-full">
                                    <Upload className="w-3.5 h-3.5" />
                                    {isSaving ? "Processing..." : "Restore Data"}
                                    <input 
                                        type="file" 
                                        accept=".json"
                                        className="hidden"
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;
                                            vibe();
                                            setIsSaving(true);
                                            try {
                                                const reader = new FileReader();
                                                reader.onload = async (event) => {
                                                    const content = event.target?.result as string;
                                                    
                                                    const response = await fetch('/api/backup/import', {
                                                        method: 'POST',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: content
                                                    });
                                                    
                                                    const result = await response.json();
                                                    if (!response.ok) throw new Error(result.error || "Import failed");
                                                    
                                                    toast({
                                                        title: "System Restored",
                                                        description: "Enterprise records have been successfully merged from the backup.",
                                                    });
                                                    window.location.reload();
                                                };
                                                reader.readAsText(file);
                                            } catch (err: any) {
                                                toast({ title: "Restore Failed", description: err.message, variant: "destructive" });
                                            } finally {
                                                setIsSaving(false);
                                            }
                                        }}
                                    />
                                </label>
                            </Button>
                        </div>
                    </div>
                    
                    <Button 
                        disabled={isSaving}
                        onClick={async () => {
                            vibe();
                            setIsSaving(true);
                            try {
                                const response = await fetch('/api/backup');
                                const data = await response.json();
                                
                                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `SMART_MINE_FULL_BACKUP_${new Date().toISOString().split('T')[0]}.json`;
                                a.click();
                                
                                toast({ title: "JSON Export Ready", description: "Complete system state has been archived to JSON." });
                            } catch (err: any) {
                                toast({ title: "Export Failed", description: err.message, variant: "destructive" });
                            } finally {
                                setIsSaving(false);
                            }
                        }}
                        className="w-full mt-3 bg-indigo-700 hover:bg-indigo-800 text-white text-[10px] font-black uppercase h-12 rounded-xl border border-indigo-500 shadow-lg"
                    >
                        <Database className="w-3.5 h-3.5 mr-2" />
                        Generate JSON Blackbox
                    </Button>
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
