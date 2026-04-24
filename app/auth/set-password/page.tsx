"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Lock, ShieldCheck, Eye, EyeOff, CheckCircle2, XCircle } from "lucide-react"

function StrengthCheck({ label, pass }: { label: string; pass: boolean }) {
  return (
    <div className="flex items-center gap-2">
      {pass
        ? <CheckCircle2 className="h-3 w-3 text-emerald-500 flex-shrink-0" />
        : <XCircle className="h-3 w-3 text-slate-300 flex-shrink-0" />}
      <span className={`text-[10px] font-bold ${pass ? "text-emerald-600" : "text-slate-400"}`}>{label}</span>
    </div>
  )
}

export default function SetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checks = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password),
    match: password === confirm && password.length > 0,
  }
  const allPass = Object.values(checks).every(Boolean)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!allPass) { setError("Please meet all password requirements."); return }

    setLoading(true)
    setError(null)
    const supabase = getSupabaseBrowserClient()

    const { error: updateError } = await supabase.auth.updateUser({ password })
    if (updateError) { setError(updateError.message); setLoading(false); return }

    // Mark temp password as used
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from("user_profiles").update({
        is_temp_password: false,
        temp_password_expires_at: null,
      }).eq("id", user.id)
    }

    router.push("/")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <Card className="w-full max-w-md rounded-[2.5rem] border-0 shadow-2xl bg-white overflow-hidden">
        <CardHeader className="p-8 pb-4 bg-gradient-to-r from-amber-500 to-orange-500">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center">
              <ShieldCheck className="h-7 w-7 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-black text-white uppercase tracking-tight">Set New Password</CardTitle>
              <CardDescription className="text-amber-100 text-xs font-bold">Your temporary password has expired. Please set a new one.</CardDescription>
            </div>
          </div>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="p-8 space-y-6">
            {error && (
              <Alert variant="destructive" className="rounded-2xl border-red-200 bg-red-50">
                <AlertDescription className="text-xs font-bold">{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">New Password</Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="h-14 pl-12 pr-12 rounded-2xl border-2 font-bold"
                  placeholder="Enter new password"
                  required
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type={showPw ? "text" : "password"}
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  className="h-14 pl-12 rounded-2xl border-2 font-bold"
                  placeholder="Confirm new password"
                  required
                />
              </div>
            </div>

            {/* Strength checks */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Password Requirements</p>
              <StrengthCheck label="At least 8 characters" pass={checks.length} />
              <StrengthCheck label="Uppercase letter (A-Z)" pass={checks.upper} />
              <StrengthCheck label="Lowercase letter (a-z)" pass={checks.lower} />
              <StrengthCheck label="Number (0-9)" pass={checks.number} />
              <StrengthCheck label="Symbol (!@#$...)" pass={checks.symbol} />
              <StrengthCheck label="Passwords match" pass={checks.match} />
            </div>

            <Button
              type="submit"
              disabled={loading || !allPass}
              className="w-full h-14 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-amber-500/20 transition-all active:scale-95"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {loading ? "Saving..." : "Set New Password & Continue"}
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  )
}
