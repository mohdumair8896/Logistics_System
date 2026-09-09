'use client';
import { MapPin, Check } from 'lucide-react';
import type { Waypoint } from '@/features/trips/types';

interface Props {
  checkpoints: Waypoint[];
  progress: number;
}

export default function CheckpointStage({ checkpoints, progress }: Props) {
  const passedCount = checkpoints.filter(c => c.passed).length;
  const nodeState = passedCount === checkpoints.length ? 'completed' : progress > 0 ? 'active' : 'upcoming';

  return (
    <div className="journey-stage">
      <div className={`journey-node journey-node-${nodeState}`}>
        <MapPin size={nodeState === 'active' ? 20 : 18} />
        <span className="journey-node-label">Waypts</span>
      </div>

      <div className={`journey-card journey-card-${nodeState}`}>
        <div className="journey-stage-header">
          <div>
            <div className="journey-stage-kicker">Stage 07 — Corridor Checkpoints</div>
            <div className="journey-stage-id">
              {passedCount} / {checkpoints.length} Passed
            </div>
          </div>
          <span className={`badge badge-${passedCount === checkpoints.length ? 'green' : 'cyan'}`} style={{ fontSize: 10 }}>
            {passedCount === checkpoints.length ? 'All Clear' : `${checkpoints.length - passedCount} Remaining`}
          </span>
        </div>

        <div className="cp-list">
          {checkpoints.map((cp, idx) => (
            <div key={idx} className={`cp-row ${cp.passed ? 'cp-done' : 'cp-pending'}`}>
              {/* Dot */}
              <div className="cp-dot">
                {cp.passed ? <Check size={11} color="var(--brand)" strokeWidth={3} /> : null}
              </div>

              {/* Content */}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div>
                    <div style={{
                      fontSize: 13, fontWeight: cp.passed ? 700 : 500,
                      color: cp.passed ? 'var(--text-high)' : 'var(--text-low)',
                      marginBottom: 3
                    }}>
                      {cp.name}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-low)', fontWeight: 500 }}>
                      {cp.location}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    {cp.passed ? (
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--brand)', fontFamily: 'var(--font-mono)' }}>
                        {cp.time || 'Passed'}
                      </span>
                    ) : (
                      <span style={{
                        fontSize: 10, fontWeight: 700, color: 'var(--text-low)',
                        background: 'rgba(148,163,184,0.08)', border: '1px solid rgba(148,163,184,0.15)',
                        borderRadius: 8, padding: '2px 8px'
                      }}>
                        Pending
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
