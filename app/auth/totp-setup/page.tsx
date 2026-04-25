"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ShieldCheck, Loader2, Copy, CheckCircle2, AlertTriangle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { LoginCarousel } from "@/components/login-carousel"

export default function TOTPSetupPage() {
  const [qrUrl, setQrUrl] = useState("")
  const [secret, setSecret] = useState("")
  const [token, setToken] = useState("")
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState(false)
  const [step, setStep] = useState(1)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    async function initSetup() {
      try {
        const res = await fetch("/api/auth/totp")
        const data = await res.json()
        if (data.error) throw new Error(data.error)
        setQrUrl(data.qrCodeUrl)
        setSecret(data.secret)
      } catch (err: any) {
        toast({ title: "Setup Failed", description: err.message, variant: "destructive" })
      } finally {
        setLoading(false)
      }
    }
    initSetup()
  }, [toast])

  const handleVerify = async () => {
    if (token.length !== 6) return
    setVerifying(true)
    try {
      const res = await fetch("/api/auth/totp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      
      setStep(2)
      toast({ title: "✅ Security Enabled", description: "Two-factor authentication is now active." })
      setTimeout(() => router.push("/"), 2000)
    } catch (err: any) {
      toast({ title: "Verification Failed", description: err.message, variant: "destructive" })
    } finally {
      setVerifying(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-white dark:bg-stone-950">
      <div className="hidden lg:block lg:w-[55%] h-screen sticky top-0">
        <LoginCarousel />
      </div>

      <div className="w-full lg:w-[45%] flex flex-col items-center justify-center p-8 md:p-16">
        <div className="max-w-[440px] w-full">
          <div className="mb-10 text-center lg:text-left">
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-emerald-500 mb-2">Secure Node Activation</p>
            <h1 className="text-4xl font-black text-stone-900 dark:text-white uppercase tracking-tighter italic">
              Enable 2FA
            </h1>
            <p className="text-stone-500 dark:text-stone-400 font-medium text-sm mt-2">
              Privileged roles require mandatory two-factor authentication.
            </p>
          </div>

          <Card className="rounded-[2.5rem] border-2 shadow-2xl overflow-hidden">
            <CardContent className="p-10">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-10 gap-4">
                  <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
                  <p className="text-xs font-black uppercase tracking-widest text-stone-400">Initializing Security Layer...</p>
                </div>
              ) : step === 1 ? (
                <div className="space-y-8">
                  <div className="bg-stone-50 dark:bg-stone-900/50 p-6 rounded-3xl flex flex-col items-center border border-stone-100 dark:border-stone-800">
                    {qrUrl && <img src={qrUrl} alt="QR Code" className="w-48 h-48 rounded-xl shadow-lg mb-4" />}
                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest text-center leading-relaxed">
                      Scan this code with Google Authenticator or Microsoft Authenticator
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-stone-500 ml-1">Verification Code</Label>
                      <Input 
                        value={token} 
                        onChange={e => setToken(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        placeholder="000000"
                        className="h-16 text-center text-3xl font-black tracking-[0.5em] rounded-2xl border-2 focus:ring-4 focus:ring-emerald-500/10"
                      />
                    </div>
                    <Button 
                      onClick={handleVerify} 
                      disabled={token.length !== 6 || verifying}
                      className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-emerald-500/20 transition-all active:scale-95"
                    >
                      {verifying ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
                      Verify & Activate
                    </Button>
                  </div>

                  <div className="pt-4 border-t border-stone-100 dark:border-stone-800 space-y-4">
                    <p className="text-[9px] font-bold text-stone-400 text-center leading-relaxed">
                      Can't scan? Use this secret key in your app:
                    </p>
                    <div className="flex items-center gap-2 p-3 bg-stone-100 dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800">
                      <code className="flex-1 text-[11px] font-black tracking-widest text-emerald-600 dark:text-emerald-400 select-all uppercase">
                        {secret}
                      </code>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(secret)
                          toast({ title: "Copied", description: "Secret key copied to clipboard" })
                        }}
                        className="h-8 w-8 p-0"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center space-y-6">
                  <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center mb-2">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-black text-stone-900 dark:text-white uppercase">Activation Successful</h3>
                    <p className="text-sm font-medium text-stone-500">Redirecting to your dashboard...</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="mt-8 flex items-center gap-4 p-6 bg-amber-50 dark:bg-amber-950/20 rounded-3xl border border-amber-100 dark:border-amber-900/50">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <p className="text-[10px] font-bold text-amber-800 dark:text-amber-400 leading-relaxed uppercase tracking-wide">
              Do not share your QR code or secret key with anyone. This is the only way to access your account.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
