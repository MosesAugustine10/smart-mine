"use client"

import React from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export function NotificationsBell() {
  return (
    <Button variant="ghost" size="icon" className="relative rounded-full shadow-sm hover:bg-slate-50 transition-all border border-slate-100 h-10 w-10">
      <Bell className="h-5 w-5 text-slate-700" />
      <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[9px] font-black uppercase text-white border-2 border-white">
        4
      </span>
      <span className="sr-only">Toggle notifications</span>
    </Button>
  )
}
