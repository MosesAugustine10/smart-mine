"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Clock, BarChart3, TrendingUp } from "lucide-react"

interface TimeFrameSwitcherProps {
  baseUrl: string
}

export function TimeFrameSwitcher({ baseUrl }: TimeFrameSwitcherProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentPeriod = searchParams.get("period") || "daily"

  const handleValueChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("period", value)
    router.push(`${baseUrl}?${params.toString()}`)
  }

  return (
    <Tabs defaultValue={currentPeriod} onValueChange={handleValueChange} className="w-full sm:w-auto">
      <TabsList className="grid grid-cols-4 bg-muted/60">
        <TabsTrigger value="daily" className="flex items-center gap-2 group">
          <Clock className="w-3 h-3 group-data-[state=active]:text-emerald-500" />
          <span className="hidden sm:inline">Daily</span>
        </TabsTrigger>
        <TabsTrigger value="weekly" className="flex items-center gap-2 group">
          <TrendingUp className="w-3 h-3 group-data-[state=active]:text-blue-500" />
          <span className="hidden sm:inline">Weekly</span>
        </TabsTrigger>
        <TabsTrigger value="monthly" className="flex items-center gap-2 group">
          <Calendar className="w-3 h-3 group-data-[state=active]:text-purple-500" />
          <span className="hidden sm:inline">Monthly</span>
        </TabsTrigger>
        <TabsTrigger value="yearly" className="flex items-center gap-2 group">
          <BarChart3 className="w-3 h-3 group-data-[state=active]:text-amber-500" />
          <span className="hidden sm:inline">Yearly</span>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
