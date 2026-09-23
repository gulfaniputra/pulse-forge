import { expect, test, type Locator, type Page } from '@playwright/test';

const TENANT_SLUG = 'lambda-corp';
const DASHBOARD_URL = `/dashboard/${TENANT_SLUG}`;

/**
 * Build a collision-resistant flag key so repeated runs against a persistent
 * seeded database never clash on the `(tenant_id, key, environment)` constraint.
 */
function uniqueKey(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Locate the flag list row that contains the given flag key. */
function flagRow(page: Page, key: string): Locator {
  return page.locator('div.nordic-card').filter({ hasText: key });
}

/**
 * Drive the full create-flag critical path through the real UI:
 * RSC render -> Hono RPC fetch -> Server Action mutation -> revalidatePath.
 */
async function createFlag(page: Page, key: string, name: string): Promise<void> {
  await page.goto(DASHBOARD_URL);
  await page.locator('#key').fill(key);
  await page.locator('#name').fill(name);
  await page.locator('#isEnabled').check();
  await page.getByRole('button', { name: 'Create Flag' }).click();

  await expect(page.getByText('Flag created successfully!')).toBeVisible();
  await expect(flagRow(page, key)).toBeVisible();
}

/** Delete a flag through the UI, accepting the confirmation dialog. */
async function deleteFlag(page: Page, key: string): Promise<void> {
  page.once('dialog', (dialog) => dialog.accept());
  await flagRow(page, key).getByRole('button', { name: 'Delete' }).click();
  await expect(flagRow(page, key)).toHaveCount(0);
}

test.describe('Flag creation critical path', () => {
  test('creates a boolean flag and shows it as active in the flag list', async ({ page }) => {
    const key = uniqueKey('e2e-create');

    await createFlag(page, key, 'E2E Create Flag');

    const row = flagRow(page, key);
    await expect(row.getByText('E2E Create Flag')).toBeVisible();
    await expect(row.getByText('Active')).toBeVisible();

    // Clean up so the seeded database stays idempotent across runs.
    await deleteFlag(page, key);
  });

  test('blocks submission when the required flag key is missing', async ({ page }) => {
    await page.goto(DASHBOARD_URL);

    await page.locator('#name').fill('E2E Missing Key');
    await page.getByRole('button', { name: 'Create Flag' }).click();

    // Native constraint validation must reject the empty required key.
    const keyIsValid = await page
      .locator('#key')
      .evaluate((el: HTMLInputElement) => el.validity.valid);
    expect(keyIsValid).toBe(false);

    // No flag should have been created.
    await expect(page.getByText('Flag created successfully!')).toHaveCount(0);
  });

  test('requires confirmation before deleting a flag', async ({ page }) => {
    const key = uniqueKey('e2e-delete');

    await createFlag(page, key, 'E2E Delete Flag');

    // Dismissing the confirm dialog must keep the flag.
    page.once('dialog', (dialog) => dialog.dismiss());
    await flagRow(page, key).getByRole('button', { name: 'Delete' }).click();
    await expect(flagRow(page, key)).toBeVisible();

    // Accepting the confirm dialog must remove the flag.
    await deleteFlag(page, key);
  });
});
