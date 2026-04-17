/**
 * Fuel Calibration Logic
 * Converts raw sensor values to actual liters using linear interpolation
 */
interface CalibrationPoint {
    raw_value: number;
    actual_liters: number;
}

export function calculateFuelLiters(rawValue: number, points: CalibrationPoint[]): number {
    if (points.length === 0) return 0;
    if (points.length === 1) return points[0].actual_liters;

    // Sort points by raw value
    const sorted = [...points].sort((a, b) => a.raw_value - b.raw_value);

    // If raw is below first point
    if (rawValue <= sorted[0].raw_value) return sorted[0].actual_liters;
    // If raw is above last point
    if (rawValue >= sorted[sorted.length - 1].raw_value) return sorted[sorted.length - 1].actual_liters;

    // Find the two points to interpolate between
    for (let i = 0; i < sorted.length - 1; i++) {
        const p1 = sorted[i];
        const p2 = sorted[i + 1];

        if (rawValue >= p1.raw_value && rawValue <= p2.raw_value) {
            // Linear Interpolation: y = y1 + ((x - x1) * (y2 - y1) / (x2 - x1))
            const liters = p1.actual_liters + 
                ((rawValue - p1.raw_value) * (p2.actual_liters - p1.actual_liters) / (p2.raw_value - p1.raw_value));
            return parseFloat(liters.toFixed(2));
        }
    }

    return 0;
}

/**
 * Fuel Theft Detection
 * Checks for sudden drops in fuel levels when engine is OFF
 */
export function detectFuelTheft(prevLiters: number, currentLiters: number, engineOn: boolean): boolean {
    if (engineOn) return false; // Normal consumption during operation
    
    const drop = prevLiters - currentLiters;
    const dropPercentage = (drop / prevLiters) * 100;

    // Threshold: More than 10% drop while engine is OFF
    return dropPercentage > 10;
}
