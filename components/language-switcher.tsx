"use client"

import * as React from "react"
import { Languages, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTranslation } from "@/components/language-context"

export function LanguageSwitcher() {
  const { language, setLanguage, t } = useTranslation()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-amber-900/20 transition-all border border-slate-200 dark:border-slate-700">
          <Languages className="h-[1.2rem] w-[1.2rem] text-slate-600 dark:text-slate-400" />
          <span className="sr-only">{t("selectLanguage")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[180px] rounded-2xl p-2 border-2 border-slate-100 dark:border-slate-800 shadow-xl">
        <DropdownMenuItem
          onClick={() => setLanguage("en")}
          className="flex items-center justify-between rounded-xl p-3 cursor-pointer focus:bg-amber-50 dark:focus:bg-amber-900/20"
        >
          <div className="flex items-center gap-3">
             <span className="text-xl">🇺🇸</span>
             <span className="font-bold text-xs uppercase tracking-widest">{t("english")}</span>
          </div>
          {language === "en" && <Check className="h-4 w-4 text-amber-600" />}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setLanguage("sw")}
          className="flex items-center justify-between rounded-xl p-3 cursor-pointer focus:bg-emerald-50 dark:focus:bg-emerald-900/20"
        >
          <div className="flex items-center gap-3">
             <span className="text-xl">🇹🇿</span>
             <span className="font-bold text-xs uppercase tracking-widest">{t("kiswahili")}</span>
          </div>
          {language === "sw" && <Check className="h-4 w-4 text-emerald-600" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
