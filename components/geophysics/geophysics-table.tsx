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
  Radio, MoreHorizontal, Clock, DollarSign, ShieldCheck, UserCheck, CheckCircle2, Activity, MapPin, Calendar, Layers, Info, Search, Eye, Edit, Trash2, ChevronLeft, ChevronRight
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

interface Survey {
  id: string
  survey_id: string
  project_name: string
  survey_type: string
  status: string
  location_name: string | null
  date_start: string
  planned_budget_tzs: number
  actual_cost_tzs: number
  surveyor_signature?: any
  geophysicist_signature?: any
  manager_signature?: any
  region: string
}

interface GeophysicsTableProps {
  surveys: Survey[]
}

const statusColors = {
  planned: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  in_progress: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
}

export function GeophysicsTable({ surveys }: GeophysicsTableProps) {
  const router = useRouter()
  const { toast } = useToast()
  
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [infoModalOpen, setInfoModalOpen] = useState(false)
  const [infoData, setInfoData] = useState<any>(null)

  const filteredSurveys = surveys.filter(survey => {
    const matchesSearch = 
      survey.project_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      survey.survey_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      survey.location_name?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || survey.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const sortedSurveys = [...filteredSurveys].sort((a, b) => new Date(b.date_start).getTime() - new Date(a.date_start).getTime())
  const totalPages = Math.ceil(sortedSurveys.length / itemsPerPage)
  
  const paginatedSurveys = sortedSurveys.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handleDelete = async () => {
    if (!selectedSurvey) return
    setIsDeleting(true)
    const supabase = getSupabaseBrowserClient()
    
    try {
      const { error } = await supabase
        .from("geophysics_surveys")
        .delete()
        .eq("id", selectedSurvey.id)
      
      if (error) throw error
      toast({ title: "Deleted", description: "Survey record purged from registry." })
      router.refresh()
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
      setSelectedSurvey(null)
    }
  }

  return (
    <Card className="border shadow-2xl rounded-3xl overflow-hidden border-slate-200/60 h-full">
      <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
              <CardTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2 text-purple-700">
                <Radio className="h-6 w-6" />
                Geophysical Acquisition Ledger
              </CardTitle>
              <p className="text-xs text-muted-foreground font-medium mt-1">Strategic Asset Exploration {"&"} Signal Integrity Tracing</p>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filter campaigns..."
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
                <SelectItem value="in_progress">Field Acquisition</SelectItem>
                <SelectItem value="completed">Analyzed & Closed</SelectItem>
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
                <TableHead className="font-black uppercase text-[10px] tracking-widest text-right px-6">Methodology</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest">Site / Location</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest">Launch Date</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest text-right">Actual Cost</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest text-right">Status</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest text-center">Info</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest text-right pr-6">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedSurveys.map((survey) => {
                const isOver = survey.actual_cost_tzs > survey.planned_budget_tzs && survey.planned_budget_tzs > 0

                return (
                    <TableRow key={survey.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/50 transition-colors group">
                      <TableCell className="pl-6 py-4">
                        <div className="font-black text-purple-700 dark:text-purple-400 font-mono text-base">{survey.survey_id}</div>
                        <div className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                           <Layers className="w-3 h-3" /> Data Stream Active
                        </div>
                      </TableCell>
                      <TableCell className="text-right px-6">
                         <Badge variant="outline" className="rounded-lg font-black text-[9px] uppercase border-2 border-purple-100 bg-purple-50 text-purple-700 whitespace-nowrap">
                            {survey.survey_type}
                         </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-black text-xs uppercase text-slate-900 dark:text-slate-100 line-clamp-1">{survey.project_name}</div>
                        <div className="text-[10px] text-muted-foreground uppercase flex items-center gap-1 font-bold">
                            <MapPin className="w-3 h-3" /> {survey.location_name || 'Global'}
                        </div>
                      </TableCell>
                      <TableCell className="font-bold text-xs whitespace-nowrap">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-3 h-3 opacity-30" />
                            {survey.date_start ? format(new Date(survey.date_start), "dd MMM yyyy") : 'No Date'}
                        </div>
                      </TableCell>
                      
                      <TableCell className="text-right">
                        <div className={`font-black tracking-tight whitespace-nowrap ${isOver ? "text-red-500" : "text-emerald-600"}`}>
                            {survey.actual_cost_tzs?.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-muted-foreground font-bold uppercase mt-1 whitespace-nowrap">Budget: {survey.planned_budget_tzs?.toLocaleString()}</div>
                      </TableCell>
                      
                      
                      <TableCell className="text-right">
                        <Badge className={`rounded-xl font-black text-[9px] uppercase tracking-widest px-3 py-1 whitespace-nowrap ${statusColors[survey.status as keyof typeof statusColors] || statusColors['in_progress']}`}>
                          {survey.status?.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      
                      <TableCell className="text-center py-4">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => { setInfoData(survey); setInfoModalOpen(true); }}
                          className="h-9 w-9 rounded-2xl bg-purple-500/10 text-purple-600 hover:bg-purple-500 hover:text-white transition-all shadow-sm"
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
                              <Link href={`/geophysics/surveys/${survey.id}`}>
                                <Eye className="h-4 w-4 mr-3 text-purple-600" /> <span className="font-bold">Inspect Data</span>
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild className="rounded-xl h-11 px-4 cursor-pointer">
                              <Link href={`/geophysics/new?opId=${survey.id}`}>
                                <Edit className="h-4 w-4 mr-3 text-amber-600" /> <span className="font-bold">Log execution</span>
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="my-2" />
                            <DropdownMenuItem 
                              className="rounded-xl h-11 px-4 text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
                              onClick={() => {
                                setSelectedSurvey(survey)
                                setDeleteDialogOpen(true)
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-3" /> <span className="font-bold">Purge Registry</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                )
              })}

              {paginatedSurveys.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-20 text-muted-foreground bg-white dark:bg-slate-950">
                    <div className="flex flex-col items-center gap-2">
                        <Radio className="w-12 h-12 opacity-10" />
                        <p className="font-bold italic">No instrumentation sequences indexed.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between p-6 border-t bg-slate-50/50">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest whitespace-nowrap">
              Campaign Index {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredSurveys.length)} of {filteredSurveys.length}
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
              Authorized Action: You are purging Geophysical Sequence <span className="font-black text-slate-900">{selectedSurvey?.survey_id}</span>. This erasure destroys instrumentation receipts and all executive sign-offs. Irreversible.
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
        title="Geophysics Survey Detail View" 
      />
    </Card>
  )
}
