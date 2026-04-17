"use client"

/**
 * app/chimbo/page.tsx  — Small Scale Miners: Complete Secure Auth System
 * ─────────────────────────────────────────────────────────────────────────────
 * THREE SECURITY PILLARS:
 *   1. TOTP  (Google Authenticator) — mandatory on each new device
 *   2. Device Binding               — PIN only works on the registered device
 *   3. Auto-Logout                  — 15-minute inactivity (enforced by hook)
 *
 * FLOWS:
 *   NEW MANAGER  → Phone → TOTP Setup → PIN Setup → Dashboard
 *   NEW SUPERVISOR → Phone → Invite Code → TOTP Setup → PIN Setup → Forms
 *   RETURNING (known device) → Phone → PIN → Role-based destination
 *   RETURNING (new device)   → Phone → TOTP verify → PIN → Role-based destination
 */

import React, { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  Mountain, ArrowLeft, ShieldCheck, Pickaxe, RotateCcw,
  Delete, CheckCircle2, AlertTriangle, Copy, Eye, EyeOff,
  UserPlus, Lock, Smartphone, RefreshCw, Crown, UserCog,
  ArrowRight, KeyRound, QrCode, Shield
} from "lucide-react"
import Link from "next/link"
import { HeroSlider } from "@/components/hero-slider"
import {
  getDeviceFingerprint, hashPin, verifyPin,
  findAccountByPhone, saveAccount, setActiveAccount, getActiveAccount,
  getAllAccounts, generateCompanyId, validateInviteCode,
  consumeInviteCode, generateInviteCode, type ChimboAccount,
} from "@/lib/chimbo-auth"
import { generateSecret, generateURI, verifySync } from "otplib"
import QRCode from "qrcode"

const vibe = () => { if (typeof navigator !== "undefined") navigator.vibrate?.(40) }

// ─── Slides ───────────────────────────────────────────────────────────────────
const chimboSlides = [
  { src: "/images/hero/hero-4.jpg", label: "Usimamizi wa Shimo Leo" },
  { src: "/images/hero/hero-6.jpg", label: "Maendeleo ya Mgodi Wako" },
]

// ─── Step type ────────────────────────────────────────────────────────────────
type AuthFlow =
  | "phone"           // enter phone number
  | "pin_login"       // returning user, known device — enter PIN
  | "totp_verify"     // returning user, NEW device — verify TOTP first
  | "invite_code"     // new supervisor — enter invite code
  | "role_select"     // new manager — pick role (new user)
  | "totp_setup"      // new user — scan QR & verify TOTP
  | "pin_setup"       // new user — create PIN
  | "pin_confirm"     // new user — confirm PIN
  | "success"         // registration complete

// ═══════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

// ─── PIN Pad ──────────────────────────────────────────────────────────────────
function PinPad({ value, onChange, onSubmit, loading, submitLabel = "INGIA →" }: {
  value: string; onChange: (v: string) => void; onSubmit: () => void
  loading?: boolean; submitLabel?: string
}) {
  const keys = ["1","2","3","4","5","6","7","8","9","","0","⌫"]
  const press = (k: string) => {
    vibe()
    if (k === "⌫") return onChange(value.slice(0, -1))
    if (k === "") return
    if (value.length < 4) onChange(value + k)
  }
  return (
    <div className="space-y-6">
      {/* Dots */}
      <div className="flex justify-center gap-4">
        {[0,1,2,3].map(i => (
          <div key={i} className={`w-5 h-5 rounded-full border-2 transition-all duration-200 ${
            value.length > i ? "bg-amber-400 border-amber-400 scale-110 shadow-lg shadow-amber-400/50" : "border-slate-600"
          }`} />
        ))}
      </div>
      {/* Keys */}
      <div className="grid grid-cols-3 gap-3 max-w-[280px] mx-auto">
        {keys.map((k, i) => (
          <button
            key={i}
            onClick={() => k === "⌫" ? press("⌫") : press(k)}
            className={`h-16 rounded-2xl font-black text-2xl transition-all active:scale-90 ${
              k === "" ? "pointer-events-none" :
              k === "⌫" ? "bg-slate-700/60 text-slate-300 hover:bg-slate-700" :
              "bg-slate-800 text-white hover:bg-amber-600/80 shadow-lg shadow-black/30 active:bg-amber-500"
            }`}
          >
            {k === "⌫" ? <Delete className="w-6 h-6 mx-auto" /> : k}
          </button>
        ))}
      </div>
      {/* Submit */}
      {value.length === 4 && (
        <button
          onClick={onSubmit}
          disabled={loading}
          className="w-full h-14 rounded-[2.5rem] bg-amber-500 hover:bg-amber-400 font-black text-lg text-slate-900 uppercase tracking-widest transition-all active:scale-95 shadow-xl shadow-amber-500/30 disabled:opacity-50"
        >
          {loading ? "Inaendelea..." : submitLabel}
        </button>
      )}
    </div>
  )
}

