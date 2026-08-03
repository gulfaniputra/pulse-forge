import { z } from 'zod';

export const createFlagSchema = z.object({
  tenantId: z.string().uuid(),
  key: z.string().min(1).max(100),
  name: z.string().min(1).max(255),
  description: z.string().optional().nullable(),
  type: z.enum(['boolean', 'multivariate']).default('boolean'),
  environment: z.string().min(1).max(50).default('production'),
  isEnabled: z.boolean().default(false),
  // For now it accept a JSON‑compatible object. The form will only send default value.
  targetingRules: z
    .object({
      rules: z.array(z.any()).default([]),
      defaultVariant: z.any().default(false),
    })
    .default({ rules: [], defaultVariant: false }),
});

export type CreateFlagInput = z.infer<typeof createFlagSchema>;

export const metricsQuerySchema = z.object({
  tenantId: z.string().uuid(),
  environment: z.string().min(1).max(50),
  flagKey: z.string().min(1).max(100).optional(),
});

export type MetricsQueryInput = z.infer<typeof metricsQuerySchema>;

export const updateFlagSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional().nullable(),
  type: z.enum(['boolean', 'multivariate']).optional(),
  isEnabled: z.boolean().optional(),
  targetingRules: z
    .object({
      rules: z.array(z.any()).default([]),
      defaultVariant: z.any().default(false),
    })
    .optional(),
});

export type UpdateFlagInput = z.infer<typeof updateFlagSchema>;
