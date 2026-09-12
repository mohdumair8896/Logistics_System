'use client';
import { useEffect, useRef } from 'react';

import type * as L from 'leaflet';

// Waypoint type for map markers
interface MapWaypoint {
  name: string;
  lat: number;
  lng: number;
  passed: boolean;
}

interface P44CorridorMapProps {
  origin: string;
  destination: string;
  progress: number;          // 0-100
  waypoints?: MapWaypoint[];
  geofenceStatus?: string;
  liveCoords?: { lat: number; lng: number }; // Real GPS from driver phone
}

// Deterministic lat/lng from a route origin/destination string hash
function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) { h = (Math.imul(31, h) + s.charCodeAt(i)) | 0; }
  return h;
}

function routeCoords(origin: string, destination: string) {
  // Map well-known generic hub names to real coords; fallback to hash-based
  const HUBS: Record<string, [number, number]> = {
    'central distribution hub':  [40.7128, -74.0060],
    'central hub':               [40.7128, -74.0060],
    'north corridor terminal':   [42.3601, -71.0589],
    'north terminal':            [42.3601, -71.0589],
    'west regional terminal':    [34.0522, -118.2437],
    'west terminal':             [34.0522, -118.2437],
    'south logistics park':      [29.7604, -95.3698],
    'south hub':                 [29.7604, -95.3698],
    'east distribution center':  [39.9526, -75.1652],
    'east hub':                  [39.9526, -75.1652],
    // India legacy
    'lucknow central hub':       [26.8467, 80.9462],
    'delhi ncr hub':             [28.7041, 77.1025],
    'kanpur regional terminal':  [26.4499, 80.3319],
    'mumbai freight hub':        [19.0760, 72.8777],
  };

  const findCoord = (name: string): [number, number] => {
    const key = name.toLowerCase().replace(/[,.].*/, '').trim();
    for (const [k, v] of Object.entries(HUBS)) {
      if (key.includes(k) || k.includes(key)) return v;
    }
    // Deterministic fallback: range within continental US
    const h = Math.abs(hashString(name));
    const lat = 30 + (h % 150) / 10;
    const lng = -120 + (h % 500) / 10;
    return [Math.min(47, Math.max(25, lat)), Math.min(-70, Math.max(-120, lng))];
  };

  return { orig: findCoord(origin), dest: findCoord(destination) };
}

