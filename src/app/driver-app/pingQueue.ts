// ─── Offline GPS queue for the driver trip link ───────────────────────────────
// Every point the phone takes goes into IndexedDB first and is then sent oldest-first, in batches, to
// /api/gps/ping. With no signal (highway black spots) the points wait on the phone and the page says so
// honestly ("saved, will send when online"); they go out in order when the connection returns.
// When the server says the trip is closed or the link is no longer valid, the trip's queued points are
// deleted: location is not kept on the phone after tracking ends.

export interface QueuedPing {
  id?: number;        // IndexedDB key: increases in the order points were taken
  tripId: string;
  lat: number;
  lng: number;
  speedKmH?: number;
  accuracy?: number;
  recordedAt: string; // when the phone took the fix (ISO 8601)
}

export interface PingStore {
  /** true when points survive a page reload (IndexedDB), false for the in-memory fallback. */
  readonly persistent: boolean;
  add(ping: QueuedPing): Promise<void>;
  /** The trip's oldest points, in the order they were taken. */
  oldest(tripId: string, limit: number): Promise<QueuedPing[]>;
  remove(ids: number[]): Promise<void>;
  count(tripId: string): Promise<number>;
  clear(tripId: string): Promise<void>;
}

/** Points per request. The server accepts up to 100. */
export const BATCH_SIZE = 50;
/** 12 hours of 5-second points. Beyond this the oldest are dropped so the phone doesn't fill up. */
export const MAX_QUEUED = 8640;

/**
 * What the server did with a batch:
 * ok — stored · retry — no network or a server error, try again later · rejected — bad data (400), drop
 * that batch · closed — the trip is finished (409) · invalid — the link was refused (401/403/404).
 */
export type SendResult = 'ok' | 'retry' | 'rejected' | 'closed' | 'invalid';

export type FlushOutcome =
  | { status: 'sent'; sent: number }
  | { status: 'waiting'; sent: number; queued: number }
  | { status: 'closed' | 'invalid'; sent: number; dropped: number };

/** Keeps a point inside the ranges /api/gps/ping accepts, so one odd GPS reading can't block the queue. */
export function cleanPing(p: QueuedPing): QueuedPing {
  const round = (n: number, places: number) => Math.round(n * 10 ** places) / 10 ** places;
  return {
    ...p,
    lat: round(Math.min(90, Math.max(-90, p.lat)), 7),
    lng: round(Math.min(180, Math.max(-180, p.lng)), 7),
    speedKmH: p.speedKmH === undefined || !Number.isFinite(p.speedKmH) ? undefined : round(Math.min(250, Math.max(0, p.speedKmH)), 1),
    accuracy: p.accuracy === undefined || !Number.isFinite(p.accuracy) ? undefined : round(Math.min(100000, Math.max(0, p.accuracy)), 1),
  };
}

export async function enqueue(store: PingStore, ping: QueuedPing): Promise<void> {
  await store.add(cleanPing(ping));
  const extra = (await store.count(ping.tripId)) - MAX_QUEUED;
  if (extra > 0) {
    const old = await store.oldest(ping.tripId, extra);
    await store.remove(old.map(p => p.id!));
  }
}

/** Sends the trip's queued points oldest-first until the queue is empty or the server can't take more. */
export async function flushQueue(
  store: PingStore,
  tripId: string,
  send: (batch: QueuedPing[]) => Promise<SendResult>,
): Promise<FlushOutcome> {
  let sent = 0;
  for (;;) {
    const batch = await store.oldest(tripId, BATCH_SIZE);
    if (batch.length === 0) return { status: 'sent', sent };
    const result = await send(batch);
    if (result === 'ok' || result === 'rejected') {
      await store.remove(batch.map(p => p.id!));
      if (result === 'ok') sent += batch.length;
      continue;
    }
    if (result === 'retry') return { status: 'waiting', sent, queued: await store.count(tripId) };
    const dropped = await store.count(tripId);
    await store.clear(tripId);
    return { status: result, sent, dropped };
  }
}

// ─── Stores ───────────────────────────────────────────────────────────────────

/** Fallback when IndexedDB is unavailable (some private modes): queues only while the page stays open. */
export class MemoryPingStore implements PingStore {
  readonly persistent = false;
  private rows: QueuedPing[] = [];
  private nextId = 1;

  async add(ping: QueuedPing) { this.rows.push({ ...ping, id: this.nextId++ }); }
  async oldest(tripId: string, limit: number) { return this.rows.filter(r => r.tripId === tripId).slice(0, limit); }
  async remove(ids: number[]) { const drop = new Set(ids); this.rows = this.rows.filter(r => !drop.has(r.id!)); }
  async count(tripId: string) { return this.rows.filter(r => r.tripId === tripId).length; }
  async clear(tripId: string) { this.rows = this.rows.filter(r => r.tripId !== tripId); }
}

const DB_NAME = 'logisticsedge-driver';
const STORE = 'pings';

const done = <T>(req: IDBRequest<T>) => new Promise<T>((resolve, reject) => {
  req.onsuccess = () => resolve(req.result);
  req.onerror = () => reject(req.error);
});
const committed = (tx: IDBTransaction) => new Promise<void>((resolve, reject) => {
  tx.oncomplete = () => resolve();
  tx.onerror = () => reject(tx.error);
  tx.onabort = () => reject(tx.error);
});

class IdbPingStore implements PingStore {
  readonly persistent = true;
  constructor(private db: IDBDatabase) {}

  async add(ping: QueuedPing) {
    const tx = this.db.transaction(STORE, 'readwrite');
    const row = { ...ping };
    delete row.id;
    tx.objectStore(STORE).add(row);
    await committed(tx);
  }

  async oldest(tripId: string, limit: number) {
    const tx = this.db.transaction(STORE, 'readonly');
    const index = tx.objectStore(STORE).index('tripId');
    // An index cursor over one key walks the primary keys in ascending order, i.e. the order points were taken
    const rows: QueuedPing[] = [];
    await new Promise<void>((resolve, reject) => {
      const req = index.openCursor(IDBKeyRange.only(tripId));
      req.onsuccess = () => {
        const cursor = req.result;
        if (!cursor || rows.length >= limit) return resolve();
        rows.push(cursor.value as QueuedPing);
        cursor.continue();
      };
      req.onerror = () => reject(req.error);
    });
    return rows;
  }

  async remove(ids: number[]) {
    if (ids.length === 0) return;
    const tx = this.db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    for (const id of ids) store.delete(id);
    await committed(tx);
  }

  async count(tripId: string) {
    const tx = this.db.transaction(STORE, 'readonly');
    return done(tx.objectStore(STORE).index('tripId').count(IDBKeyRange.only(tripId)));
  }

  async clear(tripId: string) {
    const tx = this.db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    // Delete inside the cursor callbacks: awaiting between requests can let the transaction close (older Safari)
    const req = store.index('tripId').openKeyCursor(IDBKeyRange.only(tripId));
    req.onsuccess = () => {
      const cursor = req.result;
      if (!cursor) return;
      store.delete(cursor.primaryKey);
      cursor.continue();
    };
    await committed(tx);
  }
}

/** IndexedDB when the browser allows it, otherwise the in-memory fallback. */
export async function openPingStore(): Promise<PingStore> {
  try {
    if (typeof indexedDB === 'undefined') return new MemoryPingStore();
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const store = req.result.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
      store.createIndex('tripId', 'tripId');
    };
    return new IdbPingStore(await done(req));
  } catch {
    return new MemoryPingStore();
  }
}
