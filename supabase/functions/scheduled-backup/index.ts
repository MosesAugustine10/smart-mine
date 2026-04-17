// @ts-nocheck
/**
 * Smart Mine — Supabase Edge Function: Scheduled Backup
 * 
 * This function runs on a cron schedule (server-side) and exports
 * all operational data to a Supabase Storage bucket.
 * 
 * Deployment:
 *   supabase functions deploy scheduled-backup
 * 
 * Cron Setup (in Supabase Dashboard → Edge Functions → Schedules):
 *   Schedule: 0 2 * * *   (runs daily at 02:00 UTC)
 *   Or use pg_cron via SQL:
 *     SELECT cron.schedule('daily-backup', '0 2 * * *', $$
 *       SELECT net.http_post(
 *         url := 'https://<project-ref>.supabase.co/functions/v1/scheduled-backup',
 *         headers := '{"Authorization": "Bearer <service-role-key>"}'::jsonb
 *       )
 *     $$);
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const OPERATIONAL_TABLES = [
  "blasting_executions",
  "drilling_executions",
  "diamond_drilling_logs",
  "safety_incidents",
  "material_handling_operations",
  "geophysics_surveys",
  "fuel_logs",
  "maintenance_logs",
  "equipment_payloads",
  "quarry_checklists",
  "fleet_vehicles",
]

const STORAGE_BUCKET = "backups"

serve(async (req: Request) => {
  try {
    // Only allow POST requests (from cron scheduler)
    if (req.method !== "POST") {
      return new Response("Method not allowed", { status: 405 })
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    )

    const backupData: Record<string, unknown[]> = {}
    let totalRecords = 0
    const failedTables: string[] = []

    // Fetch all operational data
    for (const table of OPERATIONAL_TABLES) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select("*")
          .order("created_at", { ascending: false })
          .limit(50000)

        if (error) {
          failedTables.push(table)
        } else if (data) {
          backupData[table] = data
          totalRecords += data.length
        }
      } catch {
        failedTables.push(table)
      }
    }

    const exportedAt = new Date().toISOString()
    const backup = {
      version: "1.0",
      platform: "Smart Mine",
      backupType: "edge_function_cron",
      exportedAt,
      tables: Object.entries(backupData).map(([table, records]) => ({
        table,
        records,
        exportedAt,
      })),
      totalRecords,
      failedTables,
    }

    const filename = `SmartMinePro_AutoBackup_${exportedAt.replace(/[:.]/g, "-").substring(0, 19)}.json`
    const jsonContent = new TextEncoder().encode(JSON.stringify(backup, null, 2))

    // Upload to Supabase Storage
    // Note: Create the 'backups' bucket in your Supabase project first
    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(`cron/${filename}`, jsonContent, {
        contentType: "application/json",
        upsert: false,
      })

    if (uploadError && uploadError.message !== "The resource already exists") {
      throw uploadError
    }

    // Log the backup event
    await supabase.from("backup_logs").insert({
      backup_type: "edge_function",
      tables_included: Object.keys(backupData),
      record_count: totalRecords,
      format: "json",
      triggered_by: "cron",
      status: failedTables.length > 0 ? "partial" : "completed",
      error_message: failedTables.length > 0 ? `Failed tables: ${failedTables.join(", ")}` : null,
    })

    return new Response(
      JSON.stringify({
        success: true,
        filename,
        totalRecords,
        tablesExported: Object.keys(backupData).length,
        failedTables,
        exportedAt,
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }
    )
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { headers: { "Content-Type": "application/json" }, status: 500 }
    )
  }
})
