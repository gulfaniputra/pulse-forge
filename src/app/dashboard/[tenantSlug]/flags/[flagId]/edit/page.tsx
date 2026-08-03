import { EditFlagForm } from '@/components/EditFlagForm';
import { db } from '@/db';
import { featureFlags, tenants } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ tenantSlug: string; flagId: string }>;
}

export default async function EditFlagPage({ params }: PageProps) {
  const { tenantSlug, flagId } = await params;

  // Fetch tenant
  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.slug, tenantSlug),
  });
  if (!tenant) notFound();

  // Fetch flag
  const flag = await db.query.featureFlags.findFirst({
    where: and(eq(featureFlags.id, flagId), eq(featureFlags.tenantId, tenant.id)),
  });
  if (!flag) notFound();

  const initialData = {
    id: flag.id,
    name: flag.name,
    description: flag.description,
    type: flag.type,
    isEnabled: flag.isEnabled,
    targetingRules: JSON.stringify(flag.targetingRules, null, 2),
    key: flag.key,
    environment: flag.environment,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Edit Flag</h1>
        <p className="text-sm text-slate-400">
          Update configuration for <span className="font-mono">{flag.key}</span> in{' '}
          <span className="font-mono">{flag.environment}</span>
        </p>
      </div>
      <EditFlagForm tenantId={tenant.id} tenantSlug={tenantSlug} initialData={initialData} />
    </div>
  );
}
