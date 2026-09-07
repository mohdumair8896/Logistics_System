import { NextRequest, NextResponse } from 'next/server';
import { initialTrips, initialVehicles, initialDrivers } from '@/lib/mockData';
import { requireAuth, isAuthError } from '@/lib/apiAuth';

export async function GET(request: NextRequest) {
  // Auth guard — 401 if no valid session
  const auth = await requireAuth(request);
  if (isAuthError(auth)) return auth;

  const activeTrips = initialTrips.filter(t => t.status === 'In Transit');

  const telemetryStream = activeTrips.map(trip => {
    const vehicle = initialVehicles.find(v => v.id === trip.vehicleId);
    const driver = initialDrivers.find(d => d.id === trip.driverId);

    // Strip PII from driver details unless user has sufficient role
    const isPrivileged = ['Operations Director', 'Fleet Dispatcher'].includes(auth.role);

    return {
      tripId: trip.id,
      vehicleNo: vehicle?.vehicleNo ?? 'UNKNOWN',
      driverName: driver?.name ?? 'Unassigned',
      // Phone number only for privileged roles
      driverPhone: isPrivileged ? (driver?.phone ?? 'N/A') : undefined,
      route: `${trip.origin} → ${trip.destination}`,
      speedKmH: trip.speedKmH ?? 64,
      fuelPercent: trip.fuelPercent ?? 78,
      cargoTemp: trip.cargoTemp ?? '21.5°C Ambient',
      geofenceStatus: trip.geofenceStatus ?? 'Inside Corridor',
      progressPercent: trip.progress,
      eta: trip.eta,
      coordinates: {
        lat: 28.6139 + trip.progress * 0.005,
        lng: 77.209 + trip.progress * 0.008,
      },
      lastPingTimestamp: new Date().toISOString(),
    };
  });

  return NextResponse.json({
    success: true,
    telemetryCount: telemetryStream.length,
    activeFleetTelemetry: telemetryStream,
    gatewayStatus: 'ONLINE_OPTIMAL',
    timestamp: new Date().toISOString(),
  });
}
