import { updateFlag } from '@/app/actions/flags';
import { db } from '@/db';
import { featureFlags, tenants } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';

describe('updateFlag server action', () => {
  let tenantId: string;
  let tenantSlug: string;
  let flagId: string;

  beforeEach(async () => {
    // Clean slate
    await db.delete(featureFlags);
    await db.delete(tenants);

    const [tenant] = await db
      .insert(tenants)
      .values({ name: 'Test Corp', slug: 'test-corp' })
      .returning();
    tenantId = tenant.id;
    tenantSlug = tenant.slug;

    // Insert a flag to update
    const [flag] = await db
      .insert(featureFlags)
      .values({
        tenantId,
        key: 'edit-me',
        name: 'Original Name',
        description: 'Old description',
        type: 'boolean',
        isEnabled: false,
        environment: 'production',
        targetingRules: { rules: [], defaultVariant: false },
      })
      .returning();
    flagId = flag.id;
  });

  it('updates basic fields successfully', async () => {
    const formData = new FormData();
    formData.append('id', flagId);
    formData.append('tenantId', tenantId);
    formData.append('name', 'New Name');
    formData.append('description', 'New description');
    formData.append('isEnabled', 'true');
    formData.append('type', 'multivariate');

    const result = await updateFlag(null, formData);
    expect(result.success).toBe(true);

    const [updated] = await db
      .select()
      .from(featureFlags)
      .where(eq(featureFlags.id, flagId))
      .limit(1);
    expect(updated.name).toBe('New Name');
    expect(updated.description).toBe('New description');
    expect(updated.isEnabled).toBe(true);
    expect(updated.type).toBe('multivariate');
    expect(updated.key).toBe('edit-me');
    expect(updated.environment).toBe('production');
  });

  it('disables a flag when isEnabled is unchecked or set to false', async () => {
    await db.update(featureFlags).set({ isEnabled: true }).where(eq(featureFlags.id, flagId));

    const formData = new FormData();
    formData.append('id', flagId);
    formData.append('tenantId', tenantId);
    // Deliberately omit isEnabled. Action defaults to false
    const result = await updateFlag(null, formData);
    expect(result.success).toBe(true);

    const [updated] = await db
      .select()
      .from(featureFlags)
      .where(eq(featureFlags.id, flagId))
      .limit(1);
    expect(updated.isEnabled).toBe(false);
  });

  it('updates targeting rules when provided as valid JSON', async () => {
    const newRules = {
      rules: [
        {
          id: 'rule1',
          name: 'Beta',
          conditions: [{ attribute: 'email', operator: 'contains', value: '@beta.com' }],
          variant: true,
        },
      ],
      defaultVariant: false,
    };

    const formData = new FormData();
    formData.append('id', flagId);
    formData.append('tenantId', tenantId);
    formData.append('targetingRules', JSON.stringify(newRules));

    const result = await updateFlag(null, formData);
    expect(result.success).toBe(true);

    const [updated] = await db
      .select()
      .from(featureFlags)
      .where(eq(featureFlags.id, flagId))
      .limit(1);
    expect(updated.targetingRules).toEqual(newRules);
  });

  it('rejects invalid UUID for id or tenantId', async () => {
    const formData = new FormData();
    formData.append('id', 'not-a-uuid');
    formData.append('tenantId', tenantId);
    const result = await updateFlag(null, formData);
    expect(result.success).toBe(false);
    expect(result.errors).toHaveProperty('id');
  });

  it('rejects if tenant does not exist', async () => {
    const fakeTenantId = '00000000-0000-0000-0000-000000000000';
    const formData = new FormData();
    formData.append('id', flagId);
    formData.append('tenantId', fakeTenantId);
    const result = await updateFlag(null, formData);
    expect(result.success).toBe(false);
    expect(result.errors).toMatchObject({ _form: ['Invalid tenant ID.'] });
  });

  it('rejects if flag does not exist or does not belong to tenant', async () => {
    // Create another tenant with its own flag
    const [otherTenant] = await db
      .insert(tenants)
      .values({ name: 'Other', slug: 'other' })
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
    formData.append('name', 'Hack attempt');

    const result = await updateFlag(null, formData);
    expect(result.success).toBe(false);
    expect(result.errors).toMatchObject({ _form: ['Flag not found or not owned by tenant.'] });
  });

  it('skips revalidation in test environment', async () => {
    const formData = new FormData();
    formData.append('id', flagId);
    formData.append('tenantId', tenantId);
    formData.append('name', 'Test name');
    const result = await updateFlag(null, formData);
    expect(result.success).toBe(true);
  });
});
