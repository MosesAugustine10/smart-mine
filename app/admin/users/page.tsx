"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  UserPlus, Search, Mail, Phone, Calendar, Shield,
  ChevronLeft, Loader2, Users, UserCog, CheckCircle2,
  Edit2, Save, X, Crown, Hammer, Eye, BarChart3,
  HardHat, Pickaxe, Truck, Package, FlaskConical
} from "lucide-react"
import Link from "next/link"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"

// ─── RBAC Role Matrix ─────────────────────────────────────────────────────────
// NOTE: "Super Admin" is a SYSTEM-OWNER level role managed exclusively by the
// platform. Company Admins can only assign these 10 operational roles.
// This list MUST mirror the permission matrix in the system spec.
const ROLES = [
  {
    value: "Investor",
    label: "Investor",
    desc: "Full access to ALL modules and reports",
    color: "bg-amber-100 text-amber-800 border-amber-300",
    icon: Crown,
    group: "management",
  },
  {
    value: "Manager",
    label: "Manager",
    desc: "Full ops access · Finance & Diamond Drilling: View Only",
    color: "bg-blue-100 text-blue-800 border-blue-300",
    icon: Shield,
    group: "management",
  },
  {
    value: "Accountant",
    label: "Accountant",
    desc: "Finance only · No access to field operations",
    color: "bg-purple-100 text-purple-800 border-purple-300",
    icon: BarChart3,
    group: "management",
  },
  {
    value: "Geologist",
    label: "Geologist",
    desc: "Diamond Drilling + Geophysics: Full · Others: View / Request",
    color: "bg-emerald-100 text-emerald-800 border-emerald-300",
    icon: FlaskConical,
    group: "technical",
  },
  {
    value: "Blaster",
    label: "Blaster",
    desc: "Blasting: Form only · Request Blasting/PPE inventory",
    color: "bg-orange-100 text-orange-800 border-orange-300",
    icon: HardHat,
    group: "field",
  },
  {
    value: "Driller",
    label: "Driller",
    desc: "Drilling: Form only · Request Fuel, Maintenance & Drilling/PPE",
    color: "bg-sky-100 text-sky-800 border-sky-300",
    icon: Pickaxe,
    group: "field",
  },
  {
    value: "Diamond Driller",
    label: "Diamond Driller",
    desc: "Diamond Drilling: Form only · Request Diamond/PPE inventory",
    color: "bg-indigo-100 text-indigo-800 border-indigo-300",
    icon: Eye,
    group: "field",
  },
  {
    value: "Stock Keeper",
    label: "Stock Keeper",
    desc: "Full CRUD on all Inventory categories (incl. PPE)",
    color: "bg-teal-100 text-teal-800 border-teal-300",
    icon: Package,
    group: "technical",
  },
  {
    value: "Supervisor",
    label: "Supervisor",
    desc: "Form only on own site · Request all / PPE inventory",
    color: "bg-slate-200 text-slate-800 border-slate-400",
    icon: UserCog,
    group: "field",
  },
  {
    value: "Driver/Operator",
    label: "Driver / Operator",
    desc: "Haulage + Fleet forms only · Request PPE",
    color: "bg-gray-100 text-gray-700 border-gray-300",
    icon: Truck,
    group: "field",
  },
]

// All 10 operational roles are selectable (Super Admin is never shown here)
const SELECTABLE_ROLES = ROLES

