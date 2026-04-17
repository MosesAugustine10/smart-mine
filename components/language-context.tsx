"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'
import { dictionary, LanType, TranslationKey } from '@/lib/i18n/dictionary'

interface LanguageContextType {
  language: LanType
  setLanguage: (lang: LanType) => void
  t: (key: TranslationKey) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<LanType>("en")

  // Load language from localStorage
  useEffect(() => {
    const savedLang = localStorage.getItem('mine_lang') as LanType
    if (savedLang && (savedLang === 'en' || savedLang === 'sw')) {
      setLanguageState(savedLang)
    }
  }, [])

  const setLanguage = (newLang: LanType) => {
    setLanguageState(newLang)
    localStorage.setItem('mine_lang', newLang)
  }

  const t = (key: TranslationKey): string => {
    // If the key exists in our dictionary, return it. Otherwise, return the key itself.
    // @ts-ignore
    return dictionary[language]?.[key] || dictionary.en?.[key] || key
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useTranslation() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    // Return a fallback t function to prevent crashing if used outside provider
    return {
        language: 'en' as LanType,
        setLanguage: () => {},
        t: (k: string) => k
    }
  }
  return context
}
