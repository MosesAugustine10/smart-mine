"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { 
    Dialog, DialogContent, DialogDescription, DialogFooter, 
    DialogHeader, DialogTitle, DialogTrigger 
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Mail, Shield, UserPlus, Trash2, KeyRound } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useAuth, UserProfile } from "@/components/auth-provider"

export function UserManagement() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [personnel, setPersonnel] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  
  // New User Form State
  const [email, setEmail] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [role, setRole] = useState("OPERATOR")
  const [position, setPosition] = useState("TRUCK_DRIVER")

  // Fetch real users from 'user_profiles' table
  useEffect(() => {
     async function fetchPersonnel() {
         if (!profile?.company_id && profile?.role !== 'SUPER_ADMIN') return
         const supabase = getSupabaseBrowserClient()
         let query = supabase.from('user_profiles').select('*')
         
         if (profile?.role === 'COMPANY_ADMIN') {
             query = query.eq('company_id', profile.company_id)
         }

         const { data, error } = await query
         if (data) {
             setPersonnel(data as UserProfile[])
         }
         setLoading(false)
     }
     fetchPersonnel()
  }, [profile])


  const handleInvite = async (e: React.FormEvent) => {
      e.preventDefault()
      
      toast({
          title: "Provisioning Clearance",
          description: "Initiating Supabase Auth protocol...",
      })

      try {
          const supabase = getSupabaseBrowserClient()
          
          // In a real production environment with high security:
          // We use Supabase Edge Functions to call admin.inviteUserByEmail
          // For now, we'll insert into user_profiles and assume the admin invites via dashboard
          // OR if the project has 'Enable Manual User Management' off, we can't do it from client.
          
          const { error } = await supabase.from('user_profiles').insert({
              email,
              first_name: firstName,
              last_name: lastName,
              role: role as any,
              position: position as any,
              status: 'pending',
              company_id: profile?.company_id
          })

          if (error) throw error

          toast({
              title: "Invitation Initialized",
              description: `Operator ${firstName} has been registered. Please ensure you have sent the invite via Supabase Auth dashboard for security.`,
              variant: "default"
          })
          
          setIsInviteOpen(false)
          setEmail(''); setFirstName(''); setLastName('')
          
          // Refresh list
          const { data: refresh } = await supabase.from('user_profiles').select('*').eq('company_id', profile?.company_id)
          if (refresh) setPersonnel(refresh)

      } catch (err: any) {
          toast({ title: "Auth Error", description: err.message, variant: "destructive" })
      }
  }

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center mb-6">
           <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Authorized Personnel Register</h3>
           
           <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
               <DialogTrigger asChild>
                   <Button variant="outline" className="h-12 rounded-xl border-2 font-black uppercase text-[10px] tracking-widest px-6 gap-3 hover:border-orange-500/50 hover:bg-orange-50 hover:text-orange-600 transition-all text-slate-700 shadow-sm">
                       <UserPlus className="w-4 h-4" /> Issue Secure Invitation
                   </Button>
               </DialogTrigger>
               <DialogContent className="sm:max-w-[500px] rounded-3xl border-2 shadow-2xl p-0 overflow-hidden">
                   <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-orange-600 to-amber-500"></div>
                   <form onSubmit={handleInvite}>
                       <DialogHeader className="p-8 pb-0">
                           <DialogTitle className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
                               <Shield className="w-6 h-6 text-orange-500" />
                               Provision Operator
                           </DialogTitle>
                           <DialogDescription className="text-xs font-bold uppercase tracking-widest mt-2">
                               Grant system clearance to new corporate personnel
                           </DialogDescription>
                       </DialogHeader>

                       <div className="p-8 space-y-6">
                           <div className="grid grid-cols-2 gap-4">
                               <div className="space-y-2">
                                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">First Name</Label>
                                  <Input value={firstName} onChange={e => setFirstName(e.target.value)} required className="h-12 rounded-xl bg-slate-50 border-2 font-bold" />
                               </div>
                               <div className="space-y-2">
                                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Last Name</Label>
                                  <Input value={lastName} onChange={e => setLastName(e.target.value)} required className="h-12 rounded-xl bg-slate-50 border-2 font-bold" />
                               </div>
                           </div>
                           
                           <div className="space-y-2">
                               <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2"><Mail className="w-3 h-3" /> Corporate Email</Label>
                               <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="h-12 rounded-xl bg-slate-50 border-2 font-bold" />
                           </div>

                           <div className="grid grid-cols-2 gap-4">
                               <div className="space-y-2">
                                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Clearance Role</Label>
                                  <Select value={role} onValueChange={setRole}>
                                      <SelectTrigger className="h-12 rounded-xl border-2 font-bold bg-slate-50">
                                          <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent className="rounded-xl border-2">
                                          <SelectItem value="OPERATOR">Operator</SelectItem>
                                          <SelectItem value="DRIVER">Driver (Udereva)</SelectItem>
                                          <SelectItem value="SUPERVISOR">Supervisor</SelectItem>
                                          <SelectItem value="SAFETY_OFFICER">Safety Officer</SelectItem>
                                          <SelectItem value="COMPANY_ADMIN">Company Admin</SelectItem>
                                      </SelectContent>
                                  </Select>
                               </div>

                               <div className="space-y-2">
                                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">System Position</Label>
                                  <Select value={position} onValueChange={setPosition}>
                                      <SelectTrigger className="h-12 rounded-xl border-2 font-bold bg-slate-50 text-[10px] uppercase">
                                          <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent className="rounded-xl border-2">
                                          <SelectGroup>
                                              <SelectLabel className="text-[9px] font-black uppercase text-orange-500">Blasting</SelectLabel>
                                              <SelectItem value="BLASTER">Blaster</SelectItem>
                                              <SelectItem value="ASSISTANT_BLASTER">Assit. Blaster</SelectItem>
                                          </SelectGroup>
                                          <SelectGroup>
                                              <SelectLabel className="text-[9px] font-black uppercase text-blue-500">Drilling</SelectLabel>
                                              <SelectItem value="DRILLER">Driller</SelectItem>
                                              <SelectItem value="DIAMOND_DRILLER">Diamond Driller</SelectItem>
                                          </SelectGroup>
                                          <SelectGroup>
                                              <SelectLabel className="text-[9px] font-black uppercase text-emerald-500">Fleet & Handling</SelectLabel>
                                              <SelectItem value="TRUCK_DRIVER">Truck Driver</SelectItem>
                                              <SelectItem value="EXCAVATOR_OPERATOR">Excavator Operator</SelectItem>
                                          </SelectGroup>
                                      </SelectContent>
                                  </Select>
                               </div>
                           </div>
                       </div>
                       
                       <DialogFooter className="p-8 pt-0 sm:justify-between items-center border-t border-slate-100 flex-row">
                           <div className="flex items-center gap-2">
                               <Switch id="auto-email" defaultChecked />
                               <Label htmlFor="auto-email" className="text-[9px] font-black uppercase text-slate-400">Trigger Auto-Email</Label>
                           </div>
                           <Button type="submit" className="h-12 rounded-xl font-black uppercase tracking-widest px-8 bg-slate-900 text-white hover:bg-slate-800 shadow-xl transiton-all">
                               Transmit Auth Link
                           </Button>
                       </DialogFooter>
                   </form>
               </DialogContent>
           </Dialog>
        </div>

        <div className="border border-slate-100 rounded-3xl overflow-hidden bg-white">
            <div className="grid grid-cols-12 gap-4 p-4 bg-slate-50 border-b border-slate-100 items-center">
                <div className="col-span-5 text-[9px] font-black uppercase tracking-widest text-slate-500 px-2">Operator Matrix Identity</div>
                <div className="col-span-3 text-[9px] font-black uppercase tracking-widest text-slate-500">Clearance</div>
                <div className="col-span-2 text-[9px] font-black uppercase tracking-widest text-slate-500">Status</div>
                <div className="col-span-2 text-right text-[9px] font-black uppercase tracking-widest text-slate-500 px-2">Vault</div>
            </div>
            <div className="divide-y divide-slate-50">
                {personnel.map((user) => (
                    <div key={user.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-slate-50/50 transition-colors group">
                        <div className="col-span-5 px-2 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-black text-slate-600 border border-slate-200">
                                {user.first_name?.[0] || user.email[0].toUpperCase()}
                            </div>
                            <div>
                                <p className="font-bold text-sm text-slate-900 leading-tight">
                                    {user.first_name} {user.last_name}
                                </p>
                                <p className="text-[10px] text-slate-500 font-medium">{user.email}</p>
                            </div>
                        </div>
                        <div className="col-span-3">
                             <div className="text-[10px] font-black uppercase tracking-widest text-slate-900 mb-0.5">{user.position.replace('_', ' ')}</div>
                             <div className="text-[8px] font-black uppercase tracking-[0.2em] text-orange-500">{user.role.replace('_', ' ')}</div>
                        </div>
                        <div className="col-span-2">
                            <Badge variant="outline" className={`text-[9px] px-3 font-black uppercase border-2 ${user.status === 'active' ? 'border-emerald-500 text-emerald-600 bg-emerald-50' : 'border-amber-500 text-amber-600 bg-amber-50'}`}>
                                {user.status}
                            </Badge>
                        </div>
                        <div className="col-span-2 px-2 flex justify-end gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-slate-200" title="Resend Reset Link">
                                <KeyRound className="w-4 h-4 text-slate-600" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-red-50" title="Revoke Clearance">
                                <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                        </div>
                    </div>
                ))}
                {personnel.length === 0 && !loading && (
                    <div className="p-8 text-center text-sm font-bold text-slate-400 italic">No operators currently provisioned in your matrix.</div>
                )}
            </div>
        </div>
    </div>
  )
}
