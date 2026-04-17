"use client"

import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useState, useEffect } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Loader2 } from "lucide-react"

interface Drillhole {
  id: string
  drill_number: string
  drilling_required_m: number
  location: string
  region: string
  created_at?: string
}

export default function DrillholeVisualizerPage() {
  const [drillholes, setDrillholes] = useState<Drillhole[]>([])
  const [selectedHole, setSelectedHole] = useState<string>("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDrillholes()
  }, [])

  const fetchDrillholes = async () => {
    const supabase = getSupabaseBrowserClient()
    const { data } = await supabase
      .from("drilling_operations")
      .select("id, drill_number, drilling_required_m, location, region, created_at")
      .order("drill_number")
    
    setDrillholes(data || [])
    setLoading(false)
  }

  const selectedDrillhole = drillholes.find(hole => hole.id === selectedHole)

  return (
    <>
      <DashboardHeader 
        title="Drillhole Visualizer" 
        description="3D visualization abstraction of drill holes"
      />
      
      <div className="p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Select Drillhole Target</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
                 <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
                <Select value={selectedHole} onValueChange={setSelectedHole}>
                <SelectTrigger className="w-full md:w-[400px]">
                    <SelectValue placeholder="Choose a drillhole record to analyze" />
                </SelectTrigger>
                <SelectContent>
                    {drillholes.map(hole => (
                    <SelectItem key={hole.id} value={hole.id}>
                        {hole.drill_number} - Depth: {hole.drilling_required_m || 0}m - {hole.location}
                    </SelectItem>
                    ))}
                </SelectContent>
                </Select>
            )}
           
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Core Spatial Visualization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gradient-to-b from-blue-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-lg p-8 min-h-[500px] flex items-center justify-center border border-slate-200 dark:border-slate-800">
              {selectedHole && selectedDrillhole ? (
                <div className="text-center w-full max-w-sm">
                  
                  {/* Pseudo Depth Core representation */}
                  <div className="relative w-32 h-[400px] mx-auto bg-slate-200 dark:bg-slate-700 rounded-2xl overflow-hidden shadow-inner border-4 border-slate-300 dark:border-slate-600">
                    
                    {/* Mineralization simulation layer scaled to depth visually */}
                    <div 
                      className="absolute bottom-0 w-full bg-gradient-to-t from-amber-600 to-amber-400 transition-all duration-1000 ease-out" 
                      style={{ height: `${Math.min(100, Math.max(10, (selectedDrillhole.drilling_required_m / 200) * 100))}%` }} 
                    />
                    
                    <div className="absolute top-4 w-full h-full flex flex-col p-2">
                       <div className="text-[10px] font-mono text-slate-500 text-left border-b border-slate-300 dark:border-slate-500 mb-2 pb-1">0m</div>
                       <div className="text-[10px] font-mono text-slate-500 text-left border-b border-slate-300 dark:border-slate-500 mb-2 pb-1 opacity-50">25m</div>
                       <div className="text-[10px] font-mono text-slate-500 text-left border-b border-slate-300 dark:border-slate-500 mb-2 pb-1 opacity-50">50m</div>
                    </div>
                    
                    <div className="absolute inset-x-0 bottom-4 flex justify-center drop-shadow-lg">
                      <Badge variant="secondary" className="bg-white/90 dark:bg-black/90 text-[10px] border border-amber-500/30">
                          Ore Body Proxy
                      </Badge>
                    </div>

                  </div>
                  
                  <div className="mt-8 p-4 bg-white dark:bg-slate-950 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
                    <p className="font-bold text-lg mb-1 text-primary">{selectedDrillhole.drill_number}</p>
                    <div className="flex justify-between items-center text-sm py-2 border-b">
                         <span className="text-muted-foreground">Calculated Depth</span>
                         <span className="font-medium">{selectedDrillhole.drilling_required_m || 0}m</span>
                    </div>
                    <div className="flex justify-between items-center text-sm py-2">
                         <span className="text-muted-foreground">Spatial Coordinates</span>
                         <span className="font-medium text-right">{selectedDrillhole.location}<br/>{selectedDrillhole.region}</span>
                    </div>
                  </div>
                  
                  <p className="mt-6 text-xs text-muted-foreground italic">Full WebGL/Three.js integration allocated for Phase 2</p>
                </div>
              ) : (
                <div className="text-center opacity-50">
                    <div className="w-16 h-48 border-4 border-dashed rounded-full mx-auto mb-4 border-slate-400"></div>
                    <p>Select a verified drill shaft constraint to compute 3D model properties</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
