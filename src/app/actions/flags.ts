'use server';

import { db } from '@/db';
import { featureFlags, tenants } from '@/db/schema';
import { type FeatureFlagTargeting } from '@/db/types';
import { createFlagSchema } from '@/lib/validations';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

/**
 * Extract Postgres error code from various error shapes.
 * Covers top‑level, `cause`, & `original` properties.
 */
function getPostgresErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== 'object') return undefined;

  // Top‑level code (pg, Neon serverless)
  if ('code' in error && typeof (error as { code: unknown }).code === 'string') {
    return (error as { code: string }).code;
  }

  // Nested inside `cause` (some Drizzle wrappers)
  const cause = (error as { cause?: unknown }).cause;
  if (
    cause &&
    typeof cause === 'object' &&
    'code' in cause &&
    typeof (cause as { code: unknown }).code === 'string'
  ) {
    return (cause as { code: string }).code;
  }

  // Nested inside `original` (older drivers)
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

export async function createFlag(_prevState: unknown, formData: FormData) {
  // Extract all form fields
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

  // Parse `targetingRules` JSON
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

  // Zod validation
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

  // Verify tenant exists before attempting insert
  const tenantExists = await db.query.tenants.findFirst({
    where: eq(tenants.id, data.tenantId),
  });
  if (!tenantExists) {
    return {
      success: false,
      errors: { _form: ['Invalid tenant ID.'] },
    };
  }

  // Insert with robust error handling
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

  // Revalidate
  if (process.env.NODE_ENV !== 'test') {
    revalidatePath(`/dashboard/${raw.slug}`);
  }

  return { success: true };
}
