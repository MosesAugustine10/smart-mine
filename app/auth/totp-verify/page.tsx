"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { ShieldCheck, Loader2, ArrowLeft } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { LoginCarousel } from "@/components/login-carousel"
import Link from "next/link"

export default function TOTPVerifyPage() {
  const [token, setToken] = useState("")
  const [verifying, setVerifying] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

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
      
      toast({ title: "✅ Identity Verified" })
      router.push("/")
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
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-emerald-500 mb-2">Multi-Factor Authentication</p>
            <h1 className="text-4xl font-black text-stone-900 dark:text-white uppercase tracking-tighter italic">
              Verify Identity
            </h1>
            <p className="text-stone-500 dark:text-stone-400 font-medium text-sm mt-2">
              Enter the 6-digit code from your authenticator app to continue.
            </p>
          </div>

          <Card className="rounded-[2.5rem] border-2 shadow-2xl overflow-hidden">
            <CardContent className="p-10">
              <div className="space-y-8">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-stone-500 ml-1">Authentication Code</Label>
                  <Input 
                    value={token} 
                    onChange={e => setToken(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="000000"
                    autoFocus
                    className="h-16 text-center text-3xl font-black tracking-[0.5em] rounded-2xl border-2 focus:ring-4 focus:ring-emerald-500/10"
                    onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                  />
                </div>
                
                <Button 
                  onClick={handleVerify} 
                  disabled={token.length !== 6 || verifying}
                  className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-emerald-500/20 transition-all active:scale-95"
                >
                  {verifying ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
                  Verify & Sign In
                </Button>

                <Link href="/login" className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-stone-600 transition-colors pt-2">
                  <ArrowLeft className="w-3 h-3" />
                  Return to Login
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
