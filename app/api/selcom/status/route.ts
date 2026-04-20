import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
    // 1. Check environment variables
    const keysPresent = !!(
        process.env.SELCOM_API_KEY &&
        process.env.SELCOM_API_SECRET
    )

    // 2. Check Database Feature Flag
    const { data: flag } = await supabase
        .from('system_flags')
        .select('is_enabled')
        .eq('flag_name', 'enable_selcom')
        .single()
    
    const dbEnabled = flag?.is_enabled === true

    return NextResponse.json({ 
        configured: keysPresent && dbEnabled 
    })
}
