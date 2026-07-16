import { loadEnvConfig } from '@next/env';

// 1. Immediately inject environment variables into process.env before anything else evaluates
loadEnvConfig(process.cwd());

async function main() {
  console.log('Starting database seeding pipeline...');

  // 2. Dynamically import database context now that process.env is safely populated
  const { db } = await import('./index');
  const { featureFlags, tenants, users } = await import('./schema');

  // Clean out existing data to ensure idempotency
  // Cascade deletes on your database schema will automatically wipe child flags & users
  await db.delete(tenants);

  // Provision a core Tenant
  console.log('Creating tenant...');
  const [tenant] = await db
    .insert(tenants)
    .values({
      name: 'Lambda Corp',
      slug: 'lambda-corp',
    })
    .returning();

  // Provision a Test User linked to that Tenant
  console.log('Creating testing user context...');
  await db.insert(users).values({
    tenantId: tenant.id,
    email: 'alonzo@lambda.com',
    name: 'Alonzo Church',
  });

  // Provision a standard Boolean toggle flag
  console.log('Creating boolean feature flag...');
  await db.insert(featureFlags).values({
    tenantId: tenant.id,
    key: 'beta-dashboard',
    name: 'Beta Dashboard access',
    description: 'Enables the next-gen telemetry control panel.',
    type: 'boolean',
    isEnabled: true,
    environment: 'production',
    targetingRules: {
      rules: [
        {
          id: 'rule_1',
          name: 'Internal team access',
          conditions: [
            {
              attribute: 'email',
              operator: 'contains',
              value: '@lambda.com',
            },
          ],
          variant: true,
        },
      ],
      defaultVariant: false,
    },
  });

  // Provision a complex multivariate configuration flag
  console.log('Creating multivariate configuration flag...');
  await db.insert(featureFlags).values({
    tenantId: tenant.id,
    key: 'pricing-tier-config',
    name: 'Dynamic Pricing Structure',
    description: 'Dictates usage limits and UI presentation structures natively per tier.',
    type: 'multivariate',
    isEnabled: true,
    environment: 'production',
    targetingRules: {
      variants: [
        { key: 'standard', value: { maxProjects: 5, enablePremiumAI: false } },
        { key: 'enterprise', value: { maxProjects: 999, enablePremiumAI: true } },
      ],
      rules: [
        {
          id: 'rule_ent',
          name: 'Upgrade Enterprise Users',
          conditions: [
            {
              attribute: 'plan',
              operator: 'equals',
              value: 'enterprise',
            },
          ],
          variant: { maxProjects: 999, enablePremiumAI: true },
        },
      ],
      defaultVariant: { maxProjects: 5, enablePremiumAI: false },
    },
  });

  console.log('Seeding transaction chain executed successfully!');
  process.exit(0);
}

main().catch((err) => {
  console.error('Seeding transaction failed drastically:', err);
  process.exit(1);
});
