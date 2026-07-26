import { type AppType } from '@/lib/hono-app';
import { hc } from 'hono/client';

// Create a dummy client to extract its exact type
const _dummyClient = hc<AppType>('');
type HonoClient = typeof _dummyClient;

/**
 * Instantiates the Hono RPC client safely across architectural boundaries
 * @param customFetch Optional custom fetch implementation for Next.js revalidation/caching strategies
 */
export const createRpcClient = (customFetch?: typeof fetch): HonoClient => {
  const isServer = typeof window === 'undefined';

  const defaultDevUrl = 'http://localhost:3000';
  const baseUrl = isServer ? process.env.NEXT_PUBLIC_APP_URL || defaultDevUrl : '';

  if (isServer && process.env.NODE_ENV === 'production' && !process.env.NEXT_PUBLIC_APP_URL) {
    console.warn(
      'CRITICAL: NEXT_PUBLIC_APP_URL is missing in production environment variables. Hono RPC server-side calls will misroute.',
    );
  }

  // 2. Return the real client cast to the extracted type
  return hc<AppType>(baseUrl, {
    fetch: customFetch || ((...args: Parameters<typeof fetch>) => fetch(...args)),
  }) as HonoClient;
};

export const clientRpc = createRpcClient();
