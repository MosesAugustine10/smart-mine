import * as turf from '@turf/turf';

interface LocationPing {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number; // Unix epoch ms
}

/**
 * Calculates a Trust Score (0-100) for a completed trip.
 * This is crucial for hybrid Phone GPS systems to flag manipulated or poor-quality trips.
 * 
 * @param pings Array of location pings recorded during the trip
 * @param haulRoadLine Turf.js LineString of the expected haul road
 * @param expectedDurationMs Expected duration of the trip
 * @returns number 0-100
 */
export function calculateTripTrustScore(
  pings: LocationPing[],
  haulRoadLine: any,
  expectedDurationMs: number
): number {
  if (pings.length === 0) return 0;

  // 1. Accuracy Metric (0-40 points)
  // Higher accuracy in GPS = better score. Accuracy > 50m starts losing points.
  let goodPings = 0;
  pings.forEach(p => {
    if (p.accuracy <= 50) goodPings++;
  });
  const accuracyRatio = goodPings / pings.length;
  const accuracyScore = accuracyRatio * 40;

  // 2. Spatial Deviation Metric (0-40 points)
  // How closely did they follow the haul road?
  let onRoutePings = 0;
  pings.forEach(p => {
    const point = turf.point([p.longitude, p.latitude]);
    const distanceToRouteMeters = turf.pointToLineDistance(point, haulRoadLine, { units: 'kilometers' }) * 1000;
    
    // We allow a 150m buffer off the haul road for natural variance/parking offsets
    if (distanceToRouteMeters <= 150) {
      onRoutePings++;
    }
  });
  const routeRatio = onRoutePings / pings.length;
  const routeScore = routeRatio * 40;

  // 3. Temporal Consistency Metric (Anti-Spoofing / App Killed) (0-20 points)
  // If a trip expected to take 30 mins has a 25 min gap between two pings, 
  // that means the app was killed or location spoofed.
  let maxTimeGapMs = 0;
  for (let i = 1; i < pings.length; i++) {
    const gap = pings[i].timestamp - pings[i - 1].timestamp;
    if (gap > maxTimeGapMs) maxTimeGapMs = gap;
  }

  // If the max gap is less than 3 minutes, give full 20 points.
  // If there's a 10 minute gap, 0 points.
  let consistencyScore = 20;
  const gapMinutes = maxTimeGapMs / 60000;
  
  if (gapMinutes > 10) consistencyScore = 0;
  else if (gapMinutes > 3) consistencyScore = 20 - ((gapMinutes - 3) * (20 / 7)); // Linear scale down

  // Final Tabulation
  const totalScore = Math.round(accuracyScore + routeScore + consistencyScore);
  
  // Guardrails just in case
  if (totalScore > 100) return 100;
  if (totalScore < 0) return 0;

  return totalScore;
}
