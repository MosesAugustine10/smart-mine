import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { sendTrialExpiryReminderViaWhatsApp } from "@/lib/whatsapp"

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// This route can be scheduled via Vercel Cron Jobs
// Example schedule: 0 9 * * * (Every morning at 9 AM)
export async function GET(req: NextRequest) {
    try {
        // Auth: Optional - you can check a CRON_SECRET header to prevent public abuse
        const authHeader = req.headers.get("Authorization")
        if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const now = new Date()
        const threeDaysFromNow = new Date()
        threeDaysFromNow.setDate(now.getDate() + 3)

        // Find companies whose trial expires in exactly 3 days, 1 day, or 0 days (today)
        const { data: subscriptions, error } = await supabase
            .from("company_subscriptions")
            .select("*, companies:company_id(name, phone)")
            .eq("status", "trial")
            .not("next_billing_date", "is", null)

        if (error) throw error

        let sentCount = 0

        for (const sub of subscriptions) {
            const expiryDate = new Date(sub.next_billing_date)
            const diffTime = expiryDate.getTime() - now.getTime()
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

            // Only notify if 3, 1, or 0 days left
            if ([0, 1, 3].includes(diffDays)) {
                if (sub.companies?.phone) {
                    await sendTrialExpiryReminderViaWhatsApp(
                        sub.companies.phone,
                        sub.companies.name,
                        diffDays
                    )
                    sentCount++
                }
            }
        }

        return NextResponse.json({
            success: true,
            processed: subscriptions.length,
            notified: sentCount,
            timestamp: now.toISOString()
        })

    } catch (err: any) {
        console.error("Cron Error (Trial Expiry):", err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
