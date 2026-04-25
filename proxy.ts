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
  const cachedRole = request.cookies.get("msm_user_role")?.value

  // 1. PUBLIC ROUTES — Performance Fast Path
  if (
    pathname === "/" ||
    pathname === "/gate" ||
    pathname === "/unauthorized" ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/login") ||
    pathname === "/small" ||
    pathname === "/medium" ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/landing") ||
    pathname === "/chimbo" ||
    pathname.startsWith("/_next") ||
    pathname.match(/\.(svg|png|jpg|jpeg|gif|webp|woff2?|ttf|ico|css|js)$/)
  ) {
    // REDIRECT LOGGED IN SUPER ADMIN AWAY FROM PUBLIC/CLIENT PAGES
    if (cachedRole) {
      try {
        const decoded = decodeURIComponent(cachedRole)
        const role = decoded.startsWith('{') ? JSON.parse(decoded).role : decoded
        // REMOVED: Auto-redirect of super-admin from /auth/login
        // This allows the owner to actually see the login page if they want to.
      } catch (e) {}
    }
    return NextResponse.next()
  }
  
  // 2. REAL AUTH CHECK via Supabase
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() { return request.cookies.getAll() },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
      },
    },
  })

  // getSession is fast (reads JWT from cookie)
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    if (pathname.startsWith("/chimbo")) return NextResponse.redirect(new URL("/chimbo", request.url))
    if (pathname.startsWith("/super-admin")) return NextResponse.redirect(new URL("/gate", request.url))
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // 3. ROLE DETERMINATION (Sync-First)
  let userRole: string = ""
  let companyId: string | null = null

  if (cachedRole) {
    try {
      const decoded = decodeURIComponent(cachedRole)
      if (decoded.startsWith('{')) {
        const parsed = JSON.parse(decoded)
        userRole = parsed.role
        companyId = parsed.cid
      } else {
        userRole = decoded
      }
    } catch { 
      userRole = cachedRole 
    }
  }

  // ONLY FETCH IF CACHE IS MISSING
  if (!userRole) {
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("role, company_id")
      .eq("id", session.user.id)
      .maybeSingle()
    
    userRole = profile?.role || "Guest"
    companyId = profile?.company_id || null
    
    const syncData = { role: userRole, cid: companyId, mods: [], ts: Date.now() }
    supabaseResponse.cookies.set("msm_user_role", JSON.stringify(syncData), { maxAge: 60 * 60 * 24, path: "/", sameSite: "lax" })
  }

  // 4. SUPER ADMIN BYPASS
  if (userRole.toUpperCase() === "SUPER_ADMIN") {
    if (pathname === "/admin" || pathname === "/home") {
      return NextResponse.redirect(new URL("/super-admin", request.url))
    }
    return supabaseResponse
  }

  // 5. ROUTE PROTECTION (Based on RBAC_RULES)
  for (const [route, allowedRoles] of Object.entries(RBAC_RULES)) {
    if (pathname.startsWith(route) && !allowedRoles.includes(userRole)) {
      return NextResponse.redirect(new URL("/unauthorized", request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest\\.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?|ttf|css|js|json)$).*)"],
}
