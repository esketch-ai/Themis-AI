/**
 * Coordinate represents a GPS [longitude, latitude] pair.
 */
export type Coordinate = [number, number];

/**
 * Travel modes supported by the citizen routing engine.
 */
export type TravelMode = 'walking' | 'bus' | 'subway' | 'cycling';

/**
 * RouteSegment represents an individual leg of a route.
 */
export interface RouteSegment {
  mode: TravelMode;
  distanceMeters: number;   // Distance in meters
  durationSeconds: number;  // Duration in seconds
  startCoords: Coordinate;
  endCoords: Coordinate;
  geomPath?: Coordinate[];  // Detailed route geometry GPS points
}

/**
 * Route represents the complete itinerary of a citizen journey.
 */
export interface Route {
  id: string;
  segments: RouteSegment[];
  departureTime: Date;
  arrivalTime: Date;
  carbonSavingsKg: number;
}

/**
 * RouteBaselineProfile acts as the historical reference for a specific OD (Origin-Destination) pair
 * to catch regression deviations.
 */
export interface RouteBaselineProfile {
  routeId: string;
  startPoint: Coordinate;
  endPoint: Coordinate;
  baselineDurationSeconds: number;
  baselineDistanceMeters: number;
}

/**
 * ValidationViolation details a compliance rule breach.
 */
export interface ValidationViolation {
  ruleName: string;
  severity: 'WARN' | 'FAIL';
  message: string;
  segmentIndex?: number;
}

/**
 * ValidationResult outlines the report of the QA/QC execution.
 */
export interface ValidationResult {
  routeId: string;
  isValid: boolean;
  status: 'PASS' | 'WARN' | 'FAIL';
  violations: ValidationViolation[];
  checkedAt: Date;
}
