import { db } from '@/db';
import { analyticsEvents, featureFlags, tenants } from '@/db/schema';
import { hashString } from '@/lib/evaluator';
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
      distinctId: 'user_0123',
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

  describe('Rollout percentages', () => {
    let rolloutTenantId: string;

    beforeEach(async () => {
      // Clean slate for this block
      await db.delete(analyticsEvents);
      await db.delete(featureFlags);
      await db.delete(tenants);

      const [tenant] = await db
        .insert(tenants)
        .values({ name: 'Rollout Tenant', slug: 'rollout-tenant' })
        .returning();
      rolloutTenantId = tenant.id;

      // Insert a flag with a rule that has `rolloutPercentage` = 50
      await db.insert(featureFlags).values({
        tenantId: rolloutTenantId,
        key: 'rollout-flag',
        name: 'Rollout test',
        type: 'boolean',
        isEnabled: true,
        environment: 'test',
        targetingRules: {
          rules: [
            {
              id: 'rule_rollout',
              name: '50% rollout',
              conditions: [
                {
                  attribute: 'email',
                  operator: 'equals',
                  value: 'user@example.com',
                },
              ],
              variant: true,
              rolloutPercentage: 50,
            },
          ],
          defaultVariant: false,
        },
      });
    });

    it('should match when rolloutPercentage = 100%', async () => {
      // Create a separate flag with 100% rollout
      await db.insert(featureFlags).values({
        tenantId: rolloutTenantId,
        key: 'rollout-100',
        name: '100% rollout',
        type: 'boolean',
        isEnabled: true,
        environment: 'test',
        targetingRules: {
          rules: [
            {
              id: 'rule_100',
              name: '100% rollout',
              conditions: [{ attribute: 'email', operator: 'equals', value: 'user@example.com' }],
              variant: true,
              rolloutPercentage: 100,
            },
          ],
          defaultVariant: false,
        },
      });

      const payload = {
        tenantId: rolloutTenantId,
        key: 'rollout-100',
        environment: 'test',
        distinctId: 'any-user-id',
        context: { email: 'user@example.com' },
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
          waitUntil: async (p: Promise<unknown>) => await p,
          passThroughOnException: () => {},
        } as unknown as HonoCtx,
      );

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.value).toBe(true);
      expect(data.match).toBe(true);
    });

    it('should fall back to default when rolloutPercentage = 0%', async () => {
      await db.insert(featureFlags).values({
        tenantId: rolloutTenantId,
        key: 'rollout-0',
        name: '0% rollout',
        type: 'boolean',
        isEnabled: true,
        environment: 'test',
        targetingRules: {
          rules: [
            {
              id: 'rule_0',
              name: '0% rollout',
              conditions: [{ attribute: 'email', operator: 'equals', value: 'user@example.com' }],
              variant: true,
              rolloutPercentage: 0,
            },
          ],
          defaultVariant: false,
        },
      });

      const payload = {
        tenantId: rolloutTenantId,
        key: 'rollout-0',
        environment: 'test',
        distinctId: 'any-user-id',
        context: { email: 'user@example.com' },
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
          waitUntil: async (p: Promise<unknown>) => await p,
          passThroughOnException: () => {},
        } as unknown as HonoCtx,
      );

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.value).toBe(false);
      expect(data.match).toBe(true);
    });

    it('should deterministically match for distinctId falling into the 50% bucket', async () => {
      const testIds = ['user-a', 'user-b'];
      const expectedResults: Record<string, boolean> = {};

      // Pre-compute expected values
      for (const id of testIds) {
        const bucket = hashString(id) % 100;
        expectedResults[id] = bucket < 50; // rolloutPercentage = 50
      }

      // Make API calls and assert they match expectations
      for (const id of testIds) {
        const payload = {
          tenantId: rolloutTenantId,
          key: 'rollout-flag',
          environment: 'test',
          distinctId: id,
          context: { email: 'user@example.com' },
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
            waitUntil: async (p: Promise<unknown>) => await p,
            passThroughOnException: () => {},
          } as unknown as HonoCtx,
        );

        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.value).toBe(expectedResults[id]);
      }
    });

    it('should move to the next rule if rollout fails for the first matching rule', async () => {
      // Insert a flag with two rules.
      // Rule 1: If email matches rollout=0 (always fails)
      // Rule 2: If email matches rollout=100 (always wins)
      await db.insert(featureFlags).values({
        tenantId: rolloutTenantId,
        key: 'fallback-rollout',
        name: 'Fallback test',
        type: 'boolean',
        isEnabled: true,
        environment: 'test',
        targetingRules: {
          rules: [
            {
              id: 'rule_fail',
              name: 'Fail',
              conditions: [{ attribute: 'email', operator: 'equals', value: 'user@example.com' }],
              variant: 'first-variant',
              rolloutPercentage: 0,
            },
            {
              id: 'rule_win',
              name: 'Win',
              conditions: [{ attribute: 'email', operator: 'equals', value: 'user@example.com' }],
              variant: 'second-variant',
              rolloutPercentage: 100,
            },
          ],
          defaultVariant: 'default',
        },
      });

      const payload = {
        tenantId: rolloutTenantId,
        key: 'fallback-rollout',
        environment: 'test',
        distinctId: 'any-id',
        context: { email: 'user@example.com' },
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
          waitUntil: async (p: Promise<unknown>) => await p,
          passThroughOnException: () => {},
        } as unknown as HonoCtx,
      );

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.value).toBe('second-variant');
    });
  });
});
