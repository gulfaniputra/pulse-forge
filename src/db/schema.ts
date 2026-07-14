import {
  boolean,
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { type FeatureFlagTargeting } from './types';

// Define Flag Type Enum (Boolean toggles vs. Multivariate strings/JSON configs)
export const flagTypeEnum = pgEnum('flag_type', ['boolean', 'multivariate']);

// Tenants table (Provides complete multi-tenant data isolation)
export const tenants = pgTable('tenants', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Users table
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

// Isolated feature flags table (unified & optimized)
export const featureFlags = pgTable(
  'feature_flags',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .references(() => tenants.id, { onDelete: 'cascade' })
      .notNull(),
    key: varchar('key', { length: 100 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    type: flagTypeEnum('type').default('boolean').notNull(),
    isEnabled: boolean('is_enabled').default(false).notNull(),

    // Type-safe JSONB field for ultra-fast edge memory execution loops
    targetingRules: jsonb('targeting_rules')
      .$type<FeatureFlagTargeting>()
      .default({ rules: [], defaultVariant: false })
      .notNull(),

    environment: varchar('environment', { length: 50 }).default('production').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    // Multi-tenant unique edge constraint
    // A flag key must be unique within a specific tenant & a specific environment (e.g. dev vs prod)
    uniqueIndex('tenant_key_env_unique_idx').on(table.tenantId, table.key, table.environment),
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
    distinctId: varchar('distinct_id', { length: 255 }).notNull(),
    evaluation: varchar('evaluation', { length: 255 }).notNull(),

    // Contextual attributes passed during evaluation (browser, country, device)
    context: jsonb('context').default({}).notNull(),
    timestamp: timestamp('timestamp').defaultNow().notNull(),
  },
  (table) => [index('analytics_tenant_timestamp_idx').on(table.tenantId, table.timestamp)],
);
