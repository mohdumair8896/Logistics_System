import { ImageResponse } from 'next/og';

export const alt = 'LogiFlow — Next-Gen AI Fleet Logistics Platform';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 80,
          background: '#020617',
          color: '#ffffff',
          fontFamily: 'sans-serif',
          border: '12px solid #0f172a',
        }}
      >
        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 18,
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 32,
                fontWeight: 900,
                color: '#1c1917',
              }}
            >
              LF
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', fontSize: 32, fontWeight: 900, letterSpacing: -1 }}>LogiFlow AI</div>
              <div style={{ display: 'flex', fontSize: 16, color: '#94a3b8', fontWeight: 600 }}>Autonomous Freight & Telematics</div>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              padding: '10px 24px',
              borderRadius: 99,
              background: 'rgba(6, 78, 59, 0.6)',
              border: '2px solid rgba(52, 211, 153, 0.4)',
              fontSize: 18,
              color: '#34d399',
              fontWeight: 700,
              fontFamily: 'monospace',
            }}
          >
            ● LIVE TELEMATICS ACTIVE
          </div>
        </div>

        {/* Center Headline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div
            style={{
              display: 'flex',
              fontSize: 18,
              fontWeight: 800,
              letterSpacing: 4,
              textTransform: 'uppercase',
              color: '#fbbf24',
              fontFamily: 'monospace',
            }}
          >
            Autonomous Corridor Infrastructure
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              fontSize: 64,
              fontWeight: 900,
              letterSpacing: -2,
              lineHeight: 1.1,
              color: '#ffffff',
            }}
          >
            <div style={{ display: 'flex' }}>Moving Made Easy,</div>
            <div style={{ display: 'flex', color: '#fbbf24' }}>Wherever Cargo Takes You.</div>
          </div>
        </div>

        {/* Bottom Metrics Ticker */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: 36,
            borderTop: '2px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div style={{ display: 'flex', gap: 48 }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', fontSize: 14, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 2 }}>Sort Rate</div>
              <div style={{ display: 'flex', fontSize: 26, fontWeight: 800, color: '#fbbf24' }}>1,420/hr AMR</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', fontSize: 14, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 2 }}>ETA Variance</div>
              <div style={{ display: 'flex', fontSize: 26, fontWeight: 800, color: '#22d3ee' }}>-12 min Dynamic</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', fontSize: 14, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 2 }}>Carbon Offset</div>
              <div style={{ display: 'flex', fontSize: 26, fontWeight: 800, color: '#34d399' }}>100% Net Zero</div>
            </div>
          </div>

          <div style={{ display: 'flex', fontSize: 20, color: '#64748b', fontFamily: 'monospace' }}>
            logiflow.io
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
