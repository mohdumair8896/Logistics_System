// The driver trip link's offline queue: points are kept in order while there is no network, sent oldest
// first when it returns, and deleted from the phone when the trip closes or the link is refused.

import { describe, expect, it } from 'vitest';
import {
  BATCH_SIZE, MAX_QUEUED, MemoryPingStore, cleanPing, enqueue, flushQueue, type QueuedPing, type SendResult,
} from '@/app/driver-app/pingQueue';

const point = (i: number, tripId = 'TRP-1'): QueuedPing => ({
  tripId, lat: 19 + i / 1000, lng: 72 + i / 1000, speedKmH: 40, accuracy: 10,
  recordedAt: new Date(Date.UTC(2026, 9, 19, 8, 0, i * 5)).toISOString(),
});

async function filled(n: number, tripId = 'TRP-1') {
  const store = new MemoryPingStore();
  for (let i = 0; i < n; i++) await enqueue(store, point(i, tripId));
  return store;
}

describe('flushQueue', () => {
  it('sends everything oldest first, in batches', async () => {
    const store = await filled(BATCH_SIZE + 7);
    const sent: string[] = [];
    const sizes: number[] = [];
    const outcome = await flushQueue(store, 'TRP-1', async (batch) => {
      sizes.push(batch.length);
      sent.push(...batch.map(p => p.recordedAt));
      return 'ok';
    });
    expect(outcome).toEqual({ status: 'sent', sent: BATCH_SIZE + 7 });
    expect(sizes).toEqual([BATCH_SIZE, 7]);
    expect(sent).toEqual([...sent].sort());
    expect(await store.count('TRP-1')).toBe(0);
  });

  it('keeps points, in order, while offline and sends them when the network returns', async () => {
    const store = await filled(3);
    let online = false;
    const received: string[] = [];
    const send = async (batch: QueuedPing[]): Promise<SendResult> => {
      if (!online) return 'retry';
      received.push(...batch.map(p => p.recordedAt));
      return 'ok';
    };

    expect(await flushQueue(store, 'TRP-1', send)).toEqual({ status: 'waiting', sent: 0, queued: 3 });
    await enqueue(store, point(3));
    expect(await flushQueue(store, 'TRP-1', send)).toEqual({ status: 'waiting', sent: 0, queued: 4 });

    online = true;
    expect(await flushQueue(store, 'TRP-1', send)).toEqual({ status: 'sent', sent: 4 });
    expect(received).toEqual([0, 1, 2, 3].map(i => point(i).recordedAt));
  });

  it('deletes the trip’s queued points when the trip is closed', async () => {
    const store = await filled(BATCH_SIZE + 5);
    await enqueue(store, point(0, 'TRP-2'));
    let calls = 0;
    const outcome = await flushQueue(store, 'TRP-1', async () => (++calls === 1 ? 'ok' : 'closed'));
    expect(outcome).toEqual({ status: 'closed', sent: BATCH_SIZE, dropped: 5 });
    expect(await store.count('TRP-1')).toBe(0);
    expect(await store.count('TRP-2')).toBe(1); // other trips are untouched
  });

  it('deletes them too when the link is refused', async () => {
    const store = await filled(2);
    expect(await flushQueue(store, 'TRP-1', async () => 'invalid')).toEqual({ status: 'invalid', sent: 0, dropped: 2 });
    expect(await store.count('TRP-1')).toBe(0);
  });

  it('drops a batch the server rejects as malformed and carries on', async () => {
    const store = await filled(BATCH_SIZE + 1);
    let calls = 0;
    const outcome = await flushQueue(store, 'TRP-1', async () => (++calls === 1 ? 'rejected' : 'ok'));
    expect(outcome).toEqual({ status: 'sent', sent: 1 });
  });
});

describe('enqueue', () => {
  it('keeps at most MAX_QUEUED points, dropping the oldest', async () => {
    const store = await filled(MAX_QUEUED + 2);
    expect(await store.count('TRP-1')).toBe(MAX_QUEUED);
    const [oldest] = await store.oldest('TRP-1', 1);
    expect(oldest.recordedAt).toBe(point(2).recordedAt);
  });

  it('clamps odd GPS readings into the ranges the server accepts', () => {
    expect(cleanPing({ ...point(0), speedKmH: 900, accuracy: -3, lat: 91 })).toMatchObject({ speedKmH: 250, accuracy: 0, lat: 90 });
    expect(cleanPing({ ...point(0), speedKmH: Number.NaN }).speedKmH).toBeUndefined();
  });
});
