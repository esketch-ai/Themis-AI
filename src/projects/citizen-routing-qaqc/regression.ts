import { Route, RouteBaselineProfile, ValidationViolation } from './types.js';

export interface RegressionReport {
  routeId: string;
  hasRegression: boolean;
  violations: ValidationViolation[];
  metrics: {
    durationIncreasePercent: number;
    distanceDeviationPercent: number;
  };
}

/**
 * RegressionAnalyzer monitors route metrics against baseline profiles
 * to detect algorithmic degradation or routing engine path anomalies.
 */
export class RegressionAnalyzer {

  /**
   * Compares the current route metrics to the historical baseline profile.
   */
  public analyze(route: Route, baseline: RouteBaselineProfile): RegressionReport {
    const violations: ValidationViolation[] = [];
    
    // Calculate total duration from route start to end
    const routeDurationSeconds = (route.arrivalTime.getTime() - route.departureTime.getTime()) / 1000;
    
    // Calculate total physical distance from all segments
    const routeDistanceMeters = route.segments.reduce((acc, seg) => acc + seg.distanceMeters, 0);

    // 1. Duration Regression Check
    // Duration increase of > 20% compared to baseline duration indicates routing regression (e.g. excessive congestion or poor routing).
    const durationDiff = routeDurationSeconds - baseline.baselineDurationSeconds;
    const durationIncreasePercent = (durationDiff / baseline.baselineDurationSeconds) * 100;

    if (durationIncreasePercent > 20.0) {
      violations.push({
        ruleName: 'REGRESSION_DURATION_CHECK',
        severity: 'FAIL',
        message: `Route duration of ${routeDurationSeconds}s exceeds baseline of ${baseline.baselineDurationSeconds}s by ${durationIncreasePercent.toFixed(1)}% (limit +20%).`,
      });
    } else if (durationIncreasePercent < -15.0) {
      violations.push({
        ruleName: 'REGRESSION_DURATION_CHECK',
        severity: 'WARN',
        message: `Route duration is unexpectedly fast (${routeDurationSeconds}s vs baseline ${baseline.baselineDurationSeconds}s), check for telemetry data drops.`,
      });
    }

    // 2. Distance Deviation Check
    // Distance deviation of > 10% (either longer detour or shorter teleportation) indicates routing anomalies.
    const distanceDiff = Math.abs(routeDistanceMeters - baseline.baselineDistanceMeters);
    const distanceDeviationPercent = (distanceDiff / baseline.baselineDistanceMeters) * 100;

    if (distanceDeviationPercent > 10.0) {
      violations.push({
        ruleName: 'REGRESSION_DISTANCE_CHECK',
        severity: 'FAIL',
        message: `Route distance of ${routeDistanceMeters.toFixed(1)}m deviates from baseline of ${baseline.baselineDistanceMeters}m by ${distanceDeviationPercent.toFixed(1)}% (limit 10%).`,
      });
    } else if (distanceDeviationPercent > 5.0) {
      violations.push({
        ruleName: 'REGRESSION_DISTANCE_CHECK',
        severity: 'WARN',
        message: `Route distance of ${routeDistanceMeters.toFixed(1)}m has a minor detour of ${distanceDeviationPercent.toFixed(1)}% compared to baseline.`,
      });
    }

    return {
      routeId: route.id,
      hasRegression: violations.some(v => v.severity === 'FAIL'),
      violations,
      metrics: {
        durationIncreasePercent,
        distanceDeviationPercent,
      },
    };
  }
}
