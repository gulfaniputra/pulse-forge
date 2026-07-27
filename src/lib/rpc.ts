import { type AppType } from '@/lib/hono-app';
import { hc } from 'hono/client';

type HonoClient = ReturnType<typeof hc<AppType>>;

export const createRpcClient = (customFetch?: typeof fetch): HonoClient => {
  const isServer = typeof window === 'undefined';
  const defaultDevUrl = 'http://localhost:3000';
  const baseUrl = isServer ? process.env.NEXT_PUBLIC_APP_URL || defaultDevUrl : '';

  if (isServer && process.env.NODE_ENV === 'production' && !process.env.NEXT_PUBLIC_APP_URL) {
    console.warn(
      'CRITICAL: NEXT_PUBLIC_APP_URL is missing in production environment variables. Hono RPC server-side calls will misroute.',
    );
  }

  return hc<AppType>(baseUrl, {
    fetch: customFetch || ((...args: Parameters<typeof fetch>) => fetch(...args)),
  });
};

export const clientRpc = createRpcClient();
