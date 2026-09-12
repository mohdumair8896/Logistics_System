// ─── Ably Server-Side Publisher ───────────────────────────────────────────────
// Use this in API routes and server actions — NOT in client components.
// For client-side subscriptions, use src/lib/ably.ts instead.

export async function publishToAbly(channel: string, event: string, data: unknown) {
  const key = process.env.ABLY_API_KEY;
  if (!key) return; // Not configured — silently skip

  try {
    const { Rest } = await import('ably');
    const ably = new Rest(key);
    await ably.channels.get(channel).publish(event, data);
  } catch (err) {
    console.error(`[Ably] Failed to publish to ${channel}/${event}:`, err);
  }
}
