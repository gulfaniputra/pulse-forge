import { type AppType } from '@/lib/hono-app';
import { hc } from 'hono/client';

/**
 * Instantiates the Hono RPC client safely across architectural boundaries
 * @param customFetch Optional custom fetch implementation (useful for Next.js revalidation/caching strategies)
 */
export const createRpcClient = (customFetch?: typeof fetch) => {
  const isServer = typeof window === 'undefined';

  // Fallback to localhost only if we are explicitly running outside production environments
  const defaultDevUrl = 'http://localhost:3000';
  const baseUrl = isServer ? process.env.NEXT_PUBLIC_APP_URL || defaultDevUrl : ''; // Relative paths are perfectly safe for client-side browser execution

  // Defensive sanity check for solo devs deploying to production environments
  if (isServer && process.env.NODE_ENV === 'production' && !process.env.NEXT_PUBLIC_APP_URL) {
    console.warn(
      'CRITICAL: NEXT_PUBLIC_APP_URL is missing in production environment variables. Hono RPC server-side calls will misroute.',
    );
  }

  return hc<AppType>(baseUrl, {
    // Handle internal binding requirements for edge runtimes with absolute type safety
    fetch: customFetch || ((...args: Parameters<typeof fetch>) => fetch(...args)),
  });
};

// Export a singleton instance optimized for standard Client Component rendering loops
export const clientRpc = createRpcClient();
