import { Vehicle, Driver } from '@/lib/mockData';

export interface AxleDistribution {
  frontPercent: number;
  rearPercent: number;
  isBalanced: boolean;
  warning?: string;
}

/**
 * Fleet Service - Vehicle capacity, driver qualification, and axle load mathematics
 * Designed by Agency Backend Architect
 */
export class FleetService {
  /**
   * Calculates safety and axle load distribution based on pallet positions
   */
  static calculateAxleLoad(totalWeightKg: number, frontHeavyRatio: number = 0.40): AxleDistribution {
    const frontPercent = Math.round(frontHeavyRatio * 100);
    const rearPercent = 100 - frontPercent;

    const isBalanced = frontPercent >= 35 && frontPercent <= 45;
    let warning: string | undefined;

    if (frontPercent > 45) {
      warning = 'Front axle overloaded (>45%). Risk of steering degradation.';
    } else if (frontPercent < 35) {
      warning = 'Rear axle overloaded (>65%). Risk of fishtailing & tire blowout.';
    }

    return {
      frontPercent,
      rearPercent,
      isBalanced,
      warning
    };
  }

  /**
   * Evaluates driver safety compliance and certifications
   */
  static verifyDriverCompliance(driver: Driver, requiresColdChain: boolean = false): {
    compliant: boolean;
    flags: string[];
  } {
    const flags: string[] = [];

    if (driver.status === 'Off Duty' || driver.status === 'Rest Period') {
      flags.push('Mandatory driver rest hours in progress.');
    }
    if (driver.safetyScore !== undefined && driver.safetyScore < 90) {
      flags.push(`Driver safety score (${driver.safetyScore}%) is below company threshold (90%).`);
    }

    return {
      compliant: flags.length === 0,
      flags
    };
  }
}
