import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function POST(request: NextRequest) {
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

  // 1. Super Admin Check
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden: Super Admin only" }, { status: 403 })
  }

  // 2. Parse and Validate Backup Data
  try {
    const backup = await request.json()
    if (!backup.version || !backup.tables || !Array.isArray(backup.tables)) {
      throw new Error("Invalid backup format")
    }

    const results: Record<string, { success: number; failed: number; errors: string[] }> = {}

    // 3. Process Tables
    for (const tableData of backup.tables) {
      const { table, records } = tableData
      if (!records || records.length === 0) continue

      results[table] = { success: 0, failed: 0, errors: [] }

      // Upsert records to handle existing IDs
      const { error: upsertError } = await supabase
        .from(table)
        .upsert(records, { onConflict: "id" })

      if (upsertError) {
        results[table].failed = records.length
        results[table].errors.push(upsertError.message)
      } else {
        results[table].success = records.length
      }
    }

    // 4. Log the Restore Event
    await supabase.from("backup_logs").insert({
      company_id: user.id,
      backup_type: "restore",
      tables_included: Object.keys(results),
      record_count: Object.values(results).reduce((acc, curr) => acc + curr.success, 0),
    })

    return NextResponse.json({
      message: "Restore completed",
      details: results
    })

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}
