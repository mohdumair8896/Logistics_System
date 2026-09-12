'use client';

// ─── Real Alert Hook ──────────────────────────────────────────────────────────
// Polls /api/alerts for live system alerts from the database.
// Alerts are created by real events:
//   - GPS geofence webhooks (Phase 3: Traccar)
//   - License expiry cron job (Phase 5: Vercel Cron)
//   - Manual alerts posted by Operations Director
//
// ❌ REMOVED: startLiveNotificationFeed() — fake setInterval simulation
// ❌ REMOVED: OPERATIONAL_ALERT_POOL — hardcoded fake event pool
// ❌ REMOVED: simulateAlert() — random alert trigger

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import type { SystemAlert } from '@/shared/types/common';

let lastAlertIds = new Set<string>();

/**
 * Fetches real system alerts from DB and optionally polls for new ones.
 * Displays a toast when a brand-new alert arrives.
 */
export function useSystemAlerts(pollIntervalMs = 30000) {
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch('/api/alerts');
      if (!res.ok) return;
      const data: SystemAlert[] = await res.json();

      // Show toast for any brand-new alert IDs since last poll
      data.forEach(alert => {
        if (!lastAlertIds.has(alert.id)) {
          const toastOpts = { description: alert.description, duration: 5000 };
          if (alert.severity === 'critical') toast.error(`🚨 ${alert.title}`, toastOpts);
          else if (alert.severity === 'warning') toast.warning(`⚠️ ${alert.title}`, toastOpts);
          else toast.info(`🔔 ${alert.title}`, toastOpts);
        }
      });

      lastAlertIds = new Set(data.map(a => a.id));
      setAlerts(data);
    } catch (err) {
      console.error('[useSystemAlerts] fetch error', err);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, pollIntervalMs);
    return () => clearInterval(interval);
  }, [fetchAlerts, pollIntervalMs]);

  const dismissAlert = useCallback(async (alertId: string) => {
    await fetch(`/api/alerts/${alertId}`, { method: 'DELETE' });
    setAlerts(prev => prev.filter(a => a.id !== alertId));
  }, []);

  const clearAll = useCallback(async () => {
    await fetch('/api/alerts', { method: 'DELETE' });
    setAlerts([]);
  }, []);

  const postAlert = useCallback(async (alert: Omit<SystemAlert, 'id' | 'timestamp'>) => {
    const res = await fetch('/api/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(alert),
    });
    if (res.ok) await fetchAlerts();
  }, [fetchAlerts]);

  return { alerts, dismissAlert, clearAll, postAlert, refetch: fetchAlerts };
}
