"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { KeyRound } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    const supabase = getSupabaseBrowserClient()
    const { error } = await supabase.auth.updateUser({
      password: password
    })

    if (error) {
      toast({
        title: "Cipher Update Failed",
        description: error.message,
        variant: "destructive"
      })
    } else {
      toast({
        title: "Security Uplift Successful",
        description: "Your new cryptographic keys have been sealed.",
      })
      router.push("/")
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 p-4">
      <Card className="w-full max-w-md bg-slate-900 border-slate-800 shadow-2xl rounded-3xl relative z-10 overflow-hidden text-slate-100">
        <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-emerald-600 via-emerald-400 to-emerald-600"></div>
        <CardHeader className="space-y-4 items-center text-center p-8 pb-4">
          <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-700 shadow-inner">
            <KeyRound className="w-8 h-8 text-emerald-500" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-2xl font-black tracking-tight uppercase">New Credentials</CardTitle>
            <CardDescription className="text-xs font-bold uppercase tracking-widest text-slate-400">
               Establish a new cipher for access
            </CardDescription>
          </div>
        </CardHeader>
        <form onSubmit={handleUpdate}>
          <CardContent className="space-y-6 px-8">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-black uppercase tracking-widest text-slate-400">New Clearance Code</Label>
              <Input
                id="password"
                type="password"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-slate-950 border-slate-800 h-12 rounded-xl focus-visible:ring-emerald-500"
              />
            </div>
          </CardContent>
          <CardFooter className="px-8 pb-8 pt-4">
            <Button 
                type="submit" 
                className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-xs transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]" 
                disabled={loading}
            >
              {loading ? "Encrypting..." : "Seal New Password"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
