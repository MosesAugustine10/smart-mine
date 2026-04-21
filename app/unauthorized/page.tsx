"use client"

import { useRouter } from "next/navigation"
import { ShieldAlert, ArrowLeft, Home } from "lucide-react"
import { useAuth } from "@/components/auth-provider"

export default function UnauthorizedPage() {
  const router = useRouter()
  const { profile } = useAuth()

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
      {/* Background pulse rings */}
      <div className="absolute w-[600px] h-[600px] rounded-full border border-red-500/10 animate-ping" style={{ animationDuration: "3s" }} />
      <div className="absolute w-[400px] h-[400px] rounded-full border border-red-500/10 animate-ping" style={{ animationDuration: "2s" }} />

      <div className="relative z-10 space-y-8 max-w-lg">
        {/* Icon */}
        <div className="mx-auto w-32 h-32 rounded-[2.5rem] bg-red-500/10 border-2 border-red-500/30 flex items-center justify-center shadow-2xl shadow-red-500/10">
          <ShieldAlert className="w-16 h-16 text-red-500" />
        </div>

        {/* Heading */}
        <div className="space-y-3">
          <p className="text-[10px] font-black text-red-500 uppercase tracking-[0.4em]">
            Access Denied · Error 403
          </p>
          <h1 className="text-5xl font-black uppercase tracking-tighter text-white italic leading-none">
            Clearance<br />
            <span className="text-red-500">Denied.</span>
          </h1>
          <p className="text-sm font-bold text-slate-400 leading-relaxed">
            Your current role{" "}
            {profile?.role && (
              <span className="text-white font-black bg-slate-800 px-2 py-0.5 rounded-lg">
                {profile.role}
              </span>
            )}{" "}
            does not have permission to access this module.
            Contact your Mine Manager or Super Admin if you believe this is an error.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => router.back()}
            className="h-14 px-8 rounded-2xl border-2 border-slate-700 bg-slate-900 hover:bg-slate-800 text-white font-black uppercase text-[10px] tracking-widest transition-all flex items-center gap-3 active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
          <button
            onClick={() => router.push("/admin")}
            className="h-14 px-8 rounded-2xl bg-white hover:bg-slate-100 text-slate-950 font-black uppercase text-[10px] tracking-widest shadow-2xl shadow-white/10 transition-all flex items-center gap-3 active:scale-95"
          >
            <Home className="w-4 h-4" />
            Command Center
          </button>
        </div>

        {/* Role reference */}
        <div className="mt-8 p-6 rounded-[2rem] bg-slate-900 border border-slate-800 text-left space-y-3">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">
            Your Access Level
          </p>
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            {[
              ["Role", profile?.role || "—"],
              ["Status", profile?.status || "—"],
              ["Company", profile?.company_id ? "Assigned" : "Unassigned"],
              ["Module", "No Access"],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between bg-slate-800/60 px-3 py-2 rounded-xl">
                <span className="font-black text-slate-500 uppercase">{k}</span>
                <span className="font-black text-white">{v}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-[9px] text-slate-700 font-black uppercase tracking-widest">
          SMART MINE · RBAC v2.0 · All access attempts are logged.
        </p>
      </div>
    </div>
  )
}
