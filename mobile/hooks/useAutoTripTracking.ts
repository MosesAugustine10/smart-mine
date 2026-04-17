import { useState, useEffect, useRef } from 'react';
// @ts-ignore
import * as Location from 'expo-location';
import * as turf from '@turf/turf';
import { getSupabaseBrowserClient } from '../../lib/supabase/client';

// -- Types --
type AppState = 'IDLE' | 'IN_PIT' | 'ON_TRIP' | 'AT_STOCKPILE';

interface Geofence {
  id: string;
  name: string;
  polygon: any; // Using any for geofence feature to simplify type compatibility
}

// -- Haul Road Coordinates (For Deviation Checking) --
// This should Ideally be fetched from the database
const HAUL_ROAD_LINE = turf.lineString([
  [32.905, -2.871], // Pit Exit
  [32.908, -2.868],
  [32.912, -2.864],
  [32.914, -2.878], // Stockpile Entry
]);

export function useAutoTripTracking(
  vehicleId: string,
  driverId: string,
  pitGeofence: Geofence | null,
  stockpileGeofence: Geofence | null
) {
  const supabase = getSupabaseBrowserClient();
  const [appState, setAppState] = useState<AppState>('IDLE');
  const [currentTripId, setCurrentTripId] = useState<string | null>(null);
  const locationSubscription = useRef<any>(null);
  
  // Deviations & Trust metrics
  const deviationTimer = useRef<any>(null);
  const locationCount = useRef(0);
  const goodAccuracyCount = useRef(0);

  // -- Heartbeat mechanism (App Killed Alert) --
  useEffect(() => {
    let heartbeatInterval: any;
    if (appState === 'ON_TRIP') {
      heartbeatInterval = setInterval(() => {
        supabase.from('vehicle_heartbeats').insert([{ vehicle_id: vehicleId, status: 'alive' }]);
      }, 60000); // 60s
    }
    return () => clearInterval(heartbeatInterval);
  }, [appState]);

  // -- Start Location Tracking --
  useEffect(() => {
    let isMounted = true;

    async function startTracking() {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      // Use Balanced Power initially. When ON_TRIP, we'd ideally restart this with BestForNavigation
      // For simplicity in this hook, we'll watch and dynamically filter.
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: appState === 'ON_TRIP' ? Location.Accuracy.BestForNavigation : Location.Accuracy.Balanced,
          timeInterval: appState === 'ON_TRIP' ? 5000 : 15000, // Faster updates on trip
          distanceInterval: appState === 'ON_TRIP' ? 10 : 50,
        },
        async (location: any) => {
          if (!isMounted) return;
          handleNewLocation(location);
        }
      );
    }

    startTracking();

    return () => {
      isMounted = false;
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
    };
  }, [appState]);

  // -- Core Geo-Logic --
  const handleNewLocation = async (loc: Location.LocationObject) => {
    const { latitude, longitude, accuracy, speed } = loc.coords;
    const currentPoint = turf.point([longitude, latitude]);

    // 1. Accuracy Drop Alert (Heuristic 1)
    if (accuracy && accuracy > 100) {
      logAlert("Dereva ameweka Battery Saver / Eneo la Mock Location.", "high");
    } else {
      locationCount.current++;
      goodAccuracyCount.current++;
    }

    // 2. Upload to database
    await supabase.from('phone_locations').insert([{
      vehicle_id: vehicleId,
      driver_id: driverId,
      latitude,
      longitude,
      speed_mps: speed,
      accuracy_m: accuracy
    }]);

    if (!pitGeofence || !stockpileGeofence) return;

    const inPit = turf.booleanPointInPolygon(currentPoint, pitGeofence.polygon);
    const inStockpile = turf.booleanPointInPolygon(currentPoint, stockpileGeofence.polygon);

    // STATE MACHINE LOGIC
    if (appState === 'IDLE' || appState === 'AT_STOCKPILE') {
      if (inPit) setAppState('IN_PIT');
    } 
    else if (appState === 'IN_PIT') {
      if (!inPit) {
        // Driver Exited Pit -> AUTO START TRIP
        startAutomatedTrip();
      }
    } 
    else if (appState === 'ON_TRIP') {
      // Check Route Deviation (Heuristic 2)
      checkRouteDeviation(currentPoint);

      if (inStockpile) {
        // Driver Entered Stockpile -> AUTO STOP TRIP
        stopAutomatedTrip();
      }
    }
  };

  const startAutomatedTrip = async () => {
    setAppState('ON_TRIP');
    locationCount.current = 0;
    goodAccuracyCount.current = 0;

    const { data } = await supabase.from('equipment_payload_logs').insert([{
      vehicle_id: vehicleId,
      status: 'in_transit',
      start_time: new Date().toISOString()
    }]).select().single();
    
    if (data) setCurrentTripId(data.id);
  };

  const stopAutomatedTrip = async () => {
    setAppState('AT_STOCKPILE');
    if (deviationTimer.current) clearTimeout(deviationTimer.current);

    // Calculate Trust Score
    const trustScore = calculateTrustScore();

    if (currentTripId) {
      await supabase.from('equipment_payload_logs').update({
        status: 'arrived',
        end_time: new Date().toISOString(),
        trust_score: trustScore
      }).eq('id', currentTripId);
    }
    setCurrentTripId(null);
  };

  const checkRouteDeviation = (currentPoint: any) => {
    // Distance from current point to the haul road line (in meters)
    const distanceKm = turf.pointToLineDistance(currentPoint, HAUL_ROAD_LINE, { units: 'kilometers' });
    const distanceMeters = distanceKm * 1000;

    if (distanceMeters > 150) {
      if (!deviationTimer.current) {
        // Start 5-minute timer
        deviationTimer.current = setTimeout(() => {
           logAlert("Driver >150m off haul road for >5 mins", "medium");
        }, 300000);
      }
    } else {
      // Back on track, clear timer
      if (deviationTimer.current) {
        clearTimeout(deviationTimer.current);
        deviationTimer.current = null;
      }
    }
  };

  const calculateTrustScore = () => {
    // Very simple ratio of high accuracy pings vs total pings. 
    // Further complex logic can be found in trip-trust.ts
    if (locationCount.current === 0) return 0;
    return Math.floor((goodAccuracyCount.current / locationCount.current) * 100);
  };

  const logAlert = async (message: string, severity: string) => {
    await supabase.from('safety_incidents').insert([{
      title: "Geofence / GPS Anomaly",
      description: message,
      severity: severity,
      equipment_involved: vehicleId
    }]);
  };

  return { appState, currentTripId };
}
