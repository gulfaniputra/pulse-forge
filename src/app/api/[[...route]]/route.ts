import { app, type AppType } from '@/lib/hono-app';
import { handle } from 'hono/vercel';

export const runtime = 'edge';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const handler = handle(app) as any;
export const DELETE = handler;
export const GET = handler;
export const OPTIONS = handler;
export const PATCH = handler;
export const POST = handler;
export const PUT = handler;

export type { AppType };
