import { Route, RouteSegment, ValidationResult, ValidationViolation, Coordinate } from './types.js';

/**
 * Calculates the great-circle distance between two points on the Earth's surface
 * using the Haversine formula (returns distance in meters).
 */
export function calculateHaversineDistance(coord1: Coordinate, coord2: Coordinate): number {
  const [lon1, lat1] = coord1;
  const [lon2, lat2] = coord2;

  const R = 6371e3; // Earth's radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // in meters
}

/**
 * RuleBasedValidator executes compliance checks on routes to verify data integrity,
 * physical feasibility, and carbon reporting consistency.
 */
export class RuleBasedValidator {
  
  // Standard carbon savings factors per mode in kgCO2 per meter
  private static readonly CARBON_FACTORS: Record<string, number> = {
    walking: 0.00020, // 0.20 kg/km
    cycling: 0.00018, // 0.18 kg/km
    bus: 0.00012,     // 0.12 kg/km
    subway: 0.00015,  // 0.15 kg/km
  };

  /**
   * Validates a Route against physical and logical QA/QC rules.
   */
  public validate(route: Route): ValidationResult {
    const violations: ValidationViolation[] = [];

    // Rule 1: Segment checks (speed, carbon, internal continuity)
    route.segments.forEach((segment, idx) => {
      this.checkWalkingSpeed(segment, idx, violations);
      this.checkSegmentContinuity(segment, idx, violations);
    });

    // Rule 2: Inter-segment spatial continuity (Transfer Continuity)
    this.checkTransferContinuity(route.segments, violations);

    // Rule 3: Carbon savings calibration check
    this.checkCarbonSavingsSanity(route, violations);

    // Evaluate overall status
    let status: 'PASS' | 'WARN' | 'FAIL' = 'PASS';
    const hasFail = violations.some(v => v.severity === 'FAIL');
    const hasWarn = violations.some(v => v.severity === 'WARN');

    if (hasFail) {
      status = 'FAIL';
    } else if (hasWarn) {
      status = 'WARN';
    }

    return {
      routeId: route.id,
      isValid: status !== 'FAIL',
      status,
      violations,
      checkedAt: new Date(),
    };
  }

  /**
   * Rule 1.1: Walk Speed Check
   * Standard human walking speed ranges from 2 km/h (slow walk) to 8 km/h (fast walk/jog).
   * v > 8 km/h indicates impossible speed (e.g. vehicle riding classified as walk) -> FAIL.
   * v < 1.5 km/h indicates abnormal congestion or stalling -> WARN.
   */
  private checkWalkingSpeed(segment: RouteSegment, index: number, violations: ValidationViolation[]): void {
    if (segment.mode !== 'walking') return;

    if (segment.durationSeconds <= 0) {
      violations.push({
        ruleName: 'WALK_SPEED_CHECK',
        severity: 'FAIL',
        message: 'Invalid segment duration (<= 0 seconds).',
        segmentIndex: index,
      });
      return;
    }

    const speedMps = segment.distanceMeters / segment.durationSeconds;
    const speedKmh = speedMps * 3.6;

    if (speedKmh > 8.0) {
      violations.push({
        ruleName: 'WALK_SPEED_CHECK',
        severity: 'FAIL',
        message: `Impossible walking speed of ${speedKmh.toFixed(2)} km/h (must be <= 8 km/h).`,
        segmentIndex: index,
      });
    } else if (speedKmh < 1.5) {
      violations.push({
        ruleName: 'WALK_SPEED_CHECK',
        severity: 'WARN',
        message: `Extremely slow walking speed of ${speedKmh.toFixed(2)} km/h (suspiciously stagnant).`,
        segmentIndex: index,
      });
    }
  }

  /**
   * Rule 1.2: Segment Spatial Integrity
   * Ensures startCoords and endCoords are reasonably matching the internal geomPath coordinates
   */
  private checkSegmentContinuity(segment: RouteSegment, index: number, violations: ValidationViolation[]): void {
    if (!segment.geomPath || segment.geomPath.length === 0) return;

    const startGeom = segment.geomPath[0];
    const endGeom = segment.geomPath[segment.geomPath.length - 1];

    const startDistance = calculateHaversineDistance(segment.startCoords, startGeom);
    const endDistance = calculateHaversineDistance(segment.endCoords, endGeom);

    if (startDistance > 30) {
      violations.push({
        ruleName: 'SEGMENT_GEOMETRY_MISMATCH',
        severity: 'WARN',
        message: `Start coordinates deviate from path start by ${startDistance.toFixed(1)} meters.`,
        segmentIndex: index,
      });
    }

    if (endDistance > 30) {
      violations.push({
        ruleName: 'SEGMENT_GEOMETRY_MISMATCH',
        severity: 'WARN',
        message: `End coordinates deviate from path end by ${endDistance.toFixed(1)} meters.`,
        segmentIndex: index,
      });
    }
  }

  /**
   * Rule 2: Spatial Continuity of Transfers
   * End coordinate of segment N must match the start coordinate of segment N+1 within a 50m tolerance.
   * Discrepancies > 50m indicate broken routes, telemetry gaps, or teleportation -> FAIL.
   */
  private checkTransferContinuity(segments: RouteSegment[], violations: ValidationViolation[]): void {
    for (let i = 0; i < segments.length - 1; i++) {
      const currentEnd = segments[i].endCoords;
      const nextStart = segments[i + 1].startCoords;

      const gapDistance = calculateHaversineDistance(currentEnd, nextStart);

      if (gapDistance > 50.0) {
        violations.push({
          ruleName: 'TRANSFER_GAP_CHECK',
          severity: 'FAIL',
          message: `Disconnection detected at transfer ${i} -> ${i + 1}. Distance gap is ${gapDistance.toFixed(1)}m (limit 50m).`,
          segmentIndex: i,
        });
      } else if (gapDistance > 15.0) {
        violations.push({
          ruleName: 'TRANSFER_GAP_CHECK',
          severity: 'WARN',
          message: `Slight GPS drift at transfer ${i} -> ${i + 1}. Distance gap is ${gapDistance.toFixed(1)}m.`,
          segmentIndex: i,
        });
      }
    }
  }

  /**
   * Rule 3: Carbon Savings Calibrated Sanity Check
   * Compares reported carbon savings against standard physical calculation (within 5% tolerance).
   * Over-reporting or discrepancy triggers WARNING.
   */
  private checkCarbonSavingsSanity(route: Route, violations: ValidationViolation[]): void {
    let calculatedCarbonKg = 0;

    route.segments.forEach(segment => {
      const factor = RuleBasedValidator.CARBON_FACTORS[segment.mode] || 0;
      calculatedCarbonKg += segment.distanceMeters * factor;
    });

    const difference = Math.abs(route.carbonSavingsKg - calculatedCarbonKg);
    const tolerance = calculatedCarbonKg * 0.05; // 5% tolerance

    if (difference > tolerance) {
      violations.push({
        ruleName: 'CARBON_SAVINGS_CALIBRATION',
        severity: 'WARN',
        message: `Reported savings of ${route.carbonSavingsKg.toFixed(3)} kg differs from computed physical value of ${calculatedCarbonKg.toFixed(3)} kg by ${((difference / calculatedCarbonKg) * 100).toFixed(1)}% (must be <= 5%).`,
      });
    }
  }
}
