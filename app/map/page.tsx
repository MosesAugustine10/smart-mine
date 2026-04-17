"use client"
import { LiveTracker } from "@/components/map/live-tracker"

export default function MapPage() {
  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-slate-950">
      <LiveTracker />
    </div>
  )
}
