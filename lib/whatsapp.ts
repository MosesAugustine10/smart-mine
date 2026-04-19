/**
 * lib/whatsapp.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * WhatsApp Business API Utility — Smart Mine Pro
 *
 * DESIGN: All functions silently skip (no errors thrown) when API keys are
 * missing. The existing wa.me links on the landing page are UNTOUCHED.
 * The moment WHATSAPP_PHONE_NUMBER_ID + WHATSAPP_ACCESS_TOKEN are added to
 * .env, automated messaging activates with zero code changes.
 */

import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const WA_API_VERSION = "v18.0"
const WA_BASE = `https://graph.facebook.com/${WA_API_VERSION}`

// ─── Configuration Check ──────────────────────────────────────────────────────
export function isWhatsAppAPIConfigured(): boolean {
    return !!(
        process.env.WHATSAPP_PHONE_NUMBER_ID &&
        process.env.WHATSAPP_ACCESS_TOKEN
    )
}

// ─── Core Send Function ───────────────────────────────────────────────────────
export async function sendWhatsAppMessage(
    phoneNumber: string,
    message: string
): Promise<{ success: boolean; reason?: string; data?: any }> {
    // 1. Check Env Keys
    if (!isWhatsAppAPIConfigured()) {
        console.log(`[WhatsApp] API keys missing. Skipping automated message to ${phoneNumber}.`)
        return { success: false, reason: "api_not_configured" }
    }

    // 2. Check Database Feature Flag
    try {
        const { data: flag } = await supabase
            .from('system_flags')
            .select('is_enabled')
            .eq('flag_name', 'enable_whatsapp_api')
            .single()
        
        if (!flag?.is_enabled) {
            console.log(`[WhatsApp] Feature Flag DISABLED in DB. Skipping automated message to ${phoneNumber}.`)
            return { success: false, reason: "feature_flag_disabled" }
        }
    } catch (dbErr) {
        console.error("[WhatsApp] DB Flag Check Error (Assuming OFF):", dbErr)
        return { success: false, reason: "db_error" }
    }


    // Normalize phone: must be international format without + (e.g. 255712345678)
    const normalized = phoneNumber.replace(/\D/g, "").replace(/^0/, "255")

    try {
        const res = await fetch(
            `${WA_BASE}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
            {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    messaging_product: "whatsapp",
                    to: normalized,
                    type: "text",
                    text: { body: message },
                }),
            }
        )
        const data = await res.json()
        if (!res.ok) {
            console.error("[WhatsApp] API Error:", JSON.stringify(data))
            return { success: false, reason: "api_error", data }
        }
        console.log(`[WhatsApp] ✅ Message sent to ${normalized}`)
        return { success: true, data }
    } catch (err: any) {
        console.error("[WhatsApp] Network Error:", err.message)
        return { success: false, reason: "network_error" }
    }
}

// ─── Invoice Notification ─────────────────────────────────────────────────────
export async function sendInvoiceViaWhatsApp(
    phoneNumber: string,
    invoiceDetails: {
        invoiceNumber: string
        companyName: string
        amount: number
        paymentLink?: string
        dueDate?: string
    }
) {
    const { invoiceNumber, companyName, amount, paymentLink, dueDate } = invoiceDetails
    const message = [
        `🏔️ *SMART MINE PRO — Invoice Yako*`,
        ``,
        `Habari ${companyName}!`,
        `Invoice yako imetengenezwa na iko tayari kwa malipo.`,
        ``,
        `📋 *Namba ya Invoice:* ${invoiceNumber}`,
        `💰 *Kiasi:* TSh ${amount.toLocaleString()}`,
        dueDate ? `📅 *Tarehe ya Mwisho:* ${dueDate}` : "",
        ``,
        paymentLink
            ? `🔗 *Link ya Malipo:*\n${paymentLink}`
            : `📱 Tuma pesa kwa namba: 0623 310 006 (SMART MINE PRO)`,
        ``,
        `Kwa msaada: https://wa.me/255623310006`,
    ].filter(Boolean).join("\n")

    return sendWhatsAppMessage(phoneNumber, message)
}

// ─── Payment Confirmation ─────────────────────────────────────────────────────
export async function sendPaymentConfirmationViaWhatsApp(
    phoneNumber: string,
    paymentDetails: {
        companyName: string
        invoiceNumber: string
        amount: number
        activatedUntil?: string
    }
) {
    const { companyName, invoiceNumber, amount, activatedUntil } = paymentDetails
    const message = [
        `✅ *SMART MINE PRO — Malipo Yamethibitishwa!*`,
        ``,
        `Hongera ${companyName}! Malipo yako yamekubaliwa.`,
        ``,
        `📋 *Invoice:* ${invoiceNumber}`,
        `💰 *Kiasi Kilicholipwa:* TSh ${amount.toLocaleString()}`,
        activatedUntil ? `📅 *Aktive Hadi:* ${activatedUntil}` : "",
        ``,
        `Mfumo wako wa SMART MINE PRO uko tayari!`,
        `Ingia sasa: https://smartmine.co.tz`,
        ``,
        `Asante kwa kuamini SMART MINE PRO! 🏔️`,
    ].filter(Boolean).join("\n")

    return sendWhatsAppMessage(phoneNumber, message)
}

// ─── Trial Expiry Reminder ────────────────────────────────────────────────────
export async function sendTrialExpiryReminderViaWhatsApp(
    phoneNumber: string,
    companyName: string,
    daysLeft: number
) {
    const urgency = daysLeft <= 1 ? "🚨 *HARAKA!*" : daysLeft <= 3 ? "⚠️ *Tahadhari!*" : "ℹ️"
    const message = [
        `${urgency} *SMART MINE PRO — Ukumbusho wa Majaribio*`,
        ``,
        `Habari ${companyName}!`,
        ``,
        daysLeft <= 0
            ? `⛔ Muda wako wa majaribio umekwisha leo!`
            : `Muda wako wa majaribio ya BURE unakwisha baada ya siku *${daysLeft}*.`,
        ``,
        `💳 *Endelea kutumia SMART MINE PRO kwa TSh 25,000/mwezi*`,
        ``,
        `Lipa sasa kupitia M-Pesa, Tigo Pesa au Airtel Money:`,
        `📱 *0623 310 006* (SMART MINE PRO)`,
        ``,
        `Au zungumza nasi hapa: https://wa.me/255623310006`,
    ].filter(Boolean).join("\n")

    return sendWhatsAppMessage(phoneNumber, message)
}

// ─── Simple wa.me Link Builder (fallback — no API needed) ────────────────────
export function buildWaLink(phone: string, message: string): string {
    const normalized = phone.replace(/\D/g, "").replace(/^0/, "255")
    return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`
}
