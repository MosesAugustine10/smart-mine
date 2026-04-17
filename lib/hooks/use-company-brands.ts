"use client"

import { useState, useEffect } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useAuth } from "@/components/auth-provider"

export interface CompanyBrand {
  id: string
  company_id: string
  brand_name: string
  logo_url: string | null
  is_default: boolean
}

export function useCompanyBrands() {
  const { profile } = useAuth()
  const [brands, setBrands] = useState<CompanyBrand[]>([])
  const [selectedBrand, setSelectedBrand] = useState<CompanyBrand | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile?.company_id) {
      setLoading(false)
      return
    }

    // ─── DEMO MODE BYPASS ────────────────────────────────────────────────────
    const isDemo = typeof window !== 'undefined' && localStorage.getItem("demo_mode") === "true";
    if (isDemo) {
        setBrands([
            { id: 'b1', company_id: 'c1', brand_name: "Amogtech Mining", logo_url: null, is_default: true },
            { id: 'b2', company_id: 'c1', brand_name: "ONE4S Geomine", logo_url: null, is_default: false },
        ])
        setSelectedBrand({ id: 'b1', company_id: 'c1', brand_name: "Amogtech Mining", logo_url: null, is_default: true })
        setLoading(false)
        return
    }
    // ─────────────────────────────────────────────────────────────────────────

    async function fetchBrands() {
      if (!profile?.company_id) return
      try {
        const supabase = getSupabaseBrowserClient()
        const { data, error } = await supabase
          .from("company_brands")
          .select("*")
          .eq("company_id", profile.company_id)
          .order("is_default", { ascending: false })

        if (error) throw error

        setBrands(data || [])
        if (data && data.length > 0) {
          setSelectedBrand(data.find(b => b.is_default) || data[0])
        }
      } catch (err) {
        console.error("Error fetching company brands:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchBrands()
  }, [profile?.company_id])

  const isMultiBrand = brands.length > 1

  return {
    brands,
    selectedBrand,
    setSelectedBrand,
    isMultiBrand,
    loading
  }
}
