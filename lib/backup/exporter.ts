/**
 * Smart Mine — Backup Export Utilities
 * Handles JSON and XLSX exports for all operational data.
 * Uses the `xlsx` package already installed in the project.
 */

import * as XLSX from "xlsx"

export interface BackupData {
  table: string
  records: Record<string, unknown>[]
  exportedAt: string
}

export interface FullBackup {
  version: "1.0"
  platform: "Smart Mine"
  exportedAt: string
  tables: BackupData[]
  totalRecords: number
}

/**
 * Trigger a JSON file download in the browser.
 */
export function exportAsJSON(data: FullBackup, filename: string): void {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: "application/json" })
  triggerDownload(blob, `${filename}.json`)
}

/**
 * Trigger an XLSX file download with one sheet per table.
 */
export function exportAsXLSX(data: FullBackup, filename: string): void {
  const workbook = XLSX.utils.book_new()

  // Summary sheet
  const summaryData = [
    ["Smart Mine — Backup Report"],
    ["Exported At", data.exportedAt],
    ["Total Records", data.totalRecords],
    ["Tables", data.tables.length],
    [],
    ["Table", "Record Count"],
    ...data.tables.map((t) => [t.table, t.records.length]),
  ]
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
  XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary")

  // One sheet per table
  for (const tableData of data.tables) {
    if (tableData.records.length === 0) continue

    const ws = XLSX.utils.json_to_sheet(tableData.records)
    // Sheet names max 31 chars
    const sheetName = tableData.table.substring(0, 31)
    XLSX.utils.book_append_sheet(workbook, ws, sheetName)
  }

  const xlsxBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" })
  const blob = new Blob([xlsxBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  })
  triggerDownload(blob, `${filename}.xlsx`)
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Format a filename with timestamp for backup files.
 */
export function buildBackupFilename(prefix = "SmartMinePro_Backup"): string {
  const now = new Date()
  const ts = now
    .toISOString()
    .replace(/[:.]/g, "-")
    .replace("T", "_")
    .substring(0, 19)
  return `${prefix}_${ts}`
}

/**
 * All operational tables available for backup.
 */
export const BACKUP_TABLES = [
  { key: "blasting_executions", label: "Blasting Logs", color: "orange" },
  { key: "drilling_executions", label: "Drilling Logs", color: "blue" },
  { key: "diamond_drilling_logs", label: "Diamond Drilling", color: "emerald" },
  { key: "safety_incidents", label: "Safety Incidents", color: "red" },
  { key: "material_handling_operations", label: "Material Handling", color: "purple" },
  { key: "geophysics_surveys", label: "Geophysics Surveys", color: "violet" },
  { key: "fuel_logs", label: "Fuel Logs", color: "yellow" },
  { key: "maintenance_logs", label: "Maintenance Logs", color: "amber" },
  { key: "equipment_payloads", label: "Quarry Payloads", color: "slate" },
  { key: "quarry_checklists", label: "Quarry Checklists", color: "teal" },
  { key: "fleet_vehicles", label: "Fleet Vehicles", color: "cyan" },
] as const

export type BackupTableKey = (typeof BACKUP_TABLES)[number]["key"]
