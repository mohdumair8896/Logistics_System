import type { Metadata } from 'next';

// Reset links carry a one-time token: keep them out of search results and referrer headers.
export const metadata: Metadata = {
  title: 'Choose a new password',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
};

export default function ResetLayout({ children }: { children: React.ReactNode }) {
  return children;
}
