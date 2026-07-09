import {
  boolean,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

// Tenants for complete multi-tenant data isolation
export const tenants = pgTable('tenants', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Users belonging to Tenants
export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .references(() => tenants.id, { onDelete: 'cascade' })
      .notNull(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    name: varchar('name', { length: 255 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [index('users_tenant_idx').on(table.tenantId)],
);

// Feature Flags configuration with embedded targeting rules
export const featureFlags = pgTable(
  'feature_flags',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .references(() => tenants.id, { onDelete: 'cascade' })
      .notNull(),
    key: varchar('key', { length: 100 }).notNull(), // e.g., "new-payment-gateway"
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    isActive: boolean('is_active').default(false).notNull(),

    // Rules payload: handles percentage rollouts, user targeting arrays, & country white-lists
    // Schema: { rules: Array<{ type: 'percentage' | 'attribute', value: any }> }
    targetingRules: jsonb('targeting_rules').default({ rules: [] }).notNull(),

    environment: varchar('environment', { length: 50 }).default('production').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('flags_tenant_key_idx').on(table.tenantId, table.key), // Compound index for fast edge resolution
  ],
);

// High-volume analytics event ingestion
export const analyticsEvents = pgTable(
  'analytics_events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .references(() => tenants.id, { onDelete: 'cascade' })
      .notNull(),
    flagKey: varchar('flag_key', { length: 100 }).notNull(),
    distinctId: varchar('distinct_id', { length: 255 }).notNull(), // Unique client identifier
    evaluation: varchar('evaluation', { length: 255 }).notNull(), // e.g., "true", "false", "variant-a"

    // Contextual attributes passed during evaluation (browser, country, device)
    context: jsonb('context').default({}).notNull(),

    timestamp: timestamp('timestamp').defaultNow().notNull(),
  },
  (table) => [
    index('analytics_tenant_timestamp_idx').on(table.tenantId, table.timestamp), // Optimized for time-series dashboard charts
  ],
);
