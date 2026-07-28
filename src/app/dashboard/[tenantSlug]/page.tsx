import { CreateFlagForm } from '@/components/CreateFlagForm';
import { db } from '@/db';
import { tenants } from '@/db/schema';
import { createRpcClient } from '@/lib/rpc';
import { eq } from 'drizzle-orm';
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

  if (!tenantRecord) {
    notFound();
  }

  const client = createRpcClient();
  const response = await client.api.v1.flags.$get({
    query: {
      tenantId: tenantRecord.id,
      environment: 'production',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch flags: ${response.status}`);
  }

  const flags = (await response.json()) as ApiFlag[];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Feature Flags</h1>
          <p className="text-sm text-slate-400">
            Control application toggles and configuration strategies in real time.
          </p>
        </div>
      </div>

      <CreateFlagForm tenantId={tenantRecord.id} tenantSlug={tenantSlug} />

      <div className="grid gap-4">
        {flags.length === 0 ? (
          <div className="border border-dashed border-slate-800 rounded-xl p-12 text-center bg-slate-950/20">
            <p className="text-slate-400 text-sm">No flags registered for this environment yet.</p>
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
                className="border border-slate-800 bg-slate-950/30 rounded-xl p-5 flex justify-between items-start hover:border-slate-700 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-semibold text-indigo-300 text-sm tracking-tight">
                      {flag.key}
                    </span>
                    <span
                      className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                        flag.type === 'boolean'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {flag.type}
                    </span>
                  </div>
                  <h2 className="text-sm font-medium text-slate-200">{flag.name}</h2>
                  {flag.description && (
                    <p className="text-xs text-slate-400 max-w-xl">{flag.description}</p>
                  )}
                  <p className="text-[11px] text-slate-500 pt-2">Updated: {lastUpdatedString}</p>
                </div>

                <div className="flex items-center gap-4">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      flag.isEnabled
                        ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50'
                        : 'bg-slate-600'
                    }`}
                  />
                  <span className="text-xs font-semibold text-slate-400">
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
