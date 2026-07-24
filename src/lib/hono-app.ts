import { db } from '@/db';
import { analyticsEvents, featureFlags } from '@/db/schema';
import { evaluateTargetingRules } from '@/lib/evaluator';
import { and, eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { z } from 'zod';

const app = new Hono().basePath('/api');

// Health check
app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

// Evaluation endpoint
const evaluateSchema = z.object({
  tenantId: z.string().uuid(),
  key: z.string().min(1).max(100),
  environment: z.string().min(1).max(50),
  distinctId: z.string().min(1).max(255),
  context: z.record(z.unknown()).default({}),
});

app.post('/v1/evaluate', async (c) => {
  const jsonBody = await c.req.json().catch(() => ({}));
  const parseResult = evaluateSchema.safeParse(jsonBody);
  if (!parseResult.success) {
    return c.json({ error: 'Bad Request', details: parseResult.error.errors }, 400);
  }
  const { tenantId, key, environment, distinctId, context } = parseResult.data;

  const flag = await db.query.featureFlags.findFirst({
    where: and(
      eq(featureFlags.tenantId, tenantId),
      eq(featureFlags.key, key),
      eq(featureFlags.environment, environment),
    ),
  });

  if (!flag || !flag.isEnabled) {
    return c.json({ value: false, reason: !flag ? 'FLAG_NOT_FOUND' : 'FLAG_DISABLED' });
  }

  const evaluatedValue = evaluateTargetingRules(flag.targetingRules, context);

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

  if (c.executionCtx?.waitUntil) {
    c.executionCtx.waitUntil(logIngestionTask);
  } else {
    logIngestionTask.catch((err) => console.error('Failed to log event asynchronously:', err));
  }

  return c.json({
    value: evaluatedValue,
    match: true,
  });
});

export { app };
export type AppType = typeof app;
