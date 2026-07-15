import { db } from './index';
import { featureFlags, tenants, users } from './schema';

async function main() {
  console.log('Starting database seeding pipeline...');

  // Clean out existing data to ensure idempotency
  // Cascade deletes on the schema will automatically wipe child flags & users
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
