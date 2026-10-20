'use client';
// ─── Floating WhatsApp button on phones ───────────────────────────────────────
// Shown only below 768 px (CSS) and only when NEXT_PUBLIC_WHATSAPP_NUMBER is set (src/lib/whatsapp.ts).

import { MessageCircle } from 'lucide-react';
import { track } from '@/lib/analytics';
import { waLink, whatsappConfigured } from '@/lib/whatsapp';

export function WhatsAppFab() {
  if (!whatsappConfigured) return null;
  return (
    <a
      className="mk-wa-fab"
      href={waLink('Hi, I would like to know more about LogisticsEdge.')}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      onClick={() => track('whatsapp_clicked', { where: 'floating' })}
    >
      <MessageCircle size={24} aria-hidden="true" />
    </a>
  );
}
