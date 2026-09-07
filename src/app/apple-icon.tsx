import { ImageResponse } from 'next/og';

export const size = {
  width: 180,
  height: 180,
};
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#020617',
          borderRadius: 36,
          border: '4px solid rgba(245, 158, 11, 0.4)',
        }}
      >
        <div
          style={{
            width: 100,
            height: 100,
            borderRadius: 24,
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 52,
            fontWeight: 900,
            color: '#1c1917',
            boxShadow: '0 10px 30px rgba(245,158,11,0.4)',
          }}
        >
          LF
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
