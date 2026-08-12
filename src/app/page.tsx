import { BarChart3, Github, Shield, Zap } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'pulse-forge | Feature Flag & Analytics Platform',
  description:
    'Multi-tenant edge-native feature flag platform built with Next.js 15, Hono RPC, & Neon Postgres.',
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute top-[-40%] left-[-20%] w-[60%] h-[60%] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-40%] right-[-20%] w-[60%] h-[60%] bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <main className="relative z-10 max-w-3xl w-full text-center space-y-8">
        <div className="inline-flex items-center gap-2 bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 rounded-full px-4 py-1.5 text-xs font-medium text-indigo-300 tracking-wider mb-4">
          <Zap className="w-3.5 h-3.5" />
          EDGE-NATIVE | HONO RPC | NEXT.JS 15
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
          <span className="text-indigo-400">pulse</span>
          <span className="text-slate-100">-forge</span>
        </h1>

        <p className="text-xl md:text-2xl text-slate-400 max-w-2xl mx-auto font-light">
          Multi-Tenant Feature Flag & Event Analytics Platform.
          <br />
          <span className="text-slate-500 text-base">
            Built with React 19, Next.js App Router, Hono RPC, Drizzle, & Neon Postgres.
          </span>
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            href="/dashboard/lambda-corp"
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-lg px-8 py-4 rounded-xl transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2 group"
          >
            Launch Demo
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </Link>

          <a
            href="https://github.com/gulfaniputra/pulse-forge"
            target="_blank"
            rel="noopener noreferrer"
            className="border border-slate-700 hover:border-slate-500 bg-slate-900/50 text-slate-300 font-medium text-lg px-6 py-4 rounded-xl transition-all flex items-center gap-2 backdrop-blur-sm"
          >
            <Github className="w-5 h-5" />
            View Source
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-12 border-t border-slate-800/50">
          <div className="flex items-center gap-3 text-slate-400 text-sm justify-center">
            <Shield className="w-4 h-4 text-emerald-400" />
            Multi-tenant RLS
          </div>
          <div className="flex items-center gap-3 text-slate-400 text-sm justify-center">
            <Zap className="w-4 h-4 text-amber-400" />
            Edge Evaluation
          </div>
          <div className="flex items-center gap-3 text-slate-400 text-sm justify-center">
            <BarChart3 className="w-4 h-4 text-indigo-400" />
            Live Metrics
          </div>
        </div>
      </main>
    </div>
  );
}
