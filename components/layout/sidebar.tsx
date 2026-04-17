"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { cn } from "@/lib/utils"
import {
  Pickaxe, Truck, ShieldAlert, Package, Home,
  MapPin, Settings, ShieldCheck, Activity, LogOut, Mountain,
  Diamond, FileSpreadsheet, Layers, Wallet, ChevronDown,
  ChevronRight, Zap, FlaskConical, LayoutDashboard, Hammer, Users
} from "lucide-react"

// ─── Types ─────────────────────────────────────────────────────────────────────
type NavLeaf = { name: string; href: string; icon: any; code: string; subItems?: NavLeaf[] }
type NavGroup = { key: string; label: string; icon: any; codes: string[]; items: NavLeaf[] }
type NavEntry = NavLeaf | NavGroup

const isGroup = (item: NavEntry): item is NavGroup => "items" in item

// ─── Navigation Configuration ──────────────────────────────────────────────────
const NAV_CONFIG: NavEntry[] = [
  { name: "Main Dashboard", href: "/admin",       icon: LayoutDashboard, code: "admin" },
  { name: "User Management",  href: "/admin/users", icon: Users,           code: "admin" },
  { name: "Global Control",    href: "/super-admin", icon: ShieldCheck,     code: "super-admin" },

  // ── OPERATIONS GROUP ──────────────────────────────────────────────────────────
  {
    key: "operations",
    label: "Operations",
    icon: Hammer,
    codes: ["blasting", "drilling", "diamond-drilling"],
    items: [
      { name: "Blasting",          href: "/blasting",  icon: Zap,     code: "blasting" },
      { name: "Drilling",          href: "/drilling",  icon: Pickaxe, code: "drilling" },
      {
        name: "Diamond Drilling",  href: "/diamond-drilling", icon: Diamond, code: "diamond-drilling",
        subItems: [
          { name: "Advanced Assay", href: "/diamond-drilling/assay", icon: FlaskConical, code: "diamond-drilling" },
        ],
      },
    ],
  },

  { name: "Fleet Registry",    href: "/fleet",            icon: Truck,      code: "fleet" },
  { name: "Material Handling", href: "/material-handling", icon: Layers,     code: "material-handling" },
  { name: "Inventory Hub",     href: "/inventory",         icon: Package,    code: "inventory" },
  { name: "Safety Center",     href: "/safety",            icon: ShieldAlert, code: "safety" },

  // ── FINANCE GROUP ─────────────────────────────────────────────────────────────
  {
    key: "finance",
    label: "Finance",
    icon: Wallet,
    codes: ["admin"],
    items: [
      { name: "Invoice & Billing", href: "/invoices",         icon: FileSpreadsheet, code: "admin" },
      { name: "Ledger",            href: "/billing/expenses", icon: Wallet,          code: "admin" },
    ],
  },

  { name: "Geophysics",        href: "/geophysics", icon: Activity, code: "geophysics" },
  { name: "Command Center",    href: "/map",         icon: MapPin,   code: "home" },
]

// ─── Helper: derive auto-open group state from pathname ────────────────────────
function getAutoOpen(pathname: string | null): Record<string, boolean> {
  return {
    operations: ["/blasting", "/drilling", "/diamond-drilling"].some(p => pathname?.startsWith(p)),
    finance:    ["/invoices", "/billing"].some(p => pathname?.startsWith(p)),
  }
}

