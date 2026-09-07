import { NextRequest, NextResponse } from 'next/server';
import { initialVehicles, initialDrivers } from '@/lib/mockData';
import { requireAuth, isAuthError, sanitizeStatus, ALLOWED_VEHICLE_STATUSES } from '@/lib/apiAuth';

export async function GET(request: NextRequest) {
  // Auth guard — 401 if no valid session
  const auth = await requireAuth(request);
  if (isAuthError(auth)) return auth;

  const { searchParams } = new URL(request.url);
  const rawStatus = searchParams.get('status');

  // Allowlist the status param
  const status = sanitizeStatus(rawStatus, ALLOWED_VEHICLE_STATUSES);
  if (rawStatus && !status) {
    return NextResponse.json(
      { success: false, message: 'Invalid status filter value' },
      { status: 400 }
    );
  }

  let results = initialVehicles.map(v => {
    const driver = initialDrivers.find(d => d.id === v.driverId);

    // Role-based field filtering
    const isPrivileged = ['Operations Director', 'Fleet Dispatcher'].includes(auth.role);

    return {
      id: v.id,
      vehicleNo: v.vehicleNo,
      type: v.type,
      status: v.status,
      capacity: v.capacity,
      currentLoad: v.currentLoad,
      location: v.location,
      fuelLevel: v.fuelLevel,
      odometerKm: v.odometerKm,
      driverName: driver?.name ?? 'Unassigned',
      // Phone number only for privileged roles (Compliance Officers can see vehicle data, not PII)
      driverPhone: isPrivileged ? (driver?.phone ?? 'N/A') : undefined,
      utilizationPercent:
        v.capacity > 0 ? Math.round((v.currentLoad / v.capacity) * 100) : 0,
    };
  });

  if (status && status.toLowerCase() !== 'all') {
    results = results.filter(v => v.status.toLowerCase() === status.toLowerCase());
  }

  return NextResponse.json({
    success: true,
    count: results.length,
    data: results,
    timestamp: new Date().toISOString(),
  });
}
