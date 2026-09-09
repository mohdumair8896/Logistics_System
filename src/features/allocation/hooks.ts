// ─── Allocation Feature — Hooks ───────────────────────────────────────────────
import { useStore } from '@/lib/store';
import type { EvaluatedVehicle } from './types';

export function useAllocation(activeOrderId: string | null) {
  const { orders, vehicles, drivers, customers, allocateVehicle } = useStore();

  const pendingOrders = orders.filter(o => o.status === 'Pending');
  const activeOrder = orders.find(o => o.id === (activeOrderId || pendingOrders[0]?.id)) ?? null;
  const customer = activeOrder ? customers.find(c => c.id === activeOrder.customerId) : null;

  const evaluatedVehicles: EvaluatedVehicle[] = vehicles.map(v => {
    const assignedDriver = drivers.find(d => d.id === v.driverId) ?? null;
    const availableCap = v.capacity - v.currentLoad;
    const reqWeight = activeOrder ? activeOrder.totalWeight : 0;
    const diff = availableCap - reqWeight;
    const isFit = diff >= 0;
    const isMaintenance = v.status === 'Maintenance';
    const isBusy = v.status === 'In Transit';
    const utilization = isFit && availableCap > 0 ? Math.round((reqWeight / v.capacity) * 100) : 0;

    let reason: string | null = null;
    let canOverride = false;

    if (isMaintenance) { reason = 'In Maintenance'; }
    else if (isBusy) { reason = 'In Transit (ETA > 4hrs)'; canOverride = true; }
    else if (!isFit) { reason = `Insufficient Capacity (${diff.toLocaleString()} kg)`; }
    else if (!assignedDriver || assignedDriver.status !== 'Available') { reason = 'Driver off duty or unavailable'; canOverride = true; }

    const isRecommended = isFit && !isMaintenance && !isBusy && assignedDriver?.status === 'Available';

    return {
      id: v.id, vehicleNo: v.vehicleNo, type: v.type,
      capacity: v.capacity, currentLoad: v.currentLoad, status: v.status, driverId: v.driverId,
      driver: assignedDriver ? { id: assignedDriver.id, name: assignedDriver.name, status: assignedDriver.status } : null,
      availableCap, diff, isFit, utilization, reason, canOverride, isRecommended: !!isRecommended
    };
  });

  const recommendedVehicle = evaluatedVehicles.find(v => v.isRecommended) ?? null;
  const alternativeVehicles = evaluatedVehicles.filter(v => v.id !== recommendedVehicle?.id);

  return { pendingOrders, activeOrder, customer, evaluatedVehicles, recommendedVehicle, alternativeVehicles, allocateVehicle };
}
