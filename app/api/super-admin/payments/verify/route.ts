import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { sendPaymentConfirmationViaWhatsApp } from "@/lib/whatsapp"

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
    try {
        // ── Auth: Verify Super Admin via Authorization header (Supabase JWT) ───
        const authHeader = req.headers.get("Authorization") || ""
        const token = authHeader.replace("Bearer ", "")

        if (!token) {
            return NextResponse.json({ error: "Unahitaji kuingia kwanza" }, { status: 401 })
        }

        const { data: { user }, error: authErr } = await createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            { global: { headers: { Authorization: `Bearer ${token}` } } }
        ).auth.getUser()

        if (authErr || !user) {
            return NextResponse.json({ error: "Token si sahihi" }, { status: 401 })
        }

        // Verify role is SUPER_ADMIN
        const { data: profile } = await supabase
            .from("user_profiles")
            .select("role")
            .eq("id", user.id)
            .single()

        if (profile?.role !== "SUPER_ADMIN") {
            return NextResponse.json({ error: "Huna ruhusa ya kutekeleza kitendo hiki" }, { status: 403 })
        }

        // ── Parse request ──────────────────────────────────────────────────────
        const { invoice_id, action } = await req.json()

        if (!invoice_id || !["approve", "reject"].includes(action)) {
            return NextResponse.json({ error: "Toa: invoice_id na action ('approve' au 'reject')" }, { status: 400 })
        }

        // ── Find invoice ───────────────────────────────────────────────────────
        const { data: invoice, error: fetchErr } = await supabase
            .from("invoices")
            .select("*, company_subscriptions(*), companies:company_id(name, phone)")
            .eq("id", invoice_id)
            .single()

        if (fetchErr || !invoice) {
            return NextResponse.json({ error: "Invoice haipatikani" }, { status: 404 })
        }

        if (invoice.status !== "pending_verification") {
            return NextResponse.json(
                { error: `Invoice ina hali ya '${invoice.status}'. Inahitajika iwe 'pending_verification'.` },
                { status: 409 }
            )
        }

        const now = new Date().toISOString()

        if (action === "approve") {
            // ── Update invoice → paid ──────────────────────────────────────────
            await supabase.from("invoices").update({
                status: "paid",
                paid_at: now,
                verified_by: user.id,
                verified_at: now,
                updated_at: now
            }).eq("id", invoice_id)

            // ── Activate subscription ──────────────────────────────────────────
            if (invoice.subscription_id) {
                const billingCycle = invoice.company_subscriptions?.billing_cycle || "monthly"
                const next = new Date()
                if (billingCycle === "quarterly") next.setMonth(next.getMonth() + 3)
                else if (billingCycle === "annually") next.setFullYear(next.getFullYear() + 1)
                else next.setMonth(next.getMonth() + 1) // default: monthly

                await supabase.from("company_subscriptions").update({
                    status: "active",
                    next_billing_date: next.toISOString().split("T")[0],
                    updated_at: now
                }).eq("id", invoice.subscription_id)

                // ── WhatsApp Confirmation (silently skips if no API keys) ───────
                const phone = invoice.companies?.phone
                if (phone) {
                    await sendPaymentConfirmationViaWhatsApp(phone, {
                        companyName: invoice.companies?.name || "Mteja",
                        invoiceNumber: invoice.invoice_number,
                        amount: invoice.amount,
                        activatedUntil: next.toLocaleDateString("sw-TZ")
                    })
                }
            }

            return NextResponse.json({
                success: true,
                message: "✅ Malipo yameidhinishwa. Mteja ana access kamili sasa.",
                action: "approved"
            })

        } else {
            // ── Reject ────────────────────────────────────────────────────────
            await supabase.from("invoices").update({
                status: "rejected",
                verified_by: user.id,
                verified_at: now,
                updated_at: now
            }).eq("id", invoice_id)

            return NextResponse.json({
                success: true,
                message: "❌ Ombi la malipo limekataliwa.",
                action: "rejected"
            })
        }

    } catch (err: any) {
        console.error("Verify Payment Error:", err)
        return NextResponse.json({ error: err.message || "Kosa la ndani" }, { status: 500 })
    }
}
