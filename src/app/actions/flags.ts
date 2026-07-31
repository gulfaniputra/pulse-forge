'use server';

import { db } from '@/db';
import { featureFlags } from '@/db/schema';
import { type FeatureFlagTargeting } from '@/db/types';
import { createFlagSchema } from '@/lib/validations';
import { revalidatePath } from 'next/cache';

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

  // Parse `targetingRules` from JSON string if provided
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

  // Validate with Zod
  const parsed = createFlagSchema.safeParse({
    tenantId: raw.tenantId,
    key: raw.key,
    name: raw.name,
    description: raw.description,
    type: raw.type ?? 'boolean',
    environment: raw.environment ?? 'production',
    isEnabled: raw.isEnabled,
    targetingRules: targetingRulesParsed, // <-- use parsed value
  });

  if (!parsed.success) {
    return {
      success: false,
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const data = parsed.data;

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
    // Unique constraint violation
    return {
      success: false,
      errors: {
        _form: ['Flag with this key and environment already exists.'],
      },
    };
  }

  // Revalidate
  if (process.env.NODE_ENV !== 'test') {
    revalidatePath(`/dashboard/${raw.slug}`);
  }

  return { success: true };
}
