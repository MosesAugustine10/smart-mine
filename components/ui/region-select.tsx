"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronDown, Check, Search, MapPin } from "lucide-react"
import { TANZANIA_REGIONS } from "@/lib/constants/regions"
import { cn } from "@/lib/utils"

interface RegionSelectProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function RegionSelect({
  value,
  onChange,
  placeholder = "Select region...",
  className,
  disabled = false,
}: RegionSelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const containerRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const filtered = TANZANIA_REGIONS.filter((r) =>
    r.toLowerCase().includes(search.toLowerCase())
  )

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch("")
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  // Focus search input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 50)
    }
  }, [open])

  const handleSelect = (region: string) => {
    onChange(region)
    setOpen(false)
    setSearch("")
  }

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "w-full flex items-center justify-between gap-2 h-12 px-4 rounded-xl border-2 bg-white text-sm font-medium transition-all",
          "hover:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30",
          open ? "border-amber-500 ring-2 ring-amber-500/20" : "border-slate-200",
          !value && "text-slate-400",
          disabled && "opacity-50 cursor-not-allowed bg-slate-50"
        )}
      >
        <span className="flex items-center gap-2 truncate">
          <MapPin className="w-4 h-4 text-amber-500 shrink-0" />
          {value || placeholder}
        </span>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-white border-2 border-slate-200 rounded-2xl shadow-2xl shadow-slate-200/60 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Search Box */}
          <div className="p-3 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tafuta mkoa... / Search region..."
                className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 font-medium"
              />
            </div>
          </div>

          {/* Region List */}
          <div className="max-h-60 overflow-y-auto overscroll-contain py-1">
            {filtered.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-400 font-medium">
                No region found
              </div>
            ) : (
              filtered.map((region) => (
                <button
                  key={region}
                  type="button"
                  onClick={() => handleSelect(region)}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-left transition-colors",
                    "hover:bg-amber-50 hover:text-amber-700",
                    value === region
                      ? "bg-amber-50 text-amber-700 font-bold"
                      : "text-slate-700"
                  )}
                >
                  <span>{region}</span>
                  {value === region && (
                    <Check className="w-4 h-4 text-amber-600 shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>

          {/* Footer hint */}
          <div className="px-4 py-2 border-t border-slate-100 bg-slate-50">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {filtered.length} of {TANZANIA_REGIONS.length} regions
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
