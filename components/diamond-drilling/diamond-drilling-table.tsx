"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { format } from "date-fns"
import { 
  Eye, Edit, Trash2, Search, ChevronLeft, ChevronRight,
  Gem, MoreHorizontal, Clock, DollarSign, PenTool, ShieldCheck, UserCheck, CheckCircle2, Activity, FlaskConical, Map, Info
} from "lucide-react"
import { SimpleDetailModal } from "@/components/ui/simple-detail-modal"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"

interface DiamondDrillingExecution {
  id: string
  drill_number: string
  date: string
  region: string
  location: string
  hole_number: string
  actual_depth_meters: number
  target_depth_meters: number
  recovery_percentage: number
  planned_budget_tzs: number
  actual_cost_tzs: number
  status: string
  operator_signature?: any
  supervisor_signature?: any
  manager_signature?: any
  sample_collected: boolean
  rqd?: number
}

interface DiamondDrillingTableProps {
  diamondOps: DiamondDrillingExecution[]
}

const statusColors = {
  planned: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  in_progress: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  paused: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
}

export function DiamondDrillingTable({ diamondOps }: DiamondDrillingTableProps) {
  const router = useRouter()
  const { toast } = useToast()
  
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRegion, setSelectedRegion] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedOp, setSelectedOp] = useState<DiamondDrillingExecution | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [infoModalOpen, setInfoModalOpen] = useState(false)
  const [infoData, setInfoData] = useState<any>(null)

  const regions = Array.from(new Set(diamondOps.map((op) => op.region).filter(Boolean)))

  const filteredOps = diamondOps.filter((op) => {
    const matchesSearch = 
      op.drill_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      op.hole_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      op.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      op.region?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesRegion = selectedRegion === "all" || op.region === selectedRegion
    
    return matchesSearch && matchesRegion
  })

  const sortedOps = [...filteredOps].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  const totalPages = Math.ceil(sortedOps.length / itemsPerPage)
  
  const paginatedOps = sortedOps.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handleDelete = async () => {
    if (!selectedOp) return
    setIsDeleting(true)
    const supabase = getSupabaseBrowserClient()
    
    try {
      const { error } = await supabase
        .from("diamond_drilling_executions")
        .delete()
        .eq("id", selectedOp.id)
      
      if (error) throw error
      toast({ title: "Deleted", description: "Core campaign record purged." })
      router.refresh()
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
      setSelectedOp(null)
    }
  }

  return (
    <Card className="border shadow-2xl rounded-3xl overflow-hidden border-slate-200/60 h-full">
      <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
              <CardTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                <Gem className="h-6 w-6 text-emerald-600" />
                Diamond Drilling Core Ledger
              </CardTitle>
              <p className="text-xs text-muted-foreground font-medium mt-1">Geological Recovery Analytics {"&"} Laboratory Sync</p>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filter by Hole ID, Rig ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full md:w-[250px] bg-white border-2 rounded-xl"
              />
            </div>
            <Select value={selectedRegion} onValueChange={setSelectedRegion}>
              <SelectTrigger className="w-[150px] bg-white border-2 rounded-xl">
                <SelectValue placeholder="All Sectors" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Global Exploration</SelectItem>
                {regions.map((region) => (
                  <SelectItem key={region as string} value={region as string}>{region}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="overflow-x-auto h-[600px]">
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-slate-900 sticky top-0 z-10 shadow-sm">
              <TableRow className="hover:bg-transparent border-b-2">
                <TableHead className="font-black uppercase text-[10px] tracking-widest pl-6">Job ID</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest">Date</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest">Region</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest">Hole / Site</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest text-right">Recovery %</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest text-center">RQD Status</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest text-right whitespace-nowrap">Depth (m)</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest text-right">Actual Cost</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest text-center">Info</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest text-right pr-6">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedOps.map((op) => {
                const isOver = op.actual_cost_tzs > op.planned_budget_tzs && op.planned_budget_tzs > 0
                const recovery = op.recovery_percentage || 0

                return (
                    <TableRow key={op.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/50 transition-colors group">
                      <TableCell className="pl-6 py-4">
                        <div className="font-black text-emerald-700 dark:text-emerald-400 font-mono text-base">{op.drill_number}</div>
                      </TableCell>
                      <TableCell className="font-bold text-slate-600 uppercase text-xs whitespace-nowrap">
                        {op.date ? format(new Date(op.date), "dd MMM yyyy") : 'TBD'}
                      </TableCell>
                      <TableCell className="font-black text-xs uppercase text-blue-600">
                        {op.region || "-"}
                      </TableCell>
                      <TableCell>
                        <div className="font-black text-xs uppercase text-slate-900 dark:text-slate-100 line-clamp-1">{op.hole_number}</div>
                        <div className="text-[10px] text-muted-foreground uppercase flex items-center gap-1 font-bold">
                            <Map className="w-3 h-3 opacity-30" /> {op.location}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                         <div className={`font-black text-lg leading-none ${recovery >= 95 ? 'text-emerald-600' : recovery >= 85 ? 'text-amber-600' : 'text-red-500'}`}>{recovery.toFixed(1)}%</div>
                         <div className="text-[10px] font-bold text-muted-foreground mt-1 uppercase">Recovery Index</div>
                      </TableCell>

                      {/* RQD Column */}
                      <TableCell className="text-center">
                          <div className="flex flex-col items-center gap-1">
                              <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter shadow-sm
                                  ${(op.rqd || 0) <= 25 ? 'bg-red-50 text-red-600' : 
                                    (op.rqd || 0) <= 50 ? 'bg-orange-50 text-orange-600' :
                                    (op.rqd || 0) <= 75 ? 'bg-yellow-50 text-yellow-600' :
                                    (op.rqd || 0) <= 90 ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-700'}`}>
                                  {(op.rqd || 0) <= 25 ? 'Mbovu Sana' : 
                                   (op.rqd || 0) <= 50 ? 'Mbovu' :
                                   (op.rqd || 0) <= 75 ? 'Wastani' :
                                   (op.rqd || 0) <= 90 ? 'Bora' : 'Bora Kabisa'}
                              </span>
                              <div className="text-[9px] font-black opacity-40">RQD: {op.rqd || 0}%</div>
                          </div>
                      </TableCell>

                      <TableCell className="text-right">
                         <div className="font-black text-slate-900 dark:text-white leading-none whitespace-nowrap">{op.actual_depth_meters?.toFixed(2)} m</div>
                         <div className="text-[10px] font-bold text-muted-foreground mt-1 uppercase whitespace-nowrap">Target: {op.target_depth_meters}m</div>
                      </TableCell>
                      
                      <TableCell className="text-right">
                        <div className={`font-black text-base leading-none ${isOver ? 'text-red-500' : 'text-emerald-600'}`}>
                           TZS {op.actual_cost_tzs?.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-muted-foreground font-bold uppercase mt-1 whitespace-nowrap">Budget: {op.planned_budget_tzs?.toLocaleString()}</div>
                      </TableCell>
                      
                      <TableCell className="text-center py-4">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => { setInfoData(op); setInfoModalOpen(true); }}
                          className="h-9 w-9 rounded-2xl bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
                        >
                          <Info className="h-4 w-4" />
                        </Button>
                      </TableCell>
                      
                      
                      <TableCell className="text-right pr-6">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="hover:bg-slate-100 rounded-full">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56 rounded-2xl border-2 shadow-2xl p-2">
                            <DropdownMenuItem asChild className="rounded-xl h-11 px-4 cursor-pointer">
                              <Link href={`/diamond-drilling/${op.id}`}>
                                <Eye className="h-4 w-4 mr-3 text-emerald-600" /> <span className="font-bold">Core Analytics</span>
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild className="rounded-xl h-11 px-4 cursor-pointer">
                              <Link href={`/diamond-drilling/new?opId=${op.id}`}>
                                <Edit className="h-4 w-4 mr-3 text-amber-600" /> <span className="font-bold">Log execution</span>
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="my-2" />
                            <DropdownMenuItem 
                              className="rounded-xl h-11 px-4 text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
                              onClick={() => {
                                setSelectedOp(op)
                                setDeleteDialogOpen(true)
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-3" /> <span className="font-bold">Purge Data</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                )
              })}

              {paginatedOps.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-20 text-muted-foreground bg-white dark:bg-slate-950">
                    <div className="flex flex-col items-center gap-2">
                        <Gem className="w-12 h-12 opacity-10" />
                        <p className="font-bold italic">No core sequences currently indexed.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between p-6 border-t bg-slate-50/50">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest whitespace-nowrap">
              Campaign Index {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, sortedOps.length)} of {sortedOps.length}
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="rounded-xl border-2 font-bold h-10 px-4 whitespace-nowrap">
                <ChevronLeft className="h-4 w-4 mr-1" /> Prev
              </Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} className="rounded-xl border-2 font-bold h-10 px-4 whitespace-nowrap">
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
        </div>
      </CardContent>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-[2.5rem] border-2 shadow-3xl p-10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black uppercase tracking-tight text-red-600">Geological Data Purge</AlertDialogTitle>
            <AlertDialogDescription className="text-base font-medium py-4">
              Authorized Action: You are purging Campaign <span className="font-black text-slate-900">{selectedOp?.drill_number}</span> (Hole: {selectedOp?.hole_number}). This action destroys core receipt metadata and all enterprise signatures.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-4 text-center">
            <AlertDialogCancel disabled={isDeleting} className="h-14 rounded-2xl font-bold uppercase tracking-widest border-2">Abort Purge</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="h-14 rounded-2xl bg-destructive text-white font-black uppercase tracking-widest px-8">
              {isDeleting ? "Wiping Registry..." : "Confirm Deletion"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <SimpleDetailModal 
        isOpen={infoModalOpen} 
        onClose={() => setInfoModalOpen(false)} 
        data={infoData} 
        title="Diamond Drilling Detail View" 
      />
    </Card>
  )
}
