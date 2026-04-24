import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { password } = await request.json()
  if (!password || password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
  }

  // 1. Update Auth password
  const { error: authUpdateError } = await supabase.auth.admin.updateUserById(user.id, {
    password: password
  })
  if (authUpdateError) return NextResponse.json({ error: authUpdateError.message }, { status: 500 })

  // 2. Clear temp password flag
  await supabase.from("user_profiles").update({
    is_temp_password: false,
    temp_password_expires_at: null
  }).eq("id", user.id)

  // 3. Audit Log
  await supabase.from("audit_logs").insert({
    actor_id: user.id,
    action: "PASSWORD_CHANGED_MANDATORY",
    module: "auth",
    details: "User changed mandatory temporary password"
  })

  return NextResponse.json({ success: true })
}
