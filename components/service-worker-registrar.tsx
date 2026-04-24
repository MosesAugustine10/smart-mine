"use client"

import { useEffect } from "react"

export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((reg) => {
          console.log("[SW] Registered:", reg.scope)
          // Check for updates every 30 minutes
          setInterval(() => reg.update(), 30 * 60 * 1000)
        })
        .catch((err) => console.warn("[SW] Registration failed:", err))
    }
  }, [])

  return null
}
