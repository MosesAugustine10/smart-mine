import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { randomBytes } from "crypto"

export const dynamic = "force-dynamic"

// ── GET: list pending password reset requests ──────────────────
export async function GET() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: caller } = await supabase.from("user_profiles").select("role, roles, company_id").eq("id", user.id).single()
  const callerRoles: string[] = caller?.roles || [caller?.role].filter(Boolean)
  
  // Only Admin or Super Admin
  if (!callerRoles.includes("SUPER_ADMIN") && !callerRoles.includes("admin") && !callerRoles.includes("company_admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  let query = supabase.from("password_reset_requests").select("*").eq("status", "pending")
  
  // Filter by company if not Super Admin
  if (!callerRoles.includes("SUPER_ADMIN") && caller?.company_id) {
    query = query.eq("company_id", caller.company_id)
  }

  const { data: requests, error } = await query.order("requested_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ requests })
}

// ── POST: reset password manually ──────────────────────────────
export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: caller } = await supabase.from("user_profiles").select("role, roles, company_id").eq("id", user.id).single()
  const callerRoles: string[] = caller?.roles || [caller?.role].filter(Boolean)
  
  if (!callerRoles.includes("SUPER_ADMIN") && !callerRoles.includes("admin") && !callerRoles.includes("company_admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { userId } = await request.json()
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 })

  // 1. Get target user
  const { data: targetProfile } = await supabase.from("user_profiles").select("email, company_id").eq("id", userId).single()
  if (!targetProfile) return NextResponse.json({ error: "User not found" }, { status: 404 })

  // 2. Validate company isolation (except for Super Admin)
  if (!callerRoles.includes("SUPER_ADMIN") && caller?.company_id !== targetProfile.company_id) {
    return NextResponse.json({ error: "Forbidden: Cross-company access" }, { status: 403 })
  }

  // 3. Generate secure temp password
  const raw = randomBytes(16).toString("base64url")
  const tempPassword = raw.slice(0, 6).toUpperCase() + "@" + raw.slice(6, 12) + "1"
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()

  // 4. Update Auth password
  const { error: authUpdateError } = await supabase.auth.admin.updateUserById(userId, {
    password: tempPassword
  })
  if (authUpdateError) return NextResponse.json({ error: authUpdateError.message }, { status: 500 })

  // 5. Update Profile flags
  await supabase.from("user_profiles").update({
    is_temp_password: true,
    temp_password_expires_at: expiresAt
  }).eq("id", userId)

  // 6. Resolve any pending requests for this email
  await supabase.from("password_reset_requests")
    .update({ status: "resolved" })
    .eq("user_email", targetProfile.email)
    .eq("status", "pending")

  // 7. Audit Log
  await supabase.from("audit_logs").insert({
    actor_id: user.id,
    action: "PASSWORD_RESET_MANUAL",
    module: "auth",
    company_id: caller?.company_id,
    details: `Manually reset password for ${targetProfile.email}`
  })

  return NextResponse.json({ success: true, tempPassword, expiresAt })
}
