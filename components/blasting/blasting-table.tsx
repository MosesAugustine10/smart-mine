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
  Bomb, MoreHorizontal, UserCheck, ShieldCheck, CheckCircle2, MapPin, Activity, Info
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

interface BlastingOperation {
  id: string
  blast_number: string
  date: string
  time: string
  region: string
  location: string
  blast_type: string
  number_of_holes: number
  hole_depth_meters: number
  hole_diameter_mm: number
  explosive_quantity_kg: number
  powder_factor: number
  total_volume_m3: number
  tonnage_t?: number
  total_cost?: number
  cost_per_tonne?: number
  status: string
  blaster?: {
    full_name: string
  }
  operator_signature?: string
  supervisor_signature?: string
  manager_signature?: string
}

interface BlastingTableProps {
  blastingOps: BlastingOperation[]
}

const statusColors = {
  planned: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
  executed: "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400",
  completed: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400",
  cancelled: "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400"
}

export function BlastingTable({ blastingOps }: BlastingTableProps) {
  const router = useRouter()
  const { toast } = useToast()
  
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedOp, setSelectedOp] = useState<BlastingOperation | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [infoModalOpen, setInfoModalOpen] = useState(false)
  const [infoData, setInfoData] = useState<any>(null)

  const filteredOps = blastingOps.filter(op => {
    const matchesSearch = 
      op.blast_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      op.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      op.region?.toLowerCase().includes(searchTerm.toLowerCase())
    
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
        .from("blasting_operations")
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
            <Bomb className="h-4 w-4 text-amber-500" />
            Blasting Registry
          </CardTitle>
          <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Operation logistics and detonation metrics</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              placeholder="Search ID/Location…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-8 pl-8 pr-3 text-xs w-[180px] border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 text-xs w-[130px] border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="planned">Planned</SelectItem>
              <SelectItem value="executed">Executed</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <ExportCSVButton data={filteredOps} filename="Blasting_Report" className="h-8 px-3 text-xs bg-white border-slate-200 hover:bg-slate-50" />
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/50 dark:bg-slate-950">
              <TableRow className="hover:bg-transparent border-b">
                <TableHead className="py-3 px-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Blast ID</TableHead>
                <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Date</TableHead>
                <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Region</TableHead>
                <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Location / Type</TableHead>
                <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Tonnage (t)</TableHead>
                <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Explosives (kg)</TableHead>
                <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Cost/Tonne</TableHead>
                <TableHead className="text-center text-[10px] font-black uppercase text-slate-400 tracking-widest">Status</TableHead>
                <TableHead className="text-center text-[10px] font-black uppercase text-slate-400 tracking-widest">Info</TableHead>
                <TableHead className="text-right pr-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="text-xs">
              {paginatedOps.map((op) => (
                <TableRow key={op.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                  <TableCell className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">{op.blast_number}</TableCell>
                  <TableCell className="py-3 font-bold text-slate-600">
                    {op.date ? format(new Date(op.date), "dd MMM yyyy") : "-"}
                  </TableCell>
                  <TableCell className="py-3 font-black text-xs uppercase text-blue-600">
                    {op.region || "-"}
                  </TableCell>
                  <TableCell className="py-3 text-[11px] font-medium text-slate-500">
                    <div className="flex items-center gap-1 font-bold text-slate-700">
                      <MapPin className="h-3 w-3 opacity-30" />
                      {op.location || "-"}
                    </div>
                    <div className="text-[9px] uppercase tracking-tighter opacity-60">{op.blast_type}</div>
                  </TableCell>
                  <TableCell className="text-right py-3 font-black text-slate-900 text-sm">
                    {op.tonnage_t?.toLocaleString() || "0"}
                  </TableCell>
                  <TableCell className="text-right py-3">
                    <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-100 font-black px-2 py-0">
                       {op.explosive_quantity_kg?.toLocaleString()} KG
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right py-3 font-black text-emerald-600">
                    {op.cost_per_tonne ? `TZS ${op.cost_per_tonne.toLocaleString()}` : "-"}
                  </TableCell>
                  <TableCell className="text-center py-3">
                    <Badge variant="outline" className={`text-[9px] font-black uppercase tracking-widest px-2 py-0 h-5 border-2 ${statusColors[op.status as keyof typeof statusColors] || statusColors['executed']}`}>
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
                          <Link href={`/blasting/operations/${op.id}`}>
                            <Eye className="h-3.5 w-3.5 mr-2 text-slate-400" /> View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild className="cursor-pointer">
                          <Link href={`/blasting/new?opId=${op.id}`}>
                            <Edit className="h-3.5 w-3.5 mr-2 text-slate-400" /> Edit Log
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
              ))}
              {paginatedOps.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12 text-slate-400">
                    No blasting operations indexed.
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

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="max-w-[400px] p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold">Standard Registry Purge</AlertDialogTitle>
            <AlertDialogDescription className="text-xs py-2">
              You are removing blast record <span className="font-bold text-slate-900">{selectedOp?.blast_number}</span>. This will permanently erase fragmentation history.
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
        title="Blasting Operation Details" 
      />
    </Card>
  )
}
