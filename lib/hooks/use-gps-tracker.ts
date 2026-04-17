"use client"

import { useEffect, useState } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

interface Position {
  lat: number
  lng: number
  speed: number | null
  timestamp: string
}

export function useGPSTracker(vehicleId?: string, isDriver: boolean = false) {
  const [currentPosition, setCurrentPosition] = useState<Position | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isDriver || !vehicleId) return

    if (!('geolocation' in navigator)) {
      setError("Geolocation is not supported by this browser.")
      return
    }

    const supabase = getSupabaseBrowserClient()

    const watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        const payload: Position = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          speed: pos.coords.speed, // meters per second
          timestamp: new Date(pos.timestamp).toISOString()
        }
        setCurrentPosition(payload)

        // Broadcast to Realtime or update database
        try {
          // If we had a specific vehicle_tracking table, we'd upsert there.
          // For now we just push via Realtime Presence or a fast telemetry insert
          await supabase.from("vehicle_telemetry").insert({
            vehicle_id: vehicleId,
            latitude: payload.lat,
            longitude: payload.lng,
            speed_mps: payload.speed,
            recorded_at: payload.timestamp
          })
        } catch (err) {
           console.log("Failed to sync GPS", err)
        }
      },
      (err) => {
        setError(err.message)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000
      }
    )

    return () => {
      navigator.geolocation.clearWatch(watchId)
    }
  }, [vehicleId, isDriver])

  return { currentPosition, error }
}
