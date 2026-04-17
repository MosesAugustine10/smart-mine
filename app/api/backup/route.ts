import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { BACKUP_TABLES } from "@/lib/backup/exporter"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  // Auth check
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const tableParam = searchParams.get("table") || "all"
  const format = searchParams.get("format") || "json"

  const tablesToFetch = tableParam === "all"
    ? BACKUP_TABLES.map(t => t.key)
    : [tableParam as string]

  const backupData: Array<{ table: string; records: Record<string, unknown>[]; exportedAt: string }> = []
  let totalRecords = 0

  for (const tableName of tablesToFetch) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10000) // Safety limit

      if (!error && data) {
        backupData.push({
          table: tableName,
          records: data as Record<string, unknown>[],
          exportedAt: new Date().toISOString(),
        })
        totalRecords += data.length
      }
    } catch {
      // Table may not exist yet — skip gracefully
      backupData.push({ table: tableName, records: [], exportedAt: new Date().toISOString() })
    }
  }

  const fullBackup = {
    version: "1.0" as const,
    platform: "Smart Mine",
    exportedAt: new Date().toISOString(),
    tables: backupData,
    totalRecords,
  }

  // Log the backup event
  try {
    await supabase.from("backup_logs").insert({
      company_id: user.id,
      backup_type: "manual",
      tables_included: tablesToFetch,
      record_count: totalRecords,
    })
  } catch {
    // backup_logs may not exist yet — silently skip
  }

  return NextResponse.json(fullBackup, {
    headers: {
      "Content-Disposition": `attachment; filename="SmartMinePro_Backup_${new Date().toISOString().split("T")[0]}.json"`,
    },
  })
}
