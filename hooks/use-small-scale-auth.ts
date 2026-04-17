"use client"

import { useEffect, useState } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export const useSmallScaleAuth = () => {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    const checkAuth = async () => {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        setLoading(false)
        return
      }

      // Fetch SSM role and trial status
      const { data: ssmUser, error: ssmError } = await supabase
        .from('small_scale_users')
        .select('*, small_scale_companies(name, primary_phone_number)')
        .eq('user_id', session.user.id)
        .maybeSingle()

      if (ssmError) {
        setError(ssmError.message)
      } else if (ssmUser) {
        // Check trial status
        const trialEnded = ssmUser.trial_ends_at && new Date(ssmUser.trial_ends_at) < new Date()
        setUser({ ...ssmUser, trialEnded })
      }

      setLoading(false)
    }

    checkAuth()
  }, [])

  const loginWithPin = async (pin: string) => {
    // 1. Verify session exists
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error("No active session. Please verify phone via TOTP first.")

    // 2. verify PIN against hash in small_scale_users
    // In production, this would be a server-side call or edge function
    // For the demo/hook logic, we assume it's validated
    const { data: isValid } = await supabase.rpc('verify_ssm_pin', { pin_input: pin })
    
    if (isValid) {
      router.push(user?.role === 'admin' ? '/chimbo/dashboard' : '/chimbo/shimo-leo')
    } else {
      throw new Error("Invalid PIN")
    }
  }

  return {
    user,
    loading,
    error,
    loginWithPin,
    isAdmin: user?.role === 'admin',
    isSupervisor: user?.role === 'supervisor',
    isTrialActive: !user?.trialEnded
  }
}
