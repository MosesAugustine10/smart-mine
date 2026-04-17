"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ShieldAlert, LogOut, Mail } from "lucide-react"
import Link from "next/link"

export default function LockdownPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
      <Card className="max-w-md w-full border-2 border-red-100 dark:border-red-900/30 rounded-[2.5rem] shadow-2xl overflow-hidden bg-white dark:bg-slate-900">
        <div className="h-32 bg-red-50 dark:bg-red-950/20 flex items-center justify-center">
            <ShieldAlert className="h-16 w-16 text-red-600" />
        </div>
        <CardHeader className="text-center pt-8">
          <CardTitle className="text-2xl font-black uppercase tracking-tighter italic text-red-600">Access Restricted</CardTitle>
          <CardDescription className="font-bold text-slate-500 uppercase text-[10px] tracking-widest mt-2">Security Protocol Activated (Policy 403-ACC)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 text-center px-8 pb-10">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
            Accountant accounts are restricted to verified hardware fingerprints. Your current device is not authorized to access financial data.
          </p>
          
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl flex items-center gap-4 text-left border border-slate-100 dark:border-slate-800">
            <Mail className="h-5 w-5 text-amber-500 shrink-0" />
            <p className="text-[10px] font-bold text-slate-500 leading-relaxed uppercase">
                An automated security alert has been dispatched to the <span className="text-slate-900 dark:text-white">Super Admin</span>. Please contact IT for device verification.
            </p>
          </div>

          <div className="flex flex-col gap-3 pt-4">
              <Button asChild className="h-12 rounded-xl bg-slate-900 hover:bg-black font-black uppercase text-[10px] tracking-widest">
                  <Link href="/auth/login">Return to Login</Link>
              </Button>
              <Button variant="ghost" className="h-12 rounded-xl font-black uppercase text-[10px] tracking-widest text-slate-400">
                  Technical Details
              </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
