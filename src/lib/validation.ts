// ─── Request validation helpers (server-only) ─────────────────────────────────
// Every write endpoint parses its body through a zod schema so only allow-listed
// fields reach the database (no mass-assignment of ids, totals or statuses).

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';

export type ParseResult<T> = { ok: true; data: T } | { ok: false; response: NextResponse };

/** Parses and validates a JSON body. Unknown keys are rejected when the schema is `.strict()`. */
export async function parseJsonBody<T extends z.ZodTypeAny>(req: NextRequest, schema: T): Promise<ParseResult<z.infer<T>>> {
  const raw = await req.json().catch(() => undefined);
  if (raw === undefined) {
    return { ok: false, response: NextResponse.json({ error: 'Request body must be valid JSON' }, { status: 400 }) };
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 },
      ),
    };
  }
  return { ok: true, data: parsed.data };
}

/** Throws a 409-style error message when a status change is not allowed. */
export function transitionError(entity: string, from: string | null | undefined, to: string) {
  return NextResponse.json(
    { error: `${entity} cannot move from "${from ?? 'unknown'}" to "${to}"` },
    { status: 409 },
  );
}

/** ISO calendar date (YYYY-MM-DD), as stored in Postgres `date` columns. */
export const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected a date in YYYY-MM-DD format');
