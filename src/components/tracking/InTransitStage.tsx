'use client';
import type { Trip } from '@/lib/mockData';

interface Props {
  trip: Trip;
  distDone: number;
  distLeft: number;
  simulating: boolean;
}

export default function InTransitStage({ trip, distDone, distLeft, simulating }: Props) {
  const nodeState = trip.progress >= 100 ? 'completed' : trip.progress > 0 ? 'active' : 'upcoming';

  // Truck moves within a 280px track (10px top/bottom padding for origin/destination markers)
  const TRACK_HEIGHT = 280;
  const truckTopPct = Math.min(92, (trip.progress / 100) * 95);

  return (
    <div className="journey-stage">
      <div className={`journey-node journey-node-${nodeState}`}>
        <span className="journey-node-num" style={{ fontSize: 24 }}>🚚</span>
        <span className="journey-node-label">Transit</span>
      </div>

      <div className={`journey-card journey-card-${nodeState}`}>
        <div className="journey-stage-header">
          <div>
            <div className="journey-stage-kicker">Stage 06 — In Transit</div>
            <div className="journey-stage-id" style={{ color: '#22d3ee' }}>
              {trip.progress >= 100 ? 'Journey Complete' : `${trip.progress}% Complete`}
            </div>
          </div>
          <span className={`badge badge-${trip.progress >= 100 ? 'green' : 'cyan'}`} style={{ fontSize: 10 }}>
            {trip.progress >= 100 ? 'Arrived' : 'Live GPS'}
          </span>
        </div>

        {/* Main layout: route visualizer + stats side by side */}
        <div style={{ display: 'flex', gap: 24, alignItems: 'stretch' }}>
          {/* Route track (left) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Origin label */}
            <div style={{ textAlign: 'right', width: 80, flexShrink: 0 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2 }}>Origin</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#34d399', lineHeight: 1.3 }}>
                {trip.origin.split(' ').slice(0, 2).join(' ')}
              </div>
            </div>

            {/* The track */}
            <div className="journey-route-track" style={{ width: 60, flexShrink: 0 }}>
              {/* Background line */}
              <div className="journey-route-line-full" />

              {/* Progress line */}
              <div
                className="journey-route-line-done"
                style={{ height: `${truckTopPct}%` }}
              />

              {/* Origin dot */}
              <div style={{
                position: 'absolute', left: '50%', top: 0,
                transform: 'translateX(-50%)',
                width: 12, height: 12, borderRadius: '50%',
                background: '#10b981', boxShadow: '0 0 10px #10b981', zIndex: 3
              }} />

              {/* Truck */}
              <div
                className={`journey-truck-icon ${simulating ? 'journey-truck-simulating' : ''}`}
                style={{ top: `${truckTopPct}%`, transform: 'translate(-50%, -50%)' }}
              >
                🚚
              </div>

              {/* Destination dot */}
              <div style={{
                position: 'absolute', left: '50%', bottom: 0,
                transform: 'translateX(-50%)',
                width: 12, height: 12, borderRadius: '50%',
                background: trip.progress >= 100 ? '#10b981' : 'var(--text-muted)',
                boxShadow: trip.progress >= 100 ? '0 0 10px #10b981' : 'none',
                zIndex: 3
              }} />
            </div>

            {/* Destination label */}
            <div style={{ textAlign: 'left', width: 80, flexShrink: 0 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2 }}>Destination</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: trip.progress >= 100 ? '#34d399' : 'var(--text-muted)', lineHeight: 1.3 }}>
                {trip.destination.split(' ').slice(0, 2).join(' ')}
              </div>
            </div>
          </div>

          {/* Stats (right) */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14, justifyContent: 'center' }}>
            {/* Big progress */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.9 }}>
                  Route Progress
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 800, color: '#22d3ee' }}>
                  {trip.progress}%
                </span>
              </div>
              <div className="progress-bar" style={{ height: 8 }}>
                <div className="progress-fill" style={{ width: `${trip.progress}%` }} />
              </div>
            </div>

            {/* Distance stats */}
            <div style={{
              background: 'rgba(2,6,23,0.5)', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 10, padding: '12px 16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8 }}>Covered</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 800, color: '#34d399', marginTop: 2 }}>{distDone} km</div>
                </div>
                <div style={{ fontSize: 18, color: 'rgba(255,255,255,0.15)' }}>/</div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8 }}>Remaining</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 800, color: '#38bdf8', marginTop: 2 }}>{distLeft} km</div>
                </div>
              </div>
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 8, display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Total route</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>{trip.distance} km</span>
              </div>
            </div>

            {/* ETA */}
            <div style={{
              background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.18)',
              borderRadius: 10, padding: '10px 16px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8 }}>ETA</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 800, color: '#34d399' }}>{trip.eta}</span>
            </div>

            {simulating && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'rgba(34,211,238,0.06)', border: '1px dashed rgba(34,211,238,0.3)',
                borderRadius: 8, padding: '8px 14px', fontSize: 12, color: '#22d3ee', fontWeight: 600
              }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22d3ee', animation: 'pulse 1s infinite' }} />
                Simulation running…
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
