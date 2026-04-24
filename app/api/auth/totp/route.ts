import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
const { authenticator } = require("otplib")
import QRCode from "qrcode"

export const dynamic = "force-dynamic"

// ── GET: generate new TOTP secret & QR code ────────────────────
export async function GET() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // 1. Generate secret
  const secret = authenticator.generateSecret()
  
  // 2. Create otpauth URL
  const otpauth = authenticator.keyuri(user.email!, "Smart Mine Pro", secret)
  
  // 3. Generate QR Data URL
  const qrCodeUrl = await QRCode.toDataURL(otpauth)

  // 4. Store secret temporarily in user_profiles (unverified)
  // We'll only set totp_enabled=true once they verify a code.
  await supabase.from("user_profiles").update({
    totp_secret: secret,
    totp_enabled: false
  }).eq("id", user.id)

  return NextResponse.json({ secret, qrCodeUrl })
}

// ── POST: verify and enable TOTP ───────────────────────────────
export async function POST(request: Request) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { token } = await request.json()
  if (!token) return NextResponse.json({ error: "Token required" }, { status: 400 })

  // 1. Get secret from profile
  const { data: caller } = await supabase.from("user_profiles").select("role, roles, company_id, totp_secret").eq("id", user.id).single()
  if (!caller?.totp_secret) return NextResponse.json({ error: "TOTP not initialized" }, { status: 400 })

  // 2. Verify token
  const isValid = authenticator.verify({ token, secret: caller.totp_secret })
  if (!isValid) return NextResponse.json({ error: "Invalid verification code" }, { status: 400 })

  // 3. Enable TOTP
  await supabase.from("user_profiles").update({
    totp_enabled: true
  }).eq("id", user.id)

  // 4. Set session cookie/flag that TOTP is verified for this session
  // We'll use a signed cookie for this in a real app, but for now a simple cookie
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toUTCString()
  
  return new NextResponse(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      'Set-Cookie': `msm_totp_verified=true; Path=/; HttpOnly; SameSite=Lax; Expires=${expires}`
    }
  })
}
