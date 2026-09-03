import { NextResponse } from 'next/server';
import { initialVehicles, initialDrivers } from '@/lib/mockData';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  let results = initialVehicles.map(v => {
    const driver = initialDrivers.find(d => d.id === v.driverId);
    return {
      ...v,
      driverName: driver?.name || 'Unassigned',
      driverPhone: driver?.phone || 'N/A',
      utilizationPercent: v.capacity > 0 ? Math.round((v.currentLoad / v.capacity) * 100) : 0
    };
  });

  if (status && status !== 'All') {
    results = results.filter(v => v.status.toLowerCase() === status.toLowerCase());
  }

  return NextResponse.json({
    success: true,
    count: results.length,
    data: results,
    timestamp: new Date().toISOString()
  });
}
