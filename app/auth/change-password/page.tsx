"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { KeyRound, Loader2, CheckCircle2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { LoginCarousel } from "@/components/login-carousel"

export default function ChangePasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      return toast({ title: "Passwords do not match", variant: "destructive" })
    }
    if (password.length < 8) {
      return toast({ title: "Password too short", description: "Minimum 8 characters required.", variant: "destructive" })
    }

    setLoading(true)
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      
      setSuccess(true)
      toast({ title: "✅ Password Updated" })
      setTimeout(() => router.push("/"), 2000)
    } catch (err: any) {
      toast({ title: "Update Failed", description: err.message, variant: "destructive" })
    } finally {
      setLoading(false)
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
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-amber-500 mb-2">Security Enforcement</p>
            <h1 className="text-4xl font-black text-stone-900 dark:text-white uppercase tracking-tighter italic">
              Update Password
            </h1>
            <p className="text-stone-500 dark:text-stone-400 font-medium text-sm mt-2">
              You are using a temporary password. For security, you must create a new one before continuing.
            </p>
          </div>

          <Card className="rounded-[2.5rem] border-2 shadow-2xl overflow-hidden">
            <CardContent className="p-10">
              {success ? (
                <div className="flex flex-col items-center justify-center py-6 text-center space-y-6">
                  <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-black text-stone-900 dark:text-white uppercase">Password Secured</h3>
                    <p className="text-sm font-medium text-stone-500">Redirecting to next step...</p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-stone-500 ml-1">New Password</Label>
                      <Input 
                        type="password"
                        value={password} 
                        onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="h-14 rounded-2xl border-2"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-stone-500 ml-1">Confirm New Password</Label>
                      <Input 
                        type="password"
                        value={confirmPassword} 
                        onChange={e => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="h-14 rounded-2xl border-2"
                        required
                      />
                    </div>
                  </div>
                  
                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="w-full h-14 bg-slate-900 hover:bg-black text-white font-black uppercase tracking-widest rounded-2xl shadow-xl transition-all active:scale-95"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <KeyRound className="w-4 h-4 mr-2" />}
                    Save & Continue
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
