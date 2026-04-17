"use client"

/**
 * hooks/use-chimbo-session.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Auto-logout hook: tracks inactivity and logs user out after 15 minutes.
 * Also handles activity touch on every user interaction.
 */

import { useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  touchActivity,
  isSessionExpired,
  clearActiveAccount,
  INACTIVITY_MS,
} from "@/lib/chimbo-auth"

const ACTIVITY_EVENTS = ["mousedown", "mousemove", "keypress", "touchstart", "scroll", "click"]

export function useChimboSession(enabled = true) {
  const router = useRouter()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const logout = useCallback(() => {
    clearActiveAccount()
    router.replace("/chimbo")
  }, [router])

  const resetTimer = useCallback(() => {
    if (!enabled) return
    touchActivity()
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      logout()
    }, INACTIVITY_MS)
  }, [enabled, logout])

  useEffect(() => {
    if (!enabled) return

    // Check immediately on mount — if already expired, log out
    if (isSessionExpired()) {
      logout()
      return
    }

    // Start the timer
    resetTimer()

    // Attach activity listeners
    ACTIVITY_EVENTS.forEach(evt => window.addEventListener(evt, resetTimer, { passive: true }))

    // Check every 30s as a safety net (for background tabs)
    const interval = setInterval(() => {
      if (isSessionExpired()) logout()
    }, 30_000)

    return () => {
      ACTIVITY_EVENTS.forEach(evt => window.removeEventListener(evt, resetTimer))
      clearInterval(interval)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [enabled, resetTimer, logout])

  return { resetTimer, logout }
}