export default function P44CorridorMap({
  origin,
  destination,
  progress,
  waypoints,
  geofenceStatus,
  liveCoords,
}: P44CorridorMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapObjRef = useRef<L.Map | null>(null);
  const truckMarkerRef = useRef<L.Marker | null>(null);
  const progressLineRef = useRef<L.Polyline | null>(null);

  useEffect(() => {
    let isMounted = true;
    let localMap: L.Map | null = null;

    if (!mapRef.current) return;
    const container = mapRef.current as HTMLElement & { _leaflet_id?: number };

    // Clean up existing map instance if any
    if (mapObjRef.current) {
      try {
        mapObjRef.current.remove();
      } catch {
        // ignore
      }
      mapObjRef.current = null;
    }
    if (container._leaflet_id) {
      delete container._leaflet_id;
    }

    // Dynamic import to avoid SSR
    import('leaflet').then((L) => {
      if (!isMounted || !mapRef.current) return;

      // Fix missing default icon paths in Next.js
      delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      // Ensure container has no residual leaflet id
      if (container._leaflet_id) {
        delete container._leaflet_id;
      }

      const { orig, dest } = routeCoords(origin, destination);
      const map = L.map(container, { zoomControl: true, attributionControl: false });
      localMap = map;
      mapObjRef.current = map;

      // OpenStreetMap tiles (free, no API key)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18,
      }).addTo(map);

      // Route polyline (base corridor)
      const routeLine = L.polyline([orig, dest], {
        color: '#E3E1DC',
        weight: 5,
        opacity: 0.7,
      }).addTo(map);

      // Progress segment (blue)
      const pct = Math.max(0, Math.min(1, progress / 100));
      const truckLat = liveCoords?.lat ?? (orig[0] + (dest[0] - orig[0]) * pct);
      const truckLng = liveCoords?.lng ?? (orig[1] + (dest[1] - orig[1]) * pct);

      const progLine = L.polyline([orig, [truckLat, truckLng]], {
        color: '#0057FF',
        weight: 5,
        opacity: 1,
      }).addTo(map);
      progressLineRef.current = progLine;

      // Origin marker (blue circle)
      const originIcon = L.divIcon({
        html: `<div style="width:14px;height:14px;border-radius:50%;background:#0057FF;border:2.5px solid #fff;box-shadow:0 2px 8px rgba(0,87,255,0.5)"></div>`,
        className: '',
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });
      L.marker(orig, { icon: originIcon }).addTo(map)
        .bindTooltip(`Origin: ${origin.split(',')[0]}`, { permanent: false, direction: 'top' });

      // Destination marker (outlined circle)
      const destIcon = L.divIcon({
        html: `<div style="width:14px;height:14px;border-radius:50%;background:#fff;border:2.5px solid #0057FF;box-shadow:0 2px 8px rgba(0,87,255,0.3)"></div>`,
        className: '',
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });
      L.marker(dest, { icon: destIcon }).addTo(map)
        .bindTooltip(`Destination: ${destination.split(',')[0]}`, { permanent: false, direction: 'top' });

      // Truck marker (moving)
      const truckIcon = L.divIcon({
        html: `<div style="width:22px;height:22px;border-radius:50%;background:#0057FF;border:2px solid #fff;display:flex;align-items:center;justify-content:center;box-shadow:0 0 12px rgba(0,87,255,0.6);font-size:11px">🚛</div>`,
        className: '',
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });
      const truckMarker = L.marker([truckLat, truckLng], { icon: truckIcon }).addTo(map)
        .bindTooltip(`In Transit — ${progress}% complete`, { permanent: false, direction: 'top' });
      truckMarkerRef.current = truckMarker;

      // Waypoint markers
      if (waypoints && waypoints.length > 0) {
        waypoints.forEach((wp, i) => {
          const wpIcon = L.divIcon({
            html: `<div style="width:10px;height:10px;border-radius:50%;background:${wp.passed ? '#0057FF' : '#E3E1DC'};border:1.5px solid ${wp.passed ? '#0057FF' : '#CCCAC4'};"></div>`,
            className: '',
            iconSize: [10, 10],
            iconAnchor: [5, 5],
          });
          const lat = orig[0] + (dest[0] - orig[0]) * ((i + 1) / (waypoints.length + 1));
          const lng = orig[1] + (dest[1] - orig[1]) * ((i + 1) / (waypoints.length + 1));
          L.marker([lat, lng], { icon: wpIcon }).addTo(map)
            .bindTooltip(wp.name, { permanent: false, direction: 'top' });
        });
      }

      // Fit map to route
      map.fitBounds(routeLine.getBounds(), { padding: [40, 40] });

      // Custom attribution
      L.control.attribution({ prefix: '<a href="https://www.openstreetmap.org/copyright" target="_blank">© OSM</a>' }).addTo(map);
    });

    return () => {
      isMounted = false;
      if (localMap) {
        try {
          localMap.remove();
        } catch {
          // ignore
        }
        localMap = null;
      } else if (mapObjRef.current) {
        try {
          mapObjRef.current.remove();
        } catch {
          // ignore
        }
      }
      mapObjRef.current = null;
      truckMarkerRef.current = null;
      progressLineRef.current = null;
      if (container && container._leaflet_id) {
        delete container._leaflet_id;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [origin, destination]);

  // Dynamically update truck position & polyline on progress/GPS updates without destroying map
  useEffect(() => {
    if (!truckMarkerRef.current) return;
    const { orig, dest } = routeCoords(origin, destination);
    const pct = Math.max(0, Math.min(1, progress / 100));
    const truckLat = liveCoords?.lat ?? (orig[0] + (dest[0] - orig[0]) * pct);
    const truckLng = liveCoords?.lng ?? (orig[1] + (dest[1] - orig[1]) * pct);

    truckMarkerRef.current.setLatLng([truckLat, truckLng]);
    truckMarkerRef.current.setTooltipContent(`In Transit — ${progress}% complete`);

    if (progressLineRef.current) {
      progressLineRef.current.setLatLngs([orig, [truckLat, truckLng]]);
    }
  }, [progress, liveCoords, origin, destination]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', minHeight: 280 }}>
      <div ref={mapRef} style={{ width: '100%', height: '100%', borderRadius: 10 }} />

      {/* Geofence status overlay */}
      {geofenceStatus && (
        <div style={{
          position: 'absolute', top: 10, right: 10, zIndex: 999,
          background: 'rgba(255,255,255,0.95)', border: '1px solid var(--brand-20)',
          borderRadius: 8, padding: '4px 10px', fontSize: 10.5, fontWeight: 700,
          color: geofenceStatus === 'Deviated' ? '#334F99' : 'var(--brand)',
          display: 'flex', alignItems: 'center', gap: 5,
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--brand)', display: 'inline-block' }} />
          {geofenceStatus}
        </div>
      )}
    </div>
  );
}
