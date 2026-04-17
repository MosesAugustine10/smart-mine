import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { InventoryTransaction } from "./types"

/**
 * Professional Inventory Synchronization Engine
 * Handles automatic stock deduction and transaction logging across all modules.
 */
export async function recordInventoryUsage(params: {
    itemCode: string,
    quantity: number,
    module: 'BLASTING' | 'DRILLING' | 'DIAMOND_DRILLING' | 'FLEET',
    referenceId: string,
    notes?: string
}) {
    const supabase = getSupabaseBrowserClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    // 1. Fetch Item to verify stock and getting ID
    const { data: item, error: fetchError } = await supabase
        .from("inventory_items")
        .select("*")
        .eq("item_code", params.itemCode)
        .single()

    if (fetchError || !item) {
        console.warn(`[Inventory Sync] Item ${params.itemCode} not found in master ledger.`)
        return { success: false, error: "Item not found" }
    }

    // 2. Calculate New Stock
    const newStock = (item.current_stock || 0) - params.quantity
    const status = newStock <= (item.minimum_stock || 0) ? 'low' : 'optimal'

    // 3. Update Inventory Item
    const { error: updateError } = await supabase
        .from("inventory_items")
        .update({ 
            current_stock: newStock,
            status: status,
            last_updated: newStock.toString(), // Store stock move for UI
            updated_at: new Date().toISOString()
        })
        .eq("id", item.id)

    if (updateError) throw updateError

    // 4. Record Transaction for Audit Trail
    const transaction: Partial<InventoryTransaction> = {
        company_id: item.company_id,
        item_id: item.id,
        item_code: item.item_code,
        type: 'OUT',
        quantity: params.quantity,
        date: new Date().toISOString(),
        module: params.module,
        reference_id: params.referenceId,
        user_id: user?.id || 'system',
        notes: params.notes || `Automatic deduction from ${params.module} operation ${params.referenceId}`,
        created_at: new Date().toISOString()
    }

    const { error: transError } = await supabase
        .from("stock_transactions")
        .insert(transaction)

    if (transError) {
        console.error("[Inventory Sync] Failed to record transaction log", transError)
        // We don't throw here to avoid blocking the main operation if just the log fails
    }

    return { 
        success: true, 
        priorStock: item.current_stock, 
        newStock,
        isLow: status === 'low'
    }
}

/**
 * Bulk usage recording for multiple items (e.g., complete blast pattern)
 */
export async function recordBulkUsage(params: {
    items: { itemCode: string, quantity: number }[],
    module: 'BLASTING' | 'DRILLING' | 'DIAMOND_DRILLING' | 'FLEET',
    referenceId: string
}) {
    const results = []
    for (const entry of params.items) {
        if (entry.quantity > 0) {
            results.push(await recordInventoryUsage({
                ...entry,
                module: params.module,
                referenceId: params.referenceId
            }))
        }
    }
    return results
}
