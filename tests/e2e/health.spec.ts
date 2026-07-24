import { expect, test } from '@playwright/test';

test('health check returns 200', async ({ request }) => {
  const response = await request.get('/api/health');
  expect(response.status()).toBe(200);
  expect(await response.json()).toMatchObject({ status: 'healthy' });
});
