import { NextRequest, NextResponse } from "next/server"
import { isWhatsAppAPIConfigured } from "@/lib/whatsapp"

// ── GET: WhatsApp Webhook Verification ───────────────────────────────────────
export async function GET(req: NextRequest) {
    if (!isWhatsAppAPIConfigured()) {
        return NextResponse.json({ error: "WhatsApp API not configured" }, { status: 503 })
    }

    const { searchParams } = new URL(req.url)
    const mode = searchParams.get("hub.mode")
    const token = searchParams.get("hub.verify_token")
    const challenge = searchParams.get("hub.challenge")

    if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
        console.log("[WhatsApp Webhook] ✅ Verified")
        return new NextResponse(challenge, { status: 200 })
    }

    return NextResponse.json({ error: "Verification failed" }, { status: 403 })
}

// ── POST: Receive Incoming WhatsApp Messages ──────────────────────────────────
export async function POST(req: NextRequest) {
    try {
        if (!isWhatsAppAPIConfigured()) {
            return NextResponse.json({ received: true }) // Silently accept
        }

        const body = await req.json()
        console.log("[WhatsApp Webhook] Incoming message:", JSON.stringify(body, null, 2))

        // Extract message details for future processing
        const entry = body?.entry?.[0]
        const changes = entry?.changes?.[0]
        const value = changes?.value
        const messages = value?.messages

        if (messages?.length > 0) {
            const msg = messages[0]
            const from = msg.from // Sender's phone number
            const text = msg.text?.body // Message text
            console.log(`[WhatsApp] Message from ${from}: ${text}`)
            // TODO: Add auto-reply logic here when needed
        }

        return NextResponse.json({ received: true })
    } catch (err: any) {
        console.error("[WhatsApp Webhook] Error:", err.message)
        return NextResponse.json({ received: true }) // Always return 200
    }
}
