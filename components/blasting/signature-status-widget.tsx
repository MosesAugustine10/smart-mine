// components/blasting/signature-status-widget.tsx
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { UserCheck, ShieldCheck, FileCheck, Clock } from "lucide-react"

interface SignatureStatusWidgetProps {
  operations: any[]
}

export function SignatureStatusWidget({ operations }: SignatureStatusWidgetProps) {
  const total = operations.length

  const blasterSigned = operations.filter(op => op.blaster_signature).length
  const supervisorSigned = operations.filter(op => op.supervisor_signature).length
  const managerSigned = operations.filter(op => op.manager_signature).length

  const blasterPercent = total > 0 ? (blasterSigned / total) * 100 : 0
  const supervisorPercent = total > 0 ? (supervisorSigned / total) * 100 : 0
  const managerPercent = total > 0 ? (managerSigned / total) * 100 : 0

  const allThreeSigned = operations.filter(op => op.blaster_signature && op.supervisor_signature && op.manager_signature).length
  const fullyCompliantPercent = total > 0 ? (allThreeSigned / total) * 100 : 0

  if (total === 0) {
    return null
  }

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-r from-slate-900 to-slate-800 text-white">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium uppercase tracking-wider flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Digital Signature Compliance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-orange-400" />
                <span className="text-xs font-bold uppercase tracking-wider">Blaster</span>
              </div>
              <span className="text-lg font-black">{blasterSigned}/{total}</span>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-orange-500 rounded-full transition-all"
                style={{ width: `${blasterPercent}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-400">{blasterPercent.toFixed(0)}% completion</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-blue-400" />
                <span className="text-xs font-bold uppercase tracking-wider">Supervisor</span>
              </div>
              <span className="text-lg font-black">{supervisorSigned}/{total}</span>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all"
                style={{ width: `${supervisorPercent}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-400">{supervisorPercent.toFixed(0)}% completion</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-emerald-400" />
                <span className="text-xs font-bold uppercase tracking-wider">Manager</span>
              </div>
              <span className="text-lg font-black">{managerSigned}/{total}</span>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{ width: `${managerPercent}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-400">{managerPercent.toFixed(0)}% completion</p>
          </div>

          <div className="space-y-2 border-l border-slate-700 pl-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider">Fully Compliant</span>
              <span className="text-lg font-black text-emerald-400">{allThreeSigned}/{total}</span>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{ width: `${fullyCompliantPercent}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-400">All 3 signatures complete</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}