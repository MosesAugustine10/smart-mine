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
  "/super-admin": ["SUPER_ADMIN"],
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const cachedRole = request.cookies.get("msm_user_role")?.value
  
  console.log(`[Proxy] Request: ${pathname} | CachedRole: ${cachedRole ? 'Present' : 'Missing'}`)

  // 0. LEGACY REDIRECTS
  if (pathname === "/home") {
    console.log("[Proxy] Redirecting legacy /home to /admin")
    return NextResponse.redirect(new URL("/admin", request.url))
  }

  // 1. PUBLIC ROUTES — Performance Fast Path
  if (
    pathname === "/" ||
    pathname === "/unauthorized" ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/landing") ||
    pathname.startsWith("/_next") ||
    pathname.match(/\.(svg|png|jpg|jpeg|gif|webp|woff2?|ttf|ico|css|js)$/)
  ) {
    if (pathname === "/") {
       if (cachedRole) {
          try {
            const decoded = decodeURIComponent(cachedRole).replace(/^j:/, '')
            const role = decoded.startsWith('{') ? JSON.parse(decoded).role : decoded
            console.log(`[Proxy] Root redirect to ${role === 'SUPER_ADMIN' ? '/super-admin' : '/admin'}`)
            if (role === 'SUPER_ADMIN') return NextResponse.redirect(new URL("/super-admin", request.url))
            return NextResponse.redirect(new URL("/admin", request.url))
          } catch (e) {
            console.error("[Proxy] Root redirect parse error", e)
          }
       }
       return NextResponse.next()
    }
    return NextResponse.next()
  }
  
  // 2. FAST PATH AUTH (Cookie-Based)
  const authCookieName = `sb-${process.env.NEXT_PUBLIC_SUPABASE_URL?.split('.')[0].replace('https://', '')}-auth-token`
  const hasAuthCookie = request.cookies.has(authCookieName) || request.cookies.has(`${authCookieName}.0`)

  if (!hasAuthCookie && !cachedRole) {
    console.log("[Proxy] No auth cookie or cached role, redirecting to login")
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // 3. REAL AUTH CHECK (Only if needed or to refresh)
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

  // getSession is only called if we don't have a cached role or we want to verify
  let session = null
  if (!cachedRole) {
    console.log("[Proxy] Fetching session (no cached role)")
    const { data } = await supabase.auth.getSession()
    session = data.session
    if (!session) {
      console.log("[Proxy] No session found, redirecting")
      return NextResponse.redirect(new URL("/login", request.url))
    }
  }

  // 4. ROLE DETERMINATION (Sync-First)
  let userRole: string = ""
  let companyId: string | null = null

  if (cachedRole) {
    try {
      const decoded = decodeURIComponent(cachedRole).replace(/^j:/, '')
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

  // ONLY FETCH IF CACHE IS MISSING (AND WE HAVE A SESSION)
  if (!userRole) {
    console.log("[Proxy] Fetching profile from DB")
    if (!session) {
      const { data } = await supabase.auth.getSession()
      session = data.session
    }

    if (session?.user) {
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("role, company_id")
        .eq("id", session.user.id)
        .maybeSingle()
      
      userRole = profile?.role || "Guest"
      companyId = profile?.company_id || null
      
      console.log(`[Proxy] Profile fetched: ${userRole}`)
      const syncData = { role: userRole, cid: companyId, mods: [], ts: Date.now() }
      supabaseResponse.cookies.set("msm_user_role", JSON.stringify(syncData), { maxAge: 60 * 60 * 24, path: "/", sameSite: "lax" })
    } else {
      userRole = "Guest"
    }
  }

  // 5. SUPER ADMIN BYPASS
  if (userRole.toUpperCase() === "SUPER_ADMIN") {
    if (pathname === "/admin" || pathname === "/home") {
      console.log("[Proxy] SuperAdmin redirect to /super-admin")
      return NextResponse.redirect(new URL("/super-admin", request.url))
    }
    return supabaseResponse
  }

  // 6. ROUTE PROTECTION (Based on RBAC_RULES)
  for (const [route, allowedRoles] of Object.entries(RBAC_RULES)) {
    if (pathname.startsWith(route) && !allowedRoles.includes(userRole)) {
      console.log(`[Proxy] RBAC Denied: ${pathname} for role ${userRole}`)
      return NextResponse.redirect(new URL("/unauthorized", request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest\\.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?|ttf|css|js|json)$).*)"],
}
