import { db } from '@/db';
import { analyticsEvents, featureFlags } from '@/db/schema';
import { evaluateTargetingRules } from '@/lib/evaluator';
import { and, eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { handle } from 'hono/vercel';
import { z } from 'zod';

export const runtime = 'edge';

const app = new Hono().basePath('/api');

// Baseline health check endpoint
app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

// Zod input shield. Completely any-free & utilize unknown for structural safety
const evaluateSchema = z.object({
  tenantId: z.string().uuid(),
  key: z.string().min(1).max(100),
  environment: z.string().min(1).max(50),
  distinctId: z.string().min(1).max(255),
  context: z.record(z.unknown()).default({}),
});

/**
 * High-velocity evaluation core endpoint
 * [POST /api/v1/evaluate] -> Zod input shield -> In-memory jsonb rule evaluator
 */
app.post('/v1/evaluate', async (c) => {
  const jsonBody = await c.req.json().catch(() => ({}));
  const parseResult = evaluateSchema.safeParse(jsonBody);

  if (!parseResult.success) {
    return c.json({ error: 'Bad Request', details: parseResult.error.errors }, 400);
  }

  const { tenantId, key, environment, distinctId, context } = parseResult.data;

  // Fast single index scan lookup
  const flag = await db.query.featureFlags.findFirst({
    where: and(
      eq(featureFlags.tenantId, tenantId),
      eq(featureFlags.key, key),
      eq(featureFlags.environment, environment),
    ),
  });

  // Fall back gracefully to false if flag doesn't exist or is globally turned off
  if (!flag || !flag.isEnabled) {
    return c.json({ value: false, reason: !flag ? 'FLAG_NOT_FOUND' : 'FLAG_DISABLED' });
  }

  // Processes targeting rules instantly in-memory without extra database round-trips
  const evaluatedValue = evaluateTargetingRules(flag.targetingRules, context);

  // Spawns a hot & active background promise immediately
  const logIngestionTask = db
    .insert(analyticsEvents)
    .values({
      tenantId,
      flagKey: key,
      distinctId,
      evaluation: String(evaluatedValue),
      context,
    })
    .execute();

  // Safely pass the hot promise off to the edge runtime lifecycle hooks
  if (c.executionCtx?.waitUntil) {
    c.executionCtx.waitUntil(logIngestionTask);
  } else {
    // Prevents unhandled rejections from crashing local environments or scripts
    logIngestionTask.catch((err) => console.error('Failed to log event asynchronously:', err));
  }

  return c.json({
    value: evaluatedValue,
    match: true,
  });
});

// Type cast to completely bypass Next.js 15 strict signature constraints
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const handler = handle(app) as any;

export {
  handler as DELETE,
  handler as GET,
  handler as OPTIONS,
  handler as PATCH,
  handler as POST,
  handler as PUT,
};

export type AppType = typeof app;
