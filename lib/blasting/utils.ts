// lib/blasting/utils.ts
import { SupabaseClient } from "@supabase/supabase-js"

export async function generateBlastNumber(supabase: SupabaseClient): Promise<string> {
  const year = new Date().getFullYear()
  const month = String(new Date().getMonth() + 1).padStart(2, '0')

  // Get the last blast number for this year/month
  const { data } = await supabase
    .from("blasting_operations")
    .select("blast_number")
    .ilike("blast_number", `BL-${year}${month}-%`)
    .order("blast_number", { ascending: false })
    .limit(1)

  let sequence = 1
  if (data && data.length > 0) {
    const lastNumber = data[0].blast_number
    const lastSeq = parseInt(lastNumber.split('-')[2])
    if (!isNaN(lastSeq)) {
      sequence = lastSeq + 1
    }
  }

  return `BL-${year}${month}-${String(sequence).padStart(3, '0')}`
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('sw-TZ', {
    style: 'currency',
    currency: 'TZS',
    maximumFractionDigits: 0
  }).format(amount || 0)
}

export function formatNumber(num: number, decimals: number = 1): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(decimals)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(decimals)}K`
  return num?.toFixed(decimals) || '0'
}

export function getVarianceDisplay(planned: number, actual: number): {
  color: string
  icon: string
  text: string
  percent: number
} {
  if (!actual || !planned) {
    return { color: "text-gray-400", icon: "none", text: "N/A", percent: 0 }
  }
  const variance = actual - planned
  const percent = (variance / planned) * 100
  if (variance <= 0) {
    return {
      color: "text-emerald-600",
      icon: "trending-down",
      text: `${Math.abs(percent).toFixed(1)}% under`,
      percent
    }
  }
  return {
    color: "text-red-600",
    icon: "trending-up",
    text: `${percent.toFixed(1)}% over`,
    percent
  }
}

export function getCostPerTonneColor(cost: number): string {
  if (!cost) return "text-gray-400"
  if (cost < 10000) return "text-emerald-600 font-bold"
  if (cost < 20000) return "text-amber-600"
  return "text-red-600"
}