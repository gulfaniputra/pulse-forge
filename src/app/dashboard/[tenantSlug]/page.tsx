import { CreateFlagForm } from '@/components/CreateFlagForm';
import { DeleteFlagButton } from '@/components/DeleteFlagButton';
import { FlagMetricsChart, type MetricsDataPoint } from '@/components/FlagMetricsChart';
import { db } from '@/db';
import { featureFlags, tenants } from '@/db/schema';
import { createRpcClient } from '@/lib/rpc';
import { and, desc, eq } from 'drizzle-orm';
import Link from 'next/link';
import { notFound } from 'next/navigation';

type ApiFlag = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  type: 'boolean' | 'multivariate';
  isEnabled: boolean;
  environment: string;
  updatedAt: string;
};

interface PageProps {
  params: Promise<{ tenantSlug: string }>;
}

export default async function FlagsOverviewPage({ params }: PageProps) {
  const { tenantSlug } = await params;

  const tenantRecord = await db.query.tenants.findFirst({
    where: eq(tenants.slug, tenantSlug),
  });
  if (!tenantRecord) notFound();

  const client = createRpcClient();

  const fetchWithTimeout = <T,>(promise: Promise<T>, ms: number): Promise<T> =>
    Promise.race([
      promise,
      new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Request timeout')), ms)),
    ]);

  // Flags are read directly from the database in this Server Component. This
  // avoids a self-referential HTTP hop to our own edge API and keeps the
  // dashboard renderable in environments where the edge/Neon runtime is not
  // available (e.g. CI running against a plain Postgres service).
  const [flagRecords, metricsResponse] = await Promise.all([
    db.query.featureFlags.findMany({
      where: and(
        eq(featureFlags.tenantId, tenantRecord.id),
        eq(featureFlags.environment, 'production'),
      ),
      orderBy: [desc(featureFlags.updatedAt)],
    }),
    fetchWithTimeout(
      client.api.v1.metrics.$get({
        query: { tenantId: tenantRecord.id, environment: 'production' },
      }),
      5000,
    ),
  ]);

  const flags: ApiFlag[] = flagRecords.map((flag: typeof featureFlags.$inferSelect) => ({
    id: flag.id,
    key: flag.key,
    name: flag.name,
    description: flag.description,
    type: flag.type,
    isEnabled: flag.isEnabled,
    environment: flag.environment,
    updatedAt: flag.updatedAt.toISOString(),
  }));

  let metricsData: MetricsDataPoint[] = [];

  if (metricsResponse.ok) {
    metricsData = (await metricsResponse.json()) as MetricsDataPoint[];
  } else {
    console.error('Failed to fetch metrics:', metricsResponse.status);
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-nordic-snow">Feature Flags</h1>
          <p className="text-sm text-nordic-frost text-opacity-70">
            Control application toggles & configuration strategies in real time
          </p>
        </div>
      </div>

      {/* Create Flag Form */}
      <CreateFlagForm tenantId={tenantRecord.id} tenantSlug={tenantSlug} />

      {/* Metrics Chart */}
      <div className="nordic-card">
        <h2 className="text-lg font-semibold text-nordic-snow mb-4">
          Evaluation Activity (last 7 days)
        </h2>
        <FlagMetricsChart data={metricsData} />
      </div>

      {/* Flag List */}
      <div className="grid gap-4">
        {flags.length === 0 ? (
          <div className="border border-dashed border-nordic-polar rounded-xl p-12 text-center bg-nordic-dark bg-opacity-50">
            <p className="text-nordic-frost text-opacity-60 text-sm">
              No flags registered for this environment yet.
            </p>
          </div>
        ) : (
          flags.map((flag) => {
            const lastUpdatedString = new Date(flag.updatedAt).toLocaleDateString('en-US', {
              dateStyle: 'medium',
              timeZone: 'UTC',
            });

            return (
              <div
                key={flag.id}
                className="nordic-card flex justify-between items-start hover:border-nordic-cyan hover:border-opacity-30 transition-colors"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-semibold text-nordic-cyan text-sm tracking-tight">
                      {flag.key}
                    </span>
                    <span
                      className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                        flag.type === 'boolean'
                          ? 'bg-nordic-green bg-opacity-10 text-nordic-green border border-nordic-green border-opacity-20'
                          : 'bg-nordic-gold bg-opacity-10 text-nordic-gold border border-nordic-gold border-opacity-20'
                      }`}
                    >
                      {flag.type}
                    </span>
                  </div>
                  <h2 className="text-sm font-medium text-nordic-snow">{flag.name}</h2>
                  {flag.description && (
                    <p className="text-xs text-nordic-frost text-opacity-70 max-w-xl">
                      {flag.description}
                    </p>
                  )}
                  <p className="text-[11px] text-nordic-polar pt-2">Updated: {lastUpdatedString}</p>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <Link
                    href={`/dashboard/${tenantSlug}/flags/${flag.id}/edit`}
                    className="text-xs text-nordic-cyan hover:text-nordic-cyan hover:text-opacity-80 transition-colors"
                  >
                    Edit
                  </Link>
                  <DeleteFlagButton
                    flagId={flag.id}
                    tenantId={tenantRecord.id}
                    tenantSlug={tenantSlug}
                  />
                  <span
                    className={`h-2 w-2 rounded-full shrink-0 ${
                      flag.isEnabled ? 'bg-nordic-green shadow-sm' : 'bg-nordic-polar'
                    }`}
                  />
                  <span className="text-xs font-semibold text-nordic-frost text-opacity-60">
                    {flag.isEnabled ? 'Active' : 'Disabled'}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
