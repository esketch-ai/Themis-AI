import { describe, test, expect } from '../test-framework.js';
import { RuleBasedValidator } from '../validator.js';
import { RegressionAnalyzer } from '../regression.js';
import { Route, RouteBaselineProfile } from '../types.js';

// Base positions for Seoul City Hall and Gwanghwamun (distance ~700 meters)
const SEOUL_CITY_HALL: [number, number] = [126.9780, 37.5665];
const GWANGHWAMUN: [number, number] = [126.9768, 37.5728];
const DEAPYEONG_MOCK: [number, number] = [126.9800, 37.5700];

describe('Citizen Routing QA/QC Validator Tests', () => {
  const validator = new RuleBasedValidator();

  test('Valid Walking Speed Route - should PASS with status PASS', () => {
    const route: Route = {
      id: 'route-valid-walk',
      departureTime: new Date('2026-05-24T10:00:00Z'),
      arrivalTime: new Date('2026-05-24T10:10:00Z'),
      carbonSavingsKg: 0.14, // 700m * 0.00020 = 0.14 kg
      segments: [
        {
          mode: 'walking',
          distanceMeters: 700,
          durationSeconds: 600, // 700m / 600s * 3.6 = 4.2 km/h (Valid speed)
          startCoords: SEOUL_CITY_HALL,
          endCoords: GWANGHWAMUN,
        }
      ]
    };

    const result = validator.validate(route);
    expect(result.isValid).toBe(true);
    expect(result.status).toBe('PASS');
    expect(result.violations.length).toBe(0);
  });

  test('Impossible Walking Speed Route (e.g. running or driving) - should FAIL with status FAIL', () => {
    const route: Route = {
      id: 'route-impossible-walk',
      departureTime: new Date('2026-05-24T10:00:00Z'),
      arrivalTime: new Date('2026-05-24T10:02:00Z'),
      carbonSavingsKg: 0.14,
      segments: [
        {
          mode: 'walking',
          distanceMeters: 700,
          durationSeconds: 60, // 700m / 60s * 3.6 = 42 km/h (Physically impossible walk)
          startCoords: SEOUL_CITY_HALL,
          endCoords: GWANGHWAMUN,
        }
      ]
    };

    const result = validator.validate(route);
    expect(result.isValid).toBe(false);
    expect(result.status).toBe('FAIL');
    
    const violation = result.violations.find(v => v.ruleName === 'WALK_SPEED_CHECK');
    expect(violation !== undefined).toBe(true);
    expect(violation?.severity).toBe('FAIL');
  });

  test('Extremely Stagnant Walking Route - should trigger WARNING', () => {
    const route: Route = {
      id: 'route-stagnant-walk',
      departureTime: new Date('2026-05-24T10:00:00Z'),
      arrivalTime: new Date('2026-05-24T11:00:00Z'),
      carbonSavingsKg: 0.02,
      segments: [
        {
          mode: 'walking',
          distanceMeters: 100,
          durationSeconds: 3600, // 100m / 3600s * 3.6 = 0.1 km/h (Extremely slow)
          startCoords: SEOUL_CITY_HALL,
          endCoords: DEAPYEONG_MOCK,
        }
      ]
    };

    const result = validator.validate(route);
    expect(result.isValid).toBe(true); // Still valid (doesn't fail the route)
    expect(result.status).toBe('WARN');
    
    const violation = result.violations.find(v => v.ruleName === 'WALK_SPEED_CHECK');
    expect(violation !== undefined).toBe(true);
    expect(violation?.severity).toBe('WARN');
  });

  test('Continuous Transfer Sequence - should PASS transfer continuity check', () => {
    const route: Route = {
      id: 'route-good-transfer',
      departureTime: new Date('2026-05-24T10:00:00Z'),
      arrivalTime: new Date('2026-05-24T10:20:00Z'),
      carbonSavingsKg: 0.18, // (400m * 0.00020) + (800m * 0.00012) = 0.08 + 0.096 = 0.176 kg (Close to 0.18)
      segments: [
        {
          mode: 'walking',
          distanceMeters: 400,
          durationSeconds: 300, // 4.8 km/h
          startCoords: SEOUL_CITY_HALL,
          endCoords: DEAPYEONG_MOCK,
        },
        {
          mode: 'bus',
          distanceMeters: 800,
          durationSeconds: 400,
          startCoords: DEAPYEONG_MOCK, // Perfect continuous connection
          endCoords: GWANGHWAMUN,
        }
      ]
    };

    const result = validator.validate(route);
    expect(result.isValid).toBe(true);
    expect(result.status).toBe('PASS');
  });

  test('Broken Transfer Spatial Gap (Telemetry Gaps) - should FAIL transfer gap checks', () => {
    const route: Route = {
      id: 'route-broken-transfer',
      departureTime: new Date('2026-05-24T10:00:00Z'),
      arrivalTime: new Date('2026-05-24T10:20:00Z'),
      carbonSavingsKg: 0.176,
      segments: [
        {
          mode: 'walking',
          distanceMeters: 400,
          durationSeconds: 300,
          startCoords: SEOUL_CITY_HALL,
          endCoords: DEAPYEONG_MOCK,
        },
        {
          mode: 'bus',
          distanceMeters: 800,
          durationSeconds: 400,
          // Seoul Station coords [126.9707, 37.5550] (approx 1.7km away from DEAPYEONG_MOCK)
          startCoords: [126.9707, 37.5550], 
          endCoords: GWANGHWAMUN,
        }
      ]
    };

    const result = validator.validate(route);
    expect(result.isValid).toBe(false);
    expect(result.status).toBe('FAIL');
    
    const violation = result.violations.find(v => v.ruleName === 'TRANSFER_GAP_CHECK');
    expect(violation !== undefined).toBe(true);
    expect(violation?.severity).toBe('FAIL');
  });

  test('Grossly Over-reported Carbon Savings - should trigger WARNING', () => {
    const route: Route = {
      id: 'route-bad-carbon',
      departureTime: new Date('2026-05-24T10:00:00Z'),
      arrivalTime: new Date('2026-05-24T10:10:00Z'),
      carbonSavingsKg: 2.50, // 700m walking should only save ~0.14 kg. 2.50 kg is huge inflation!
      segments: [
        {
          mode: 'walking',
          distanceMeters: 700,
          durationSeconds: 600,
          startCoords: SEOUL_CITY_HALL,
          endCoords: GWANGHWAMUN,
        }
      ]
    };

    const result = validator.validate(route);
    expect(result.isValid).toBe(true);
    expect(result.status).toBe('WARN');
    
    const violation = result.violations.find(v => v.ruleName === 'CARBON_SAVINGS_CALIBRATION');
    expect(violation !== undefined).toBe(true);
    expect(violation?.severity).toBe('WARN');
  });
});

