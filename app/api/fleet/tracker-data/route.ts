import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

/**
 * GPS Hardware Ingestion Endpoint
 * Accepts JSON from Traccar Forwarding
 */
export async function POST(req: NextRequest) {
    try {
        const payload = await req.json();
        
        // Expected payload structure (Traccar format)
        // { "imei": "...", "timestamp": ..., "lat": ..., "lng": ..., "speed": ..., "fuel": ..., "ignition": ... }
        const { imei, timestamp, lat, lng, speed, fuel, ignition } = payload;

        if (!imei) {
            return NextResponse.json({ error: 'Missing IMEI' }, { status: 400 });
        }

        const supabase = getSupabaseBrowserClient();

        // 1. Check if device exists in vehicles table
        const { data: vehicle, error: vError } = await supabase
            .from('vehicles')
            .select('id, name')
            .eq('tracker_device_id', imei)
            .maybeSingle();

        if (vError) throw vError;

        if (!vehicle) {
            console.warn(`Unidentified Device Detected: ${imei}`);
            // Log to a system alerts table if needed
            return NextResponse.json({ status: 'unidentified', device: imei });
        }

        // 2. Insert into hardware_locations
        const { error: hError } = await supabase
            .from('hardware_locations')
            .insert({
                tracker_device_id: imei,
                latitude: lat,
                longitude: lng,
                speed: speed,
                fuel_level_raw: fuel,
                engine_status: ignition === 1 || ignition === true,
                timestamp: timestamp ? new Date(timestamp * 1000).toISOString() : new Date().toISOString(),
                raw_payload: payload
            });

        if (hError) throw hError;

        return NextResponse.json({ status: 'success', vehicle: vehicle.name });

    } catch (error: any) {
        console.error('GPS Ingestion Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
