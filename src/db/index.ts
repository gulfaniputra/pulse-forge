import { Pool as NeonPool, neonConfig } from '@neondatabase/serverless';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-serverless';
import * as schema from './schema';

declare const require: (id: string) => unknown;

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is missing.');
}

const isLocalPostgres =
  process.env.DATABASE_URL.includes('localhost') || process.env.DATABASE_URL.includes('127.0.0.1');

export function extractClientType() {
  const dummyPool = {} as NeonPool;
  return drizzleNeon(dummyPool, { schema });
}
type NeonDbClient = ReturnType<typeof extractClientType>;

let dbInstance: unknown;

if (isLocalPostgres) {
  const pgModule = 'pg';
  const drizzlePgModule = 'drizzle-orm/node-postgres';

  const pg = require(pgModule) as { Pool: new (config: { connectionString: string }) => unknown };
  const { drizzle: drizzlePg } = require(drizzlePgModule) as {
    drizzle: (pool: unknown, options: { schema: typeof schema }) => unknown;
  };

  const globalForDb = globalThis as unknown as { pool: unknown };
  const pool = globalForDb.pool ?? new pg.Pool({ connectionString: process.env.DATABASE_URL });

  if (process.env.NODE_ENV !== 'production') {
    globalForDb.pool = pool;
  }

  dbInstance = drizzlePg(pool, { schema });
} else {
  if (typeof globalThis.WebSocket === 'undefined') {
    const wsModule = 'ws';
    const ws = require(wsModule) as typeof neonConfig.webSocketConstructor;
    neonConfig.webSocketConstructor = ws;
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

  dbInstance = drizzleNeon(pool, { schema });
}

export const db = dbInstance as unknown as NeonDbClient;
export type DbClient = NeonDbClient;
