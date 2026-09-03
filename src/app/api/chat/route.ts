import { NextRequest, NextResponse } from 'next/server';
import { initialOrders, initialTrips, initialVehicles, initialKnowledgeBase } from '@/lib/mockData';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message = (body.message || '').trim();
    const q = message.toLowerCase();

    if (!message) {
      return NextResponse.json({ success: false, error: 'Query message is required' }, { status: 400 });
    }

    // 1. Intent: Track & Trace
    if (q.includes('track') || q.includes('where') || q.includes('ord-') || q.includes('trp-')) {
      const matchOrder = initialOrders.find(o => q.includes(o.id.toLowerCase())) || initialOrders[0];
      const matchTrip = initialTrips.find(t => t.orderId === matchOrder.id) || initialTrips[0];
      const matchVeh = initialVehicles.find(v => v.id === matchTrip?.vehicleId) || initialVehicles[0];

      return NextResponse.json({
        success: true,
        intent: 'track_and_trace',
        reply: `Shipment ${matchOrder.id} is currently ${matchTrip?.status || 'In Transit'} along the ${matchOrder.origin} to ${matchOrder.destination} corridor. Current velocity is ${matchTrip?.speedKmH || 68} km/h with 0 geofence violations.`,
        dataCard: {
          type: 'telematics',
          orderId: matchOrder.id,
          origin: matchOrder.origin,
          destination: matchOrder.destination,
          status: matchTrip?.status || 'In Transit',
          vehicleNo: matchVeh?.vehicleNo || 'UP32 CD 5678',
          velocityKmH: matchTrip?.speedKmH || 68,
          progressPercent: matchTrip?.progress || 58,
          eta: 'Today ~21:30'
        },
        timestamp: new Date().toISOString()
      });
    }

    // 2. Intent: Corridor Emergency & Incident Protocol
    if (q.includes('emergency') || q.includes('accident') || q.includes('breakdown') || q.includes('alarm') || q.includes('temp') || q.includes('puncture') || q.includes('spill')) {
      return NextResponse.json({
        success: true,
        intent: 'corridor_emergency',
        reply: '🚨 EMERGENCY CORRIDOR BYPASS ACTIVATED: Your safety event has been escalated to the Central Operations Desk. Rapid roadside assistance deployed.',
        emergencyHotline: '1800-PRE-LMS (Toll Free • Priority 1)',
        dataCard: {
          type: 'emergency_triage',
          protocol: 'Turn hazard lights ON • Place reflective triangles 50m behind unit',
          recoveryEta: 'Roadside unit dispatched (ETA ~35 mins)',
          hotline: '1800-PRE-LMS'
        },
        timestamp: new Date().toISOString()
      });
    }

    // 3. Intent: Spot Quotation
    if (q.includes('quote') || q.includes('rate') || q.includes('price') || q.includes('cost') || q.includes('per kg')) {
      const weightMatch = q.match(/\b(\d{3,5})\s*(kg|ton|tonne)?\b/);
      const weightKg = weightMatch ? parseInt(weightMatch[1]) : 8000;
      const ratePerKg = 2.2;
      const base = weightKg * ratePerKg;
      const gst = base * 0.18;
      const total = base + gst;

      return NextResponse.json({
        success: true,
        intent: 'spot_quote',
        reply: `Automated spot freight quotation for ${weightKg.toLocaleString()} kg on Lucknow Central Hub ➔ Delhi NCR Corridor: Base freight is ₹${base.toLocaleString()} + 18% GST (₹${gst.toLocaleString()}), Net total: ₹${total.toLocaleString()}.`,
        dataCard: {
          type: 'spot_quote',
          weightKg,
          corridor: 'Lucknow Central Hub → Delhi NCR Hub',
          baseFreight: base,
          gstAmount: gst,
          netTotal: total,
          ratePerKg,
          validityHours: 24
        },
        timestamp: new Date().toISOString()
      });
    }

    // 4. Intent: Cargo Booking & Lead Extraction
    if (q.includes('book') || q.includes('schedule') || q.includes('shipment') || q.includes('dispatch')) {
      const leadId = `LEAD-${Math.floor(100 + Math.random() * 900)}`;

      return NextResponse.json({
        success: true,
        intent: 'freight_booking',
        reply: `Consignment intake ticket generated: ${leadId}. Our automated allocation engine has queued this payload for axle weight distribution and driver assignment.`,
        leadCaptured: {
          id: leadId,
          corridor: 'Lucknow Central Hub → Delhi NCR Hub',
          estimatedWeightKg: 8000,
          status: 'New'
        },
        timestamp: new Date().toISOString()
      });
    }

    // 5. Intent: Knowledge Base Retrieval
    const matchKb = initialKnowledgeBase.find(k => k.keywords.some(kw => q.includes(kw)));
    if (matchKb) {
      return NextResponse.json({
        success: true,
        intent: 'knowledge_base',
        reply: `[${matchKb.category}] ${matchKb.title}: ${matchKb.content}`,
        category: matchKb.category,
        timestamp: new Date().toISOString()
      });
    }

    // Fallback
    return NextResponse.json({
      success: true,
      intent: 'general_faq',
      reply: 'LogiFlow can look up real-time telematics (e.g. "Track ORD-1001"), compute instant spot freight pricing ("Quote for 5000 kg"), ingest booking intakes, or trigger 24/7 roadside emergency protocols. How may I assist your supply chain?',
      timestamp: new Date().toISOString()
    });

  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
