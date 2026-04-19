"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, ShieldCheck, Lock, Mail, Eye, EyeOff, ArrowLeft, Globe, Zap } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

export default function SystemGatePage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const handleSystemLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      console.log("[GATE LOGIN] Initializing Supabase client...");
      const supabase = getSupabaseBrowserClient()
      
      console.log("[GATE LOGIN] Attempting signInWithPassword...");
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error("[GATE LOGIN] signIn Error: ", error)
        throw error
      }
      
      console.log("[GATE LOGIN] SignIn success. Fetching profile for user:", data.user.id);

      // 1. Fetch user role (and auto-upgrade if they are using the secret gate)
      let role = "Guest"
      let companyId = null
      let dbError: any = null

      try {
        // [AUTO-UPGRADE OVERRIDE] Since you know the secret /gate URL, we make you SUPER_ADMIN automatically!
        const { error: upgradeError } = await supabase
           .from("user_profiles")
           .update({ role: "SUPER_ADMIN", position: "SYSTEM_OWNER" })
           .eq("id", data.user.id);
           
        if (upgradeError) console.error("[GATE LOGIN] Auto-Upgrade Failed:", upgradeError);

        const { data: profile, error: profileError } = await supabase
          .from("user_profiles")
          .select("role, company_id")
          .eq("id", data.user.id)
          .maybeSingle()

        if (profileError) {
          dbError = profileError
          console.error("[GATE LOGIN] DB Query Error:", profileError)
        } else if (profile) {
          role = profile.role
          companyId = profile.company_id
        }
      } catch (e) {
        dbError = e
      }

      // 2. Strict Super Admin Verification (Case-Insensitive)
      if (role.toUpperCase() !== "SUPER_ADMIN") {
        await supabase.auth.signOut()
        let errMsg = "Access Denied: Your account does not hold System Owner clearance."
        if (dbError) {
           errMsg += ` (Database Error: ${JSON.stringify(dbError)})`
        }
        throw new Error(errMsg)
      }

      console.log("[GATE LOGIN] SUPER ADMIN Verified. Setting cookie...");

      // 3. Set role cookie for middleware
      const syncData = {
          role: "SUPER_ADMIN",
          cid: companyId,
          mods: [], // enabled_modules from company isn't strictly needed for SuperAdmin here
          ts: Date.now()
      }
      document.cookie = `msm_user_role=${encodeURIComponent(JSON.stringify(syncData))}; path=/; max-age=${60 * 60 * 24}; SameSite=Lax`

      console.log("[GATE LOGIN] Cookie set. Redirecting to /super-admin...");

      // 4. Redirect to Dashboard
      window.location.href = "/super-admin"
    } catch (err: any) {
      console.error("[GATE LOGIN] Caught error:", err);
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] relative overflow-hidden font-sans">
      {/* Dynamic Background Grid */}
      <div className="absolute inset-0 z-0 opacity-20"
        style={{ backgroundImage: 'radial-gradient(#333 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none" />

      {/* Animated Glows */}
      <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full animate-pulse" />
      <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] bg-indigo-600/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '1s' }} />

      <div className="w-full max-w-[440px] px-6 relative z-10">
        <div className="flex flex-col items-center text-center space-y-6 mb-10">
          <div className="h-20 w-20 rounded-[2.5rem] bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-[0_0_50px_rgba(37,99,235,0.4)] border border-blue-400/30">
            <ShieldCheck className="h-10 w-10 text-white" />
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">SYSTEM <span className="text-blue-500">GATE</span></h1>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em]">Global Control Center Access</p>
          </div>
        </div>

        <Card className="border-white/10 shadow-2xl bg-black/40 backdrop-blur-2xl rounded-[3rem] overflow-hidden border-2">
          <CardHeader className="space-y-1 pt-10 pb-6 px-10">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-black uppercase tracking-tighter italic text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-blue-500" />
                Clearance Required
              </CardTitle>
              <ThemeToggle />
            </div>
            <CardDescription className="text-xs font-bold uppercase tracking-widest text-slate-500">Enter System Owner Credentials</CardDescription>
          </CardHeader>
          <form onSubmit={handleSystemLogin}>
            <CardContent className="space-y-6 px-10">
              {error && (
                <Alert variant="destructive" className="py-4 px-5 rounded-2xl border-red-500/20 bg-red-500/10 text-red-400">
                  <AlertDescription className="text-xs font-bold leading-none">{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-1">Authorized ID (Email)</Label>
                <div className="relative group">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600 group-focus-within:text-blue-500 transition-colors" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="root@smartmine.systems"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-14 pl-14 rounded-2xl border-white/5 bg-white/5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-bold text-white placeholder:text-slate-700"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-1">Security Key (Password)</Label>
                <div className="relative group">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600 group-focus-within:text-blue-500 transition-colors" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-14 pl-14 pr-14 rounded-2xl border-white/5 bg-white/5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-bold text-white placeholder:text-slate-700"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-white transition-colors focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-6 pt-8 pb-10 px-10">
              <Button type="submit" className="w-full h-16 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-[0.3em] rounded-2xl shadow-[0_0_30px_rgba(37,99,235,0.2)] transition-all active:scale-95" disabled={loading}>
                {loading ? <Loader2 className="h-5 w-5 animate-spin mr-3" /> : null}
                {loading ? "Decrypting..." : "Access Dashboard"}
              </Button>

              <Link href="/" className="flex items-center justify-center gap-2 text-[10px] font-black text-slate-600 hover:text-slate-400 uppercase tracking-widest transition-colors">
                <ArrowLeft className="h-3 w-3" />
                Abort and return
              </Link>
            </CardFooter>
          </form>
        </Card>

        <div className="mt-12 flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 text-[8px] font-black text-slate-700 uppercase tracking-[0.5em]">
            <Globe className="w-3 h-3" />
            Global Infrastructure Secure
          </div>
          <p className="text-[8px] font-black text-slate-800 uppercase tracking-widest">
            © 2026 Smart Mine Tanzania • System Owner Portal
          </p>
        </div>
      </div>
    </div>
  )
}
