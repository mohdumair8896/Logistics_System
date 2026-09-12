// ─── Database Connection — Neon PostgreSQL (Serverless) ───────────────────────
// Uses @neondatabase/serverless for edge-compatible HTTP connections.
// All API routes import { db } from '@/lib/db'.

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const sql = neon(process.env.DATABASE_URL);
export const db = drizzle(sql, { schema });

export type DbClient = typeof db;
