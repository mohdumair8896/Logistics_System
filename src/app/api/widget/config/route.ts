import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      platform: 'Precision Logistics System',
      agentName: 'LogiFlow',
      version: '2.4.0',
      primaryColor: '#F59E0B',
      accentColor: '#10B981',
      allowedCorridors: [
        { code: 'LKO-DEL', name: 'Lucknow Central Hub ➔ Delhi NCR Hub', distanceKm: 512, baseRatePerKg: 2.0 },
        { code: 'LKO-KAN', name: 'Lucknow Central Hub ➔ Kanpur Facility', distanceKm: 82, baseRatePerKg: 2.4 },
        { code: 'LKO-AGR', name: 'Lucknow Central Hub ➔ Agra Corridor', distanceKm: 340, baseRatePerKg: 2.2 },
        { code: 'LKO-VAR', name: 'Lucknow Central Hub ➔ Varanasi Industrial Hub', distanceKm: 322, baseRatePerKg: 2.1 }
      ],
      emergencyHotline: '1800-PRE-LMS',
      responseTimeMs: 35
    }
  });
}
