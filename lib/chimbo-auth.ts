/**
 * lib/chimbo-auth.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Secure authentication utilities for the Small Scale Miners (Chimbo) system.
 *
 * THREE SECURITY PILLARS:
 *   1. TOTP (Google Authenticator)  — first-time device registration
 *   2. Device Binding               — PIN locked to one device fingerprint
 *   3. Auto-Logout                  — 15-minute inactivity timer
 */

// ─── Storage Keys ─────────────────────────────────────────────────────────────
export const STORE = {
  ACCOUNTS:       "chimbo_accounts",       // all local accounts
  ACTIVE:         "chimbo_account",        // currently logged-in account
  LAST_ACTIVITY:  "chimbo_last_activity",  // timestamp for auto-logout
  DEVICES:        "chimbo_devices",        // registered device fingerprints
  INVITES:        "chimbo_invites",        // pending invitation codes
} as const

// ─── Types ────────────────────────────────────────────────────────────────────
export type ChimboRole = "MANAGER" | "SUPERVISOR"

export interface ChimboAccount {
  id: string
  phone: string
  full_name: string
  role: ChimboRole
  pin: string                   // hashed (XOR+base64 — lightweight for offline)
  totp_secret: string           // stored locally, verified client-side
  recovery_codes: string[]
  device_fingerprint: string    // bound device fingerprint
  company_id: string            // links SUPERVISOR to a MANAGER's company
  account_type: "SMALL_SCALE"
  subscription_status: "TRIAL" | "ACTIVE" | "EXPIRED"
  trial_start: string
  created_at: string
}

export interface ChimboInvite {
  code: string            // 6-char alphanumeric
  manager_phone: string
  company_id: string
  created_at: string
  expires_at: string      // 48 hours
  used: boolean
}

// ─── Device Fingerprinting ────────────────────────────────────────────────────
/**
 * Generates a stable device fingerprint using browser characteristics.
 * Not cryptographically perfect, but sufficient for offline PWA device binding.
 */
export function getDeviceFingerprint(): string {
  if (typeof window === "undefined") return "server"
  const components = [
    navigator.userAgent,
    navigator.language,
    screen.width + "x" + screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency ?? 0,
    (navigator as any).deviceMemory ?? 0,
  ].join("|")

  // Simple hash (djb2)
  let hash = 5381
  for (let i = 0; i < components.length; i++) {
    hash = (hash * 33) ^ components.charCodeAt(i)
  }
  return Math.abs(hash).toString(36).padStart(8, "0")
}

// ─── PIN Utilities ────────────────────────────────────────────────────────────
/** Lightweight reversible obfuscation for local PIN storage (not true crypto) */
export function hashPin(pin: string, phone: string): string {
  const salt = phone.slice(-4)
  let result = ""
  for (let i = 0; i < pin.length; i++) {
    result += String.fromCharCode(pin.charCodeAt(i) ^ salt.charCodeAt(i % salt.length))
  }
  return btoa(result + salt)
}

export function verifyPin(inputPin: string, storedHash: string, phone: string): boolean {
  return hashPin(inputPin, phone) === storedHash
}

// ─── Invitation Codes ─────────────────────────────────────────────────────────
export function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789" // no I,O,0,1 for clarity
  let code = ""
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

export function createInvite(managerPhone: string, companyId: string): ChimboInvite {
  const now = new Date()
  const expires = new Date(now.getTime() + 48 * 60 * 60 * 1000) // 48 hrs
  const invite: ChimboInvite = {
    code: generateInviteCode(),
    manager_phone: managerPhone,
    company_id: companyId,
    created_at: now.toISOString(),
    expires_at: expires.toISOString(),
    used: false,
  }
  const invites = getInvites()
  invites.push(invite)
  localStorage.setItem(STORE.INVITES, JSON.stringify(invites))
  return invite
}

export function getInvites(): ChimboInvite[] {
  if (typeof window === "undefined") return []
  try { return JSON.parse(localStorage.getItem(STORE.INVITES) || "[]") } catch { return [] }
}

export function validateInviteCode(code: string): ChimboInvite | null {
  const invites = getInvites()
  const invite = invites.find(i => i.code === code.toUpperCase() && !i.used)
  if (!invite) return null
  if (new Date(invite.expires_at) < new Date()) return null // expired
  return invite
}

export function consumeInviteCode(code: string): void {
  const invites = getInvites()
  const updated = invites.map(i => i.code === code ? { ...i, used: true } : i)
  localStorage.setItem(STORE.INVITES, JSON.stringify(updated))
}

// ─── Account Management ───────────────────────────────────────────────────────
export function getAllAccounts(): ChimboAccount[] {
  if (typeof window === "undefined") return []
  try { return JSON.parse(localStorage.getItem(STORE.ACCOUNTS) || "[]") } catch { return [] }
}

export function findAccountByPhone(phone: string): ChimboAccount | null {
  return getAllAccounts().find(a => a.phone === phone) || null
}

export function saveAccount(account: ChimboAccount): void {
  const accounts = getAllAccounts()
  const idx = accounts.findIndex(a => a.phone === account.phone)
  if (idx >= 0) accounts[idx] = account
  else accounts.push(account)
  localStorage.setItem(STORE.ACCOUNTS, JSON.stringify(accounts))
}

export function getActiveAccount(): ChimboAccount | null {
  if (typeof window === "undefined") return null
  try { return JSON.parse(localStorage.getItem(STORE.ACTIVE) || "null") } catch { return null }
}

export function setActiveAccount(account: ChimboAccount): void {
  localStorage.setItem(STORE.ACTIVE, JSON.stringify(account))
  localStorage.setItem(STORE.LAST_ACTIVITY, Date.now().toString())
}

export function clearActiveAccount(): void {
  localStorage.removeItem(STORE.ACTIVE)
  localStorage.removeItem(STORE.LAST_ACTIVITY)
}

// ─── Auto-Logout (15 min inactivity) ─────────────────────────────────────────
export const INACTIVITY_MS = 15 * 60 * 1000 // 15 minutes

export function touchActivity(): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORE.LAST_ACTIVITY, Date.now().toString())
  }
}

export function isSessionExpired(): boolean {
  if (typeof window === "undefined") return false
  const last = Number(localStorage.getItem(STORE.LAST_ACTIVITY) || "0")
  return Date.now() - last > INACTIVITY_MS
}

// ─── Device Validation ────────────────────────────────────────────────────────
export function isKnownDevice(account: ChimboAccount): boolean {
  return account.device_fingerprint === getDeviceFingerprint()
}

// ─── Company ID ───────────────────────────────────────────────────────────────
export function generateCompanyId(): string {
  return "comp_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 7)
}
