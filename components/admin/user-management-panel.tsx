"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog"
import {
  Users, Plus, Edit, Trash2, Copy, CheckCircle2, Loader2,
  Shield, Search, RefreshCw
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { ALL_ROLES, ROLE_LABELS, ROLE_COLORS, type AppRole } from "@/lib/rbac"

interface UserRecord {
  id: string
  first_name: string
  last_name: string
  email: string
  role: string
  roles: string[]
  status: string
  is_temp_password: boolean
  temp_password_expires_at: string | null
}

export function UserManagementPanel() {
  const { toast } = useToast()
  const [users, setUsers] = useState<UserRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [showAdd, setShowAdd] = useState(false)
  const [editUser, setEditUser] = useState<UserRecord | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<UserRecord | null>(null)
  const [tempPassword, setTempPassword] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // Password Reset Requests
  const [resetRequests, setResetRequests] = useState<any[]>([])
  const [resetModalUser, setResetModalUser] = useState<UserRecord | null>(null)
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  const [newUser, setNewUser] = useState({ full_name: "", email: "", roles: [] as string[] })
  const [editRoles, setEditRoles] = useState<string[]>([])

  const loadUsers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/super-admin/users")
      const data = await res.json()
      setUsers(data.users || [])
      
      // Load reset requests
      const reqRes = await fetch("/api/super-admin/password-resets")
      const reqData = await reqRes.json()
      setResetRequests(reqData.requests || [])
    } catch { toast({ title: "Error loading management data", variant: "destructive" }) }
    finally { setLoading(false) }
  }, [toast])

  useEffect(() => { loadUsers() }, [loadUsers])

  const filtered = users.filter(u =>
    (u.first_name + " " + u.last_name + " " + u.email).toLowerCase().includes(search.toLowerCase())
  )

  const toggleRole = (role: string, current: string[], setter: (r: string[]) => void) => {
    setter(current.includes(role) ? current.filter(r => r !== role) : [...current, role])
  }

  const handleCreate = async () => {
    if (!newUser.email || newUser.roles.length === 0) {
      toast({ title: "Email and at least one role required", variant: "destructive" }); return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/super-admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setTempPassword(data.tempPassword)
      setShowAdd(false)
      setNewUser({ full_name: "", email: "", roles: [] })
      loadUsers()
      toast({ title: "✅ User created", description: "Temporary password generated below." })
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" })
    } finally { setSaving(false) }
  }

  const handleEditSave = async () => {
    if (!editUser) return
    setSaving(true)
    try {
      const res = await fetch("/api/super-admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: editUser.id, roles: editRoles })
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      setEditUser(null)
      loadUsers()
      toast({ title: "✅ Roles updated" })
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" })
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setSaving(true)
    try {
      const res = await fetch(`/api/super-admin/users?userId=${deleteTarget.id}`, { method: "DELETE" })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      setDeleteTarget(null)
      loadUsers()
      toast({ title: "User deleted" })
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" })
    } finally { setSaving(false) }
  }

  const handleResetPassword = async () => {
    if (!resetModalUser) return
    setSaving(true)
    try {
      const res = await fetch("/api/super-admin/password-resets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: resetModalUser.id })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setTempPassword(data.tempPassword)
      setShowResetConfirm(false)
      loadUsers()
      toast({ title: "✅ Password Reset Complete" })
    } catch (e: any) {
      toast({ title: "Reset Failed", description: e.message, variant: "destructive" })
    } finally { setSaving(false) }
  }

  const copyPassword = () => {
    if (tempPassword) {
      navigator.clipboard.writeText(tempPassword)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <Card className="border shadow-2xl rounded-[2.5rem] overflow-hidden border-slate-100 bg-white">
      <CardHeader className="p-8 pb-4 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-500" /> User Management
          </CardTitle>
          <div className="flex gap-2">
            <Button onClick={loadUsers} size="sm" variant="outline" className="rounded-xl border-2 h-9 gap-2">
              <RefreshCw className="w-3 h-3" /> Refresh
            </Button>
            <Button onClick={() => setShowAdd(true)} size="sm" className="rounded-xl h-9 gap-2 bg-indigo-600 hover:bg-indigo-700">
              <Plus className="w-3 h-3" /> Add User
            </Button>
          </div>
        </div>
        
        {/* Pending Password Reset Requests Section */}
        {resetRequests.length > 0 && (
          <div className="mt-6 px-2">
            <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <RefreshCw className="w-4 h-4 text-amber-600 animate-spin-slow" />
                <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-700">Pending Reset Requests</h4>
              </div>
              <div className="space-y-2">
                {resetRequests.map(req => (
                  <div key={req.id} className="flex items-center justify-between bg-white/80 p-3 rounded-xl border border-amber-100">
                    <div>
                      <p className="text-xs font-black text-slate-800">{req.user_email}</p>
                      <p className="text-[9px] font-bold text-slate-400">{new Date(req.requested_at).toLocaleString()}</p>
                    </div>
                    <Button size="sm" onClick={() => { setResetModalUser(users.find(u => u.email === req.user_email) || null); setShowResetConfirm(true); }} className="h-8 rounded-lg bg-amber-600 hover:bg-amber-700 text-[9px] font-black uppercase tracking-widest">
                      Resolve Now
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="relative mt-4">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search users..." className="pl-9 rounded-xl border-2" />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b">
                  <th className="text-left px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Employee</th>
                  <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Assigned Roles</th>
                  <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Status</th>
                  <th className="text-right px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id} className="border-b hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-black text-slate-900">{u.first_name} {u.last_name}</div>
                      <div className="text-[10px] text-slate-400 font-bold">{u.email}</div>
                      {u.is_temp_password && (
                        <span className="text-[9px] bg-amber-100 text-amber-700 font-black px-2 py-0.5 rounded-full">TEMP PASSWORD</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1">
                        {(u.roles?.length ? u.roles : [u.role]).map(r => (
                          <span key={r} className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${ROLE_COLORS[r as AppRole] || "bg-slate-100 text-slate-700 border-slate-200"}`}>
                            {ROLE_LABELS[r as AppRole] || r}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`text-[9px] font-black px-2 py-1 rounded-full ${u.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                        {(u.status || "active").toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 justify-end">
                        <Button size="sm" variant="ghost" onClick={() => { setResetModalUser(u); setShowResetConfirm(true); }}
                          className="h-8 w-8 p-0 rounded-xl hover:bg-amber-50 hover:text-amber-600" title="Reset Password">
                          <RefreshCw className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => { setEditUser(u); setEditRoles(u.roles?.length ? u.roles : [u.role]) }}
                          className="h-8 w-8 p-0 rounded-xl hover:bg-blue-50 hover:text-blue-600">
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        {!u.roles?.includes("SUPER_ADMIN") && u.role !== "SUPER_ADMIN" && (
                          <Button size="sm" variant="ghost" onClick={() => setDeleteTarget(u)}
                            className="h-8 w-8 p-0 rounded-xl hover:bg-red-50 hover:text-red-600">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={4} className="text-center py-12 text-slate-400 font-bold text-sm">No users found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>

      {/* Temp Password Display */}
      {tempPassword && (
        <div className="p-8 border-t bg-amber-50">
          <Alert className="rounded-2xl border-amber-200 bg-amber-50">
            <Shield className="h-4 w-4 text-amber-600" />
            <AlertDescription>
              <p className="text-[10px] font-black uppercase tracking-widest text-amber-700 mb-2">Temporary Password (valid 48h)</p>
              <div className="flex items-center gap-3">
                <code className="text-lg font-black tracking-widest text-amber-900 bg-white px-4 py-2 rounded-xl border border-amber-200">{tempPassword}</code>
                <Button size="sm" onClick={copyPassword} className="rounded-xl bg-amber-500 hover:bg-amber-600 text-white gap-2">
                  {copied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copied!" : "Copy"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setTempPassword(null)} className="rounded-xl">Dismiss</Button>
              </div>
              <p className="text-[9px] text-amber-600 font-bold mt-2">Share this with the user manually. User will be forced to change it on first login.</p>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* ADD USER DIALOG */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="rounded-[2.5rem] border-2 shadow-3xl max-w-lg p-8">
          <DialogHeader>
            <DialogTitle className="text-lg font-black uppercase tracking-tight">Add New User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Full Name</Label>
              <Input value={newUser.full_name} onChange={e => setNewUser({ ...newUser, full_name: e.target.value })}
                placeholder="John Doe" className="rounded-xl border-2 h-12 font-bold" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Email Address</Label>
              <Input type="email" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                placeholder="john@amogtech.co.tz" className="rounded-xl border-2 h-12 font-bold" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Assign Roles (select all that apply)</Label>
              <div className="grid grid-cols-2 gap-2">
                {(ALL_ROLES.filter(r => r !== "SUPER_ADMIN") as AppRole[]).map(role => (
                  <label key={role} className={`flex items-center gap-2 p-2.5 rounded-xl border-2 cursor-pointer transition-all ${newUser.roles.includes(role) ? "border-indigo-400 bg-indigo-50" : "border-slate-100 hover:border-slate-200"}`}>
                    <input type="checkbox" className="accent-indigo-600"
                      checked={newUser.roles.includes(role)}
                      onChange={() => toggleRole(role, newUser.roles, r => setNewUser({ ...newUser, roles: r }))} />
                    <span className="text-[10px] font-black">{ROLE_LABELS[role]}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="gap-3 mt-6">
            <Button variant="outline" onClick={() => setShowAdd(false)} className="rounded-xl border-2 h-11">Cancel</Button>
            <Button onClick={handleCreate} disabled={saving} className="rounded-xl h-11 bg-indigo-600 hover:bg-indigo-700 gap-2">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              Create & Generate Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* EDIT ROLES DIALOG */}
      <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
        <DialogContent className="rounded-[2.5rem] border-2 max-w-lg p-8">
          <DialogHeader>
            <DialogTitle className="text-lg font-black uppercase tracking-tight">Edit Roles — {editUser?.first_name}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {(ALL_ROLES.filter(r => r !== "SUPER_ADMIN") as AppRole[]).map(role => (
              <label key={role} className={`flex items-center gap-2 p-2.5 rounded-xl border-2 cursor-pointer transition-all ${editRoles.includes(role) ? "border-indigo-400 bg-indigo-50" : "border-slate-100 hover:border-slate-200"}`}>
                <input type="checkbox" className="accent-indigo-600"
                  checked={editRoles.includes(role)}
                  onChange={() => toggleRole(role, editRoles, setEditRoles)} />
                <span className="text-[10px] font-black">{ROLE_LABELS[role]}</span>
              </label>
            ))}
          </div>
          <DialogFooter className="gap-3 mt-6">
            <Button variant="outline" onClick={() => setEditUser(null)} className="rounded-xl border-2 h-11">Cancel</Button>
            <Button onClick={handleEditSave} disabled={saving} className="rounded-xl h-11 bg-indigo-600 hover:bg-indigo-700">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save Roles"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRM */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-[2.5rem] border-2 p-10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black text-red-600">Delete User</AlertDialogTitle>
            <AlertDialogDescription>Permanently remove <strong>{deleteTarget?.email}</strong>? This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3">
            <AlertDialogCancel className="rounded-xl border-2 h-12">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="rounded-xl h-12 bg-red-600 hover:bg-red-700 font-black">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete User"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* MANUAL PASSWORD RESET CONFIRMATION */}
      <Dialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <DialogContent className="rounded-[2.5rem] border-2 p-10 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase tracking-tight text-amber-600">Reset User Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm font-medium text-slate-600 leading-relaxed">
              Are you sure you want to reset the password for <strong>{resetModalUser?.email}</strong>? 
              A new temporary password will be generated and displayed for you to share manually.
            </p>
          </div>
          <DialogFooter className="gap-3">
            <Button variant="outline" onClick={() => setShowResetConfirm(false)} className="rounded-xl border-2 h-12">Cancel</Button>
            <Button onClick={handleResetPassword} disabled={saving} className="rounded-xl h-12 bg-amber-600 hover:bg-amber-700 text-white font-black uppercase tracking-widest">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
              Generate Temp Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
