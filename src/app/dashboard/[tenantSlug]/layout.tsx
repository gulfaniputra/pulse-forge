import { db } from '@/db';
import { tenants } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';

interface DashboardLayoutProps {
  children: React.ReactNode;
  params: Promise<{ tenantSlug: string }>;
}

export default async function DashboardLayout({ children, params }: DashboardLayoutProps) {
  const { tenantSlug } = await params;

  // Enforce server-side tenant scoping checks.
  const currentTenant = await db.query.tenants.findFirst({
    where: eq(tenants.slug, tenantSlug),
  });

  if (!currentTenant) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      <header className="sticky top-0 z-50 border-b border-slate-800/50 bg-slate-950/70 backdrop-blur-xl px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="font-bold tracking-wider text-indigo-400">pulse-forge</span>
            <span className="text-slate-600">/</span>
            <span className="text-sm font-medium bg-slate-800 px-2.5 py-1 rounded-md text-slate-300">
              {currentTenant.name}
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-6">{children}</main>
    </div>
  );
}
