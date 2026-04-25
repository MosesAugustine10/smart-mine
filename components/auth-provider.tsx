"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { User, AuthChangeEvent, Session } from "@supabase/supabase-js"
import { useRouter, usePathname } from "next/navigation"
import { isHighPrivilege } from "@/lib/rbac"

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
  is_temp_password: boolean
  totp_enabled: boolean
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
// Routes that should never trigger auth network calls or kick-back to login
const PUBLIC_ROUTES = ['/', '/auth', '/login', '/auth/set-password', '/auth/change-password', '/auth/totp-setup', '/auth/totp-verify']
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
      const getCookie = (name: string) => {
        const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
        return match ? match[2] : null
      }

      const syncCookie = getCookie('msm_user_role')
      let cachedProfile: any = null
      
      if (syncCookie) {
          try {
              let decoded = syncCookie;
              try { decoded = decodeURIComponent(syncCookie); } catch (e) {}
              if (decoded.startsWith('j:')) decoded = decoded.substring(2);
              if (decoded.startsWith('{')) {
                  const data = JSON.parse(decoded)
                  if (data && data.role) {
                      cachedProfile = {
                          role: data.role.toUpperCase(),
                          company_id: data.cid,
                          enabled_modules: data.mods || []
                      }
                  }
              }
          } catch (e) {
              console.warn("AuthProvider: Cookie parse error", e)
          }
      }

      if (isPublic) {
        setLoading(false)
        return
      }

      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        if (sessionError) throw sessionError
        
        if (session?.user) {
          setUser(session.user)
          
          if (cachedProfile) {
            setProfile({ id: session.user.id, email: session.user.email || "", ...cachedProfile } as UserProfile)
            setLoading(false)
            return
          }

          console.log("AuthProvider: Fetching profile for", session.user.id)
          const { data: profileData, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle()
          
          if (profileError) console.error("AuthProvider: Profile fetch error", profileError)

          if (profileData) {
            console.log("AuthProvider: Profile found", profileData.role)
            setProfile({
              ...profileData,
              enabled_modules: (profileData as any).companies?.enabled_modules || []
            } as UserProfile)
          }
        }
      } catch (err) {
        console.warn("AuthProvider: Initialization warning", err)
      } finally {
        setLoading(false)
      }
    }

    const fallbackTimer = setTimeout(() => setLoading(false), 3000)
    loadSession().then(() => clearTimeout(fallbackTimer))

    let listener: any = null
    const { data } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      if (session?.user) {
        setUser(session.user)
        
        // Super Admin Bypass
        const isSuper = (session.user.user_metadata as any)?.role === 'SUPER_ADMIN' || 
                       document.cookie.includes('SUPER_ADMIN')

        if (isSuper && !profile) {
            console.log("AuthProvider: Emergency SuperAdmin detected")
            setProfile({
                id: session.user.id,
                email: session.user.email || "",
                role: 'SUPER_ADMIN',
                position: 'SYSTEM_OWNER',
                status: 'active'
            } as UserProfile)
            setLoading(false)
        } else if (!profile) {
            const { data: profileData } = await supabase
              .from('user_profiles')
              .select('*')
              .eq('id', session.user.id)
              .maybeSingle()
            
            if (profileData) {
              setProfile({
                ...profileData,
                enabled_modules: (profileData as any).companies?.enabled_modules || []
              } as UserProfile)
            }
        }
      } else {
        setUser(null)
        setProfile(null)
      }
      setLoading(false)
    })
    listener = data

    return () => {
      listener?.subscription.unsubscribe()
    }
  }, [isPublic, profile])

  const signOut = async () => {
    document.cookie = 'msm_user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;'
    const supabase = getSupabaseBrowserClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const hasAccess = (modulePath: string) => {
    if (!profile) return false
    const userRole = profile.role
    const enabledModules = (profile as any).enabled_modules || []

    if (userRole === 'SUPER_ADMIN') return true

    const [mainModule, subModule] = modulePath.toLowerCase().split('.')
    const subscriptionGated = ['blasting', 'drilling', 'diamond-drilling', 'material-handling', 'fleet', 'inventory', 'geophysics', 'safety', 'finance']

    if (subscriptionGated.includes(mainModule)) {
      if (Array.isArray(enabledModules)) {
        if (!enabledModules.includes(mainModule)) return false
      } else {
        const config = enabledModules[mainModule]
        if (!config) return false
        if (subModule && typeof config === 'object' && !config[subModule]) return false
      }
    }

    const ROUTE_ACCESS: Record<string, string[]> = {
      'blasting':          ['manager', 'blaster', 'admin'],
      'drilling':          ['manager', 'driller', 'admin'],
      'diamond-drilling':  ['manager', 'diamond_driller', 'geologist', 'admin'],
      'material-handling': ['manager', 'driver_operator', 'admin'],
      'geophysics':        ['manager', 'geologist', 'geophysics_engineer', 'admin'],
      'fleet':             ['manager', 'driver_operator', 'spotter', 'admin'],
      'inventory':         ['manager', 'stock_keeper', 'admin'],
      'finance':           ['accountant', 'admin'],
      'invoices':          ['accountant', 'admin'],
      'reports':           ['manager', 'accountant', 'admin'],
      'safety':            ['manager', 'blaster', 'driller', 'diamond_driller', 'driver_operator', 'admin'],
      'admin':             ['admin'],
      'home':              ['manager', 'accountant', 'geologist', 'blaster', 'driller', 'diamond_driller', 'stock_keeper', 'driver_operator', 'spotter', 'admin'],
      'map':               ['manager', 'admin'],
    }

    const allowed = ROUTE_ACCESS[mainModule]
    return allowed === undefined || allowed.includes(userRole ?? '')
  }

  useEffect(() => {
    if (loading || isAuthRoute || isPublic) return

    if (!profile) {
      console.warn("AuthProvider: No profile, kicking to login from", pathname)
      router.push('/login')
      return
    }

    if (profile.is_temp_password && pathname !== '/auth/change-password') {
      router.replace('/auth/change-password')
      return
    }

    const roles = Array.isArray(profile.role) ? profile.role : [profile.role]
    /* TOTP Enforcement Disabled by User Request for initial testing
    if (isHighPrivilege(roles)) {
      if (!profile.totp_enabled && pathname !== '/auth/totp-setup') {
        router.replace('/auth/totp-setup')
        return
      }
      
      if (profile.totp_enabled && pathname !== '/auth/totp-verify') {
        const getCookie = (name: string) => {
          const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
          return match ? match[2] : null
        }
        if (!getCookie('msm_totp_verified')) {
          router.replace('/auth/totp-verify')
          return
        }
      }
    }
    */

    if (profile.status === 'pending') {
       signOut()
       return
    }

    const path = (pathname?.split('/')[1]) || 'home'
    if (profile?.role?.toUpperCase() === 'SUPER_ADMIN' && path !== 'super-admin' && !isAuthRoute && !isPublic) {
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
