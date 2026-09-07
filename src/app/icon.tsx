import { ImageResponse } from 'next/og';

export const size = {
  width: 32,
  height: 32,
};
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 18,
          background: 'linear-gradient(135deg, #f59e0b, #d97706)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#1c1917',
          fontWeight: 900,
          borderRadius: 8,
          boxShadow: 'inset 0 0 4px rgba(255,255,255,0.4)',
        }}
      >
        LF
      </div>
    ),
    {
      ...size,
    }
  );
}
