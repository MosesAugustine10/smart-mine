"use client"

import { useTranslation } from "./language-context"
import { Button } from "@/components/ui/button"
import { Languages, Check } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function LanguageToggle() {
  const { language, setLanguage } = useTranslation()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="h-10 px-4 rounded-xl border-2 border-slate-100 dark:border-slate-800 bg-white/50 backdrop-blur-md flex items-center gap-2 transition-all hover:shadow-lg font-black uppercase text-[10px] tracking-widest group">
          <Languages className="w-4 h-4 text-blue-600 transition-transform group-hover:rotate-12" />
          <span>{language === 'en' ? 'ENGLISH' : 'KISWAHILI'}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-48 p-2 rounded-2xl border-2 shadow-2xl bg-white dark:bg-slate-900 border-slate-100">
        <DropdownMenuItem
          onClick={() => setLanguage('en')}
          className="h-10 rounded-xl cursor-pointer flex items-center justify-between px-4 group"
        >
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">English</span>
          </div>
          {language === 'en' && <Check className="w-4 h-4 text-emerald-500" />}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setLanguage('sw')}
          className="h-10 rounded-xl cursor-pointer flex items-center justify-between px-4 group"
        >
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Kiswahili</span>
          </div>
          {language === 'sw' && <Check className="w-4 h-4 text-emerald-500" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
