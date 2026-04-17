"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { User } from "@supabase/supabase-js"
import { useRouter, usePathname } from "next/navigation"

export type UserRole =
  | 'SUPER_ADMIN'
  | 'COMPANY_ADMIN'
  | 'SUPERVISOR'
  | 'FINANCE_ACCOUNTANT'
  | 'SAFETY_OFFICER'
  | 'OPERATOR' | string

export type UserPosition =
  | 'SYSTEM_OWNER'
  | 'COMPANY_DIRECTOR'
  | 'BLASTER' | 'ASSISTANT_BLASTER'
  | 'DRILLER' | 'ASSISTANT_DRILLER'
  | 'DIAMOND_DRILLER' | 'CORE_TECHNICIAN'
  | 'EXCAVATOR_OPERATOR' | 'LOADER_OPERATOR' | 'TRUCK_DRIVER'
  | 'DRIVER' | 'MECHANIC' | 'FLEET_SUPERVISOR'
  | 'GEOPHYSICIST' | 'SURVEY_TECHNICIAN'
  | 'SAFETY_OFFICER' | 'SAFETY_SUPERVISOR'
  | 'STORE_KEEPER' | 'INVENTORY_CONTROLLER'
  | 'SITE_ENGINEER' | 'MINING_ENGINEER' | 'PROJECT_MANAGER' | 'SUPERVISOR' | 'ACCOUNTANT'

export interface UserProfile {
  id: string
  company_id: string | null
  first_name: string | null
  last_name: string | null
  email: string
  role: UserRole
  position: UserPosition
  status: string
}

interface AuthContextValue {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  signOut: () => Promise<void>
  hasAccess: (module: string) => boolean
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => { },
  hasAccess: () => false
})

// Routes that should never trigger auth network calls
const PUBLIC_ROUTES = ['/', '/auth', '/chimbo', '/landing']
function isPublicPath(pathname: string | null) {
  if (!pathname) return false
  return PUBLIC_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'))
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  const isAuthRoute = pathname?.startsWith('/auth')
  const isPublic = isPublicPath(pathname)

  useEffect(() => {
    const supabase = getSupabaseBrowserClient()



    async function loadSession() {
      if (isPublic) {
        setLoading(false)
        return
      }

      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) throw sessionError
        
        if (session?.user) {
          setUser(session.user)
          const { data: profileData } = await supabase
            .from('user_profiles')
            .select('*, companies(enabled_modules)')
            .eq('id', session.user.id)
            .maybeSingle()
          
          if (profileData) {
            setProfile({
              ...profileData,
              enabled_modules: (profileData as any).companies?.enabled_modules || []
            } as UserProfile)
          }
        }
      } catch (err) {
        console.warn("Auth initialization warning:", err)
      } finally {
        setLoading(false)
      }
    }

    loadSession()

    // 4. AUTH STATE UPDATES
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {


      setUser(session?.user ?? null)
      if (session?.user) {
        setLoading(true)
        const { data: profileData } = await supabase
          .from('user_profiles')
          .select('*, companies(enabled_modules)')
          .eq('id', session.user.id)
          .maybeSingle()
        
        if (profileData) {
          setProfile({
            ...profileData,
            enabled_modules: (profileData as any).companies?.enabled_modules || []
          } as UserProfile)
        }
        setLoading(false)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    document.cookie = 'demo_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;'
    const supabase = getSupabaseBrowserClient()
    await supabase.auth.signOut()
    window.location.href = '/auth/login'
  }

  // The PBAC Routing Logic Matrix
    const hasAccess = (module: string) => {

    
    if (!profile) return false
    const userRole = profile.role // e.g. 'Investor', 'Manager', 'Blaster' ...
    const enabledModules = (profile as any).enabled_modules || []

    // ─── Super Admin overrides everything ──────────────────────────────────
    if (userRole === 'SUPER_ADMIN') return true

    // ─── Company-level module subscription gate ─────────────────────────────
    const subscriptionGated = [
      'blasting', 'drilling', 'diamond-drilling',
      'material-handling', 'fleet', 'inventory',
      'geophysics', 'safety'
    ]
    if (subscriptionGated.includes(module.toLowerCase()) && !enabledModules.includes(module.toLowerCase())) {
      return false
    }

    // ─── RBAC Role Matrix ───────────────────────────────────────────────────
    // Matches the 10-role permission matrix exactly.
    // 'none' = module hidden entirely. Any other level = accessible.
    const ROUTE_ACCESS: Record<string, string[]> = {
      'blasting':          ['Investor', 'Manager', 'Geologist', 'Blaster', 'Supervisor'],
      'drilling':          ['Investor', 'Manager', 'Geologist', 'Driller', 'Supervisor'],
      'diamond-drilling':  ['Investor', 'Manager', 'Geologist', 'Diamond Driller', 'Supervisor'],
      'material-handling': ['Investor', 'Manager', 'Supervisor', 'Driver/Operator'],
      'geophysics':        ['Investor', 'Manager', 'Geologist'],
      'fleet':             ['Investor', 'Manager', 'Driller', 'Diamond Driller', 'Supervisor', 'Driver/Operator'],
      'inventory':         ['Investor', 'Manager', 'Geologist', 'Blaster', 'Driller', 'Diamond Driller', 'Stock Keeper', 'Supervisor', 'Driver/Operator'],
      'finance':           ['Investor', 'Manager', 'Accountant'],
      'invoices':          ['Investor', 'Manager', 'Accountant'],
      'billing':           ['Investor', 'Manager', 'Accountant'],
      'reports':           ['Investor', 'Manager', 'Accountant', 'Geologist', 'Stock Keeper', 'Supervisor'],
      'safety':            ['Investor', 'Manager', 'Geologist', 'Blaster', 'Driller', 'Diamond Driller', 'Supervisor'],
      // Always accessible
      'admin':             ['Investor', 'Manager', 'Accountant', 'Geologist', 'Blaster', 'Driller', 'Diamond Driller', 'Stock Keeper', 'Supervisor', 'Driver/Operator'],
      'home':              ['Investor', 'Manager', 'Accountant', 'Geologist', 'Blaster', 'Driller', 'Diamond Driller', 'Stock Keeper', 'Supervisor', 'Driver/Operator'],
      'map':               ['Investor', 'Manager', 'Accountant', 'Geologist', 'Blaster', 'Driller', 'Diamond Driller', 'Stock Keeper', 'Supervisor', 'Driver/Operator'],
      'super-admin':       [],   // Only SUPER_ADMIN (handled above)
      'chimbo':            [],   // Small Scale — never shown inside MSM sidebar
    }

    const allowed = ROUTE_ACCESS[module.toLowerCase()]
    if (allowed === undefined) return true  // unknown module — allow (fail-open for UI)
    return allowed.includes(userRole ?? '')
  }

  // Enforce Matrix Lock if not loading and not on a public/auth route
  useEffect(() => {
    if (loading || isAuthRoute || isPublic) return;



    if (!profile) {
      router.push('/auth/login')
      return
    }

    if (profile.status === 'pending') {
       signOut()
       return
    }

    const path = (pathname?.split('/')[1]) || 'home'

    if (profile?.role === 'SUPER_ADMIN' && path !== 'super-admin') {
      router.replace('/super-admin')
      return
    }

    if (path !== 'home' && path !== '' && path !== 'super-admin' && !pathname?.startsWith('/chimbo') && !hasAccess(path)) {
      router.push('/unauthorized')
    }
  }, [pathname, loading, profile, isAuthRoute, router])

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut, hasAccess }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
