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

  const fetchWithAuth: typeof fetch = (input, init) => {
    const headers = new Headers(init?.headers);

    if (isServer && process.env.API_KEY) {
      headers.set('Authorization', `Bearer ${process.env.API_KEY}`);
    }

    return fetch(input, {
      ...init,
      headers,
    });
  };

  return hc<AppType>(baseUrl, {
    fetch: customFetch || fetchWithAuth,
  });
};

export const clientRpc = createRpcClient();
