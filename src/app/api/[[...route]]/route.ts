import { Hono } from 'hono';
import { handle } from 'hono/vercel';

// Force the API block to run on the high-performance serverless edge runtime
export const runtime = 'edge';

const app = new Hono().basePath('/api');

// Baseline health check endpoint
app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

// Type cast to completely bypass Next.js 15 strict signature constraints
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const handler = handle(app) as any;

// Export all HTTP method handlers Next.js App Router expects to handle routing smoothly
export {
  handler as DELETE,
  handler as GET,
  handler as OPTIONS,
  handler as PATCH,
  handler as POST,
  handler as PUT,
};

// Export the application type contract for the frontend Hono RPC client
export type AppType = typeof app;
