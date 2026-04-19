import { createBrowserClient } from '@supabase/ssr'

export function getSupabaseBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

  // Use globalThis to persist the instance across NextJS HMR in dev mode
  if (!(globalThis as any).__SUPABASE_BROWSER_CLIENT) {
    (globalThis as any).__SUPABASE_BROWSER_CLIENT = createBrowserClient(
      supabaseUrl,
      supabaseKey
    )
  }

  return (globalThis as any).__SUPABASE_BROWSER_CLIENT
}
