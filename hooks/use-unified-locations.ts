import { useEffect, useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export interface VehicleLocation {
    vehicle_id: string;
    vehicle_name: string;
    plate_number: string;
    tracking_method: 'PHONE_GPS' | 'HARDWARE_TRACKER';
    latitude: number;
    longitude: number;
    speed: number;
    last_updated: string;
    current_source: 'phone' | 'hardware';
}

/**
 * Hook to subscribe to unified vehicle locations in realtime
 */
export function useUnifiedLocations() {
    const [locations, setLocations] = useState<VehicleLocation[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const supabase = getSupabaseBrowserClient();

        // 1. Initial Fetch
        const fetchInitial = async () => {
            const { data, error } = await supabase
                .from('unified_vehicle_locations')
                .select('*');
            
            if (data) setLocations(data as VehicleLocation[]);
            setLoading(false);
        };

        fetchInitial();

        // 2. Realtime Subscriptions
        // Note: Views cannot be directly subscribed to in Supabase.
        // We subscribe to the underlying tables and trigger a re-fetch or manual update.
        const channel = supabase
            .channel('vehicle-updates')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'vehicle_locations' },
                () => fetchInitial() // Re-fetch view on phone update
            )
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'hardware_locations' },
                () => fetchInitial() // Re-fetch view on hardware update
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    return { locations, loading };
}