describe('Citizen Routing Regression Analyzer Tests', () => {
  const analyzer = new RegressionAnalyzer();

  const baselineProfile: RouteBaselineProfile = {
    routeId: 'route-01',
    startPoint: SEOUL_CITY_HALL,
    endPoint: GWANGHWAMUN,
    baselineDurationSeconds: 1000,
    baselineDistanceMeters: 1000,
  };

  test('Route compliant with Baseline - should pass without regressions', () => {
    const route: Route = {
      id: 'route-01',
      departureTime: new Date('2026-05-24T10:00:00Z'),
      arrivalTime: new Date('2026-05-24T10:17:00Z'), // 1020 seconds (2% deviation)
      carbonSavingsKg: 0.20,
      segments: [
        {
          mode: 'walking',
          distanceMeters: 1010, // 1% deviation
          durationSeconds: 1020,
          startCoords: SEOUL_CITY_HALL,
          endCoords: GWANGHWAMUN,
        }
      ]
    };

    const report = analyzer.analyze(route, baselineProfile);
    expect(report.hasRegression).toBe(false);
    expect(report.violations.length).toBe(0);
  });

  test('Route experiencing excessive travel time - should FAIL duration regression check', () => {
    const route: Route = {
      id: 'route-01',
      departureTime: new Date('2026-05-24T10:00:00Z'),
      arrivalTime: new Date('2026-05-24T10:22:00Z'), // 1320 seconds (+32% deviation)
      carbonSavingsKg: 0.20,
      segments: [
        {
          mode: 'walking',
          distanceMeters: 1000,
          durationSeconds: 1320,
          startCoords: SEOUL_CITY_HALL,
          endCoords: GWANGHWAMUN,
        }
      ]
    };

    const report = analyzer.analyze(route, baselineProfile);
    expect(report.hasRegression).toBe(true);
    
    const violation = report.violations.find(v => v.ruleName === 'REGRESSION_DURATION_CHECK');
    expect(violation !== undefined).toBe(true);
    expect(violation?.severity).toBe('FAIL');
  });

  test('Route with excessive detour path - should FAIL distance regression check', () => {
    const route: Route = {
      id: 'route-01',
      departureTime: new Date('2026-05-24T10:00:00Z'),
      arrivalTime: new Date('2026-05-24T10:16:40Z'), // 1000 seconds
      carbonSavingsKg: 0.23,
      segments: [
        {
          mode: 'walking',
          distanceMeters: 1180, // +18% detour (above 10% limit)
          durationSeconds: 1000,
          startCoords: SEOUL_CITY_HALL,
          endCoords: GWANGHWAMUN,
        }
      ]
    };

    const report = analyzer.analyze(route, baselineProfile);
    expect(report.hasRegression).toBe(true);

    const violation = report.violations.find(v => v.ruleName === 'REGRESSION_DISTANCE_CHECK');
    expect(violation !== undefined).toBe(true);
    expect(violation?.severity).toBe('FAIL');
  });
});
