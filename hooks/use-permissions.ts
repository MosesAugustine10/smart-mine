"use client"

import { useEffect, useState } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

// ─── Type Definitions ─────────────────────────────────────────────────────────
export type AccessLevel = 'full' | 'view' | 'form' | 'request' | 'none'

export type MediumScaleRole =
  | 'Investor'
  | 'Manager'
  | 'Accountant'
  | 'Geologist'
  | 'Blaster'
  | 'Driller'
  | 'Diamond Driller'
  | 'Stock Keeper'
  | 'Supervisor'
  | 'Driver/Operator'

export type ModuleKey =
  | 'blasting'
  | 'drilling'
  | 'diamond'       // Diamond Drilling
  | 'handling'      // Material Handling
  | 'geophysics'    // Geophysics / Advanced Assay
  | 'fleet'         // Vehicles, Fuel, Maintenance, Payload, Checklist
  | 'inventory'     // All Inventory categories
  | 'inventory_ppe' // PPE & General specifically
  | 'finance'       // Invoices & Expenses
  | 'reports'       // Dashboards & Reports

// ─── PERMISSION MATRIX (THE BIBLE — DO NOT DEVIATE) ──────────────────────────
//
// Access Levels:
//   full    → Create, Read, Update, Delete
//   view    → Read-only. No add/edit buttons shown.
//   form    → Form submission only. No lists. No dashboards.
//   request → Can see stock levels + submit Request. Cannot adjust stock.
//   none    → Module completely hidden. Direct URL → redirect to /unauthorized
//
const MATRIX: Record<MediumScaleRole, Record<ModuleKey, AccessLevel>> = {
  'Investor': {
    blasting: 'full', drilling: 'full', diamond: 'full', handling: 'full',
    geophysics: 'full', fleet: 'full', inventory: 'full', inventory_ppe: 'full',
    finance: 'full', reports: 'full',
  },
  'Manager': {
    blasting: 'full', drilling: 'full', diamond: 'view', handling: 'full',
    geophysics: 'view', fleet: 'full', inventory: 'full', inventory_ppe: 'full',
    finance: 'view', reports: 'full',
  },
  'Accountant': {
    blasting: 'none', drilling: 'none', diamond: 'none', handling: 'none',
    geophysics: 'none', fleet: 'none', inventory: 'none', inventory_ppe: 'none',
    finance: 'full', reports: 'view',
  },
  'Geologist': {
    blasting: 'view', drilling: 'view', diamond: 'full', handling: 'none',
    geophysics: 'full', fleet: 'none', inventory: 'request', inventory_ppe: 'request',
    finance: 'none', reports: 'view',
  },
  'Blaster': {
    blasting: 'form', drilling: 'none', diamond: 'none', handling: 'none',
    geophysics: 'none', fleet: 'none', inventory: 'request', inventory_ppe: 'request',
    finance: 'none', reports: 'none',
  },
  'Driller': {
    blasting: 'none', drilling: 'form', diamond: 'none', handling: 'none',
    geophysics: 'none', fleet: 'request', inventory: 'request', inventory_ppe: 'request',
    finance: 'none', reports: 'none',
  },
  'Diamond Driller': {
    blasting: 'none', drilling: 'none', diamond: 'form', handling: 'none',
    geophysics: 'none', fleet: 'request', inventory: 'request', inventory_ppe: 'request',
    finance: 'none', reports: 'none',
  },
  'Stock Keeper': {
    blasting: 'none', drilling: 'none', diamond: 'none', handling: 'none',
    geophysics: 'none', fleet: 'none', inventory: 'full', inventory_ppe: 'full',
    finance: 'none', reports: 'view',
  },
  'Supervisor': {
    blasting: 'form', drilling: 'form', diamond: 'form', handling: 'form',
    geophysics: 'none', fleet: 'form', inventory: 'request', inventory_ppe: 'request',
    finance: 'none', reports: 'view',
  },
  'Driver/Operator': {
    blasting: 'none', drilling: 'none', diamond: 'none', handling: 'form',
    geophysics: 'none', fleet: 'form', inventory: 'none', inventory_ppe: 'request',
    finance: 'none', reports: 'none',
  },
}

// ─── Fallback (no access) ─────────────────────────────────────────────────────
const NO_ACCESS: Record<ModuleKey, AccessLevel> = {
  blasting: 'none', drilling: 'none', diamond: 'none', handling: 'none',
  geophysics: 'none', fleet: 'none', inventory: 'none', inventory_ppe: 'none',
  finance: 'none', reports: 'none',
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export const usePermissions = (moduleName: ModuleKey) => {
  const [role, setRole] = useState<MediumScaleRole | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const supabase = getSupabaseBrowserClient()
        const { data: { session } } = await supabase.auth.getSession()

        if (session) {
          const { data } = await supabase
            .from('user_profiles')
            .select('role')
            .eq('id', session.user.id)
            .maybeSingle()

          if (data?.role) {
            setRole(data.role as MediumScaleRole)
          }
        }
      } catch (e) {
        console.error('usePermissions error:', e)
      } finally {
        setLoading(false)
      }
    }

    fetchUserRole()
  }, [])

  const permissions = role ? (MATRIX[role] || NO_ACCESS) : NO_ACCESS
  const access = permissions[moduleName] ?? 'none'

  return {
    role,
    loading,
    accessLevel: access,
    /** Can see the module at all (not 'none') */
    canView: access !== 'none',
    /** Can create/update/delete */
    canEdit: access === 'full',
    /** Read-only — only viewing, no forms */
    isViewOnly: access === 'view',
    /** Form submission only — no lists or dashboards shown after submit */
    isFormOnly: access === 'form',
    /** Can see stock levels + submit a request. Cannot adjust stock counts */
    canRequest: access === 'request',
    /** Full CRUD */
    isFull: access === 'full',
  }
}

// ─── Utility: get full permission set for a role ──────────────────────────────
export function getPermissionsForRole(role: string): Record<ModuleKey, AccessLevel> {
  return MATRIX[role as MediumScaleRole] || NO_ACCESS
}

// ─── Utility: check if a role can access a given route prefix ─────────────────
export function roleCanAccessRoute(role: string, routePrefix: string): boolean {
  const routeModuleMap: Record<string, ModuleKey> = {
    '/blasting': 'blasting',
    '/drilling': 'drilling',
    '/diamond-drilling': 'diamond',
    '/material-handling': 'handling',
    '/geophysics': 'geophysics',
    '/fleet': 'fleet',
    '/inventory': 'inventory',
    '/finance': 'finance',
    '/reports': 'reports',
    '/invoices': 'finance',
  }

  const moduleKey = routeModuleMap[routePrefix]
  if (!moduleKey) return true // unknown route — defer to middleware

  const perms = getPermissionsForRole(role)
  return perms[moduleKey] !== 'none'
}
