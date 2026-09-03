import { Trip } from '@/lib/mockData';

export interface TelematicsPing {
  tripId: string;
  latitude: number;
  longitude: number;
  speedKmH: number;
  fuelPercent: number;
  cargoTempCelsius: number;
  timestamp: string;
}

/**
 * Telematics Service - Real-time IoT sensor telemetry & geofencing validation
 * Designed by Agency Backend Architect
 */
export class TelematicsService {
  /**
   * Evaluates if a vehicle's speed is violating safety limits
   */
  static evaluateSpeedAlert(speedKmH: number, limitKmH: number = 80): {
    isSpeeding: boolean;
    severity: 'normal' | 'warning' | 'critical';
  } {
    if (speedKmH > limitKmH + 15) return { isSpeeding: true, severity: 'critical' };
    if (speedKmH > limitKmH) return { isSpeeding: true, severity: 'warning' };
    return { isSpeeding: false, severity: 'normal' };
  }

  /**
   * Evaluates cold chain temperature compliance
   */
  static evaluateColdChainTemp(tempCelsius: number, minAllowed: number = 2.0, maxAllowed: number = 8.0): {
    isCompliant: boolean;
    variance: number;
  } {
    if (tempCelsius < minAllowed) {
      return { isCompliant: false, variance: Number((tempCelsius - minAllowed).toFixed(1)) };
    }
    if (tempCelsius > maxAllowed) {
      return { isCompliant: false, variance: Number((tempCelsius - maxAllowed).toFixed(1)) };
    }
    return { isCompliant: true, variance: 0 };
  }
}
