# AGENTS.md

## Project Context

This repository is a personal-first Web3 Hunting OS.

It is a private desktop-first workbench for managing Web3 hunting activity, including projects, accounts, wallets, tasks, daily work, notes, inbox items, archive, and activity logs.

The product is personal-first, not SaaS-first.

## Source of Truth

Before making product, architecture, database, UI, or feature decisions, read:

1. `PRD.MD`
2. `DESIGN.md`
3. `PROJECT_STATUS.md` for current implementation context only

Rules:

* `PRD.MD` controls product behavior, feature scope, data model, phase decisions, and implementation priorities.
* `DESIGN.md` controls visual style, layout, component treatment, spacing, density, and responsive behavior.
* `AGENTS.md` controls how to work in this repository.
* `PROJECT_STATUS.md` describes the current state of implementation, but it does not override `PRD.MD` or `DESIGN.md`.
* Backup markdown files are not active instructions.
* Ignore docs inside `.local-backup/` unless the user explicitly asks for comparison.

If `AGENTS.md`, `PRD.MD`, `DESIGN.md`, and current implementation conflict, stop and ask the user before implementing.

## Working Mode

Work batch-by-batch.

Do not build everything at once.

Before each implementation batch:

1. Explain the plan.
2. List exact files that will be created or changed.
3. Wait for user approval.
4. Implement only the approved scope.
5. Run lint, typecheck, and build when available.
6. Summarize what changed and how to test it.

Do not implement unapproved features.

Do not implement Phase 2 or Phase 3 unless explicitly requested.

If implementation has already progressed far, audit before changing code.

Do not rewrite working features unless the user approves.

Avoid large refactors during visual, documentation, or alignment passes.

## Batch Discipline

When the user asks for an audit, review only. Do not edit code.

When the user approves a batch, stay inside that batch.

If a requested change touches many areas at once, split it into smaller approval-gated batches.

If a change expands scope, stop and ask.

## Core Stack

Use:

* Next.js 15 App Router
* TypeScript
* Tailwind CSS
* shadcn/ui
* Supabase Auth
* Supabase PostgreSQL
* Supabase Storage
* Supabase RLS
* Drizzle ORM
* Zod
* React Hook Form
* Vercel deployment

## Stable Product Rules

* Account is persona.
* Wallet is address.
* Do not merge Account and Wallet.
* L1 is a wallet type or wallet group, never an account.
* A project can be assigned to many accounts.
* A project can be assigned to many wallets.
* A task can be assigned to many accounts.
* A task can optionally be assigned to wallets.
* Daily checklist must be grouped by account by default.
* Task logs are the source of truth for daily completion.
* Do not store daily done or skip state directly on tasks.
* Archive replaces Trash and must use an archive reason.
* The app is personal-first.
* After signup/login, automatically create one default personal workspace if missing.
* Keep `workspace_id` on all main tables.
* Keep `workspace_members` for future team support.
* Do not build team invite UI unless approved.
* Do not build workspace switcher UI unless approved.
* Do not build billing unless approved.

## Authentication Rules

The user-facing auth identifier is `username`, never email.

Signup fields:

```txt
username
display name
password
password confirmation
```

Login fields:

```txt
username
password
```

Username rules:

* Must match `^[a-z0-9_]{3,24}$`
* Must be unique
* Trim whitespace before validation
* Reject uppercase and invalid characters
* Do not silently transform invalid UI input into a valid username

Supabase Auth is still used under the hood.

Build the Supabase Auth adapter email server-side as:

```txt
{normalized_username}@web3-hunting.local
```

Rules:

* Never display the generated internal email in the UI.
* Never log the generated internal email in user-facing activity.
* Never request email during signup/login in MVP.
* Store `username` and `display_name` in Supabase user metadata.
* Do not build email verification flow unless explicitly requested.
* Account/persona email is optional tracking data and is separate from authentication identity.
* Default workspace naming uses display name first and username as fallback.
* Keep protected routes, cookie session handling, middleware refresh, and logout.

## Development Auth Bypass Rules

A development-only preview bypass may exist only for local preview.

It must follow all rules:

* Only active when `NODE_ENV === "development"`
* Only active when Supabase environment variables are missing
* Never active in production
* If production env vars are missing, fail closed
* Must show a clear console warning when active
* Must not run if valid Supabase env vars exist

Do not expand this bypass.

Do not use it as real auth.

Do not expose service-role keys to the browser.

## Security Rules

Never store:

* seed phrase
* raw private key
* recovery phrase
* exchange API secret
* sensitive passwords

Allowed:

* public wallet address
* wallet label
* tx hash
* proof URL
* project notes
* global notes
* inbox items that do not contain secrets
* hint where private key is stored

Use Supabase RLS for workspace-based access.

A user can only access rows from workspaces where they are a member.

Never expose service-role credentials to the browser.

## Phase and Scope Rules

Build only the phase and batch approved by the user.

Do not implement future ideas unless explicitly approved.

Future ideas may include things like:

* Gmail integration
* Multi-email sync
* Google OAuth
* AI email classification
* Scheduled inbox sync
* X/Twitter monitoring
* Agent discovery
* Crypto news widget
* Token price widget
* Team features
* Advanced analytics

These must not be built unless the current `PRD.MD` and the user explicitly approve them.

If `PRD.MD` says a feature is out of scope, do not build it.

## UI Rules

Follow `DESIGN.md` as the visual source of truth.

Stable visual direction:

* personal-first
* desktop-first
* dark productivity workbench
* soft-depth interface
* compact but readable
* fast to scan
* fast to write
* not terminal
* not cyberpunk
* not generic SaaS admin
* not analytics-first
* not marketing-style

Gradient rules:

* Subtle atmospheric gradients are allowed only when `DESIGN.md` allows them.
* Content panels should mostly remain readable and solid.
* Avoid heavy gradients, neon glow, glassmorphism, noisy textures, shiny 3D, and card walls.

Icon rules:

* Use one consistent icon family unless `DESIGN.md` says otherwise.
* Icons should be mostly monochrome.
* Use semantic color only for state, priority, validation, or important actions.
* Do not use colorful icon sets randomly.

## Database Rules

Use workspace-based data isolation.

Main tables should include `workspace_id`.

Follow the schema and constraints in `PRD.MD`.

Task log daily uniqueness rule unless `PRD.MD` changes it:

```sql
CREATE UNIQUE INDEX task_logs_unique_daily
ON task_logs(task_id, account_id, logged_date);
```

For MVP, `wallet_id` is optional metadata and must not create duplicate daily logs unless `PRD.MD` explicitly changes this rule.

## Response Format After Each Batch

After each batch, report:

1. What was implemented
2. Files created or changed
3. Commands run
4. Environment variables needed
5. How to test locally
6. Known issues or TODOs
7. Whether lint, typecheck, and build pass
8. Recommended next batch
