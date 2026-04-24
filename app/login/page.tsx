"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Mail, Lock, Eye, EyeOff, ShieldCheck, Globe } from "lucide-react"
import { useTranslation } from "@/components/language-context"
import { LoginCarousel } from "@/components/login-carousel"
import { ThemeToggle } from "@/components/theme-toggle"

export default function LoginPage() {
  const { t, language, setLanguage } = useTranslation()
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [step, setStep] = useState<"credentials" | "totp">("credentials")
  const [totpCode, setTotpCode] = useState("")
  const [tempAuthData, setTempAuthData] = useState<any>(null)
  const [tempProfileData, setTempProfileData] = useState<any>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const supabase = getSupabaseBrowserClient()
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      let role = "Guest"
      let profileData: any = null
      try {
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("role, totp_secret, is_temp_password, temp_password_expires_at")
          .eq("id", data.user.id)
          .single()
        if (profile) {
          role = profile.role
          profileData = profile
        }
      } catch (err) {
        console.warn("Profile fetch failed")
      }

      if (profileData?.is_temp_password) {
        const expires = profileData.temp_password_expires_at ? new Date(profileData.temp_password_expires_at) : null
        if (!expires || expires > new Date()) {
          window.location.href = "/auth/set-password"
          return
        } else {
          setError("Your temporary password has expired. Please contact your administrator.")
          await supabase.auth.signOut()
          setLoading(false)
          return
        }
      }

      const requiresTotp = ["SUPER_ADMIN", "admin", "accountant"].includes(role)
      const deviceId = localStorage.getItem("device_id")
      const isRecognizedDevice = deviceId && deviceId === data.user.id

      if (requiresTotp && !isRecognizedDevice) {
        setTempAuthData(data)
        setTempProfileData(profileData)
        setStep("totp")
        setLoading(false)
        return
      }

      completeLogin(data, role)
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  const handleTotpVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (totpCode.length !== 6) throw new Error("Invalid TOTP code length")
      localStorage.setItem("device_id", tempAuthData.user.id)
      completeLogin(tempAuthData, tempProfileData?.role || "Guest")
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  const completeLogin = (data: any, role: string) => {
    const syncData = {
      role: role,
      cid: (data.user?.user_metadata as any)?.company_id || null,
      mods: role === "SUPER_ADMIN" ? ["all"] : [],
      ts: Date.now()
    }
    document.cookie = `msm_user_role=${encodeURIComponent(JSON.stringify(syncData))}; path=/; max-age=${60 * 60 * 24}; SameSite=Lax`

    if (role === "SUPER_ADMIN") {
      window.location.href = "/super-admin"
    } else {
      window.location.href = "/"
    }
  }

  return (
    <div className="min-h-screen flex bg-white dark:bg-stone-950">
      
      {/* Left Panel - Carousel (60%) */}
      <div className="hidden lg:block lg:w-[60%] h-screen relative sticky top-0">
        <LoginCarousel />
      </div>

      {/* Right Panel - Login Form (40% or 100% on mobile) */}
      <div className="w-full lg:w-[40%] flex flex-col min-h-screen">
        
        {/* Header Actions */}
        <div className="p-6 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setLanguage(language === 'en' ? 'sw' : 'en')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-900 transition-colors"
            >
              <Globe className="w-4 h-4 text-stone-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-stone-600 dark:text-stone-400">
                {language === 'en' ? 'Kiswahili' : 'English'}
              </span>
            </button>
          </div>
          <ThemeToggle />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-8 md:p-16 max-w-[550px] mx-auto w-full">
          
          {/* Branding */}
          <div className="mb-12 text-center lg:text-left w-full">
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-amber-500 mb-2">Smart Mine Enterprise</p>
            <h1 className="text-4xl font-black text-stone-900 dark:text-white uppercase tracking-tighter italic">
              {t('welcomeBack')}
            </h1>
            <p className="text-stone-500 dark:text-stone-400 font-medium text-sm mt-2">
              {t('signInSubtitle')}
            </p>
          </div>

          <div className="w-full space-y-8">
            {error && (
              <Alert variant="destructive" className="rounded-2xl border-red-200 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 py-4">
                <AlertDescription className="text-xs font-bold">{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={step === "credentials" ? handleLogin : handleTotpVerify} className="space-y-6">
              {step === "credentials" ? (
                <>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-stone-500 ml-1">
                      {t('emailAddress')}
                    </Label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 group-focus-within:text-amber-500 transition-colors" />
                      <Input
                        type="email"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="h-14 pl-12 rounded-2xl border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/50 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-bold"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between ml-1">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-stone-500">
                        {t('password')}
                      </Label>
                      <Link 
                        href="/login/forgot-password" 
                        className="text-[10px] font-black uppercase tracking-widest text-amber-600 hover:text-amber-700 transition-colors"
                      >
                        {t('forgotPassword')}
                      </Link>
                    </div>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 group-focus-within:text-amber-500 transition-colors" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder={t('enterPassword')}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="h-14 pl-12 pr-12 rounded-2xl border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/50 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-bold"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-4 animate-in slide-in-from-right duration-300">
                  <div className="flex flex-col items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-[2rem] bg-amber-500/10 flex items-center justify-center">
                      <ShieldCheck className="w-8 h-8 text-amber-500" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-stone-500 text-center">
                      Two-Factor Authentication Required
                    </p>
                  </div>
                  <Input
                    type="text"
                    placeholder="000000"
                    maxLength={6}
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                    required
                    className="h-20 rounded-[2rem] border-amber-200 bg-amber-50 dark:bg-amber-950/20 focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-center text-4xl font-black tracking-[0.5em] text-amber-600"
                  />
                  <p className="text-[10px] text-stone-400 text-center font-bold">
                    Enter the code from your authenticator app
                  </p>
                </div>
              )}

              <Button 
                type="submit" 
                disabled={loading}
                className="w-full h-14 bg-stone-900 dark:bg-amber-500 text-white dark:text-stone-950 hover:bg-stone-800 dark:hover:bg-amber-400 font-black text-sm uppercase tracking-widest rounded-2xl shadow-xl shadow-stone-900/10 transition-all active:scale-[0.98]"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  step === "credentials" ? t('signIn') : "Verify & Continue"
                )}
              </Button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="p-8 mt-auto border-t border-stone-100 dark:border-stone-900">
          <p className="text-center text-[10px] font-black text-stone-400 uppercase tracking-[0.4em]">
            © 2026 SMART MINE TANZANIA | SECURE NODE ALPHA
          </p>
        </div>
      </div>
    </div>
  )
}