// ─── TOTP Setup ───────────────────────────────────────────────────────────────
function TotpSetupStep({ phone, onVerified }: { phone: string; onVerified: (secret: string, codes: string[]) => void }) {
  const [secret, setSecret] = useState("")
  const [qrCode, setQrCode] = useState("")
  const [token, setToken] = useState("")
  const [err, setErr] = useState("")
  const [loading, setLoading] = useState(false)
  const [showSecret, setShowSecret] = useState(false)
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([])
  const [verified, setVerified] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const generate = async () => {
      try {
        const s = generateSecret()
        setSecret(s)
        const otpauth = generateURI({ secret: s, label: phone, issuer: "Smart Mine", strategy: "totp" })
        const url = await QRCode.toDataURL(otpauth)
        setQrCode(url)
        setRecoveryCodes(Array.from({ length: 6 }, () =>
          Math.random().toString(36).slice(2, 8).toUpperCase() + "-" +
          Math.random().toString(36).slice(2, 8).toUpperCase()
        ))
      } catch (e) { console.error("TOTP setup error:", e) }
    }
    generate()
  }, [phone])

  const handleVerify = async () => {
    setLoading(true)
    setErr("")
    try {
      const isValid = verifySync({ 
        token: token.replace(/\s/g, ""), 
        secret, 
        strategy: "totp",
        epochTolerance: 1
      })
      if (!isValid) throw new Error("Namba si sahihi. Angalia app yako na ujaribu tena.")
      setVerified(true)
    } catch (e: any) {
      setErr(e.message || "Hitilafu imetokea.")
      setToken("")
    } finally {
      setLoading(false)
    }
  }

  const copySecret = () => {
    navigator.clipboard.writeText(secret)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (verified) return (
    <div className="space-y-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/30">
        <CheckCircle2 className="w-9 h-9 text-white" />
      </div>
      <div className="space-y-2">
        <h3 className="text-white font-black text-xl uppercase tracking-tighter">Google Auth ✓</h3>
        <p className="text-slate-400 text-xs font-bold px-2">Hifadhi recovery codes hizi vizuri. Utazihitaji ukipoteza simu:</p>
      </div>
      <div className="bg-slate-800/60 border border-slate-700 p-4 rounded-2xl space-y-2 text-left">
        {recoveryCodes.map(code => (
          <div key={code} className="text-amber-400 font-black text-sm tracking-[0.15em] bg-slate-900/60 py-2 px-3 rounded-xl border border-slate-700/50 font-mono">
            {code}
          </div>
        ))}
      </div>
      <p className="text-[10px] text-slate-500 uppercase tracking-widest">📸 Piga picha ya skrini au andika mahali salama</p>
      <button
        onClick={() => onVerified(secret, recoveryCodes)}
        className="w-full h-14 rounded-[2.5rem] bg-amber-500 hover:bg-amber-400 font-black text-lg text-slate-900 uppercase tracking-widest shadow-xl shadow-amber-500/30"
      >
        NIMEHIFADHI → ENDELEA
      </button>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Step 1: QR */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-amber-500 text-slate-900 flex items-center justify-center text-[10px] font-black shrink-0">1</div>
          <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Scan QR Code kwenye Google Authenticator</p>
        </div>
        <div className="bg-white p-4 rounded-2xl mx-auto w-44 h-44 shadow-2xl flex items-center justify-center">
          {qrCode
            ? <img src={qrCode} alt="TOTP QR" className="w-full h-full object-contain" />
            : <div className="w-full h-full bg-slate-100 animate-pulse rounded-xl flex items-center justify-center"><QrCode className="w-10 h-10 text-slate-300" /></div>
          }
        </div>
        {/* Manual entry option */}
        <div className="flex items-center gap-2 bg-slate-800/40 rounded-xl p-3">
          <div className="flex-1">
            <p className="text-[9px] text-slate-500 uppercase tracking-widest mb-1">Au ingiza manually:</p>
            <p className="font-mono text-[10px] text-amber-400 tracking-widest break-all">
              {showSecret ? secret : "••••••••••••••••••••"}
            </p>
          </div>
          <button onClick={() => setShowSecret(!showSecret)} className="p-1.5 text-slate-500 hover:text-white">
            {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
          <button onClick={copySecret} className="p-1.5 text-slate-500 hover:text-amber-400 transition-colors">
            {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Step 2: Verify */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-amber-500 text-slate-900 flex items-center justify-center text-[10px] font-black shrink-0">2</div>
          <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Ingiza namba 6 kutoka app</p>
        </div>
        <input
          type="text" inputMode="numeric" maxLength={6}
          value={token} onChange={e => setToken(e.target.value.replace(/\D/g, ""))}
          placeholder="000 000"
          className="w-full h-16 text-center text-3xl font-black rounded-2xl bg-slate-800 border-2 border-slate-700 text-amber-400 outline-none focus:border-amber-500 tracking-[0.3em] font-mono"
        />
        {err && <p className="text-red-400 text-xs font-bold flex items-center gap-2"><AlertTriangle className="w-4 h-4 shrink-0" />{err}</p>}
        <button
          onClick={handleVerify}
          disabled={loading || token.length < 6}
          className="w-full h-14 rounded-2xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 font-black text-slate-900 uppercase text-sm tracking-widest"
        >
          {loading ? "Inathibitisha..." : "THIBITISHA TOTP"}
        </button>
      </div>
    </div>
  )
}

// ─── TOTP Verify (login on new device) ───────────────────────────────────────
function TotpVerifyStep({ account, onVerified }: { account: ChimboAccount; onVerified: () => void }) {
  const [token, setToken] = useState("")
  const [err, setErr] = useState("")
  const [loading, setLoading] = useState(false)

  const handleVerify = async () => {
    setLoading(true); setErr("")
    try {
      const isValid = verifySync({ 
        token: token.replace(/\s/g, ""), 
        secret: account.totp_secret,
        strategy: "totp",
        epochTolerance: 1
      })
      if (!isValid) throw new Error("Namba si sahihi. Jaribu tena.")
      // Update device fingerprint on this account
      const updated = { ...account, device_fingerprint: getDeviceFingerprint() }
      saveAccount(updated)
      onVerified()
    } catch (e: any) {
      setErr(e.message); setToken("")
    } finally { setLoading(false) }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-3 py-2">
        <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border-2 border-blue-500/30 flex items-center justify-center">
          <Smartphone className="w-8 h-8 text-blue-400" />
        </div>
        <div className="text-center space-y-1">
          <p className="text-sm font-black text-white uppercase tracking-tight">Kifaa kipya kimegunduliwa</p>
          <p className="text-[10px] text-slate-400 font-bold">Thibitisha kwa Google Authenticator ili kuruhusu simu hii</p>
        </div>
      </div>
      <input
        type="text" inputMode="numeric" maxLength={6}
        value={token} onChange={e => setToken(e.target.value.replace(/\D/g, ""))}
        placeholder="000 000"
        className="w-full h-16 text-center text-3xl font-black rounded-2xl bg-slate-800 border-2 border-slate-700 text-amber-400 outline-none focus:border-amber-500 tracking-[0.3em] font-mono"
      />
      {err && <p className="text-red-400 text-xs font-bold flex items-center gap-2"><AlertTriangle className="w-4 h-4" />{err}</p>}
      <button
        onClick={handleVerify}
        disabled={loading || token.length < 6}
        className="w-full h-14 rounded-2xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 font-black text-slate-900 uppercase text-sm tracking-widest"
      >
        {loading ? "Inathibitisha..." : "RUHUSU KIFAA HIKI"}
      </button>
    </div>
  )
}


// ═══════════════════════════════════════════════════════════════════════════════
// MAIN AUTH PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export default function ChimboAuthPage() {
  const router = useRouter()

  // Flow state
  const [flow, setFlow] = useState<AuthFlow>("phone")
  const [phone, setPhone] = useState("")
  const [phoneErr, setPhoneErr] = useState("")
  const [inviteCode, setInviteCode] = useState("")
  const [inviteErr, setInviteErr] = useState("")
  const [inviteData, setInviteData] = useState<any>(null)
  const [selectedRole, setSelectedRole] = useState<"MANAGER" | "SUPERVISOR">("MANAGER")
  const [totpSecret, setTotpSecret] = useState("")
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([])
  const [pin, setPin] = useState("")
  const [pinConfirm, setPinConfirm] = useState("")
  const [pinErr, setPinErr] = useState("")
  const [loginPin, setLoginPin] = useState("")
  const [loginErr, setLoginErr] = useState("")
  const [loginLoading, setLoginLoading] = useState(false)

  const [pendingAccount, setPendingAccount] = useState<ChimboAccount | null>(null)

  // Quick helper to determine target page
  const getTargetPage = (acc: ChimboAccount | null) => {
    if (!acc) return "/chimbo"
    return acc.role === "MANAGER" ? "/chimbo/dashboard" : "/chimbo/data-entry"
  }

  // Clear any medium-scale demo flags
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("demo_mode")
      localStorage.removeItem("demo_role")
    }
    // If already logged in, redirect
    const existing = getActiveAccount()
    if (existing) {
      router.replace(getTargetPage(existing))
    }
  }, [])

  // ── STEP: Phone number ──────────────────────────────────────────────────────
  const handlePhone = () => {
    const cleaned = phone.replace(/\s/g, "")
    if (!/^0[67]\d{8}$/.test(cleaned)) {
      setPhoneErr("Namba si sahihi. Mfano: 0712 345 678")
      return
    }
    setPhoneErr("")
    const existing = findAccountByPhone(cleaned)

    if (existing) {
      setPendingAccount(existing)
      const known = existing.device_fingerprint === getDeviceFingerprint()
      setFlow(known ? "pin_login" : "totp_verify")
    } else {
      // Check if there are ANY accounts — if yes, this must be a supervisor using invite
      const all = getAllAccounts()
      if (all.length === 0) {
        // First-ever user → auto-becomes MANAGER
        setSelectedRole("MANAGER")
        setFlow("totp_setup")
      } else {
        // Extra user — must provide invite code
        setFlow("invite_code")
      }
    }
  }

  // ── STEP: Invite code (supervisor) ─────────────────────────────────────────
  const handleInviteCode = () => {
    const invite = validateInviteCode(inviteCode.trim())
    if (!invite) {
      setInviteErr("Nambari ya mwaliko si sahihi au imekwisha muda wake.")
      return
    }
    setInviteErr("")
    setInviteData(invite)
    setSelectedRole("SUPERVISOR")
    setFlow("totp_setup")
  }

  // ── STEP: TOTP complete ─────────────────────────────────────────────────────
  const handleTotpDone = (secret: string, codes: string[]) => {
    setTotpSecret(secret)
    setRecoveryCodes(codes)
    setFlow("pin_setup")
  }

  // ── STEP: PIN confirm ───────────────────────────────────────────────────────
  const handlePinConfirm = () => {
    if (pin !== pinConfirm) {
      setPinErr("PIN hazilingani! Weka tena.")
      setPinConfirm("")
      return
    }
    setPinErr("")
    // Save account
    const cleanPhone = phone.replace(/\s/g, "")
    const newAccount: ChimboAccount = {
      id: "acc_" + Date.now().toString(36),
      phone: cleanPhone,
      full_name: cleanPhone, // will be updated if name step added
      role: selectedRole,
      pin: hashPin(pin, cleanPhone),
      totp_secret: totpSecret,
      recovery_codes: recoveryCodes,
      device_fingerprint: getDeviceFingerprint(),
      company_id: inviteData ? inviteData.company_id : generateCompanyId(),
      account_type: "SMALL_SCALE",
      subscription_status: "TRIAL",
      trial_start: new Date().toISOString(),
      created_at: new Date().toISOString(),
    }
    saveAccount(newAccount)
    if (inviteData) consumeInviteCode(inviteData.code)
    setActiveAccount(newAccount)
    setFlow("success")
  }

  // ── STEP: PIN login ─────────────────────────────────────────────────────────
  const handlePinLogin = async () => {
    if (!pendingAccount) return
    setLoginLoading(true); setLoginErr("")
    await new Promise(r => setTimeout(r, 400)) // slight delay for UX
    const valid = verifyPin(loginPin, pendingAccount.pin, pendingAccount.phone)
    if (!valid) {
      setLoginErr("PIN si sahihi. Jaribu tena.")
      setLoginPin("")
      setLoginLoading(false)
      return
    }
    setActiveAccount(pendingAccount)
    const target = pendingAccount.role === "MANAGER" ? "/chimbo/dashboard" : "/chimbo/data-entry"
    router.replace(target)
  }

  // ── STEP: TOTP verified on new device ──────────────────────────────────────
  const handleDeviceVerified = () => {
    if (!pendingAccount) return
    setFlow("pin_login")
  }

  // ── STEP: Success → Route by role ───────────────────────────────────────────
  useEffect(() => {
    if (flow === "success") {
      const acc = getActiveAccount()
      const target = acc?.role === "MANAGER" ? "/chimbo/dashboard" : "/chimbo/data-entry"
      setTimeout(() => router.replace(target), 1500)
    }
  }, [flow])

  // ── STEP: Labels ─────────────────────────────────────────────────────────────
  const stepLabels: Record<AuthFlow, string> = {
    phone:       "INGIA SMART MINE",
    pin_login:   "KARIBU TENA!",
    totp_verify: "THIBITISHA KIFAA",
    invite_code: "NAMBARI YA MWALIKO",
    role_select: "CHAGUA NAFASI",
    totp_setup:  "USALAMA WA TOTP",
    pin_setup:   "WEKA PIN YAKO",
    pin_confirm: "THIBITISHA PIN",
    success:     "UMEINGIA! 🎉",
  }

  const canGoBack = flow !== "phone" && flow !== "success"

  // ───────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-950 transition-colors duration-500 md:h-screen md:overflow-hidden">

      {/* ── LEFT: Image Slider ─────────────────────────────────────────────── */}
      <div className="w-full md:w-1/2 h-[35vh] md:h-full relative overflow-hidden shrink-0">
        <HeroSlider slides={chimboSlides} />
        {/* Logo overlay */}
        <div className="absolute top-6 left-6 z-20">
          <Link href="/" className="flex items-center gap-2 bg-black/50 backdrop-blur-md px-3 py-2 rounded-xl border border-white/10 hover:bg-black/70 transition-all">
            <ArrowLeft className="h-4 w-4 text-white" />
            <span className="text-white text-[10px] font-black uppercase tracking-widest">Nyumbani</span>
          </Link>
        </div>
        {/* Gradient overlay at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-950 to-transparent md:hidden" />
      </div>

      {/* ── RIGHT: Auth Form ───────────────────────────────────────────────── */}
      <div className="w-full md:w-1/2 flex flex-col items-center justify-center p-6 md:p-12 relative overflow-y-auto bg-slate-950">
        {/* Ambient glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-sm relative z-10 space-y-8">

          {/* Brand */}
          <div className="text-center space-y-3">
            <div className="w-16 h-16 mx-auto rounded-[1.5rem] bg-amber-500 flex items-center justify-center shadow-2xl shadow-amber-500/30">
              <Mountain className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tighter italic uppercase leading-none">
                SMART <span className="text-amber-500">MINE</span>
              </h1>
              <p className="text-[10px] font-bold text-amber-600 uppercase tracking-[0.3em] mt-1">Wachimbaji Wadogo · Secured</p>
            </div>
          </div>

          {/* ── Security Pillars (shown on first step only) ────────────────── */}
          {flow === "phone" && (
            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: QrCode, label: "TOTP Auth", color: "text-amber-400" },
                { icon: Smartphone, label: "Device Lock", color: "text-blue-400" },
                { icon: Lock, label: "15-min timeout", color: "text-emerald-400" },
              ].map(({ icon: Icon, label, color }) => (
                <div key={label} className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex flex-col items-center gap-1.5">
                  <Icon className={`w-5 h-5 ${color}`} />
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest text-center leading-tight">{label}</span>
                </div>
              ))}
            </div>
          )}

          {/* ── Card ──────────────────────────────────────────────────────── */}
          <div className="bg-slate-900/80 backdrop-blur-xl rounded-[2.5rem] border border-slate-800 p-8 shadow-2xl space-y-6 relative overflow-hidden">
            {/* Top accent line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500 opacity-60" />

            {/* Back button */}
            {canGoBack && (
              <button
                onClick={() => setFlow("phone")}
                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-amber-400 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" /> RUDI MWANZO
              </button>
            )}

            {/* Step header */}
            <div className="space-y-1">
              <p className="text-[9px] font-black text-amber-500/70 uppercase tracking-[0.3em]">
                {flow === "phone" ? "Hatua ya Kuingia" :
                 flow === "totp_setup" ? "Usalama wa Kwanza" :
                 flow === "pin_setup" || flow === "pin_confirm" ? "Weka Nambari Siri" :
                 flow === "invite_code" ? "Mwaliko wa Supervisor" :
                 flow === "totp_verify" ? "Kifaa Kipya" :
                 flow === "success" ? "Umefanikiwa" : "Ingia"}
              </p>
              <h2 className="text-xl font-black text-white uppercase tracking-tighter italic">{stepLabels[flow]}</h2>
            </div>

            {/* ─── PHONE STEP ──────────────────────────────────────────── */}
            {flow === "phone" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Namba ya Simu</label>
                  <div className="relative">
                    <input
                      type="tel" inputMode="tel"
                      value={phone}
                      onChange={e => { setPhone(e.target.value); setPhoneErr("") }}
                      onKeyDown={e => e.key === "Enter" && handlePhone()}
                      placeholder="0712 345 678"
                      className="w-full h-14 pl-5 pr-4 rounded-2xl bg-slate-800 border-2 border-slate-700 focus:border-amber-500 text-white text-lg font-bold placeholder:text-slate-600 outline-none transition-all"
                    />
                  </div>
                  {phoneErr && <p className="text-red-400 text-xs font-bold flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5 shrink-0" />{phoneErr}</p>}
                </div>
                <button
                  onClick={handlePhone}
                  className="w-full h-14 rounded-2xl bg-amber-500 hover:bg-amber-400 font-black text-slate-900 uppercase tracking-widest transition-all active:scale-95 shadow-xl shadow-amber-500/20"
                >
                  ENDELEA →
                </button>
                <p className="text-[9px] text-slate-600 text-center font-bold uppercase tracking-widest">
                  Mtumiaji mpya? Ingiza namba yako → tutakuongoza
                </p>
              </div>
            )}

            {/* ─── INVITE CODE STEP (new supervisor) ───────────────────── */}
            {flow === "invite_code" && (
              <div className="space-y-5">
                <div className="flex items-center gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
                  <UserCog className="w-8 h-8 text-blue-400 shrink-0" />
                  <div>
                    <p className="text-[10px] font-black text-blue-300 uppercase tracking-widest">Supervisor Login</p>
                    <p className="text-[9px] text-slate-500 font-bold mt-0.5">Omba Manager wako akupe nambari ya mwaliko</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nambari ya Mwaliko (6 herufi)</label>
                  <input
                    type="text"
                    value={inviteCode}
                    onChange={e => { setInviteCode(e.target.value.toUpperCase().slice(0, 6)); setInviteErr("") }}
                    placeholder="ABCD12"
                    className="w-full h-14 text-center text-2xl font-black rounded-2xl bg-slate-800 border-2 border-slate-700 focus:border-amber-500 text-amber-400 tracking-[0.4em] font-mono outline-none uppercase"
                  />
                  {inviteErr && <p className="text-red-400 text-xs font-bold flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" />{inviteErr}</p>}
                </div>
                <button
                  onClick={handleInviteCode}
                  disabled={inviteCode.length < 6}
                  className="w-full h-14 rounded-2xl bg-amber-500 disabled:opacity-40 hover:bg-amber-400 font-black text-slate-900 uppercase tracking-widest active:scale-95"
                >
                  THIBITISHA MWALIKO
                </button>
              </div>
            )}

            {/* ─── TOTP SETUP (new user) ────────────────────────────────── */}
            {flow === "totp_setup" && (
              <TotpSetupStep phone={phone.replace(/\s/g, "")} onVerified={handleTotpDone} />
            )}

            {/* ─── TOTP VERIFY (new device) ────────────────────────────── */}
            {flow === "totp_verify" && pendingAccount && (
              <TotpVerifyStep account={pendingAccount} onVerified={handleDeviceVerified} />
            )}

            {/* ─── PIN SETUP ────────────────────────────────────────────── */}
            {flow === "pin_setup" && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                  <Shield className="w-5 h-5 text-emerald-400 shrink-0" />
                  <p className="text-[9px] text-emerald-300 font-bold uppercase tracking-widest">PIN hii itafanya kazi kwenye kifaa hiki tu</p>
                </div>
                <PinPad
                  value={pin} onChange={setPin}
                  onSubmit={() => { setFlow("pin_confirm") }}
                  submitLabel="ENDELEA →"
                />
              </div>
            )}

            {/* ─── PIN CONFIRM ──────────────────────────────────────────── */}
            {flow === "pin_confirm" && (
              <div className="space-y-4">
                {pinErr && <p className="text-red-400 text-xs font-bold flex items-center gap-2"><AlertTriangle className="w-4 h-4" />{pinErr}</p>}
                <PinPad
                  value={pinConfirm} onChange={v => { setPinConfirm(v); setPinErr("") }}
                  onSubmit={handlePinConfirm}
                  submitLabel="HIFADHI PIN"
                />
              </div>
            )}

            {/* ─── PIN LOGIN ────────────────────────────────────────────── */}
            {flow === "pin_login" && pendingAccount && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-slate-800 rounded-2xl border border-slate-700">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${pendingAccount.role === "MANAGER" ? "bg-purple-600" : "bg-amber-500"}`}>
                    {pendingAccount.role === "MANAGER" ? <Crown className="w-5 h-5 text-white" /> : <UserCog className="w-5 h-5 text-white" />}
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{pendingAccount.role}</p>
                    <p className="text-sm font-black text-white">{pendingAccount.full_name || pendingAccount.phone}</p>
                  </div>
                </div>
                {loginErr && <p className="text-red-400 text-xs font-bold flex items-center gap-2"><AlertTriangle className="w-4 h-4" />{loginErr}</p>}
                <PinPad
                  value={loginPin} onChange={v => { setLoginPin(v); setLoginErr("") }}
                  onSubmit={handlePinLogin}
                  loading={loginLoading}
                  submitLabel="INGIA →"
                />
                <button
                  onClick={() => setFlow("totp_verify")}
                  className="w-full text-[9px] font-black text-slate-600 hover:text-amber-400 uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-3 h-3" /> Umesahau PIN? Thibitisha kwa Google Auth
                </button>
              </div>
            )}

            {/* ─── SUCCESS ──────────────────────────────────────────────── */}
            {flow === "success" && (
              <div className="flex flex-col items-center gap-5 py-4 text-center">
                <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/30 animate-bounce">
                  <CheckCircle2 className="w-10 h-10 text-white" />
                </div>
                <div>
                  <p className="text-white font-black text-xl uppercase tracking-tighter">Akaunti Imefunguliwa!</p>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">Inakupeleka kwenye mfumo...</p>
                </div>
              </div>
            )}

          </div>

          {/* Footer */}
          <p className="text-center text-[9px] font-black text-slate-800 uppercase tracking-widest">
            © 2026 Smart Mine Tanzania · Secured by TOTP
          </p>
        </div>
      </div>
    </div>
  )
}
