'use client';
import { useState, useEffect, useRef } from 'react';
import { useStore } from '@/lib/store';
import { initialCustomers as customers } from '@/lib/mockData';
import type { Customer } from '@/lib/store';
import { CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import DriverChatModal from '@/components/layout/DriverChatModal';
import JourneyHeader from '@/components/tracking/JourneyHeader';
import OrderStage from '@/components/tracking/OrderStage';
import AllocationStage from '@/components/tracking/AllocationStage';
import DriverStage from '@/components/tracking/DriverStage';
import LoadingStage from '@/components/tracking/LoadingStage';
import DispatchStage from '@/components/tracking/DispatchStage';
import InTransitStage from '@/components/tracking/InTransitStage';
import CheckpointStage from '@/components/tracking/CheckpointStage';
import ArrivalStage from '@/components/tracking/ArrivalStage';
import DeliveryStage from '@/components/tracking/DeliveryStage';
import InvoiceStage from '@/components/tracking/InvoiceStage';
import TelemetryPanel from '@/components/tracking/TelemetryPanel';

export default function TrackingPage() {
  const { trips, vehicles, drivers, orders, invoices, updateTrip } = useStore();
  const [selectedTrip, setSelectedTrip] = useState<string | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [chatDriverId, setChatDriverId] = useState<string | null>(null);
  const router = useRouter();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const activeTrips = trips.filter(t => t.status === 'In Transit');
  const trip = trips.find(t => t.id === selectedTrip) || activeTrips[0] || null;

  // Auto-select first active trip
  useEffect(() => {
    if (activeTrips.length > 0 && !selectedTrip) {
      setSelectedTrip(activeTrips[0].id);
    }
  }, [activeTrips.length, selectedTrip]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  // Derived data
  const vehicle = trip ? vehicles.find(v => v.id === trip.vehicleId) ?? null : null;
  const driver  = trip ? drivers.find(d => d.id === trip.driverId)   ?? null : null;
  const order   = trip ? orders.find(o => o.id === trip.orderId)     ?? null : null;
  const customer = order ? customers.find((c: Customer) => c.id === order.customerId) ?? null : null;
  const invoice  = order ? invoices.find(inv => inv.orderId === order.id) ?? null : null;

  const distDone = trip ? Math.round((trip.progress / 100) * trip.distance) : 0;
  const distLeft = trip ? trip.distance - distDone : 0;

  // Build checkpoint list (real checkpoints or sensible defaults)
  const defaultCheckpoints = [
    {
      name: `${trip?.origin || 'Origin'} Hub Ingate`,
      location: 'Terminal Dispatch',
      passed: true,
      time: trip?.startedAt ?? undefined,
    },
    {
      name: 'National Corridor Express Toll',
      location: 'NH-19 Checkpoint',
      passed: (trip?.progress ?? 0) > 40,
      time: (trip?.progress ?? 0) > 40 ? '10:15 AM' : undefined,
    },
    {
      name: `${trip?.destination || 'Destination'} Facility Ingate`,
      location: 'Delivery Gate',
      passed: (trip?.progress ?? 0) >= 100,
      time: (trip?.progress ?? 0) >= 100 ? 'Arrived' : undefined,
    },
  ];
  const displayCheckpoints =
    trip?.checkpoints && trip.checkpoints.length > 0 ? trip.checkpoints : defaultCheckpoints;

  // ── Simulation ────────────────────────────────────────────────────────────
  const startSimulation = () => {
    if (!trip || trip.progress >= 100) return;
    setSimulating(true);
    intervalRef.current = setInterval(() => {
      const current = useStore.getState().trips.find(t => t.id === trip.id);
      if (!current || current.progress >= 100) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setSimulating(false);
        return;
      }
      const newProgress = Math.min(100, current.progress + 10);
      const remaining = trip.distance - Math.round((newProgress / 100) * trip.distance);
      const etaMin = Math.round((remaining / trip.distance) * (trip.distance / 60 * 60));

      const updatedCheckpoints = (current.checkpoints ?? []).map((cp, idx) => {
        const threshold = (idx + 1) * (100 / (current.checkpoints?.length ?? 3));
        return {
          ...cp,
          passed: newProgress >= threshold - 10,
          time:
            newProgress >= threshold - 10
              ? cp.time ?? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : undefined,
        };
      });

      updateTrip(trip.id, {
        progress: newProgress,
        eta: newProgress >= 100 ? 'Arrived at Destination!' : `${etaMin} min`,
        status: newProgress >= 100 ? 'Delivered' : 'In Transit',
        speedKmH: newProgress >= 100 ? 0 : Math.floor(Math.random() * 15) + 60,
        fuelPercent: Math.max(20, (current.fuelPercent ?? 85) - 2),
        geofenceStatus: newProgress >= 100 ? 'Arrived' : 'Inside Corridor',
        checkpoints: updatedCheckpoints,
      });

      if (newProgress >= 100) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setSimulating(false);
        toast.success('Shipment Delivered! 🎉', {
          description: 'Cargo successfully delivered. Generating POD.',
        });
        setTimeout(() => router.push('/delivery'), 1800);
      }
    }, 600);
  };

  // ── Empty state ───────────────────────────────────────────────────────────
  if (activeTrips.length === 0 && trips.filter(t => t.status === 'Delivered').length > 0) {
    return (
      <div className="animate-slide-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <div className="card" style={{ textAlign: 'center', padding: 60, maxWidth: 400 }}>
          <CheckCircle size={48} color="#10b981" style={{ margin: '0 auto 16px' }} />
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
            All Active Deliveries Completed!
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            View completed shipments in the Delivery &amp; POD module.
          </div>
        </div>
      </div>
    );
  }

  // ── Main journey view ─────────────────────────────────────────────────────
  return (
    <div className="animate-slide-in">
      {/* Header: page title + trip selector + shipment banner */}
      <JourneyHeader
        activeTrips={activeTrips}
        selectedTripId={trip?.id ?? null}
        onSelectTrip={setSelectedTrip}
        trip={trip}
        customer={customer ?? null}
        order={order ?? null}
      />

      {trip && (
        <div className="journey-root">
          {/* ── LEFT: vertical journey timeline ─────────────────────── */}
          <div className="journey-left">
            <div className="journey-timeline">
              <OrderStage order={order ?? null} customer={customer ?? null} />
              <AllocationStage vehicle={vehicle} order={order ?? null} />
              <DriverStage driver={driver} vehicle={vehicle} />
              <LoadingStage order={order ?? null} vehicle={vehicle} trip={trip} />
              <DispatchStage trip={trip} vehicle={vehicle} driver={driver} />
              <InTransitStage
                trip={trip}
                distDone={distDone}
                distLeft={distLeft}
                simulating={simulating}
              />
              <CheckpointStage checkpoints={displayCheckpoints} progress={trip.progress} />
              <ArrivalStage trip={trip} destination={trip.destination} />
              <DeliveryStage
                trip={trip}
                order={order ?? null}
                invoice={invoice ?? null}
                onNavigate={() => router.push('/delivery')}
              />
              <InvoiceStage
                invoice={invoice ?? null}
                order={order ?? null}
                customer={customer ?? null}
                onNavigate={() => router.push('/invoices')}
              />
            </div>
          </div>

          {/* ── RIGHT: sticky telemetry + controls ──────────────────── */}
          <div className="journey-right">
            <div className="telemetry-sticky">
              <TelemetryPanel
                trip={trip}
                vehicle={vehicle}
                driver={driver}
                distDone={distDone}
                distLeft={distLeft}
                simulating={simulating}
                onStartSimulation={startSimulation}
                onChatDriver={() => driver && setChatDriverId(driver.id)}
                onNavigateDelivery={() => router.push('/delivery')}
              />
            </div>
          </div>
        </div>
      )}

      {/* Driver chat modal */}
      {chatDriverId && (
        <DriverChatModal driverId={chatDriverId} onClose={() => setChatDriverId(null)} />
      )}
    </div>
  );
}
