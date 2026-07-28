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
