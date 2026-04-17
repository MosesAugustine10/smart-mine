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
import { ExportCSVButton } from "@/components/export-csv-button"
import { 
  Eye, Edit, Trash2, Search, ChevronLeft, ChevronRight,
  Drill, MoreHorizontal, UserCheck, ShieldCheck, CheckCircle2, MapPin, Info
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

interface DrillingExecution {
  id: string
  drill_number: string
  date: string
  region: string
  location: string
  driller_name: string
  holes_drilled: number
  hole_length_m: number
  penetration_rate_m_per_min: number
  planned_budget_tzs: number
  actual_expenditure_tzs: number
  status: string
  operator_signature?: string
  supervisor_signature?: string
  manager_signature?: string
}

interface DrillingTableProps {
  drillingOps: DrillingExecution[]
}

const statusColors = {
  planned: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
  in_progress: "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400",
  completed: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400",
  paused: "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400"
}

export function DrillingTable({ drillingOps }: DrillingTableProps) {
  const router = useRouter()
  const { toast } = useToast()
  
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRegion, setSelectedRegion] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedOp, setSelectedOp] = useState<DrillingExecution | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [infoModalOpen, setInfoModalOpen] = useState(false)
  const [infoData, setInfoData] = useState<any>(null)

  const regions = Array.from(new Set(drillingOps.map((op) => op.region).filter(Boolean)))

  const filteredOps = drillingOps.filter((op) => {
    const matchesSearch = 
      op.drill_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      op.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      op.region?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      op.driller_name?.toLowerCase().includes(searchTerm.toLowerCase())
    
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
        .from("drilling_operations")
        .delete()
        .eq("id", selectedOp.id)
      
      if (error) throw error
      toast({ title: "Success", description: "Record removed successfully." })
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
    <Card className="border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
      <CardHeader className="p-4 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <CardTitle className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Drill className="h-4 w-4 text-blue-500" />
            Drilling Ops Ledger
          </CardTitle>
          <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Fleet analytics and signature verification</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              placeholder="Search Rig/Driller…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-8 pl-8 pr-3 text-xs w-[180px] border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950"
            />
          </div>
          <Select value={selectedRegion} onValueChange={setSelectedRegion}>
            <SelectTrigger className="h-8 text-xs w-[130px] border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950">
              <SelectValue placeholder="All Regions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Regions</SelectItem>
              {regions.map((region) => (
                <SelectItem key={region as string} value={region as string}>{region as string}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <ExportCSVButton data={filteredOps} filename="Drilling_Report" className="h-8 px-3 text-xs bg-white border-slate-200 hover:bg-slate-50" />
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/50 dark:bg-slate-950">
              <TableRow className="hover:bg-transparent border-b border-slate-200 dark:border-slate-800">
                <TableHead className="py-3 px-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Rig ID</TableHead>
                <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Date</TableHead>
                <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Region</TableHead>
                <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-widest truncate">Location</TableHead>
                <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Meters</TableHead>
                <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Budget (TZS)</TableHead>
                <TableHead className="text-center text-[10px] font-black uppercase text-slate-400 tracking-widest">Status</TableHead>
                <TableHead className="text-center text-[10px] font-black uppercase text-slate-400 tracking-widest">Info</TableHead>
                <TableHead className="text-right pr-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="text-xs">
              {paginatedOps.map((op) => {
                 const totalDepth = (op.holes_drilled || 0) * (op.hole_length_m || 0)
                 return (
                  <TableRow key={op.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors border-b border-slate-100 dark:border-slate-800/50">
                    <TableCell className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">{op.drill_number}</TableCell>
                    <TableCell className="py-3 font-bold text-slate-600 whitespace-nowrap">
                      {op.date ? format(new Date(op.date), "dd MMM yyyy") : "-"}
                    </TableCell>
                    <TableCell className="py-3 font-black text-[10px] uppercase text-blue-600">
                      {op.region || "-"}
                    </TableCell>
                    <TableCell className="py-3 max-w-[120px] truncate font-bold text-slate-500">
                       {op.location || "-"}
                    </TableCell>
                    <TableCell className="text-right py-3 font-black text-slate-900">
                      {totalDepth.toFixed(1)} <span className="text-[9px] font-medium text-slate-400 uppercase">m</span>
                    </TableCell>
                    <TableCell className="text-right py-3 font-black text-emerald-600">
                      {op.actual_expenditure_tzs?.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-center py-3">
                      <Badge className={statusColors[op.status?.toLowerCase() as keyof typeof statusColors] || "bg-slate-100 text-slate-600"}>
                        {op.status?.replace('_', ' ')}
                      </Badge>

                    </TableCell>
                    <TableCell className="text-center py-3">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => { setInfoData(op); setInfoModalOpen(true); }}
                        className="h-8 w-8 rounded-xl bg-blue-500/10 text-blue-600 hover:bg-blue-500 hover:text-white transition-all"
                      >
                        <Info className="h-4 w-4" />
                      </Button>
                    </TableCell>
                    <TableCell className="text-right pr-4 py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40 text-xs font-medium">
                          <DropdownMenuItem asChild className="cursor-pointer">
                            <Link href={`/drilling/${op.id}`}>
                              <Eye className="h-3.5 w-3.5 mr-2 text-slate-400" /> View Record
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild className="cursor-pointer">
                            <Link href={`/drilling/new?opId=${op.id}`}>
                              <Edit className="h-3.5 w-3.5 mr-2 text-slate-400" /> Edit Entry
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-red-500 cursor-pointer"
                            onClick={() => {
                              setSelectedOp(op)
                              setDeleteDialogOpen(true)
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
              {paginatedOps.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12 text-slate-400">
                    No drilling records found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Record {filteredOps.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, filteredOps.length)} of {filteredOps.length}
            </p>
            <div className="flex items-center gap-1.5">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} 
                disabled={currentPage === 1} 
                className="h-7 text-[10px] font-bold uppercase px-3 border-slate-200"
              >
                <ChevronLeft className="h-3 w-3 mr-1" /> Prev
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} 
                disabled={currentPage === totalPages || totalPages === 0} 
                className="h-7 text-[10px] font-bold uppercase px-3 border-slate-200"
              >
                Next <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
        </div>
      </CardContent>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="max-w-[400px] p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold">Standard Data Purge</AlertDialogTitle>
            <AlertDialogDescription className="text-xs py-2">
              You are removing rig entry <span className="font-bold text-slate-900">{selectedOp?.drill_number}</span>. Audits will be recorded.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel disabled={isDeleting} className="h-9 text-xs font-bold uppercase rounded-md">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="h-9 bg-red-500 text-white hover:bg-red-600 text-xs font-bold uppercase rounded-md">
              {isDeleting ? "Wiping..." : "Confirm Purge"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <SimpleDetailModal 
        isOpen={infoModalOpen} 
        onClose={() => setInfoModalOpen(false)} 
        data={infoData} 
        title="Drilling Operation Details" 
      />
    </Card>
  )
}
