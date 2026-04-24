import { createServerClient } from "@supabase/ssr"
import { NextResponse } from "next/server"
import { BACKUP_TABLES } from "@/lib/backup/exporter"

export const dynamic = "force-dynamic"

// This route is called by Vercel Cron at midnight daily
// vercel.json: { "crons": [{ "path": "/api/cron/backup", "schedule": "0 0 * * *" }] }
export async function GET(request: Request) {
  // Verify cron secret to prevent unauthorized calls
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )

  const tables = BACKUP_TABLES.map(t => t.key)
  const backupData: any[] = []
  let totalRecords = 0

  for (const tableName of tables) {
    try {
      const { data } = await supabase.from(tableName).select("*").limit(10000)
      if (data) {
        backupData.push({ table: tableName, records: data, exportedAt: new Date().toISOString() })
        totalRecords += data.length
      }
    } catch { /* skip missing tables */ }
  }

  const fullBackup = {
    version: "1.0",
    platform: "Smart Mine Pro – Amogtech",
    exportedAt: new Date().toISOString(),
    tables: backupData,
    totalRecords,
  }

  // Store in Supabase Storage bucket "backups"
  const filename = `backup_${new Date().toISOString().split("T")[0]}.json`
  const { error: uploadError } = await supabase.storage
    .from("backups")
    .upload(filename, JSON.stringify(fullBackup), {
      contentType: "application/json",
      upsert: true,
    })

  // Log to backup_logs table
  await supabase.from("backup_logs").insert({
    backup_type: "automated",
    tables_included: tables,
    record_count: totalRecords,
    storage_url: uploadError ? null : `backups/${filename}`,
  })

  return NextResponse.json({
    success: true,
    totalRecords,
    filename,
    storedSuccessfully: !uploadError,
  })
}
