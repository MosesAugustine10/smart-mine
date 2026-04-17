"use client"

import React, { useState, useEffect } from "react"
import { ShieldCheck, UserCheck, Calendar } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { useTranslation } from "@/components/language-context"
import { cn } from "@/lib/utils"

interface ProfessionalSignatureProps {
  onSign: (signatureData: string) => void
  title?: string
  required?: boolean
  className?: string
}

export function ProfessionalSignature({
  onSign,
  title = "Digital Authorization",
  required = false,
  className
}: ProfessionalSignatureProps) {
  const { profile } = useAuth()
  const { t } = useTranslation()
  const [signed, setSigned] = useState(false)
  const [signDate, setSignDate] = useState<string | null>(null)

  const userName = profile ? `${profile.first_name} ${profile.last_name}` : "Authorized Personnel"
  const userPosition = profile?.position || "Staff"

  const handleSign = () => {
    if (signed) return
    const now = new Date().toISOString()
    setSigned(true)
    setSignDate(now)
    
    // In a real system, this might be a cryptographic hash or a formatted string
    // For this professional UI, we send back a JSON string containing the auth metadata
    const signatureData = JSON.stringify({
      signer: userName,
      position: userPosition,
      timestamp: now,
      status: "VERIFIED"
    })
    onSign(signatureData)
  }

  return (
    <div className={cn("flex flex-col gap-4 w-full max-w-md", className)}>
      <div className="flex justify-between items-end px-2">
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
          {signed ? "Authorization Captured" : title} {required && !signed && <span className="text-red-500">*</span>}
        </span>
        {signed && (
          <div className="flex items-center gap-2">
             <span className="flex items-center gap-1 text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 uppercase tracking-tighter">
                <ShieldCheck className="w-3 h-3" />
                Identity Verified
             </span>
          </div>
        )}
      </div>

      <div 
        onClick={handleSign}
        className={cn(
          "relative group border-4 rounded-[2.5rem] p-8 flex flex-col items-center justify-center min-h-[160px] transition-all duration-500 cursor-pointer overflow-hidden",
          signed 
            ? "border-emerald-500/50 bg-emerald-50/10 shadow-2xl shadow-emerald-500/10" 
            : "border-slate-100 bg-white hover:border-slate-200 hover:shadow-lg active:scale-[0.98]"
        )}
      >
        {signed ? (
          <div className="flex flex-col items-center text-center space-y-3 animate-in zoom-in-95 duration-500">
            {/* Professional Script Style Rendering */}
            <div className="relative">
                <p className="text-3xl font-serif italic text-slate-900 tracking-tight leading-none px-4">
                  {userName}
                </p>
                <div className="absolute -bottom-2 left-0 right-0 h-[1px] bg-slate-300 transform rotate-1" />
            </div>
            
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{userPosition}</p>
              <div className="flex items-center justify-center gap-3 text-[8px] font-bold text-emerald-600 uppercase tracking-widest opacity-80">
                 <span className="flex items-center gap-1"><Calendar className="w-2.5 h-2.5" /> {new Date(signDate!).toLocaleDateString()}</span>
                 <span className="flex items-center gap-1"><UserCheck className="w-2.5 h-2.5" /> ID: {profile?.id ? profile.id.slice(0, 8) : "DEMO"}</span>
              </div>
            </div>
            
            {/* Professional Stamp Background */}
            <div className="absolute -top-10 -right-10 opacity-[0.03] pointer-events-none rotate-12">
                <ShieldCheck className="w-48 h-48 text-emerald-950" />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center space-y-4">
             <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center border-2 border-slate-100 group-hover:bg-blue-50 group-hover:border-blue-100 transition-colors">
                <UserCheck className="w-8 h-8 text-slate-300 group-hover:text-blue-500 transition-colors" />
             </div>
             <div className="space-y-1">
                <p className="text-sm font-black uppercase tracking-widest text-slate-900 group-hover:text-blue-600 transition-colors">Click to Authorize</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic opacity-60 px-4">
                  By clicking, you apply your professional digital signature as {userName}
                </p>
             </div>
          </div>
        )}
      </div>
      
      {!signed && (
        <p className="text-[9px] font-bold text-center text-slate-400 uppercase tracking-[0.2em] mt-2 italic px-8 leading-relaxed">
           Verification uses your authenticated profile credentials to certify this entry for official records.
        </p>
      )}
    </div>
  )
}
