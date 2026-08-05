import { app } from '@/lib/hono-app';
import { describe, expect, it } from 'vitest';

describe('API Key Authentication', () => {
  it('returns 401 when Authorization header is missing', async () => {
    const res = await app.request('/api/health', {
      method: 'GET',
    });
    expect(res.status).toBe(401);
  });

  it('returns 401 when Authorization header is invalid', async () => {
    const res = await app.request('/api/health', {
      method: 'GET',
      headers: { Authorization: 'Bearer wrong-key' },
    });
    expect(res.status).toBe(401);
  });

  it('returns 200 when valid Authorization header is provided', async () => {
    const res = await app.request('/api/health', {
      method: 'GET',
      headers: { Authorization: `Bearer ${process.env.API_KEY}` },
    });
    expect(res.status).toBe(200);
  });
});
