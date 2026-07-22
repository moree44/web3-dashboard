# Repository Guidelines

## Project Structure & Module Organization

This is a Next.js 15 App Router project for a personal Web3 Hunting OS. Source code lives in `src/`. Routes are under `src/app`, feature-specific preview and UI logic lives in `src/features/*`, shared layout components live in `src/components/layout`, shared UI primitives in `src/components/ui`, and shared utilities in `src/lib`. Tests live in `tests/`, with unit tests in `tests/unit`. Product and design direction are documented in `PRD.MD`, `DESIGN.md`, and `PROJECT_STATUS.md`.

## Build, Test, and Development Commands

Use pnpm with Node 22 or newer.

```bash
pnpm install
pnpm dev
pnpm build
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
```

`pnpm dev` starts the local Next.js app with Turbopack. `build` validates production output. `lint` runs ESLint with zero warnings. `typecheck` runs TypeScript without emitting files. `test` runs Vitest unit tests. `test:e2e` runs Playwright.

## Coding Style & Naming Conventions

Use TypeScript, React Server Components where practical, and client components only when state or browser APIs are needed. Keep components small and feature-scoped. Use kebab-case file names like `projects-preview.tsx` and descriptive component names like `TaskDetailPanel`. Use Tailwind utility classes and existing soft visual tokens from `src/app/globals.css`. Follow `DESIGN.md` for spacing, dark theme, density, and visual tone.

## Testing Guidelines

Unit tests use Vitest and Testing Library. Place tests in `tests/unit` and name them `*.test.ts` or `*.test.tsx`. Add tests for validation, auth helpers, data transforms, and critical UI behavior when logic becomes non-trivial. Run `pnpm test`, `pnpm typecheck`, and `pnpm lint` before handoff.

## Commit & Pull Request Guidelines

Git history uses short imperative commits, for example `Add task detail panel and personal items` or `Polish daily checklist layout`. Keep commits focused. Pull requests should include a concise summary, screenshots for UI changes, test commands run, known limitations, and linked issues when relevant.

## Security & Configuration Tips

Never commit secrets. Use `.env.example` as the reference for required variables. Supabase service-role keys must never be exposed to the browser. Do not store seed phrases, raw private keys, recovery phrases, exchange API secrets, or sensitive passwords in app data.

## Agent-Specific Instructions

Before product, UI, data model, or architecture changes, read `PRD.MD`, `DESIGN.md`, and `PROJECT_STATUS.md`. Work in small approved batches. Do not build Phase 2 or Phase 3 features unless explicitly requested.
