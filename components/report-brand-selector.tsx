"use client"

import { useCompanyBrands, CompanyBrand } from "@/lib/hooks/use-company-brands"
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select"
import { Building2, Info } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface ReportBrandSelectorProps {
  onBrandChange?: (brand: CompanyBrand) => void
}

export function ReportBrandSelector({ onBrandChange }: ReportBrandSelectorProps) {
  const { brands, selectedBrand, setSelectedBrand, isMultiBrand, loading } = useCompanyBrands()

  if (loading || !isMultiBrand) return null

  const handleValueChange = (brandId: string) => {
    const brand = brands.find(b => b.id === brandId)
    if (brand) {
      setSelectedBrand(brand)
      if (onBrandChange) onBrandChange(brand)
    }
  }

  return (
    <div className="flex flex-col gap-2 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex items-center justify-between px-1">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
          <Building2 className="w-3 h-3" /> Report Branding (Subsidiary)
        </label>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Info className="w-3 h-3 text-slate-400" />
            </TooltipTrigger>
            <TooltipContent className="bg-slate-900 text-white border-0 rounded-xl">
              <p className="text-[9px] font-bold uppercase">Select which brand name/logo should appear on the generated report.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <Select value={selectedBrand?.id} onValueChange={handleValueChange}>
        <SelectTrigger className="h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-bold text-sm">
          <SelectValue placeholder="Select Brand" />
        </SelectTrigger>
        <SelectContent className="rounded-xl border-slate-200 dark:border-slate-800 shadow-2xl">
          {brands.map((brand) => (
            <SelectItem key={brand.id} value={brand.id} className="rounded-lg font-medium">
              {brand.brand_name} {brand.is_default && <span className="text-[8px] font-black text-emerald-500 ml-2 uppercase tracking-widest">(Default)</span>}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
