import { loadEnvConfig } from '@next/env';
import { Client } from 'pg';

// Reuse the repo's env-loading convention so `npm run test:e2e` works locally
// without manually exporting DATABASE_URL. Existing process.env values win.
loadEnvConfig(process.cwd());

const TENANT_SLUG = 'lambda-corp';

/**
 * Playwright global setup for the E2E suite.
 *
 * The dashboard critical-path tests need the `lambda-corp` tenant to exist.
 * CI runs the integration suite (which truncates tenants) before E2E and never
 * seeds, so we provision the tenant idempotently here. Stale `e2e-*` flags from
 * previously failed runs are cleared to keep the suite repeatable.
 */
export default async function globalSetup(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is required to run the E2E suite.');
  }

  const client = new Client({ connectionString });
  await client.connect();

  try {
    await client.query(
      `INSERT INTO tenants (name, slug)
       VALUES ($1, $2)
       ON CONFLICT (slug) DO NOTHING`,
      ['Lambda Corp', TENANT_SLUG],
    );

    await client.query(
      `DELETE FROM feature_flags
       WHERE tenant_id = (SELECT id FROM tenants WHERE slug = $1)
         AND key LIKE 'e2e-%'`,
      [TENANT_SLUG],
    );
  } finally {
    await client.end();
  }
}
