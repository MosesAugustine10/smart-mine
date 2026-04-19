import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import crypto from "crypto"

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function generateInvoiceNumber(): string {
    const year = new Date().getFullYear()
    const rand = Math.floor(10000 + Math.random() * 90000)
    return `INV-${year}-${rand}`
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { company_id, subscription_id, amount, description, billing_cycle } = body

        if (!company_id || !amount || !description) {
            return NextResponse.json({ error: "Fields zinakosekana: company_id, amount, description" }, { status: 400 })
        }

        // Verify company exists
        const { data: company, error: companyErr } = await supabase
            .from("companies")
            .select("id, name, phone, email")
            .eq("id", company_id)
            .single()

        if (companyErr || !company) {
            return NextResponse.json({ error: "Kampuni haipatikani" }, { status: 404 })
        }

        const invoiceNumber = generateInvoiceNumber()

        // ── Call Selcom API ───────────────────────────────────────────────────────
        const selcomApiKey = process.env.SELCOM_API_KEY
        const selcomApiSecret = process.env.SELCOM_API_SECRET
        const selcomBaseUrl = process.env.SELCOM_BASE_URL || "https://apigw.selcommobile.com/v1"

        let selcomInvoiceId: string | null = null
        let paymentLink: string | null = null

        if (selcomApiKey && selcomApiSecret) {
            const timestamp = new Date().toISOString()
            const signaturePayload = `${selcomApiKey}${timestamp}${invoiceNumber}`
            const signature = crypto
                .createHmac("sha256", selcomApiSecret)
                .update(signaturePayload)
                .digest("base64")

            const selcomPayload = {
                vendor: selcomApiKey,
                order_id: invoiceNumber,
                buyer_email: company.email || "noemail@smartmine.tz",
                buyer_name: company.name,
                buyer_phone: company.phone?.replace(/\D/g, "") || "",
                amount: amount,
                currency: "TZS",
                memo: description,
                webhook: `${process.env.NEXT_PUBLIC_APP_URL}/api/selcom/webhook`,
                expiry: "2880", // 48 hours
                header_keys: `Content-Type:Accept:timestamp:signed-fields`,
                header_values: `application/json:application/json:${timestamp}:`
            }

            try {
                const selcomRes = await fetch(`${selcomBaseUrl}/checkout/create-order`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json",
                        "Authorization": `SELCOM ${selcomApiKey}`,
                        "Digest-Method": "HS256",
                        "Digest": signature,
                        "Timestamp": timestamp,
                        "Signed-Fields": "vendor,order_id,buyer_email,buyer_name,buyer_phone,amount,currency,memo"
                    },
                    body: JSON.stringify(selcomPayload)
                })
                const selcomData = await selcomRes.json()
                if (selcomData?.result === "SUCCESS") {
                    selcomInvoiceId = selcomData.data?.reference
                    paymentLink = selcomData.data?.payment_gateway_url || selcomData.data?.qr_code_url
                }
            } catch (selcomErr) {
                console.error("Selcom API Error:", selcomErr)
                // Continue even if Selcom fails — we still save the invoice locally
            }
        }

        // ── Save Invoice to DB ────────────────────────────────────────────────────
        const { data: invoice, error: invErr } = await supabase
            .from("invoices")
            .insert({
                company_id,
                subscription_id: subscription_id || null,
                selcom_invoice_id: selcomInvoiceId,
                invoice_number: invoiceNumber,
                amount,
                currency: "TZS",
                description,
                status: "pending",
                payment_link: paymentLink
            })
            .select()
            .single()

        if (invErr) throw invErr

        // ── WhatsApp Notification (silently skips if no API keys) ───────────────
        try {
            const { sendInvoiceViaWhatsApp } = await import("@/lib/whatsapp")
            await sendInvoiceViaWhatsApp(company.phone, {
                invoiceNumber,
                companyName: company.name,
                amount,
                paymentLink: paymentLink || `${process.env.NEXT_PUBLIC_APP_URL}/pay/${invoice.id}`,
            })
        } catch (waErr) {
            console.error("WhatsApp Send Error (Invoice):", waErr)
        }

        return NextResponse.json({
            success: true,
            invoice_number: invoiceNumber,
            payment_link: paymentLink,
            invoice_id: invoice.id,
            selcom_connected: !!selcomInvoiceId,
            message: selcomInvoiceId
                ? "Invoice imetengenezwa na Selcom payment link imewekwa."
                : "Invoice imehifadhiwa. Weka SELCOM_API_KEY kwa payment link ya moja kwa moja."
        })

    } catch (err: any) {
        console.error("Create Invoice Error:", err)
        return NextResponse.json({ error: err.message || "Kosa la ndani" }, { status: 500 })
    }
}
