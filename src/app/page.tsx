'use client';

import dynamic from 'next/dynamic';
import LogisticsSections from '@/components/home/LogisticsSections';

const ScrollJourneyCanvas = dynamic(
  () => import('@/components/home/ScrollJourneyCanvas'),
  { ssr: false }
);

export default function Home() {
  return (
    // CRITICAL: NO overflow-x:hidden on this element — it breaks position:sticky
    // The scroll happens on the <html>/<body> (the viewport), not a child container
    <main style={{ background: '#020617', width: '100%' }}>

      {/* 400vh tall scroll track — the sticky canvas locks here */}
      <div
        id="journey-track"
        style={{ position: 'relative', height: '400vh', width: '100%' }}
      >
        {/* sticky: stays fixed in viewport as user scrolls through the 400vh */}
        <div
          style={{
            position: 'sticky',
            top: 0,
            height: '100vh',
            width: '100%',
            overflow: 'hidden', // only the canvas container clips, NOT the parent
          }}
        >
          <ScrollJourneyCanvas />
        </div>
      </div>

      {/* All below-the-fold marketing sections */}
      <LogisticsSections />

    </main>
  );
}
