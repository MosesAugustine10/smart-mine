"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Zap, Fuel, Activity, TrendingDown, Vibrate, ShieldAlert, CheckCircle2 } from "lucide-react"

export interface AlertRule {
  id: string
  field: string
  threshold: number
  direction: "above" | "below"
  severity: "critical" | "warning" | "info"
  label: string
  unit: string
  icon: "vibration" | "fuel" | "penetration" | "cost" | "deviation" | "safety"
}

export interface MiningAlert {
  id: string
  severity: "critical" | "warning" | "info"
  message: string
  value: string
  module: string
  ref_id: string
  timestamp: string
}

const ICON_MAP = {
  vibration: Vibrate,
  fuel: Fuel,
  penetration: TrendingDown,
  cost: Zap,
  deviation: Activity,
  safety: ShieldAlert,
}

const SEVERITY_STYLES = {
  critical: {
    border: "border-red-500/40",
    bg: "bg-red-500/10",
    icon: "text-red-400",
    badge: "bg-red-500/20 text-red-400 border-red-500/30",
    dot: "bg-red-500",
  },
  warning: {
    border: "border-amber-500/40",
    bg: "bg-amber-500/10",
    icon: "text-amber-400",
    badge: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    dot: "bg-amber-500",
  },
  info: {
    border: "border-blue-500/40",
    bg: "bg-blue-500/10",
    icon: "text-blue-400",
    badge: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    dot: "bg-blue-500",
  },
}

// Standardized rules for anomaly detection
const DEFAULT_RULES: AlertRule[] = [
  { id: "vib-001", field: "vibration_mm_s", threshold: 5.0, direction: "above", severity: "critical", label: "Blast Vibration Exceeded", unit: "mm/s", icon: "vibration" },
  { id: "air-001", field: "airblast_db", threshold: 120, direction: "above", severity: "critical", label: "Airblast Overpressure", unit: "dB", icon: "safety" },
  { id: "pf-001", field: "actual_powder_factor", threshold: 0.8, direction: "above", severity: "warning", label: "High Powder Factor", unit: "kg/t", icon: "cost" },
  { id: "pf-002", field: "actual_powder_factor", threshold: 0.2, direction: "below", severity: "warning", label: "Low Powder Factor (Under-charging)", unit: "kg/t", icon: "cost" },
  { id: "rop-001", field: "penetration_rate_m_per_min", threshold: 0.3, direction: "below", severity: "warning", label: "Low Penetration Rate", unit: "m/min", icon: "penetration" },
  { id: "fuel-001", field: "fuel_consumption_l", threshold: 500, direction: "above", severity: "warning", label: "High Fuel Consumption", unit: "L/shift", icon: "fuel" },
  { id: "dev-001", field: "deviation_m", threshold: 0.5, direction: "above", severity: "critical", label: "Drill Hole Deviation Alert", unit: "m", icon: "deviation" },
  { id: "rec-001", field: "recovery_percentage", threshold: 75, direction: "below", severity: "warning", label: "Low Core Recovery", unit: "%", icon: "penetration" },
]

function detectAlerts(
  blastingOps: any[],
  drillingOps: any[],
  diamondOps: any[],
  rules: AlertRule[]
): MiningAlert[] {
  const alerts: MiningAlert[] = []
  const allOps: Array<{ data: any; module: string; rules: AlertRule[] }> = [
    ...blastingOps.map(d => ({ data: d, module: "Blasting", rules: rules.filter(r => ["vib-001", "air-001", "pf-001", "pf-002"].includes(r.id)) })),
    ...drillingOps.map(d => ({ data: d, module: "Drilling", rules: rules.filter(r => ["rop-001", "fuel-001", "dev-001"].includes(r.id)) })),
    ...diamondOps.map(d => ({ data: d, module: "Diamond Drill", rules: rules.filter(r => ["rec-001", "dev-001"].includes(r.id)) })),
  ]

  for (const { data, module, rules: applicable } of allOps) {
    for (const rule of applicable) {
      const val = data[rule.field]
      if (val == null) continue
      const triggered = rule.direction === "above" ? val > rule.threshold : val < rule.threshold
      if (triggered) {
        alerts.push({
          id: `${rule.id}-${data.id}`,
          severity: rule.severity,
          message: rule.label,
          value: `${Number(val).toFixed(2)} ${rule.unit} (limit: ${rule.threshold} ${rule.unit})`,
          module,
          ref_id: data.blast_number || data.drill_number || data.campaign_id || data.id,
          timestamp: data.execution_date || data.date || data.created_at || "",
        })
      }
    }
  }

  // Sort: critical first
  return alerts.sort((a, b) => {
    const p = { critical: 0, warning: 1, info: 2 }
    return p[a.severity] - p[b.severity]
  })
}

interface SmartAlertsProps {
  blastingOps?: any[]
  drillingOps?: any[]
  diamondOps?: any[]
  compact?: boolean
}

export function SmartAlerts({ blastingOps = [], drillingOps = [], diamondOps = [], compact = false }: SmartAlertsProps) {
  const alerts = useMemo(
    () => detectAlerts(blastingOps, drillingOps, diamondOps, DEFAULT_RULES),
    [blastingOps, drillingOps, diamondOps]
  )

  const criticals = alerts.filter(a => a.severity === "critical").length
  const warnings = alerts.filter(a => a.severity === "warning").length

  if (alerts.length === 0) {
    return (
      <Card className="border-0 bg-slate-900 text-white rounded-[2rem]">
        <CardContent className="p-6 flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
          </div>
          <div className="text-center">
            <p className="text-sm font-black uppercase tracking-widest text-emerald-400">All Systems Nominal</p>
            <p className="text-[10px] text-slate-500 mt-1">No anomalies detected across active operations</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 bg-slate-900 text-white rounded-[2rem] overflow-hidden">
      <CardHeader className="bg-white/5 border-b border-white/10 p-5">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            Smart Alert System
          </CardTitle>
          <div className="flex items-center gap-2">
            {criticals > 0 && (
              <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 uppercase">
                {criticals} Critical
              </span>
            )}
            {warnings > 0 && (
              <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase">
                {warnings} Warning
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className={`p-4 space-y-2 ${compact ? "max-h-72 overflow-auto" : "max-h-[480px] overflow-auto"} custom-scrollbar`}>
        {alerts.map((alert) => {
          const styles = SEVERITY_STYLES[alert.severity]
          const Icon = ICON_MAP.vibration // default
          return (
            <div
              key={alert.id}
              className={`flex items-start gap-3 p-3 rounded-xl border ${styles.border} ${styles.bg}`}
            >
              <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 animate-pulse ${styles.dot}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-bold text-white truncate">{alert.message}</p>
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full border uppercase shrink-0 ${styles.badge}`}>
                    {alert.severity}
                  </span>
                </div>
                <p className={`text-[10px] font-bold mt-0.5 ${styles.icon}`}>{alert.value}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[9px] text-slate-500 font-bold uppercase">{alert.module}</span>
                  {alert.ref_id && (
                    <span className="text-[9px] text-slate-600 font-mono">#{alert.ref_id}</span>
                  )}
                  {alert.timestamp && (
                    <span className="text-[9px] text-slate-600">{alert.timestamp}</span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

export { detectAlerts, DEFAULT_RULES }
