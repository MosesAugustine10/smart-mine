import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { invoice_id, payment_method, transaction_id, amount, sender_phone } = body

        // ── Validate required fields ───────────────────────────────────────────
        if (!invoice_id || !payment_method || !transaction_id) {
            return NextResponse.json(
                { error: "Tafadhali jaza: invoice_id, payment_method, na transaction_id" },
                { status: 400 }
            )
        }

        const validMethods = ["manual_mpesa", "manual_tigo", "manual_airtel"]
        if (!validMethods.includes(payment_method)) {
            return NextResponse.json(
                { error: "Njia ya malipo si sahihi. Tumia: manual_mpesa, manual_tigo, au manual_airtel" },
                { status: 400 }
            )
        }

        // ── Find and validate invoice ──────────────────────────────────────────
        const { data: invoice, error: fetchErr } = await supabase
            .from("invoices")
            .select("id, status, amount, company_id")
            .eq("id", invoice_id)
            .single()

        if (fetchErr || !invoice) {
            return NextResponse.json({ error: "Invoice haipatikani" }, { status: 404 })
        }

        if (invoice.status !== "pending") {
            return NextResponse.json(
                { error: `Invoice hii ina hali ya '${invoice.status}'. Inahitajika iwe 'pending'.` },
                { status: 409 }
            )
        }

        // ── Update invoice to pending_verification ─────────────────────────────
        const { error: updateErr } = await supabase
            .from("invoices")
            .update({
                payment_method,
                manual_transaction_id: transaction_id,
                status: "pending_verification",
                updated_at: new Date().toISOString(),
                ...(sender_phone ? { sender_phone } : {})
            })
            .eq("id", invoice_id)

        if (updateErr) throw updateErr

        return NextResponse.json({
            success: true,
            message: "Malipo yamesubiri kuthibitishwa. Tutakujulisha mara moja baada ya kuthibitisha.",
            invoice_id,
            status: "pending_verification"
        })

    } catch (err: any) {
        console.error("Manual Submit Error:", err)
        return NextResponse.json({ error: err.message || "Kosa la ndani" }, { status: 500 })
    }
}
