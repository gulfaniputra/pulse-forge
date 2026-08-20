import { Pool as NeonPool, neonConfig } from '@neondatabase/serverless';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-serverless';
import type { Pool as PgPool } from 'pg';
import * as schema from './schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is missing.');
}

const isEdge = process.env.NEXT_RUNTIME === 'edge';
const isLocalPostgres =
  !isEdge &&
  (process.env.DATABASE_URL.includes('localhost') ||
    process.env.DATABASE_URL.includes('127.0.0.1'));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbClient = any;
let dbClient: DbClient;

if (isLocalPostgres) {
  const pg = await import('pg');
  const { drizzle } = await import('drizzle-orm/node-postgres');

  const globalForDb = globalThis as unknown as { pool: PgPool | undefined };
  const pool = globalForDb.pool ?? new pg.Pool({ connectionString: process.env.DATABASE_URL });
  if (process.env.NODE_ENV !== 'production') {
    globalForDb.pool = pool;
  }
  dbClient = drizzle(pool, { schema });
} else {
  if (typeof globalThis.WebSocket === 'undefined') {
    const ws = await import('ws');
    neonConfig.webSocketConstructor = ws.default;
  }

  const globalForDb = globalThis as unknown as { pool: NeonPool | undefined };
  const pool =
    globalForDb.pool ??
    new NeonPool({
      connectionString: process.env.DATABASE_URL,
      connectionTimeoutMillis: 10000,
    });
  if (process.env.NODE_ENV !== 'production') {
    globalForDb.pool = pool;
  }
  dbClient = drizzleNeon(pool, { schema });
}

export const db = dbClient;
export type { DbClient };
