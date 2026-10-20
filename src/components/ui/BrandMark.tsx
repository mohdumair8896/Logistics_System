// LogisticsEdge mark: a green highway signboard (white border) with a "straight ahead" arrow.
// See docs/DESIGN_SYSTEM.md §4.

export function BrandMark({ size = 28, title }: { size?: number; title?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" role={title ? 'img' : undefined} aria-hidden={title ? undefined : true}>
      {title && <title>{title}</title>}
      <rect x="1" y="1" width="30" height="30" rx="6" fill="var(--brand)" />
      <rect x="3.75" y="3.75" width="24.5" height="24.5" rx="3.5" fill="none" stroke="#fff" strokeWidth="1.5" />
      <path d="M16 23.5V10.5M10.75 15.5 16 10.25l5.25 5.25" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
