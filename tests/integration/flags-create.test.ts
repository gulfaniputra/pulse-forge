// tests/integration/flags-create.test.ts
import { createFlag } from '@/app/actions/flags';
import { db } from '@/db';
import { featureFlags, tenants } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';

describe('createFlag server action', () => {
  let tenantId: string;
  let tenantSlug: string;

  beforeEach(async () => {
    await db.delete(featureFlags);
    await db.delete(tenants);

    const [tenant] = await db
      .insert(tenants)
      .values({ name: 'Test Corp', slug: 'test-corp' })
      .returning();
    tenantId = tenant.id;
    tenantSlug = tenant.slug;
  });

  it('should create a flag with valid data', async () => {
    const formData = new FormData();
    formData.append('tenantId', tenantId);
    formData.append('slug', tenantSlug);
    formData.append('key', 'feature-x');
    formData.append('name', 'Feature X');
    formData.append('type', 'boolean');
    formData.append('environment', 'production');
    formData.append('isEnabled', 'true');

    const result = await createFlag(null, formData);
    expect(result.success).toBe(true);

    const [flag] = await db
      .select()
      .from(featureFlags)
      .where(eq(featureFlags.key, 'feature-x'))
      .limit(1);
    expect(flag).toBeDefined();
    expect(flag.name).toBe('Feature X');
    expect(flag.isEnabled).toBe(true);
    expect(flag.environment).toBe('production');
  });

  it('should reject missing required fields', async () => {
    const formData = new FormData();
    formData.append('tenantId', tenantId);
    formData.append('slug', tenantSlug);

    const result = await createFlag(null, formData);
    expect(result.success).toBe(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const errors = result.errors as any;
    expect(errors.key).toBeDefined();
    expect(errors.name).toBeDefined();
  });

  it('should reject duplicate (tenant, key, environment)', async () => {
    await db.insert(featureFlags).values({
      tenantId,
      key: 'duplicate',
      name: 'Duplicate',
      environment: 'production',
      type: 'boolean',
      isEnabled: false,
      targetingRules: { rules: [], defaultVariant: false },
    });

    const formData = new FormData();
    formData.append('tenantId', tenantId);
    formData.append('slug', tenantSlug);
    formData.append('key', 'duplicate');
    formData.append('name', 'Another');
    formData.append('environment', 'production');

    const result = await createFlag(null, formData);
    expect(result.success).toBe(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const errors = result.errors as any;
    expect(errors._form).toBeDefined();
    expect(errors._form[0]).toMatch(/already exists/i);
  });
});
