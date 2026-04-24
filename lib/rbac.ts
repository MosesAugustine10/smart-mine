// ============================================================
// RBAC – Role Based Access Control
// Single-Tenant Smart Mine Pro for Amogtech
// ============================================================

export const ALL_ROLES = [
  "SUPER_ADMIN",
  "admin",
  "manager",
  "accountant",
  "blaster",
  "driller",
  "diamond_driller",
  "geologist",
  "geophysics_engineer",
  "driver_operator",
  "spotter",
  "stock_keeper",
] as const

export type AppRole = typeof ALL_ROLES[number]

export const ROLE_LABELS: Record<AppRole, string> = {
  SUPER_ADMIN: "Super Admin",
  admin: "Company Admin",
  manager: "Manager",
  accountant: "Accountant",
  blaster: "Blaster",
  driller: "Driller",
  diamond_driller: "Diamond Driller",
  geologist: "Geologist",
  geophysics_engineer: "Geophysics Engineer",
  driver_operator: "Driver / Operator",
  spotter: "Spotter",
  stock_keeper: "Stock Keeper",
}

export const ROLE_COLORS: Record<AppRole, string> = {
  SUPER_ADMIN: "bg-purple-100 text-purple-800 border-purple-200",
  admin: "bg-indigo-100 text-indigo-800 border-indigo-200",
  manager: "bg-blue-100 text-blue-800 border-blue-200",
  accountant: "bg-emerald-100 text-emerald-800 border-emerald-200",
  blaster: "bg-red-100 text-red-800 border-red-200",
  driller: "bg-orange-100 text-orange-800 border-orange-200",
  diamond_driller: "bg-cyan-100 text-cyan-800 border-cyan-200",
  geologist: "bg-amber-100 text-amber-800 border-amber-200",
  geophysics_engineer: "bg-violet-100 text-violet-800 border-violet-200",
  driver_operator: "bg-slate-100 text-slate-800 border-slate-200",
  spotter: "bg-teal-100 text-teal-800 border-teal-200",
  stock_keeper: "bg-lime-100 text-lime-800 border-lime-200",
}

// High-privilege roles that require TOTP
export const HIGH_PRIVILEGE_ROLES: AppRole[] = ["SUPER_ADMIN", "admin", "accountant"]

// Module access matrix
// Key: route segment (matches app directory name)
// Value: roles that can access (empty array = no restriction beyond login)
export const MODULE_ACCESS: Record<string, AppRole[]> = {
  "super-admin": ["SUPER_ADMIN"],
  "admin": ["SUPER_ADMIN", "admin"],
  "blasting": ["SUPER_ADMIN", "admin", "manager", "blaster"],
  "drilling": ["SUPER_ADMIN", "admin", "manager", "driller"],
  "diamond-drilling": ["SUPER_ADMIN", "admin", "manager", "diamond_driller", "geologist"],
  "geophysics": ["SUPER_ADMIN", "admin", "manager", "geologist", "geophysics_engineer"],
  "material-handling": ["SUPER_ADMIN", "admin", "manager", "driver_operator"],
  "fleet": ["SUPER_ADMIN", "admin", "manager", "driver_operator", "spotter"],
  "inventory": ["SUPER_ADMIN", "admin", "manager", "stock_keeper"],
  "finance": ["SUPER_ADMIN", "admin", "accountant"],
  "invoices": ["SUPER_ADMIN", "admin", "accountant"],
  "safety": ["SUPER_ADMIN", "admin", "manager", "blaster", "driller", "diamond_driller", "driver_operator"],
  "map": ["SUPER_ADMIN", "admin", "manager"],
  "reports": ["SUPER_ADMIN", "admin", "manager"],

  "settings": ["SUPER_ADMIN", "admin"],
}

// Navigation modules shown per role (for sidebar)
export const NAV_MODULE_ACCESS: Record<string, AppRole[]> = { ...MODULE_ACCESS }

export function hasRole(userRoles: string | string[], requiredRole: AppRole): boolean {
  const roles = Array.isArray(userRoles) ? userRoles : [userRoles]
  return roles.some(r => r === requiredRole || r === "SUPER_ADMIN")
}

export function canAccessModule(userRoles: string | string[], module: string): boolean {
  const allowed = MODULE_ACCESS[module]
  if (!allowed) return true // unknown module = open
  const roles = Array.isArray(userRoles) ? userRoles : [userRoles]
  if (roles.includes("SUPER_ADMIN")) return true
  return roles.some(r => (allowed as string[]).includes(r))
}

export function isHighPrivilege(roles: string[]): boolean {
  return roles.some(r => (HIGH_PRIVILEGE_ROLES as string[]).includes(r))
}
