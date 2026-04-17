import { NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  try {
    const { email, companyId, role, fullName } = await request.json()

    if (!email || !companyId) {
      return NextResponse.json({ error: 'Email and Company ID are required' }, { status: 400 })
    }

    const supabaseAdmin = getSupabaseAdminClient()

    // 1. Invite the user via Supabase Auth
    // This sends an invitation email automatically
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'invite',
        email: email,
        options: {
            data: { 
                full_name: fullName || 'Company Admin',
                company_id: companyId
            },
            redirectTo: `${new URL(request.url).origin}/auth/callback`
        }
    })

    if (inviteError) {
      return NextResponse.json({ error: inviteError.message }, { status: 500 })
    }

    const userId = inviteData.user.id
    const inviteLink = inviteData.properties.action_link

    // 2. Create/Update the user profile
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .upsert({
        id: userId,
        company_id: companyId,
        email: email,
        role: role || 'COMPANY_ADMIN',
        position: 'COMPANY_DIRECTOR',
        status: 'active'
      })

    if (profileError) {
        console.error('Profile creation error:', profileError)
    }

    // 3. Link to specific module user tables (Small or Medium)
    await supabaseAdmin.from('medium_scale_users').upsert({
        user_id: userId,
        company_id: companyId,
        role: 'Investor'
    })

    await supabaseAdmin.from('small_scale_users').upsert({
        user_id: userId,
        company_id: companyId,
        full_name: fullName || 'Admin',
        role: 'admin'
    })

    return NextResponse.json({ 
        message: 'Invitation link generated at zero cost', 
        inviteLink: inviteLink,
        userId: userId 
    })

  } catch (error: any) {
    console.error('System Owner Invite API Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
