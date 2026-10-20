import type { Metadata } from 'next';

// Invite links carry a one-time token: keep them out of search results and referrer headers.
export const metadata: Metadata = {
  title: 'Accept invitation',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
};

export default function InviteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