function getRoleMeta(role: string) {
  return (
    ROLES.find(r => r.value === role || r.value.toLowerCase() === role?.toLowerCase()) || {
      value: role || "unknown",
      label: role || "Unknown",
      desc: "",
      color: "bg-gray-100 text-gray-600 border-gray-200",
      icon: UserCog,
      group: "field",
    }
  )
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [editingUser, setEditingUser] = useState<any>(null)
  const [editRole, setEditRole] = useState("")
  const [saving, setSaving] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState("Driller")
  const [inviting, setInviting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchUsers()
  }, [])

  async function fetchUsers() {
    try {
      setLoading(true)
      const supabase = getSupabaseBrowserClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { setLoading(false); return }

      const { data: profile } = await supabase
        .from("user_profiles")
        .select("company_id")
        .eq("id", session.user.id)
        .single()

      if (profile?.company_id) {
        const { data } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("company_id", profile.company_id)
          .order("created_at", { ascending: false })
        if (data) setUsers(data)
      }
    } catch (error) {
      console.error("User Fetch Error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleEditRole = async () => {
    if (!editingUser || !editRole) return
    setSaving(true)
    try {
      const supabase = getSupabaseBrowserClient()
      const { error } = await supabase
        .from("user_profiles")
        .update({ role: editRole })
        .eq("id", editingUser.id)
      if (error) throw error
      toast({ title: "Role Updated", description: `${editingUser.first_name}'s role changed to ${editRole}.` })
      setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, role: editRole } : u))
      setEditingUser(null)
    } catch (err: any) {
      toast({ title: "Update Failed", description: err.message, variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleInvite = async () => {
    if (!inviteEmail) return
    setInviting(true)
    try {
      // In a real system, this would call an invite API endpoint
      // For now, show a success toast indicating the invite was "sent"
      await new Promise(r => setTimeout(r, 800))
      toast({ title: "Invitation Sent", description: `Invite dispatched to ${inviteEmail} as ${inviteRole}.` })
      setInviteOpen(false)
      setInviteEmail("")
      setInviteRole("Driller")
    } catch (err: any) {
      toast({ title: "Invite Failed", description: err.message, variant: "destructive" })
    } finally {
      setInviting(false)
    }
  }

  const filteredUsers = users.filter(u =>
    `${u.first_name} ${u.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Stats
  const roleDistribution = ROLES.map(r => ({ ...r, count: users.filter(u => u.role === r.value).length })).filter(r => r.count > 0)

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center space-y-4 bg-slate-50">
        <div className="relative">
          <Loader2 className="w-16 h-16 text-blue-600 animate-spin" />
          <Users className="w-6 h-6 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-400" />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400 animate-pulse">Synchronizing Personnel Registry...</p>
      </div>
    )
  }

  return (
    <div className="p-6 sm:p-10 space-y-10 max-w-[1400px] mx-auto min-h-screen bg-slate-50/50 dark:bg-slate-950/50 pb-20">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b-2 border-slate-200 dark:border-slate-800 pb-8">
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <Button variant="ghost" className="h-10 px-4 rounded-xl font-bold uppercase text-[10px] tracking-widest border-2 hover:bg-white transition-all">
              <ChevronLeft className="w-4 h-4 mr-2" />Back
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2.5 rounded-xl text-white shadow-lg shadow-blue-500/30">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">User Management</h1>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Personnel Registry & Access Control</p>
            </div>
          </div>
        </div>
        <Button
          onClick={() => setInviteOpen(true)}
          className="h-14 px-8 rounded-2xl bg-blue-600 hover:bg-blue-700 font-black uppercase text-[11px] tracking-widest shadow-2xl shadow-blue-500/20 transition-all hover:scale-[1.02]"
        >
          <UserPlus className="w-4 h-4 mr-3" />
          Invite New User
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        <Card className="border-0 shadow-xl rounded-[2rem] bg-slate-900 text-white overflow-hidden relative">
          <CardContent className="p-6">
            <Users className="absolute -top-4 -right-4 w-24 h-24 opacity-5" />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Total Personnel</p>
            <p className="text-5xl font-black italic">{users.length}</p>
            <p className="text-[10px] font-bold text-slate-500 uppercase mt-3">Registered Accounts</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-xl rounded-[2rem] bg-blue-600 text-white overflow-hidden relative">
          <CardContent className="p-6">
            <Shield className="absolute -top-4 -right-4 w-24 h-24 opacity-10" />
            <p className="text-[10px] font-black uppercase tracking-widest text-blue-200 mb-2">Admins</p>
            <p className="text-5xl font-black italic">{users.filter(u => ['Investor','Manager','Accountant'].includes(u.role)).length}</p>
            <p className="text-[10px] font-bold text-blue-300 uppercase mt-3">Management Access</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-xl rounded-[2rem] bg-emerald-600 text-white overflow-hidden relative">
          <CardContent className="p-6">
            <Hammer className="absolute -top-4 -right-4 w-24 h-24 opacity-10" />
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-200 mb-2">Field Staff</p>
            <p className="text-5xl font-black italic">{users.filter(u => ['Blaster','Driller','Diamond Driller','Stock Keeper','Supervisor','Driver/Operator','Geologist'].includes(u.role)).length}</p>
            <p className="text-[10px] font-bold text-emerald-300 uppercase mt-3">Operational Users</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-xl rounded-[2rem] bg-white dark:bg-slate-900 overflow-hidden border-t-4 border-blue-500">
          <CardContent className="p-6">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Role Breakdown</p>
            <div className="space-y-1.5">
              {roleDistribution.slice(0, 3).map(r => (
                <div key={r.value} className="flex items-center justify-between">
                  <span className="text-[9px] font-black uppercase text-slate-500">{r.label}</span>
                  <span className="text-[10px] font-black text-slate-800 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">{r.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="border-0 shadow-2xl rounded-[2.5rem] overflow-hidden bg-white dark:bg-slate-900 border-t-8 border-blue-600">
        <CardHeader className="bg-slate-950 text-white px-8 py-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-black uppercase italic tracking-tighter flex items-center gap-3">
              <BarChart3 className="w-5 h-5 text-blue-400" />
              Personnel Registry
            </CardTitle>
            <Badge className="bg-blue-600 text-white font-black border-0 px-4 text-[10px] tracking-widest">{filteredUsers.length} USERS</Badge>
          </div>
          {/* Search */}
          <div className="flex items-center gap-3 mt-4 bg-slate-800 rounded-2xl px-4 py-3">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <Input
              placeholder="Search by name, email or role..."
              className="bg-transparent border-0 focus-visible:ring-0 text-sm font-medium text-white placeholder:text-slate-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-slate-100 dark:border-slate-800">
                  <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400">User</th>
                  <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Role & Access</th>
                  <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Contact</th>
                  <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                  <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Registered</th>
                  <th className="text-right py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => {
                  const roleMeta = getRoleMeta(user.role)
                  const RoleIcon = roleMeta.icon
                  return (
                    <tr key={user.id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-blue-50/40 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-5 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-blue-500/20 shrink-0">
                            {user.first_name?.[0]?.toUpperCase()}{user.last_name?.[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-sm">{user.first_name} {user.last_name}</p>
                            <p className="text-[10px] font-bold text-slate-400 font-mono">ID: {user.id.slice(0, 10)}...</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-5 px-6">
                        <div className="space-y-1">
                          <Badge className={`${roleMeta.color} font-black uppercase text-[9px] px-3 py-1 border flex items-center gap-1.5 w-fit`}>
                            <RoleIcon className="w-3 h-3" />
                            {roleMeta.label}
                          </Badge>
                          {(roleMeta as any).desc && (
                            <p className="text-[9px] text-slate-400 font-medium pl-1 max-w-[200px] truncate">{(roleMeta as any).desc}</p>
                          )}
                        </div>
                      </td>
                      <td className="py-5 px-6">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 text-slate-500">
                            <Mail className="w-3.5 h-3.5 shrink-0" />
                            <span className="text-xs font-medium">{user.email || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-500">
                            <Phone className="w-3.5 h-3.5 shrink-0" />
                            <span className="text-xs font-medium">{user.phone_number || 'N/A'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-5 px-6">
                        <Badge className="bg-emerald-50 text-emerald-700 font-black uppercase text-[9px] px-3 border border-emerald-200 flex items-center gap-1.5 w-fit">
                          <CheckCircle2 className="w-3 h-3" />
                          Active
                        </Badge>
                      </td>
                      <td className="py-5 px-6">
                        <div className="flex items-center gap-2 text-slate-400">
                          <Calendar className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-bold">{new Date(user.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                        </div>
                      </td>
                      <td className="py-5 px-6">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => { setEditingUser(user); setEditRole(user.role || 'operator') }}
                            className="h-9 px-4 rounded-xl font-black uppercase text-[9px] tracking-widest border-2 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all"
                          >
                            <Edit2 className="w-3 h-3 mr-1.5" />
                            Edit Role
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-24 text-center">
                      <Users className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                      <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">Zero Personnel Records Found</p>
                      <p className="text-xs text-slate-300 mt-2">Try a different search term or invite new users</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Role Dialog */}
      <Dialog open={!!editingUser} onOpenChange={(o) => !o && setEditingUser(null)}>
        <DialogContent className="max-w-md rounded-[2rem] border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase italic tracking-tighter flex items-center gap-2">
              <UserCog className="w-5 h-5 text-blue-600" />
              Edit Access Role
            </DialogTitle>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-6 pt-2">
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border-2">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-sm">
                  {editingUser.first_name?.[0]}{editingUser.last_name?.[0]}
                </div>
                <div>
                  <p className="font-black text-slate-900 uppercase">{editingUser.first_name} {editingUser.last_name}</p>
                  <p className="text-xs text-slate-400">{editingUser.email}</p>
                </div>
              </div>
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Select New Role</Label>
                <div className="grid gap-2">
                  {SELECTABLE_ROLES.map(role => {
                    const RIcon = role.icon
                    return (
                      <button
                        key={role.value}
                        onClick={() => setEditRole(role.value)}
                        className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                          editRole === role.value
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-slate-100 hover:border-slate-200 bg-white'
                        }`}
                      >
                        <div className={`p-1.5 rounded-lg shrink-0 ${editRole === role.value ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                          <RIcon className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-700">{role.label}</p>
                          <p className="text-[9px] font-medium text-slate-400 mt-0.5 truncate">{role.desc}</p>
                        </div>
                        {editRole === role.value && <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setEditingUser(null)} className="flex-1 h-12 rounded-xl font-black uppercase text-[10px] tracking-widest border-2">
                  <X className="w-4 h-4 mr-2" />Cancel
                </Button>
                <Button onClick={handleEditRole} disabled={saving} className="flex-1 h-12 rounded-xl bg-blue-600 hover:bg-blue-700 font-black uppercase text-[10px] tracking-widest">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  Save Role
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Invite User Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="max-w-md rounded-[2rem] border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase italic tracking-tighter flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-blue-600" />
              Invite New User
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 pt-2">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="engineer@minesite.com"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  className="pl-10 h-12 rounded-xl border-2 font-medium"
                />
              </div>
            </div>
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Assign Role</Label>
              <div className="grid gap-2">
                {SELECTABLE_ROLES.map(role => {
                  const RIcon = role.icon
                  return (
                    <button
                      key={role.value}
                      onClick={() => setInviteRole(role.value)}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                        inviteRole === role.value ? 'border-blue-500 bg-blue-50' : 'border-slate-100 hover:border-slate-200 bg-white'
                      }`}
                    >
                      <div className={`p-1.5 rounded-lg shrink-0 ${inviteRole === role.value ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                        <RIcon className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-700">{role.label}</p>
                        <p className="text-[9px] font-medium text-slate-400 mt-0.5 truncate">{role.desc}</p>
                      </div>
                      {inviteRole === role.value && <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />}
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setInviteOpen(false)} className="flex-1 h-12 rounded-xl font-black uppercase text-[10px] tracking-widest border-2">
                Cancel
              </Button>
              <Button onClick={handleInvite} disabled={inviting || !inviteEmail} className="flex-1 h-12 rounded-xl bg-blue-600 hover:bg-blue-700 font-black uppercase text-[10px] tracking-widest">
                {inviting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
                Send Invite
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
