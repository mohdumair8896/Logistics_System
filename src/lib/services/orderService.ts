import { Order, Vehicle, Driver } from '@/lib/mockData';

export type ValidOrderStatus = 'Pending' | 'Allocated' | 'Staged' | 'In Transit' | 'Delivered' | 'Cancelled';

export interface OrderValidationResult {
  valid: boolean;
  errors: string[];
}

export interface AllocationPayload {
  orderId: string;
  vehicleId: string;
  driverId: string;
  overrideReason?: string;
}

/**
 * Order Service - Implements strict state machine and workflow transitions
 * Designed by Agency Backend Architect
 */
export class OrderService {
  /**
   * Validates if a state transition is legal according to logistics SLA
   */
  static canTransition(current: ValidOrderStatus, next: ValidOrderStatus): boolean {
    const validTransitions: Record<ValidOrderStatus, ValidOrderStatus[]> = {
      'Pending': ['Allocated', 'Cancelled'],
      'Allocated': ['Staged', 'Pending', 'Cancelled'],
      'Staged': ['In Transit', 'Allocated', 'Cancelled'],
      'In Transit': ['Delivered', 'Staged'],
      'Delivered': [],
      'Cancelled': []
    };
    return validTransitions[current]?.includes(next) ?? false;
  }

  /**
   * Validates an order creation request
   */
  static validateOrder(order: Partial<Order>): OrderValidationResult {
    const errors: string[] = [];

    if (!order.customerId) errors.push('Customer ID is required.');
    if (!order.origin || order.origin.trim().length === 0) errors.push('Origin terminal is required.');
    if (!order.destination || order.destination.trim().length === 0) errors.push('Destination address is required.');
    if (!order.totalWeight || order.totalWeight <= 0) errors.push('Total weight must be greater than 0 kg.');
    if (!order.items || order.items.length === 0) errors.push('At least one manifest item is required.');

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Evaluates if a vehicle and driver can fulfill an order
   */
  static evaluateAllocation(order: Order, vehicle: Vehicle, driver: Driver): {
    canAllocate: boolean;
    reason?: string;
    utilizationPercent: number;
  } {
    if (vehicle.status !== 'Available') {
      return { canAllocate: false, reason: `Vehicle is currently ${vehicle.status}`, utilizationPercent: 0 };
    }
    if (driver.status !== 'Available') {
      return { canAllocate: false, reason: `Driver is ${driver.status}`, utilizationPercent: 0 };
    }
    if (order.totalWeight > vehicle.capacity) {
      return {
        canAllocate: false,
        reason: `Exceeds vehicle capacity by ${(order.totalWeight - vehicle.capacity).toLocaleString()} kg`,
        utilizationPercent: Math.round((order.totalWeight / vehicle.capacity) * 100)
      };
    }

    const utilizationPercent = Math.round((order.totalWeight / vehicle.capacity) * 100);
    return {
      canAllocate: true,
      utilizationPercent
    };
  }
}
