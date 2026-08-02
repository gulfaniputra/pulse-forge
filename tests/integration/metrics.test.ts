import { db } from '@/db';
import { analyticsEvents, featureFlags, tenants } from '@/db/schema';
import { app } from '@/lib/hono-app';
import { beforeEach, describe, expect, it } from 'vitest';

type MetricsResponseItem = { day: string; flagKey: string; count: number };

describe('GET /api/v1/metrics', () => {
  let tenantId: string;
  let flagKey: string;

  beforeEach(async () => {
    // Clean up
    await db.delete(analyticsEvents);
    await db.delete(featureFlags);
    await db.delete(tenants);

    const [tenant] = await db
      .insert(tenants)
      .values({ name: 'Metrics Test', slug: 'metrics-test' })
      .returning();
    tenantId = tenant.id;

    const [flag] = await db
      .insert(featureFlags)
      .values({
        tenantId,
        key: 'test-flag',
        name: 'Test Flag',
        type: 'boolean',
        isEnabled: true,
        environment: 'production',
        targetingRules: { rules: [], defaultVariant: false },
      })
      .returning();
    flagKey = flag.key;

    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const twoDaysAgo = new Date(now);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    await db.insert(analyticsEvents).values([
      { tenantId, flagKey, distinctId: 'user1', evaluation: 'true', timestamp: now, context: {} },
      { tenantId, flagKey, distinctId: 'user2', evaluation: 'true', timestamp: now, context: {} },
      {
        tenantId,
        flagKey,
        distinctId: 'user3',
        evaluation: 'false',
        timestamp: yesterday,
        context: {},
      },
      {
        tenantId,
        flagKey,
        distinctId: 'user4',
        evaluation: 'true',
        timestamp: twoDaysAgo,
        context: {},
      },
    ]);
  }, 20000);

  it('returns 200 with aggregated metrics for the tenant/environment', async () => {
    const res = await app.request(`/api/v1/metrics?tenantId=${tenantId}&environment=production`, {
      method: 'GET',
    });
    expect(res.status).toBe(200);
    const data = (await res.json()) as MetricsResponseItem[];
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(3);
    expect(data[0]).toHaveProperty('day');
    expect(data[0]).toHaveProperty('flagKey');
    expect(data[0]).toHaveProperty('count');
    const total = data.reduce((acc, item) => acc + Number(item.count), 0);
    expect(total).toBe(4);
  });

  it('filters by flagKey when provided', async () => {
    const res = await app.request(
      `/api/v1/metrics?tenantId=${tenantId}&environment=production&flagKey=${flagKey}`,
      { method: 'GET' },
    );
    expect(res.status).toBe(200);
    const data = (await res.json()) as MetricsResponseItem[];
    expect(data.every((item) => item.flagKey === flagKey)).toBe(true);
  });

  it('returns 400 if tenantId is missing', async () => {
    const res = await app.request('/api/v1/metrics?environment=production', { method: 'GET' });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('Bad Request');
  });

  it('returns 404 if tenant does not exist', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const res = await app.request(`/api/v1/metrics?tenantId=${fakeId}&environment=production`, {
      method: 'GET',
    });
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toBe('Tenant not found');
  });
});
