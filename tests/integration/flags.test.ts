import { db } from '@/db';
import { featureFlags, tenants } from '@/db/schema';
import { app } from '@/lib/hono-app';
import { beforeEach, describe, expect, it } from 'vitest';

const authHeaders = {
  Authorization: `Bearer ${process.env.API_KEY}`,
};

describe('GET /api/v1/flags', () => {
  let tenantId: string;

  beforeEach(async () => {
    await db.delete(featureFlags);
    await db.delete(tenants);

    const [tenant] = await db
      .insert(tenants)
      .values({ name: 'Test Tenant', slug: 'test-tenant' })
      .returning();
    tenantId = tenant.id;

    // Seed flags in two environments to verify filtering.
    await db.insert(featureFlags).values([
      {
        tenantId,
        key: 'flag-prod-1',
        name: 'Production Flag 1',
        type: 'boolean',
        isEnabled: true,
        environment: 'production',
        targetingRules: { rules: [], defaultVariant: false },
      },
      {
        tenantId,
        key: 'flag-prod-2',
        name: 'Production Flag 2',
        type: 'multivariate',
        isEnabled: false,
        environment: 'production',
        targetingRules: { rules: [], defaultVariant: false },
      },
      {
        tenantId,
        key: 'flag-dev',
        name: 'Development Flag',
        type: 'boolean',
        isEnabled: true,
        environment: 'development',
        targetingRules: { rules: [], defaultVariant: false },
      },
    ]);
  });

  it('returns the list of flags for a given tenant and environment', async () => {
    const res = await app.request(`/api/v1/flags?tenantId=${tenantId}&environment=production`, {
      method: 'GET',
      headers: { ...authHeaders },
    });
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data).toHaveLength(2);
    // Check first flag's shape including the `environment` field.
    expect(data[0]).toMatchObject({
      key: 'flag-prod-1',
      name: 'Production Flag 1',
      type: 'boolean',
      isEnabled: true,
      environment: 'production',
    });
    expect(data[1]).toMatchObject({
      key: 'flag-prod-2',
      name: 'Production Flag 2',
      type: 'multivariate',
      isEnabled: false,
      environment: 'production',
    });
    // Ensure fields like `updatedAt` are present as strings (ISO date).
    expect(typeof data[0].updatedAt).toBe('string');
  });

  it('returns 404 if the tenant does not exist', async () => {
    const nonExistentTenantId = '00000000-0000-0000-0000-000000000000';
    const res = await app.request(
      `/api/v1/flags?tenantId=${nonExistentTenantId}&environment=production`,
      {
        method: 'GET',
        headers: { ...authHeaders },
      },
    );
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json).toMatchObject({ error: 'Tenant not found' });
  });

  it('returns 400 if tenantId is missing', async () => {
    const res = await app.request('/api/v1/flags?environment=production', {
      method: 'GET',
      headers: { ...authHeaders },
    });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('Bad Request');
    expect(json.details).toBeDefined();
  });

  it('returns 400 if environment is missing', async () => {
    const res = await app.request(`/api/v1/flags?tenantId=${tenantId}`, {
      method: 'GET',
      headers: { ...authHeaders },
    });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('Bad Request');
  });
});
