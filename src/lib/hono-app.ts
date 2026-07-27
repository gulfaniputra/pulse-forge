import { db } from '@/db';
import { analyticsEvents, featureFlags, tenants } from '@/db/schema';
import { evaluateTargetingRules } from '@/lib/evaluator';
import { and, eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { z } from 'zod';

const evaluateSchema = z.object({
  tenantId: z.string().uuid(),
  key: z.string().min(1).max(100),
  environment: z.string().min(1).max(50),
  distinctId: z.string().min(1).max(255),
  context: z.record(z.unknown()).default({}),
});

const flagsQuerySchema = z.object({
  tenantId: z.string().uuid(),
  environment: z.string().min(1).max(50),
});

const app = new Hono()
  .basePath('/api')
  .get('/health', (c) => {
    return c.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
    });
  })
  .post('/v1/evaluate', async (c) => {
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
  })
  .get('/v1/flags', async (c) => {
    const query = c.req.query();
    const parseResult = flagsQuerySchema.safeParse(query);
    if (!parseResult.success) {
      return c.json({ error: 'Bad Request', details: parseResult.error.errors }, 400);
    }
    const { tenantId, environment } = parseResult.data;

    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, tenantId),
    });
    if (!tenant) {
      return c.json({ error: 'Tenant not found' }, 404);
    }

    const flags = await db.query.featureFlags.findMany({
      where: and(eq(featureFlags.tenantId, tenantId), eq(featureFlags.environment, environment)),
      orderBy: (flags, { desc }) => [desc(flags.updatedAt)],
    });

    const result = flags.map((flag) => ({
      id: flag.id,
      key: flag.key,
      name: flag.name,
      description: flag.description,
      type: flag.type,
      isEnabled: flag.isEnabled,
      environment: flag.environment,
      updatedAt: flag.updatedAt,
    }));

    return c.json(result);
  });

export { app };
export type AppType = typeof app;
