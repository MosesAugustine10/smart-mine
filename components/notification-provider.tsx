"use client"

import { createContext, useContext, useEffect, useState, useRef } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { BellRing } from "lucide-react"

interface NotificationContextValue {
  unreadCount: number
  clearCount: () => void
}

const NotificationContext = createContext<NotificationContextValue>({
  unreadCount: 0,
  clearCount: () => {},
})

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0)
  const { toast } = useToast()
  
  // Audio alarm referencing a standard browser beep or a custom ping from public/ folder
  const alarmSound = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    // We create a lightweight ping dynamically instead of requiring a file
    try {
      if (typeof window !== "undefined") {
         alarmSound.current = new Audio('data:audio/mp3;base64,//NExAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//NExAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq')
      }
    } catch (e) {
      console.warn("Audio initialization failed", e)
    }

    const supabase = getSupabaseBrowserClient()

    // Listen to ALL INSERTs on the public schema
    const channel = supabase
      .channel('global-alerts')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public' },
        (payload) => {
          handleNewInsert(payload)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const handleNewInsert = (payload: any) => {
    // Avoid triggering on logs or auth metadata
    if (payload.table.includes('audit') || payload.table.includes('log')) return

    // Format human-readable 
    const humanTable = payload.table.replace(/_/g, " ").toUpperCase()
    
    // Attempt to play sound
    if (alarmSound.current) {
        alarmSound.current.volume = 0.5
        alarmSound.current.play().catch(e => console.log('Audio autoplay blocked by browser', e))
    }

    setUnreadCount(prev => prev + 1)

    // Trigger visual toast
    toast({
      title: "New Transmission Received",
      description: `A new record was logged in the ${humanTable} module.`,
      duration: 8000,
    })
  }

  const clearCount = () => setUnreadCount(0)

  return (
    <NotificationContext.Provider value={{ unreadCount, clearCount }}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  return useContext(NotificationContext)
}
