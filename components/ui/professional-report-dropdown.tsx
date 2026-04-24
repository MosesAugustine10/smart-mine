"use client"

import { ProfessionalReportButton } from "./professional-report-button"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { FileBarChart, ClipboardCheck, UserCircle, Download, LayoutDashboard } from "lucide-react"

interface ReportConfig {
  data: any[]
  filename: string
  moduleColor: "blue" | "orange" | "emerald" | "indigo" | "slate" | "purple" | "red" | "amber"
  activePeriod?: "all" | "daily" | "weekly" | "monthly" | "yearly"
  kpis?: any[]
  charts?: any[]
}

interface ProfessionalReportDropdownProps {
  configs: {
    budget: ReportConfig
    execution: ReportConfig
    client: ReportConfig
  }
}

export function ProfessionalReportDropdown({ configs }: ProfessionalReportDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="h-14 px-8 rounded-2xl bg-slate-900 border-2 border-slate-800 text-white font-black uppercase text-[10px] tracking-[0.2em] shadow-2xl transition-all hover:scale-[1.02] hover:bg-black group">
          <Download className="w-4 h-4 mr-2 text-blue-400 group-hover:scale-110 transition-transform" />
          Intelligence Reports
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 p-3 rounded-[2rem] border-2 shadow-2xl bg-white dark:bg-slate-900" align="end">
        <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 p-3">
          Select Reporting Protocol
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator className="mx-2" />
        
        {/* 1. BUDGET REPORT */}
        <div className="p-1">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
              <FileBarChart className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white">Budget vs Actuals</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase">Cost variance analysis</p>
            </div>
          </div>
          <div className="px-3 pb-2">
            <ProfessionalReportButton 
              {...configs.budget}
              title="Budget Variance & Fiscal Report"
              buttonLabel="Generate Budget Report"
            />
          </div>
        </div>

        <DropdownMenuSeparator className="mx-2" />

        {/* 2. EXECUTION REPORT */}
        <div className="p-1">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600">
              <ClipboardCheck className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white">Execution Metrics</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase">Shift timelines & operational KPIs</p>
            </div>
          </div>
          <div className="px-3 pb-2">
            <ProfessionalReportButton 
              {...configs.execution}
              title="Operational Execution Registry"
              buttonLabel="Generate Execution Report"
            />
          </div>
        </div>

        <DropdownMenuSeparator className="mx-2" />

        {/* 3. CLIENT REPORT */}
        <div className="p-1">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <UserCircle className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white">Client Presentation</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase">Branded external-facing document</p>
            </div>
          </div>
          <div className="px-3 pb-2">
            <ProfessionalReportButton 
              {...configs.client}
              title="Client Operational Summary"
              buttonLabel="Generate Client Report"
            />
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
