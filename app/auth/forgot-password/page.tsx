"use client"

import { useState } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Mail, ArrowLeft } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    const supabase = getSupabaseBrowserClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })

    if (error) {
      toast({
        title: "Transmission Failed",
        description: error.message,
        variant: "destructive"
      })
    } else {
      toast({
        title: "Recovery Code Sent",
        description: "Check your corporate inbox for the cryptographic reset link.",
      })
      setEmail("")
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 p-4">
      <Card className="w-full max-w-md bg-slate-900 border-slate-800 shadow-2xl rounded-3xl relative z-10 overflow-hidden text-slate-100">
        <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-slate-600 via-slate-400 to-slate-600"></div>
        <CardHeader className="space-y-4 items-center text-center p-8 pb-4">
          <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-700 shadow-inner">
            <Mail className="w-8 h-8 text-slate-400" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-2xl font-black tracking-tight uppercase">Credential Recovery</CardTitle>
            <CardDescription className="text-xs font-bold uppercase tracking-widest text-slate-400">
               Generate an automated reset link
            </CardDescription>
          </div>
        </CardHeader>
        <form onSubmit={handleReset}>
          <CardContent className="space-y-6 px-8">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-black uppercase tracking-widest text-slate-400">Corporate Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="operator@mining.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-slate-950 border-slate-800 h-12 rounded-xl focus-visible:ring-slate-400"
              />
            </div>
          </CardContent>
          <CardFooter className="px-8 pb-8 pt-4 flex flex-col gap-4">
            <Button 
                type="submit" 
                className="w-full h-12 rounded-xl bg-slate-100 hover:bg-white text-slate-900 font-black uppercase tracking-widest text-xs transition-all" 
                disabled={loading}
            >
              {loading ? "Transmitting..." : "Send Secure Link"}
            </Button>
            <Link href="/auth/login" className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-slate-300 transition-colors">
               <ArrowLeft className="w-3 h-3" /> Abort Sequence
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
