"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Mail, ArrowLeft, CheckCircle2, Globe } from "lucide-react"
import { useTranslation } from "@/components/language-context"
import { LoginCarousel } from "@/components/login-carousel"
import { ThemeToggle } from "@/components/theme-toggle"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

export default function ForgotPasswordPage() {
  const { t, language, setLanguage } = useTranslation()
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = getSupabaseBrowserClient()
      
      // Get user profile to get full name if possible
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('id, first_name, last_name, company_id')
        .eq('email', email)
        .maybeSingle()

      const { error } = await supabase
        .from('password_reset_requests')
        .insert({
          user_email: email,
          company_id: profile?.company_id || null,
          status: 'pending'
        })

      if (error) throw error
      
      setSubmitted(true)
    } catch (error) {
      console.error("Reset request failed:", error)
      // We still show success to avoid email enumeration, 
      // but in this closed system we might want to show an error if it's a real failure
      setSubmitted(true) 
    } finally {
      setLoading(false)
    }
  }


  return (
    <div className="min-h-screen flex bg-white dark:bg-stone-950">
      
      {/* Left Panel - Carousel (60%) */}
      <div className="hidden lg:block lg:w-[60%] h-screen relative sticky top-0">
        <LoginCarousel />
      </div>

      {/* Right Panel - Form (40%) */}
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
              {t('forgotPasswordTitle')}
            </h1>
            <p className="text-stone-500 dark:text-stone-400 font-medium text-sm mt-2">
              {submitted ? "Request successful" : t('forgotPasswordInstruction')}
            </p>
          </div>

          <div className="w-full space-y-8">
            {submitted ? (
              <div className="space-y-6 animate-in fade-in zoom-in duration-500">
                <Alert className="rounded-[2rem] border-amber-200 bg-amber-50 dark:bg-amber-950/20 text-stone-800 dark:text-amber-200 p-8 flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-amber-500 text-white flex items-center justify-center mb-6 shadow-xl shadow-amber-500/20">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <AlertDescription className="text-sm font-bold leading-relaxed">
                    {t('forgotPasswordSubmitted')}
                  </AlertDescription>
                </Alert>
                
                <Link href="/login" className="flex items-center justify-center gap-2 w-full h-14 bg-stone-900 dark:bg-amber-500 text-white dark:text-stone-950 font-black text-sm uppercase tracking-widest rounded-2xl shadow-xl transition-all">
                  <ArrowLeft className="w-4 h-4" />
                  {t('backToLogin')}
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
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

                <Button 
                  type="submit" 
                  disabled={loading}
                  className="w-full h-14 bg-stone-900 dark:bg-amber-500 text-white dark:text-stone-950 hover:bg-stone-800 dark:hover:bg-amber-400 font-black text-sm uppercase tracking-widest rounded-2xl shadow-xl shadow-stone-900/10 transition-all active:scale-[0.98]"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Processing...
                    </span>
                  ) : (
                    t('sendResetLink')
                  )}
                </Button>

                <Link 
                  href="/login" 
                  className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-amber-600 transition-colors py-2"
                >
                  <ArrowLeft className="w-3 h-3" />
                  {t('backToLogin')}
                </Link>
              </form>
            )}
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
