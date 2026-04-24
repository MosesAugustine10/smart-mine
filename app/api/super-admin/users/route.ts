import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { canAccessModule } from "@/lib/rbac"
import { randomBytes } from "crypto"

export const dynamic = "force-dynamic"

// ── GET: list all users ────────────────────────────────────────
export async function GET() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // service role for admin reads
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: caller } = await supabase.from("user_profiles").select("role, roles").eq("id", user.id).single()
  const callerRoles: string[] = caller?.roles || [caller?.role].filter(Boolean)
  if (!callerRoles.includes("SUPER_ADMIN") && !callerRoles.includes("admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { data: profiles, error } = await supabase
    .from("user_profiles")
    .select("id, first_name, last_name, email, role, roles, status, created_at, temp_password_expires_at, is_temp_password")
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ users: profiles })
}

// ── POST: create a new user with temp password ─────────────────
export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: caller } = await supabase.from("user_profiles").select("role, roles").eq("id", user.id).single()
  const callerRoles: string[] = caller?.roles || [caller?.role].filter(Boolean)
  if (!callerRoles.includes("SUPER_ADMIN") && !callerRoles.includes("admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await request.json()
  const { full_name, email, roles } = body as { full_name: string; email: string; roles: string[] }

  if (!email || !roles?.length) {
    return NextResponse.json({ error: "Email and roles are required" }, { status: 400 })
  }

  // Generate secure temp password: 16 chars, mixed case + symbols
  const raw = randomBytes(16).toString("base64url")
  const tempPassword = raw.slice(0, 6).toUpperCase() + "@" + raw.slice(6, 12) + raw.slice(12, 14) + "1"

  // Create auth user
  const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { full_name },
  })

  if (createError) return NextResponse.json({ error: createError.message }, { status: 500 })

  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()

  // Create profile
  const nameParts = (full_name || "").split(" ")
  const { error: profileError } = await supabase.from("user_profiles").upsert({
    id: newUser.user!.id,
    email,
    first_name: nameParts[0] || "",
    last_name: nameParts.slice(1).join(" ") || "",
    role: roles[0],
    roles,
    status: "active",
    is_temp_password: true,
    temp_password_expires_at: expiresAt,
  })

  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 })

  // Log the action (safely)
  try {
    await supabase.from("audit_logs").insert({
      actor_id: user.id,
      action: "USER_CREATED",
      module: "user_management",
      details: `Created user ${email} with roles: ${roles.join(", ")}`,
    })
  } catch (err) {
    console.warn("Failed to write audit log:", err)
  }

  return NextResponse.json({ 
    success: true, 
    tempPassword, 
    userId: newUser.user!.id,
    expiresAt 
  })
}

// ── PATCH: update user roles ───────────────────────────────────
export async function PATCH(request: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: caller } = await supabase.from("user_profiles").select("role, roles").eq("id", user.id).single()
  const callerRoles: string[] = caller?.roles || [caller?.role].filter(Boolean)
  if (!callerRoles.includes("SUPER_ADMIN") && !callerRoles.includes("admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await request.json()
  const { userId, roles, status } = body

  // Prevent non-super-admin from editing SUPER_ADMIN
  const { data: target } = await supabase.from("user_profiles").select("role, roles").eq("id", userId).single()
  const targetRoles: string[] = target?.roles || [target?.role].filter(Boolean)
  if (targetRoles.includes("SUPER_ADMIN") && !callerRoles.includes("SUPER_ADMIN")) {
    return NextResponse.json({ error: "Cannot modify Super Admin" }, { status: 403 })
  }

  const updates: any = {}
  if (roles) { updates.roles = roles; updates.role = roles[0] }
  if (status) updates.status = status

  const { error } = await supabase.from("user_profiles").update(updates).eq("id", userId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}

// ── DELETE: remove user ────────────────────────────────────────
export async function DELETE(request: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: caller } = await supabase.from("user_profiles").select("role, roles").eq("id", user.id).single()
  const callerRoles: string[] = caller?.roles || [caller?.role].filter(Boolean)
  if (!callerRoles.includes("SUPER_ADMIN") && !callerRoles.includes("admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("userId")
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 })

  // Prevent deleting super admin
  const { data: target } = await supabase.from("user_profiles").select("role, roles").eq("id", userId).single()
  const targetRoles: string[] = target?.roles || [target?.role].filter(Boolean)
  if (targetRoles.includes("SUPER_ADMIN")) {
    return NextResponse.json({ error: "Cannot delete Super Admin" }, { status: 403 })
  }

  await supabase.auth.admin.deleteUser(userId)
  return NextResponse.json({ success: true })
}
