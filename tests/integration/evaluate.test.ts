import { db } from '@/db';
import { analyticsEvents, featureFlags, tenants } from '@/db/schema';
import { app } from '@/lib/hono-app';
import { beforeEach, describe, expect, it } from 'vitest';

type HonoCtx = NonNullable<Parameters<typeof app.request>[3]>;

describe('POST /api/v1/evaluate - Integration Suite', () => {
  let tenantId: string;

  beforeEach(async () => {
    // Clear analytics events first to prevent async log records from blocking tenant deletion
    await db.delete(analyticsEvents);
    await db.delete(featureFlags);
    await db.delete(tenants);

    const [tenant] = await db
      .insert(tenants)
      .values({
        name: 'Test Enterprise',
        slug: 'test-enterprise',
      })
      .returning();

    tenantId = tenant.id;

    // Seed a standard multi-tenant targeting blueprint rule setup
    await db.insert(featureFlags).values({
      tenantId: tenant.id,
      key: 'premium-features',
      name: 'Premium Tier Flags',
      type: 'boolean',
      isEnabled: true,
      environment: 'test',
      targetingRules: {
        rules: [
          {
            id: 'rule_beta',
            name: 'Beta Domain Access',
            conditions: [
              {
                attribute: 'email',
                operator: 'contains',
                value: '@beta.com',
              },
            ],
            variant: true,
          },
        ],
        defaultVariant: false,
      },
    });
  });

  it('should return default variant if context does not match targeting conditions', async () => {
    const payload = {
      tenantId,
      key: 'premium-features',
      environment: 'test',
      distinctId: 'user_123',
      context: { email: 'user@standard.com' },
    };

    const res = await app.request(
      '/api/v1/evaluate',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
      undefined,
      {
        waitUntil: async (promise: Promise<unknown>) => {
          await promise;
        },
        passThroughOnException: () => {},
      } as unknown as HonoCtx,
    );

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.value).toBe(false);
  });

  it('should route to matched variant if rule parameters match context perfectly', async () => {
    const payload = {
      tenantId,
      key: 'premium-features',
      environment: 'test',
      distinctId: 'user_999',
      context: { email: 'tester@beta.com' },
    };

    const res = await app.request(
      '/api/v1/evaluate',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
      undefined,
      {
        waitUntil: async (promise: Promise<unknown>) => {
          await promise;
        },
        passThroughOnException: () => {},
      } as unknown as HonoCtx,
    );

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.value).toBe(true);
  });

  it('should return 400 Bad Request if mandatory shield variables are omitted', async () => {
    const res = await app.request('/api/v1/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantId,
        environment: 'test',
      }),
    });

    expect(res.status).toBe(400);
  });
});
