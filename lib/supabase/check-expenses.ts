import { getSupabaseBrowserClient } from "./client"

async function checkTable() {
    const supabase = getSupabaseBrowserClient()
    const { data, error } = await supabase.from('expenses').select('*').limit(1)
    console.log({ data, error })
}
checkTable()
