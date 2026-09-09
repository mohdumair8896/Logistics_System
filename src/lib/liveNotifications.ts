'use client';

import { useStore, SystemAlert } from './store';
import { toast } from 'sonner';

export interface OperationalEvent {
  title: string;
  description: string;
  severity: 'critical' | 'warning' | 'info';
  category: 'Fleet' | 'Driver' | 'Weather' | 'Warehouse' | 'Cold-Chain' | 'Geofence';
}

export const OPERATIONAL_ALERT_POOL: OperationalEvent[] = [
  {
    title: 'Geofence Entry: UP32 AB 1234 Arrived at Kanpur Terminal',
    description: 'Vehicle V001 cleared perimeter RFID scanner. Directing to Bay 2 for scheduled unloading.',
    severity: 'info',
    category: 'Geofence',
  },
  {
    title: 'Cold-Chain Alert: Reefer V002 (+5.6°C Threshold Exceeded)',
    description: 'Corridor telematics detected +1.8°C spike in dairy cargo zone on NH-19. Automated compressor boost activated.',
    severity: 'warning',
    category: 'Cold-Chain',
  },
  {
    title: 'Warehouse Bay 4 Staging Completed for ORD-1002',
    description: '12,500 kg industrial cargo weighed and secured. Axle weight balance: 99.2% optimal. Ready for driver ingate.',
    severity: 'info',
    category: 'Warehouse',
  },
  {
    title: 'Expressway Traffic Advisory: NH-19 Corridor Congestion',
    description: 'Bridge maintenance near Agra toll plaza. Estimated delay +18 mins. Dynamic reroute suggestion sent to active drivers.',
    severity: 'warning',
    category: 'Weather',
  },
  {
    title: 'Speed Advisory Violation: UP32 KL 5678 (78 km/h in 60 zone)',
    description: 'Vehicle V004 exceeded corridor speed threshold on rain-slicked bypass. Speed advisory dispatch sent to driver.',
    severity: 'critical',
    category: 'Fleet',
  },
  {
    title: 'Inbound Spot Quote Request: 14T Pharma Freight',
    description: 'New high-priority cold-chain freight enquiry received for Lucknow ➔ Delhi NCR. Dispatched to CRM pipeline.',
    severity: 'info',
    category: 'Fleet',
  },
  {
    title: 'Geofence Departure: UP32 EF 9012 En Route to Varanasi',
    description: 'Trip TRP-1004 departed Lucknow Central Hub. Real-time telemetry tracking and temperature monitoring engaged.',
    severity: 'info',
    category: 'Geofence',
  },
];

let liveFeedInterval: NodeJS.Timeout | null = null;
let alertIndex = 0;

/**
 * Triggers a simulated operational notification immediately.
 * Adds the alert to the Zustand store and displays an interactive Sonner toast.
 */
export function triggerLiveAlert(customEvent?: OperationalEvent): SystemAlert {
  const event = customEvent || OPERATIONAL_ALERT_POOL[alertIndex % OPERATIONAL_ALERT_POOL.length];
  alertIndex++;

  const newAlert = {
    title: event.title,
    description: event.description,
    severity: event.severity,
    category: event.category,
  };

  useStore.getState().addAlert(newAlert);

  // Trigger interactive toast alert
  const toastOptions = {
    description: event.description,
    duration: 5000,
  };

  if (event.severity === 'critical') {
    toast.error(`🚨 ${event.title}`, toastOptions);
  } else if (event.severity === 'warning') {
    toast.warning(`⚠️ ${event.title}`, toastOptions);
  } else {
    toast.info(`🔔 ${event.title}`, toastOptions);
  }

  return {
    ...newAlert,
    id: `ALT-${Date.now()}`,
    timestamp: 'Just now',
  };
}

/**
 * Starts the continuous live background alert simulator.
 * Automatically dispatches realistic fleet events every 35-45 seconds.
 */
export function startLiveNotificationFeed(intervalMs = 40000) {
  if (typeof window === 'undefined') return;
  if (liveFeedInterval) return; // already active

  liveFeedInterval = setInterval(() => {
    // Only fire if the user is logged in
    if (useStore.getState().isLoggedIn) {
      triggerLiveAlert();
    }
  }, intervalMs);
}

/**
 * Stops the live background alert simulator.
 */
export function stopLiveNotificationFeed() {
  if (liveFeedInterval) {
    clearInterval(liveFeedInterval);
    liveFeedInterval = null;
  }
}

/**
 * Checks if the live feed heartbeat is currently active.
 */
export function isLiveFeedActive(): boolean {
  return liveFeedInterval !== null;
}