// ─── Component ─────────────────────────────────────────────────────────────────
export function Sidebar() {
  const pathname = usePathname()
  const { hasAccess, profile, signOut } = useAuth()
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(getAutoOpen(pathname))

  // Keep groups synced when route changes
  useEffect(() => {
    setOpenGroups(prev => {
      const auto = getAutoOpen(pathname)
      // Only auto-open, never auto-close
      return { ...prev, operations: prev.operations || auto.operations, finance: prev.finance || auto.finance }
    })
  }, [pathname])

  const toggleGroup = (key: string) =>
    setOpenGroups(prev => ({ ...prev, [key]: !prev[key] }))

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname?.startsWith(href + "/"))

  // Loading state
  if (!profile) return (
    <div className="flex h-full w-56 flex-col border-r bg-white dark:bg-slate-900 items-center justify-center gap-3 shrink-0">
      <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center animate-pulse">
        <Mountain className="h-5 w-5 text-amber-500" />
      </div>
      <p className="text-[9px] font-black uppercase tracking-widest text-slate-300">Loading...</p>
    </div>
  )

  return (
    <div className="flex h-full w-56 flex-col border-r bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 shrink-0">

      {/* ── Logo ──────────────────────────────────────────────────────────── */}
      <div className="flex h-14 items-center border-b border-slate-100 dark:border-slate-800 px-4 gap-2.5">
        <div className="h-7 w-7 rounded-lg bg-amber-500 flex items-center justify-center shrink-0">
          <Mountain className="h-4 w-4 text-white" />
        </div>
        <span className="font-bold text-sm text-slate-900 dark:text-white tracking-tight">Smart Mine</span>
      </div>

      {/* ── User Badge ────────────────────────────────────────────────────── */}
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
        <p className="text-[10px] text-slate-400 dark:text-slate-500 mb-0.5">Clearance Active</p>
        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate capitalize uppercase">
          {profile.position?.replace(/_/g, " ") || "User"}
        </p>
        <span className="inline-block mt-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-500 capitalize px-2 py-0.5 bg-amber-50 dark:bg-amber-900/20 rounded-full">
          {profile.role?.replace(/_/g, " ")}
        </span>
      </div>

      {/* ── Navigation ────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto py-3 px-2 custom-scrollbar">
        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-2 mb-2">Systems Matrix</p>
        <nav className="flex flex-col gap-0.5">
          {NAV_CONFIG.map((entry) => {

            // ── GROUP ─────────────────────────────────────────────────────
            if (isGroup(entry)) {
              const hasAny = entry.codes.some(c => hasAccess(c))
              if (!hasAny) return null

              const groupHasActive = entry.items.some(i =>
                isActive(i.href) || (i.subItems?.some(s => isActive(s.href)) ?? false)
              )
              const isOpen = openGroups[entry.key]

              return (
                <div key={entry.key} className="mb-0.5">
                  {/* Group header button */}
                  <button
                    onClick={() => toggleGroup(entry.key)}
                    className={cn(
                      "w-full flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[10px] font-black tracking-wider transition-all uppercase",
                      groupHasActive
                        ? "text-amber-500 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/10"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                    )}
                  >
                    <entry.icon className={cn("h-3.5 w-3.5 shrink-0", groupHasActive ? "text-amber-500" : "text-slate-400")} />
                    <span className="flex-1 text-left">{entry.label}</span>
                    {isOpen
                      ? <ChevronDown className="h-3 w-3 text-slate-400" />
                      : <ChevronRight className="h-3 w-3 text-slate-400" />
                    }
                  </button>

                  {/* Group items */}
                  {isOpen && (
                    <div className="mt-0.5 ml-4 pl-2.5 border-l-2 border-slate-100 dark:border-slate-700/60 flex flex-col gap-0.5">
                      {entry.items.map((child) => {
                        if (!hasAccess(child.code)) return null
                        const childActive = isActive(child.href)
                        const subActive = child.subItems?.some(s => isActive(s.href)) ?? false
                        const highlight = childActive || subActive

                        return (
                          <div key={child.href}>
                            <Link
                              href={child.href}
                              className={cn(
                                "flex items-center gap-2 rounded-md px-2 py-1.5 text-[10px] font-bold tracking-wider transition-all uppercase",
                                highlight
                                  ? "bg-amber-500 text-white shadow-md shadow-amber-500/20"
                                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                              )}
                            >
                              <child.icon className={cn("h-3 w-3 shrink-0", highlight ? "text-white" : "text-slate-400")} />
                              {child.name}
                            </Link>

                            {/* Sub-items (Advanced Assay under Diamond Drilling) */}
                            {child.subItems && highlight && (
                              <div className="mt-0.5 ml-3 pl-2 border-l border-amber-200/60 dark:border-amber-700/40 flex flex-col gap-0.5">
                                {child.subItems.map((sub) => {
                                  if (!hasAccess(sub.code)) return null
                                  const subIsActive = isActive(sub.href)
                                  return (
                                    <Link
                                      key={sub.href}
                                      href={sub.href}
                                      className={cn(
                                        "flex items-center gap-2 rounded-md px-2 py-1.5 text-[10px] font-bold tracking-wider transition-all uppercase",
                                        subIsActive
                                          ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                                          : "text-slate-500 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-700"
                                      )}
                                    >
                                      <sub.icon className={cn("h-3 w-3 shrink-0", subIsActive ? "text-amber-500" : "text-slate-400")} />
                                      {sub.name}
                                    </Link>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            }

            // ── LEAF ITEM ─────────────────────────────────────────────────
            const leaf = entry as NavLeaf
            if (!hasAccess(leaf.code)) return null
            const active = isActive(leaf.href)
            return (
              <Link
                key={leaf.href}
                href={leaf.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[10px] font-bold tracking-wider transition-all uppercase",
                  active
                    ? "bg-amber-500 text-white shadow-md shadow-amber-500/20"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                )}
              >
                <leaf.icon className={cn("h-3.5 w-3.5 shrink-0", active ? "text-white" : "text-slate-400")} />
                {leaf.name}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <div className="p-2 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-0.5">
        <Link
          href="/settings"
          className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[10px] font-bold tracking-wider text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-white transition-all uppercase"
        >
          <Settings className="h-3.5 w-3.5" />
          Settings
        </Link>
        <button
          onClick={signOut}
          className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[10px] font-bold tracking-wider text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 transition-all w-full text-left uppercase"
        >
          <LogOut className="h-3.5 w-3.5" />
          Abort Session
        </button>
      </div>
    </div>
  )
}
