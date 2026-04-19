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
import { Loader2, Mountain, Lock, Mail, Eye, EyeOff, ArrowLeft } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { HeroSlider } from "@/components/hero-slider"

const loginSlides = [
  { src: "/images/hero/hero-7.jpg", label: "Enterprise Mining Solutions" },
  { src: "/images/hero/hero-8.jpg", label: "Advanced Site Analytics" },
]

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // DEMO BYPASS LOGIC REMOVED

    try {
      const supabase = getSupabaseBrowserClient()
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      // 1. Quick Profile Fetch - No complex joins
      let role = "Guest"
      try {
        const { data: profile } = await supabase.from("user_profiles").select("role").eq("id", data.user.id).single()
        role = profile?.role || "Guest"
      } catch (err) {
        console.warn("Profile fetch failed, defaulting to Guest redirect")
      }

      // 2. Set role cookie for middleware
      const syncData = {
        role: role,
        cid: (data.user?.user_metadata as any)?.company_id || null,
        mods: role === "SUPER_ADMIN" ? ["all"] : [],
        ts: Date.now()
      }
      document.cookie = `msm_user_role=${encodeURIComponent(JSON.stringify(syncData))}; path=/; max-age=${60 * 60 * 24}; SameSite=Lax`

      // 3. Forced Refresh Redirect
      if (role === "SUPER_ADMIN") {
        window.location.href = "/super-admin"
      } else if (role === "admin" || role === "supervisor") {
        window.location.href = "/chimbo/dashboard"
      } else {
        window.location.href = "/"
      }
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 dark:bg-slate-950 md:h-screen md:overflow-hidden">

      {/* LEFT SIDE: Slider */}
      <div className="w-full md:w-1/2 h-[40vh] md:h-full relative overflow-hidden">
        <HeroSlider slides={loginSlides} />
        <div className="absolute top-8 left-8 z-20">
          <Link href="/" className="flex items-center gap-2 group bg-black/20 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 hover:bg-black/40 transition-all">
            <ArrowLeft className="h-4 w-4 text-white" />
            <span className="text-white text-xs font-bold uppercase tracking-widest">Back to Home</span>
          </Link>
        </div>
      </div>

      {/* RIGHT SIDE: Login Form */}
      <div className="w-full md:w-1/2 h-full flex flex-col items-center justify-center p-6 md:p-12 relative overflow-y-auto">
        <div className="absolute top-6 right-6 z-20">
          <ThemeToggle />
        </div>

        <div className="w-full max-w-[420px] space-y-8 relative z-10">
          <div className="flex flex-col items-center text-center space-y-4 mb-2">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="h-12 w-12 rounded-2xl bg-amber-500 flex items-center justify-center shadow-xl shadow-amber-500/20 group-hover:scale-110 transition-transform">
                <Mountain className="h-7 w-7 text-white" />
              </div>
            </Link>
            <div className="space-y-1">
              <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">SMART <span className="text-amber-500">MINE</span></h1>
              <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.4em]">Enterprise Command Center</p>
            </div>
          </div>

          <Card className="border-slate-200 dark:border-slate-800 shadow-2xl bg-white dark:bg-slate-900/50 backdrop-blur-sm rounded-[2rem] overflow-hidden">
            <CardHeader className="space-y-1 pt-8 pb-4 px-8">
              <CardTitle className="text-2xl font-black uppercase tracking-tighter italic">Sign In</CardTitle>
              <CardDescription className="text-xs font-medium text-slate-500">Access your administrative mining dashboard</CardDescription>
            </CardHeader>
            <form onSubmit={handleLogin}>
              <CardContent className="space-y-5 px-8">
                {error && (
                  <Alert variant="destructive" className="py-3 px-4 rounded-2xl border-red-200 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400">
                    <AlertDescription className="text-xs font-bold leading-none">{error}</AlertDescription>
                  </Alert>
                )}
                {message && (
                  <Alert className="py-3 px-4 rounded-2xl border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400">
                    <AlertDescription className="text-xs font-bold leading-none">{message}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-1">Email Address</Label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-amber-500 transition-colors" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-14 pl-12 rounded-2xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-sm font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-1">Password</Label>
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-amber-500 transition-colors" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-14 pl-12 pr-12 rounded-2xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-sm font-bold"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex flex-col gap-4 pt-6 pb-8 px-8">
                <Button type="submit" className="w-full h-14 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-slate-900/10 dark:shadow-white/5 transition-all active:scale-95" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {loading ? "Signing in..." : "Secure Login"}
                </Button>

                <div className="flex flex-col gap-2 w-full">
                  <Button
                    type="button"
                    variant="link"
                    onClick={async () => {
                      if (!email) {
                        setError("Please enter your email address to reset password.")
                        return
                      }
                      setResetLoading(true)
                      const supabase = getSupabaseBrowserClient()
                      const { error } = await supabase.auth.resetPasswordForEmail(email, {
                        redirectTo: `${window.location.origin}/auth/reset-password`,
                      })
                      setResetLoading(false)
                      if (error) setError(error.message)
                      else setMessage("Password reset instructions sent to your email.")
                    }}
                    className="text-[10px] font-black text-slate-400 hover:text-amber-600 uppercase tracking-widest transition-colors h-auto p-0"
                  >
                    {resetLoading ? "Sending Link..." : "Forgot your password?"}
                  </Button>


                </div>
              </CardFooter>
            </form>
          </Card>

          <p className="text-center text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.3em]">
            © 2026 Smart Mine Tanzania
          </p>

        </div>
      </div>
    </div>
  )
}
