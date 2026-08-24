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
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden px-4 py-12 md:px-8">
      {/* Glowing orbs */}
      <div className="absolute -top-1/2 -left-1/4 h-[80%] w-[80%] rounded-full bg-nordic-cyan bg-opacity-5 blur-3xl" />
      <div className="absolute -bottom-1/2 -right-1/4 h-[80%] w-[80%] rounded-full bg-nordic-purple bg-opacity-5 blur-3xl" />

      <main className="relative z-10 mx-auto w-full max-w-4xl space-y-10 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-nordic-polar border-opacity-40 bg-nordic-navy bg-opacity-60 px-4 py-1.5 text-xs font-medium tracking-wider text-nordic-cyan backdrop-blur-sm">
          NEXT.JS 15 · HONO RPC · DRIZZLE · NEON
        </div>

        {/* Headline */}
        <h1 className="text-5xl font-bold tracking-tight md:text-7xl">
          <span className="text-nordic-cyan">pulse</span>
          <span className="text-nordic-snow">-forge</span>
        </h1>

        {/* Sub-headline – text opacity fixed */}
        <div className="mx-auto max-w-2xl space-y-7 text-xl text-nordic-frost text-opacity-80 md:text-2xl">
          <p>Multi-tenant feature flagging with real‑time event analytics</p>
          <p className="text-base text-nordic-frost text-opacity-50">Powered by React 19</p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col items-center justify-center gap-4 pt-2 sm:flex-row">
          <Link
            href="/dashboard/lambda-corp"
            className="group inline-flex items-center gap-2 rounded-xl bg-nordic-cyan bg-opacity-90 hover:bg-nordic-cyan px-8 py-4 text-lg font-medium text-nordic-deeper shadow-solid transition-all hover:shadow-solid-lg"
          >
            Launch Demo
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </Link>

          <a
            href="https://github.com/gulfaniputra/pulse-forge"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-nordic-polar border-opacity-60 bg-nordic-navy bg-opacity-50 px-6 py-4 text-lg font-medium text-nordic-frost transition-all hover:border-nordic-cyan hover:bg-nordic-navy"
          >
            <Github className="h-5 w-5" />
            View Source
          </a>
        </div>

        {/* Feature grid – text opacity fixed */}
        <div className="grid grid-cols-1 gap-6 border-t border-nordic-polar border-opacity-30 pt-10 md:grid-cols-3 md:gap-4">
          <div className="flex items-center justify-center gap-3 text-sm text-nordic-frost text-opacity-70">
            <Shield className="h-4 w-4 text-nordic-green" />
            Tenant‑scoped queries
          </div>
          <div className="flex items-center justify-center gap-3 text-sm text-nordic-frost text-opacity-70">
            <Zap className="h-4 w-4 text-nordic-gold" />
            Edge‑native API
          </div>
          <div className="flex items-center justify-center gap-3 text-sm text-nordic-frost text-opacity-70">
            <BarChart3 className="h-4 w-4 text-nordic-cyan" />
            E2E Type Safety
          </div>
        </div>
      </main>
    </div>
  );
}
