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
  Truck, MoreHorizontal, Clock, DollarSign, ShieldCheck, UserCheck, CheckCircle2, Activity, MapPin, Calendar, Package, Info
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
import { MaterialHandlingReportButton } from "./material-handling-reports"

interface Operation {
  id: string
  operation_number: string
  date: string
  region: string
  location: string
  production_per_day_tonnes: number
  total_cost: number
  planned_budget_tzs: number
  status: string
  operator_signature?: any
  supervisor_signature?: any
  manager_signature?: any
  trips_per_day: number
}

interface MaterialHandlingTableProps {
  materialOps: Operation[]
}

const statusColors = {
  planned: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  in_progress: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
}

export function MaterialHandlingTable({ materialOps }: MaterialHandlingTableProps) {
  const router = useRouter()
  const { toast } = useToast()
  
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedOp, setSelectedOp] = useState<Operation | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [infoModalOpen, setInfoModalOpen] = useState(false)
  const [infoData, setInfoData] = useState<any>(null)

  const filteredOps = materialOps.filter(op => {
    const matchesSearch = 
      op.operation_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      op.region?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      op.location?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || op.status === statusFilter
    
    return matchesSearch && matchesStatus
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
        .from("material_handling_operations")
        .delete()
        .eq("id", selectedOp.id)
      
      if (error) throw error
      toast({ title: "Deleted", description: "Operation record purged from vault." })
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
    <Card className="border shadow-2xl rounded-3xl overflow-hidden border-slate-200/60 transition-all hover:shadow-emerald-500/5 h-full">
      <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
              <CardTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2 text-emerald-700">
                <Truck className="h-6 w-6 text-emerald-500" />
                Haulage Performance Ledger
              </CardTitle>
              <p className="text-xs text-muted-foreground font-medium mt-1">Strategic Material Movement {"&"} Production Logic</p>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filter logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full md:w-[250px] bg-white border-2 rounded-xl"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px] bg-white border-2 rounded-xl">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Global Status</SelectItem>
                <SelectItem value="planned">Pre-Op Logistics</SelectItem>
                <SelectItem value="in_progress">Field Execution</SelectItem>
                <SelectItem value="completed">Analyzed & Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="overflow-x-auto h-[600px]">
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-slate-900 sticky top-0 z-10 shadow-sm font-black uppercase text-[10px] tracking-widest">
              <TableRow className="hover:bg-transparent border-b-2 text-slate-500">
                <TableHead className="pl-6 font-black uppercase">Registry ID</TableHead>
                <TableHead className="font-black uppercase">Day</TableHead>
                <TableHead className="font-black uppercase">Date</TableHead>
                <TableHead className="text-right px-6 font-black uppercase">Trips</TableHead>
                <TableHead className="text-right font-black uppercase">Production (t)</TableHead>
                <TableHead className="font-black uppercase">Pit / Zone</TableHead>
                <TableHead className="text-right font-black uppercase">Operating Cost</TableHead>
                <TableHead className="text-right font-black uppercase">Status</TableHead>
                <TableHead className="text-center font-black uppercase">Info</TableHead>
                <TableHead className="text-right pr-6 font-black uppercase">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedOps.map((op) => {
                const isOver = op.total_cost > op.planned_budget_tzs && op.planned_budget_tzs > 0
                const dayName = op.date ? format(new Date(op.date), "EEEE") : "N/A"

                return (
                    <TableRow key={op.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/50 transition-colors group">
                      <TableCell className="pl-6 py-4">
                        <div className="font-black text-emerald-700 dark:text-emerald-400 font-mono text-base">{op.operation_number}</div>
                      </TableCell>
                      
                      <TableCell className="font-black text-xs uppercase text-slate-400">
                        {dayName}
                      </TableCell>

                      <TableCell className="font-black text-xs whitespace-nowrap text-slate-900 px-4">
                        {op.date ? format(new Date(op.date), "dd MMM yyyy") : 'No Date'}
                      </TableCell>

                      <TableCell className="text-right px-6">
                         <Badge variant="outline" className="rounded-lg font-black text-[9px] uppercase border-2 border-emerald-100 bg-emerald-50 text-emerald-700">
                            {op.trips_per_day || 0} TRIPS
                         </Badge>
                      </TableCell>

                      <TableCell className="text-right">
                         <div className="font-black text-slate-900 dark:text-white text-lg tracking-tighter">
                            {op.production_per_day_tonnes?.toLocaleString() || "0"}
                         </div>
                      </TableCell>

                      <TableCell className="px-6">
                        <div className="font-black text-xs uppercase text-emerald-600 mb-1">{op.region}</div>
                        <div className="text-[10px] text-muted-foreground uppercase flex items-center gap-1 font-bold">
                            <MapPin className="w-3 h-3 opacity-30" /> {op.location || 'Site Base'}
                        </div>
                      </TableCell>
                      
                      <TableCell className="text-right">
                        <div className={`font-black tracking-tight whitespace-nowrap ${isOver ? "text-red-500" : "text-emerald-600"}`}>
                            {op.total_cost?.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-muted-foreground font-bold uppercase mt-1 whitespace-nowrap">Budget: {op.planned_budget_tzs?.toLocaleString()}</div>
                      </TableCell>
                      
                      <TableCell className="text-right">
                        <Badge className={`rounded-lg font-black text-[9px] uppercase border-0 py-1 ${statusColors[op.status?.toLowerCase() as keyof typeof statusColors] || "bg-slate-100 text-slate-600"}`}>
                          {op.status?.replace('_', ' ') || 'Unknown'}
                        </Badge>
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
                          <DropdownMenuContent align="end" className="w-64 rounded-2xl border-2 shadow-2xl p-2 bg-white">
                            <DropdownMenuItem asChild className="rounded-xl h-11 px-4 cursor-pointer">
                              <Link href={`/material-handling/operations/${op.id}`}>
                                <Eye className="h-4 w-4 mr-3 text-emerald-600" /> <span className="font-bold">Inspect Logic</span>
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild className="rounded-xl h-11 px-4 cursor-pointer">
                              <Link href={`/material-handling/new?opId=${op.id}`}>
                                <Edit className="h-4 w-4 mr-3 text-amber-600" /> <span className="font-bold">Log execution</span>
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="my-2" />
                            <div className="px-1">
                                <MaterialHandlingReportButton data={op} />
                            </div>
                            <DropdownMenuSeparator className="my-2" />
                            <DropdownMenuItem 
                              className="rounded-xl h-11 px-4 text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
                              onClick={() => {
                                setSelectedOp(op)
                                setDeleteDialogOpen(true)
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-3" /> <span className="font-bold">Wipe from Vault</span>
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
                        <Truck className="w-12 h-12 opacity-10" />
                        <p className="font-bold italic">No haulage events indexed.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between p-6 border-t bg-slate-50/50">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest whitespace-nowrap">
              Haulage Index {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredOps.length)} of {filteredOps.length}
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
            <AlertDialogTitle className="text-2xl font-black uppercase tracking-tight text-red-600">Enterprise Registry Purge</AlertDialogTitle>
            <AlertDialogDescription className="text-base font-medium py-4">
              Authorized Action: You are purging Material Handling Asset <span className="font-black text-slate-900">{selectedOp?.operation_number}</span>. This erasure destroys production receipts and all executive sign-offs. Irreversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-4">
            <AlertDialogCancel disabled={isDeleting} className="h-14 rounded-2xl font-bold uppercase tracking-widest border-2">Abort</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="h-14 rounded-2xl bg-destructive text-white font-black uppercase tracking-widest px-8">
              {isDeleting ? "Wiping Registry..." : "Confirm Purge"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <SimpleDetailModal 
        isOpen={infoModalOpen} 
        onClose={() => setInfoModalOpen(false)} 
        data={infoData} 
        title="Material Handling Detail View" 
      />
    </Card>
  )
}
