// ─── WhatsApp click-to-chat ───────────────────────────────────────────────────
// NEXT_PUBLIC_WHATSAPP_NUMBER: the business WhatsApp number in international form, digits only
// (e.g. 919876543210). Unset: every WhatsApp button stays hidden rather than pointing at a guess.

export const WHATSAPP_NUMBER = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '').replace(/\D/g, '');

export const whatsappConfigured = WHATSAPP_NUMBER.length >= 10;

/** A wa.me link with a pre-filled message */
export function waLink(text: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}
