# pulse-forge

**pulse-forge** is a production-grade serverless multi-tenant feature flag and real-time event analytics platform. Designed for edge-native execution, zero-ops infrastructure overhead, absolute end-to-end type safety, and rigorous test-driven stability.

## Table of Contents

- [Architecture & Design Decisions](#architecture--design-decisions)
  - [Key Micro-Architectures](#key-micro-architectures)
- [Tech Stack](#tech-stack)
- [Repository Structure](#repository-structure)
- [Git Workflow & CI/CD](#git-workflow--cicd)
  - [Pipeline Security Gates](#pipeline-security-gates)
- [Local Development Guide](#local-development-guide)
  - [Getting Started](#getting-started)
  - [Available Scripts](#available-scripts)
  - [Database Management (Drizzle Kit)](#database-management-drizzle-kit)

## Architecture & Design Decisions

`pulse-forge` is architected as a high-velocity low-latency engine built entirely around the modern serverless edge model. Instead of relying on traditional, heavy, and expensive infrastructure blocks, the platform delegates heavy lifting to edge runtimes and cloud connection-pooled relational engines.

### Key Micro-Architectures

- **Colocated monolith architecture:** The entire system lives within a unified single-project structure. A high-performance **Hono API** is hosted natively inside the Next.js App Router catch-all directory (`src/app/api/[[...route]]/route.ts`). This structure provides unified workspace synchronization and removes cross-repository version friction.
- **End-to-End type safety (Hono RPC):** The application completely eliminates untyped network layer fetch requests. The Next.js frontend interacts directly with the edge API through Hono’s native TypeScript RPC (Remote Procedure Call) mechanism, exporting a compiled `AppType` contract. Modifying an API schema instantly flags compilation and type errors across the entire application interface.
- **Edge-optimized data modeling:** To achieve ultra-low execution latency, feature flag targeting rules (e.g. percentage rollouts & regional lookups) are embedded as highly structured `jsonb` objects directly inside the core `feature_flags` table. This avoids expensive multi-table relational joins, transforming flag evaluation into near-instantaneous index scans.
- **Serverless pool shielding:** Database connectivity utilizes the WebSocket/HTTP architecture provided by `@neondatabase/serverless`, protecting the transactional backend against socket exhaustion under volatile edge-scale traffic spikes.

## Tech Stack

| Layer                | Technology                         | Purpose / Configuration                                                                                                           |
| :------------------- | :--------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------- |
| **Frontend**         | React 19 + Next.js 15 (App Router) | React Server Components (RSC) for isolated server-side queries and clean client hydration boundaries.                             |
| **Backend**          | Hono                               | Lightweight and edge-native router configured with strict input validation shields via **Zod**.                                   |
| **Database & ORM**   | PostgreSQL + Drizzle               | Fully multi-tenant PostgreSQL backing a type-safe Drizzle schema featuring strict row indexing and cascade constraints.           |
| **Testing suite**    | Vitest + Playwright                | **Vitest** for isolated, memory-mapped API route assertions. **Playwright** for complete end-to-end browser automation workflows. |
| **Tooling & linter** | Prettier + ESLint                  | Unified Flat Config (`eslint.config.mjs`) and shared formatting schemas ensuring strict code quality and style symmetry.          |

## Repository Structure

```text
pulse-forge/
├── .github/workflows/  # Automated multi-gate CI pipelines
│   └── ci.yml
├── src/
│   ├── app/
│   │   ├── api/        # Colocated Hono Edge API
│   │   └── dashboard/  # Secure multi-tenant user panel
│   ├── db/             # Drizzle schemas and pool layout
│   │   └── schema.ts
│   └── lib/            # Shared Hono RPC Type Clients
├── tests/
│   ├── e2e/            # Playwright UI scenarios
│   └── integration/    # Vitest route assertion tests
├── eslint.config.mjs   # Flat config rules
├── vite.config.ts      # Vitest sequential-thread execution configuration
└── tsconfig.json       # Strict type rules & path mapping
```

## Git Workflow & CI/CD

The repository enforces a non-negotiable quality gate via GitHub Actions (`.github/workflows/ci.yml`) on every pull request targeting the `main` branch.

```
[Local Commit] -> [Lint/Prettier Check] -> [Type Compilation] -> [Vitest Integration] -> [Playwright E2E] -> [Ship]
```

### Pipeline Security Gates

1. **Lint & code style check:** Evaluates full compliance using `next lint` and strict Prettier formatting verification.
2. **Type compilation guardrail:** Executes `tsc --noEmit` to verify full-stack contract stability across the shared Hono RPC boundaries.
3. **Vitest integration suite:** Executes localized in-memory router testing against mock and isolated database targets sequentially.
4. **Playwright browser suite:** Triggers headless browser smoke execution and leveraging automated GitHub Actions caching for the local Playwright binary directory (`~/.cache/ms-playwright`) to keep execution times optimal.

## Local Development Guide

### Getting Started

Ensure you have Node.js 22+ active in your runtime environment. Install the dependency map bypassing strict peer mismatches caused by React 19 testing tool transitions:

```bash
npm install --legacy-peer-deps
```

### Available Scripts

- **Launch the local workspace development loop:**

```bash
npm run dev
```

- **Execute strict full-stack type system check:**

```bash
npm run typecheck
```

- **Run pre-commit linter verification & format check:**

```bash
npm run lint
```

- **auto-fix workspace layout code formatting:**

```bash
npm run format
```

- **Run route integration suite:**

```bash
npm run test:integration
```

- **Run full headless browser E2E workflows:**

```bash
npm run test:e2e
```

- **Compile local code base for production readiness build:**

```bash
npm run build
```

### Database Management (Drizzle Kit)

- **Generate SQL migrations from TypeScript schemas:** `npx drizzle-kit generate`
- **Push structural migrations to active database instances:** `npx drizzle-kit migrate`
- **Mount local graphical interface to inspect PostgreSQL tables:** `npx drizzle-kit studio`
