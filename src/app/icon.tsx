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
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#090d16',
          borderRadius: 8,
          border: '1px solid rgba(56, 189, 248, 0.4)',
        }}
      >
        <svg width="24" height="24" viewBox="0 0 100 100" fill="none">
          <polygon
            points="50,4 92,26 92,74 50,96 8,74 8,26"
            fill="#0f172a"
            stroke="#f59e0b"
            strokeWidth="5"
          />
          <path
            d="M 28 32 L 28 68 L 48 68"
            stroke="#fbbf24"
            strokeWidth="11"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M 52 32 L 72 32 M 52 50 L 68 50 M 52 68 L 72 68 M 52 32 L 52 68"
            stroke="#38bdf8"
            strokeWidth="10"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}
