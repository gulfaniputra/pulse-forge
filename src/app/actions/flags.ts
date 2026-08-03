'use server';

import { db } from '@/db';
import { featureFlags, tenants } from '@/db/schema';
import { type FeatureFlagTargeting } from '@/db/types';
import { createFlagSchema, updateFlagSchema } from '@/lib/validations';
import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

/**
 * Extract Postgres error code from various error shapes.
 * Covers top‑level, `cause`, & `original` properties.
 */
function getPostgresErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== 'object') return undefined;

  if ('code' in error && typeof (error as { code: unknown }).code === 'string') {
    return (error as { code: string }).code;
  }

  const cause = (error as { cause?: unknown }).cause;
  if (
    cause &&
    typeof cause === 'object' &&
    'code' in cause &&
    typeof (cause as { code: unknown }).code === 'string'
  ) {
    return (cause as { code: string }).code;
  }

  const original = (error as { original?: unknown }).original;
  if (
    original &&
    typeof original === 'object' &&
    'code' in original &&
    typeof (original as { code: unknown }).code === 'string'
  ) {
    return (original as { code: string }).code;
  }

  return undefined;
}

// Create Flag
export async function createFlag(_prevState: unknown, formData: FormData) {
  const raw = {
    tenantId: formData.get('tenantId') as string,
    key: formData.get('key') as string,
    name: formData.get('name') as string,
    description: formData.get('description') as string | null,
    type: formData.get('type') as 'boolean' | 'multivariate' | null,
    environment: formData.get('environment') as string,
    isEnabled: formData.get('isEnabled') === 'true',
    slug: formData.get('slug') as string,
  };

  const targetingRulesRaw = formData.get('targetingRules') as string | null;
  let targetingRulesParsed;
  if (targetingRulesRaw) {
    try {
      targetingRulesParsed = JSON.parse(targetingRulesRaw);
    } catch {
      return {
        success: false,
        errors: {
          targetingRules: ['Invalid JSON format. Please provide a valid JSON object.'],
        },
      };
    }
  } else {
    targetingRulesParsed = { rules: [], defaultVariant: false };
  }

  const parsed = createFlagSchema.safeParse({
    tenantId: raw.tenantId,
    key: raw.key,
    name: raw.name,
    description: raw.description,
    type: raw.type ?? 'boolean',
    environment: raw.environment ?? 'production',
    isEnabled: raw.isEnabled,
    targetingRules: targetingRulesParsed,
  });

  if (!parsed.success) {
    return {
      success: false,
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const data = parsed.data;

  const tenantExists = await db.query.tenants.findFirst({
    where: eq(tenants.id, data.tenantId),
  });
  if (!tenantExists) {
    return {
      success: false,
      errors: { _form: ['Invalid tenant ID.'] },
    };
  }

  try {
    await db.insert(featureFlags).values({
      tenantId: data.tenantId,
      key: data.key,
      name: data.name,
      description: data.description ?? null,
      type: data.type,
      environment: data.environment,
      isEnabled: data.isEnabled,
      targetingRules: data.targetingRules as FeatureFlagTargeting,
    });
  } catch (error) {
    const errorCode = getPostgresErrorCode(error);
    if (errorCode === '23505') {
      return {
        success: false,
        errors: { _form: ['Flag with this key and environment already exists.'] },
      };
    }
    return {
      success: false,
      errors: { _form: ['An unexpected error occurred. Please try again.'] },
    };
  }

  if (process.env.NODE_ENV !== 'test') {
    revalidatePath(`/dashboard/${raw.slug}`);
  }

  return { success: true };
}

// Update Flag
export async function updateFlag(_prevState: unknown, formData: FormData) {
  const raw = {
    id: formData.get('id') as string,
    tenantId: formData.get('tenantId') as string,
    name: formData.get('name') as string | null,
    description: formData.get('description') as string | null,
    type: formData.get('type') as 'boolean' | 'multivariate' | null,
    // Always derive isEnabled – default to false if checkbox is absent
    isEnabled: formData.has('isEnabled') && formData.get('isEnabled') === 'true',
    slug: formData.get('slug') as string | null,
  };

  const targetingRulesRaw = formData.get('targetingRules') as string | null;
  let targetingRulesParsed = undefined;
  if (targetingRulesRaw) {
    try {
      targetingRulesParsed = JSON.parse(targetingRulesRaw);
    } catch {
      return {
        success: false,
        errors: {
          targetingRules: ['Invalid JSON format. Please provide a valid JSON object.'],
        },
      };
    }
  }

  // Build payload.
  // Includes all fields that were sent but always include `isEnabled` to allow toggling off.
  const payload: Record<string, unknown> = {
    id: raw.id,
    tenantId: raw.tenantId,
    isEnabled: raw.isEnabled, // always set
  };
  if (raw.name !== null) payload.name = raw.name;
  if (raw.description !== null) payload.description = raw.description;
  if (raw.type !== null) payload.type = raw.type;
  if (targetingRulesParsed !== undefined) payload.targetingRules = targetingRulesParsed;

  const parsed = updateFlagSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      success: false,
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const data = parsed.data;

  const tenantExists = await db.query.tenants.findFirst({
    where: eq(tenants.id, data.tenantId),
  });
  if (!tenantExists) {
    return {
      success: false,
      errors: { _form: ['Invalid tenant ID.'] },
    };
  }

  const flag = await db.query.featureFlags.findFirst({
    where: and(eq(featureFlags.id, data.id), eq(featureFlags.tenantId, data.tenantId)),
  });
  if (!flag) {
    return {
      success: false,
      errors: { _form: ['Flag not found or not owned by tenant.'] },
    };
  }

  const updateData: Record<string, unknown> = {
    updatedAt: new Date(),
  };
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.type !== undefined) updateData.type = data.type;
  if (data.isEnabled !== undefined) updateData.isEnabled = data.isEnabled;
  if (data.targetingRules !== undefined) updateData.targetingRules = data.targetingRules;

  try {
    await db
      .update(featureFlags)
      .set(updateData)
      .where(and(eq(featureFlags.id, data.id), eq(featureFlags.tenantId, data.tenantId)));
  } catch (error) {
    const errorCode = getPostgresErrorCode(error);
    if (errorCode === '23505') {
      return {
        success: false,
        errors: { _form: ['A flag with this key and environment already exists.'] },
      };
    }
    return {
      success: false,
      errors: { _form: ['An unexpected error occurred. Please try again.'] },
    };
  }

  const slug =
    raw.slug || (await db.query.tenants.findFirst({ where: eq(tenants.id, data.tenantId) }))?.slug;
  if (process.env.NODE_ENV !== 'test' && slug) {
    revalidatePath(`/dashboard/${slug}`);
  }

  return { success: true };
}
