import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { randomBytes } from "crypto"

export const dynamic = "force-dynamic"

// ── GET: list all companies ────────────────────────────────────
export async function GET() {
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
  if (!callerRoles.includes("SUPER_ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // Get companies with user counts
  const { data: companies, error } = await supabase
    .from("companies")
    .select("*, users:user_profiles(count)")
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const formatted = companies.map(c => ({
    ...c,
    userCount: c.users?.[0]?.count || 0
  }))

  return NextResponse.json({ companies: formatted })
}

// ── POST: create a new company + admin ─────────────────────────
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
  if (!callerRoles.includes("SUPER_ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await request.json()
  const { companyName, adminFullName, adminEmail } = body

  if (!companyName || !adminFullName || !adminEmail) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  // 1. Create company
  const { data: company, error: companyError } = await supabase
    .from("companies")
    .insert({ name: companyName })
    .select()
    .single()

  if (companyError) return NextResponse.json({ error: companyError.message }, { status: 500 })

  // 2. Create Admin User
  const raw = randomBytes(16).toString("base64url")
  const tempPassword = raw.slice(0, 6).toUpperCase() + "@" + raw.slice(6, 12) + "1"
  
  const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
    email: adminEmail,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { full_name: adminFullName },
  })

  if (createError) {
    // Cleanup company if user creation fails
    await supabase.from("companies").delete().eq("id", company.id)
    return NextResponse.json({ error: createError.message }, { status: 500 })
  }

  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
  const nameParts = (adminFullName || "").split(" ")

  // 3. Create profile
  const { error: profileError } = await supabase.from("user_profiles").upsert({
    id: newUser.user!.id,
    company_id: company.id,
    email: adminEmail,
    first_name: nameParts[0] || "",
    last_name: nameParts.slice(1).join(" ") || "",
    role: "company_admin",
    roles: ["company_admin"],
    status: "active",
    is_temp_password: true,
    temp_password_expires_at: expiresAt,
  })

  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 })

  return NextResponse.json({ 
    success: true, 
    company, 
    tempPassword,
    adminEmail,
    expiresAt
  })
}
