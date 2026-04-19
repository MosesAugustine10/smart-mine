import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import crypto from "crypto"

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
    try {
        const body = await req.text()
        const webhookSecret = process.env.SELCOM_WEBHOOK_SECRET

        // ── Signature Verification ────────────────────────────────────────────────
        if (webhookSecret) {
            const signature = req.headers.get("x-signature") || req.headers.get("Digest") || ""
            const expectedSig = crypto
                .createHmac("sha256", webhookSecret)
                .update(body)
                .digest("base64")

            if (signature !== expectedSig) {
                console.error("Webhook signature mismatch")
                return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
            }
        }

        const payload = JSON.parse(body)
        console.log("Selcom Webhook received:", JSON.stringify(payload, null, 2))

        const {
            reference: selcomInvoiceId,
            order_id: invoiceNumber,
            payment_status: status,
            transid: transactionId
        } = payload

        // ── Find matching invoice ─────────────────────────────────────────────────
        const { data: invoice } = await supabase
            .from("invoices")
            .select("*, company_subscriptions(*), companies:company_id(name, phone)")
            .or(`selcom_invoice_id.eq.${selcomInvoiceId},invoice_number.eq.${invoiceNumber}`)
            .single()

        if (!invoice) {
            console.error("Webhook: Invoice haipatikani kwa:", selcomInvoiceId, invoiceNumber)
            return NextResponse.json({ received: true }) // Always return 200 to Selcom
        }

        const normalizedStatus = String(status || "").toUpperCase()

        if (normalizedStatus === "COMPLETED" || normalizedStatus === "PAID" || normalizedStatus === "SUCCESS") {
            // ── Mark invoice as PAID ──────────────────────────────────────────────
            await supabase.from("invoices").update({
                status: "paid",
                paid_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }).eq("id", invoice.id)

            // ── Activate subscription ─────────────────────────────────────────────
            if (invoice.subscription_id) {
                const billingCycle = invoice.company_subscriptions?.billing_cycle || "monthly"
                const next = new Date()
                if (billingCycle === "monthly") next.setMonth(next.getMonth() + 1)
                else if (billingCycle === "quarterly") next.setMonth(next.getMonth() + 3)
                else next.setFullYear(next.getFullYear() + 1)

                await supabase.from("company_subscriptions").update({
                    status: "active",
                    next_billing_date: next.toISOString().split("T")[0],
                    updated_at: new Date().toISOString()
                }).eq("id", invoice.subscription_id)

                // ── WhatsApp Confirmation (silently skips if no API keys) ───────
                try {
                    const { sendPaymentConfirmationViaWhatsApp } = await import("@/lib/whatsapp")
                    if (invoice.companies?.phone) {
                        await sendPaymentConfirmationViaWhatsApp(invoice.companies.phone, {
                            companyName: invoice.companies.name,
                            invoiceNumber: invoice.invoice_number,
                            amount: invoice.amount,
                            activatedUntil: next.toLocaleDateString("sw-TZ")
                        })
                    }
                } catch (waErr) {
                    console.error("WhatsApp Send Error (Confirmation):", waErr)
                }
            }

            console.log(`✅ Invoice ${invoice.invoice_number} marked PAID. TxID: ${transactionId}`)

        } else if (normalizedStatus === "FAILED" || normalizedStatus === "CANCELLED" || normalizedStatus === "EXPIRED") {
            await supabase.from("invoices").update({
                status: normalizedStatus === "EXPIRED" ? "expired" : "failed",
                updated_at: new Date().toISOString()
            }).eq("id", invoice.id)

            // Mark subscription as past_due
            if (invoice.subscription_id) {
                await supabase.from("company_subscriptions").update({
                    status: "past_due",
                    updated_at: new Date().toISOString()
                }).eq("id", invoice.subscription_id)
            }

            console.log(`❌ Invoice ${invoice.invoice_number} status: ${normalizedStatus}`)
        }

        // Always respond 200 to Selcom
        return NextResponse.json({ received: true, status: "ok" })

    } catch (err: any) {
        console.error("Webhook Error:", err)
        // Still return 200 to prevent Selcom retries flooding
        return NextResponse.json({ received: true, error: err.message }, { status: 200 })
    }
}
