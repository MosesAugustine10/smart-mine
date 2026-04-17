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
  MapPin, Calendar, AlertTriangle, FileText, Info, Printer, ShieldAlert, Search, Trash2
} from "lucide-react"
import { SimpleDetailModal } from "@/components/ui/simple-detail-modal"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"

interface SafetyIncident {
  id: string
  incident_number: string
  title: string
  incident_type: string
  severity: string
  status: string
  incident_date: string
  location: string | null
  reporter_signature?: any
  supervisor_signature?: any
  manager_signature?: any
  reported_by_name?: string
  description?: string
}

interface SafetyTableProps {
  incidents: SafetyIncident[]
}

const severityColors = {
  LOW: "bg-blue-100 text-blue-800",
  MEDIUM: "bg-yellow-100 text-yellow-800",
  HIGH: "bg-orange-100 text-orange-800",
  CRITICAL: "bg-red-100 text-red-800"
}

export function SafetyTable({ incidents }: SafetyTableProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [severityFilter, setSeverityFilter] = useState<string>("all")
  const [infoModalOpen, setInfoModalOpen] = useState(false)
  const [infoData, setInfoData] = useState<any>(null)

  const filteredIncidents = incidents.filter(incident => {
    const matchesSearch = 
      incident.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      incident.incident_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      incident.location?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesSeverity = severityFilter === "all" || incident.severity === severityFilter
    
    return matchesSearch && matchesSeverity
  })

  const generatePDF = (incident: SafetyIncident) => {
    toast({ title: "Generating Detailed Report", description: "Standardized PDF Process is being finalized." })
    
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Safety Incident Process - ${incident.incident_number}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
            body { font-family: 'Inter', sans-serif; margin: 0; padding: 40px; color: #0f172a; }
            .header { display: flex; justify-between; border-bottom: 8px solid #ef4444; padding-bottom: 20px; margin-bottom: 40px; }
            .proto-info { text-align: right; }
            .title { font-size: 32px; font-weight: 900; text-transform: uppercase; letter-spacing: -1px; }
            .incident-num { font-family: monospace; font-size: 18px; color: #ef4444; }
            .section { margin-bottom: 30px; }
            .section-title { font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; color: #64748b; margin-bottom: 15px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
            .box { background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; }
            .label { font-size: 9px; font-weight: 900; text-transform: uppercase; color: #94a3b8; margin-bottom: 5px; }
            .value { font-size: 14px; font-weight: 700; }
            .severity { padding: 4px 12px; border-radius: 100px; color: white; background: #ef4444; display: inline-block; font-size: 10px; font-weight: 900; }
            .signatures { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-top: 60px; }
            .sig-box { border-top: 2px solid #e2e8f0; padding-top: 15px; text-align: center; }
            .sig-img { height: 60px; object-fit: contain; margin-bottom: 10px; mix-blend-mode: multiply; }
            .footer { margin-top: 80px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
                <div class="title">Safety Incident Report</div>
                <div class="incident-num">${incident.incident_number}</div>
            </div>
            <div class="proto-info">
                <div class="label">Archive Date</div>
                <div class="value">${format(new Date(), 'dd MMMM yyyy HH:mm')}</div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">1. Occurrence Dynamics</div>
            <div class="grid">
                <div class="box">
                    <div class="label">Incident Designation</div>
                    <div class="value">${incident.title}</div>
                </div>
                <div class="box">
                    <div class="label">Severity Index</div>
                    <div class="severity">${incident.severity}</div>
                </div>
                <div class="box">
                    <div class="label">Incident Type</div>
                    <div class="value">${incident.incident_type}</div>
                </div>
                <div class="box">
                    <div class="label">Geographic Block / Sector</div>
                    <div class="value">${incident.location}</div>
                </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">2. Event Narrative</div>
            <div class="box" style="min-height: 200px;">
                <div class="value">${incident.description || 'N/A'}</div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">3. Authorization Chain</div>
            <div class="signatures">
                <div class="sig-box">
                    ${incident.reporter_signature ? `<img src="${incident.reporter_signature}" class="sig-img" />` : '<div style="height:60px"></div>'}
                    <div class="label">Reporter Signature</div>
                    <div class="value">${incident.reported_by_name || 'N/A'}</div>
                </div>
                <div class="sig-box">
                    ${incident.supervisor_signature ? `<img src="${incident.supervisor_signature}" class="sig-img" />` : '<div style="height:60px"></div>'}
                    <div class="label">Safety Supervisor Sign-off</div>
                </div>
                <div class="sig-box">
                    ${incident.manager_signature ? `<img src="${incident.manager_signature}" class="sig-img" />` : '<div style="height:60px"></div>'}
                    <div class="label">Country Manager Auth</div>
                </div>
            </div>
          </div>

          <div class="footer">
            Generated by SMART MINE Main Compliance Module. Confidential Official Document.
          </div>
        </body>
      </html>
    `
    printWindow.document.write(html)
    printWindow.document.close()
    setTimeout(() => {
        printWindow.print()
    }, 500)
  }

  return (
    <Card className="border shadow-2xl rounded-[2.5rem] overflow-hidden border-slate-200/60 transition-all hover:shadow-3xl">
      <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
              <CardTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-3 text-red-700">
                <ShieldAlert className="h-6 w-6" />
                Safety Compliance List
              </CardTitle>
              <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1 tracking-widest">Incident Governance {"&"} Risk Mitigation Ledger</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filter incidents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-11 w-full md:w-[250px] bg-white dark:bg-slate-900 border-2 rounded-xl text-xs font-bold"
              />
            </div>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="h-11 w-[150px] bg-white dark:bg-slate-900 border-2 rounded-xl text-xs font-bold font-black"><SelectValue /></SelectTrigger>
              <SelectContent className="rounded-xl border-2">
                <SelectItem value="all">Global Severity</SelectItem>
                <SelectItem value="LOW">Low Risk</SelectItem>
                <SelectItem value="MEDIUM">Medium Risk</SelectItem>
                <SelectItem value="HIGH">High Alert</SelectItem>
                <SelectItem value="CRITICAL">Critical Crisis</SelectItem>
              </SelectContent>
            </Select>

          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-100/30 dark:bg-slate-900/50">
              <TableRow className="hover:bg-transparent border-b-2">
                <TableHead className="font-black uppercase text-[9px] tracking-[0.2em] pl-8 py-5">Case ID</TableHead>
                <TableHead className="font-black uppercase text-[9px] tracking-[0.2em]">Timeline {"&"} Block</TableHead>
                <TableHead className="font-black uppercase text-[9px] tracking-[0.2em]">Incident Designation</TableHead>
                <TableHead className="font-black uppercase text-[9px] tracking-[0.2em] text-right px-4">Info</TableHead>
                <TableHead className="font-black uppercase text-[9px] tracking-[0.2em] text-right pr-8">Vault Controls</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredIncidents.map((incident) => (
                <TableRow key={incident.id} className="hover:bg-red-50/20 transition-all border-b last:border-0 border-slate-100/60 group">
                  <TableCell className="pl-8 py-6">
                    <div className="font-black text-slate-500 font-mono text-[10px]">{incident.incident_number}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-black text-sm text-slate-900 dark:text-white tracking-tight">{format(new Date(incident.incident_date), "dd MMM yyyy")}</div>
                    <div className="text-[9px] font-black text-muted-foreground uppercase flex items-center gap-1 mt-0.5">
                       <MapPin className="w-3 h-3 text-red-500" /> {incident.location || 'Site Global'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-black text-xs uppercase text-slate-900 dark:text-white line-clamp-1">{incident.title}</div>
                    <div className="text-[9px] text-muted-foreground font-black uppercase mt-1">
                        Process: <span className="text-slate-900 dark:text-white">{incident.incident_type}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={`font-black text-[9px] uppercase tracking-widest px-3 py-1 border-0 ${severityColors[incident.severity as keyof typeof severityColors] || severityColors['LOW']}`}>
                      {incident.severity}
                    </Badge>
                  </TableCell>
                  
                  <TableCell className="text-right px-4">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => { setInfoData(incident); setInfoModalOpen(true); }}
                      className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 hover:bg-blue-500 hover:text-white transition-all shadow-sm"
                    >
                      <Info className="h-4 w-4" />
                    </Button>
                  </TableCell>
                  
                  
                  <TableCell className="text-right pr-8">
                    <div className="flex justify-end gap-1.5">
                      <Button onClick={() => generatePDF(incident)} variant="ghost" size="icon" className="h-10 w-10 hover:bg-slate-100 rounded-xl transition-all" title="Print Report">
                          <Printer className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-10 w-10 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all opacity-0 group-hover:opacity-100">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}

              {filteredIncidents.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-20 text-muted-foreground italic font-medium uppercase tracking-[0.2em] text-xs">
                    No safety records indexed in current filter.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <SimpleDetailModal 
        isOpen={infoModalOpen} 
        onClose={() => setInfoModalOpen(false)} 
        data={infoData} 
        title="Safety Incident Protocol Details" 
      />
    </Card>
  )
}
