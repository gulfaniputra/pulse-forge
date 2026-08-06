import { deleteFlag } from '@/app/actions/flags';
import { db } from '@/db';
import { featureFlags, tenants } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';

describe('deleteFlag server action', () => {
  let tenantId: string;
  let tenantSlug: string;
  let flagId: string;

  beforeEach(async () => {
    // Clean slate.
    await db.delete(featureFlags);
    await db.delete(tenants);

    const [tenant] = await db
      .insert(tenants)
      .values({ name: 'Delete Test Corp', slug: 'delete-corp' })
      .returning();
    tenantId = tenant.id;
    tenantSlug = tenant.slug;

    const [flag] = await db
      .insert(featureFlags)
      .values({
        tenantId,
        key: 'delete-me',
        name: 'To Be Deleted',
        type: 'boolean',
        isEnabled: false,
        environment: 'production',
        targetingRules: { rules: [], defaultVariant: false },
      })
      .returning();
    flagId = flag.id;
  });

  it('should delete a flag successfully', async () => {
    const formData = new FormData();
    formData.append('id', flagId);
    formData.append('tenantId', tenantId);
    formData.append('slug', tenantSlug);

    const result = await deleteFlag(null, formData);
    expect(result.success).toBe(true);

    const [deletedFlag] = await db
      .select()
      .from(featureFlags)
      .where(eq(featureFlags.id, flagId))
      .limit(1);
    expect(deletedFlag).toBeUndefined();
  });

  it('should reject if flag does not exist', async () => {
    const fakeFlagId = '00000000-0000-0000-0000-000000000000';
    const formData = new FormData();
    formData.append('id', fakeFlagId);
    formData.append('tenantId', tenantId);
    formData.append('slug', tenantSlug);

    const result = await deleteFlag(null, formData);
    expect(result.success).toBe(false);
    expect(result.errors).toMatchObject({
      _form: ['Flag not found or not owned by tenant.'],
    });
  });

  it('should reject if flag belongs to a different tenant', async () => {
    // Create another tenant.
    const [otherTenant] = await db
      .insert(tenants)
      .values({ name: 'Other Corp', slug: 'other-corp' })
      .returning();

    const [otherFlag] = await db
      .insert(featureFlags)
      .values({
        tenantId: otherTenant.id,
        key: 'other-flag',
        name: 'Other',
        type: 'boolean',
        isEnabled: false,
        environment: 'production',
        targetingRules: { rules: [], defaultVariant: false },
      })
      .returning();

    const formData = new FormData();
    formData.append('id', otherFlag.id);
    formData.append('tenantId', tenantId);
    formData.append('slug', tenantSlug);

    const result = await deleteFlag(null, formData);
    expect(result.success).toBe(false);
    expect(result.errors).toMatchObject({
      _form: ['Flag not found or not owned by tenant.'],
    });
  });

  it('should reject invalid tenant ID', async () => {
    const fakeTenantId = '00000000-0000-0000-0000-000000000000';
    const formData = new FormData();
    formData.append('id', flagId);
    formData.append('tenantId', fakeTenantId);
    formData.append('slug', tenantSlug);

    const result = await deleteFlag(null, formData);
    expect(result.success).toBe(false);
    expect(result.errors).toMatchObject({
      _form: ['Invalid tenant ID.'],
    });
  });

  it('should skip revalidation in test environment', async () => {
    const formData = new FormData();
    formData.append('id', flagId);
    formData.append('tenantId', tenantId);
    formData.append('slug', tenantSlug);

    const result = await deleteFlag(null, formData);
    expect(result.success).toBe(true);
  });
});
