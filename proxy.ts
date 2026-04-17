import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

// --- RBAC PERMISSION MATRIX (THE BIBLE) ---
const RBAC_RULES: Record<string, string[]> = {
  // Medium Scale
  "/blasting": ["Investor", "Manager", "Geologist", "Blaster", "Supervisor"],
  "/drilling": ["Investor", "Manager", "Geologist", "Driller", "Supervisor"],
  "/diamond-drilling": ["Investor", "Manager", "Geologist", "Diamond Driller", "Supervisor"],
  "/material-handling": ["Investor", "Manager", "Supervisor", "Driver/Operator"],
  "/geophysics": ["Investor", "Manager", "Geologist"],
  "/fleet": ["Investor", "Manager", "Driller", "Diamond Driller", "Supervisor", "Driver/Operator"],
  "/inventory": ["Investor", "Manager", "Geologist", "Blaster", "Driller", "Diamond Driller", "Stock Keeper", "Supervisor", "Driver/Operator"],
  "/finance": ["Investor", "Manager", "Accountant"],
  "/reports": ["Investor", "Manager", "Accountant", "Geologist", "Stock Keeper", "Supervisor", "Driver/Operator"],
  
  // Small Scale (Admin only routes)
  "/chimbo/dashboard": ["admin"],
  "/chimbo/mauzo": ["admin"],
  "/chimbo/vibarua": ["admin"],
  "/chimbo/ripoti": ["admin"],
  "/chimbo/ramani": ["admin"],
  
  // Small Scale (Supervisor only routes)
  "/chimbo/shimo-leo": ["supervisor", "admin"],
  "/chimbo/jackhammer": ["supervisor", "admin"],
  "/chimbo/mafuta": ["supervisor", "admin"],
  "/chimbo/ajali": ["supervisor", "admin"],
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1. PUBLIC ROUTES — always allow (including Small Scale Landing/Auth)
  if (
    pathname === "/" ||
    pathname === "/unauthorized" ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/landing") ||
    pathname === "/chimbo" ||
    pathname.startsWith("/_next") ||
    pathname.match(/\.(svg|png|jpg|jpeg|gif|webp|woff2?|ttf|ico|css|js)$/)
  ) {
    return NextResponse.next()
  }

  // 2. CHECK ROLE CACHE (COOKIE) — SPEED UP BY ~900ms
  const cachedRole = request.cookies.get("msm_user_role")?.value
  
  // 3. REAL AUTH CHECK via Supabase
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() { return request.cookies.getAll() },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
      },
    },
  })

  // Get session - lightweight (from JWT)
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    if (pathname.startsWith("/chimbo")) {
      return NextResponse.redirect(new URL("/chimbo", request.url))
    }
    return NextResponse.redirect(new URL("/auth/login", request.url))
  }

  // 4. ROLE DETERMINATION (Cache-First)
  let userRole: string = cachedRole || ""

  if (!userRole) {
    // Falls back to DB only if cache is missing
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("id", session.user.id)
      .maybeSingle()
    
    userRole = profile?.role || "Guest"
    
    // Set cookie for next request (expires in 24h)
    supabaseResponse.cookies.set("msm_user_role", userRole, { 
        maxAge: 60 * 60 * 24,
        path: "/",
        sameSite: "lax"
    })
  }

  // 5. SUPER ADMIN BYPASS - FAST TRACK
  if (userRole === "SUPER_ADMIN") {
    if (pathname === "/" || pathname === "/admin" || pathname === "/home" || pathname === "/auth/login") {
      return NextResponse.redirect(new URL("/super-admin", request.url))
    }
    return supabaseResponse
  }

  // 6. ROUTE PROTECTION (Based on RBAC_RULES)
  for (const [route, allowedRoles] of Object.entries(RBAC_RULES)) {
    if (pathname.startsWith(route) && !allowedRoles.includes(userRole)) {
      return NextResponse.redirect(new URL("/unauthorized", request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?|ttf|css|js)$).*)"],
}
