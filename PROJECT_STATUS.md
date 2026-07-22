# Project Status - Web3 Hunting OS

Last updated: 2026-07-22

## Current Position

Web3 Hunting OS is in **Phase 1 Core, preview-first, UI freeze candidate**.

The app has a working Next.js 15 desktop preview shell with routed UI for Dashboard, Inbox, Docs, Projects, Watchlist, Daily, Tasks, Accounts, Archive, Settings, Login, and Signup. Visual direction is mostly locked around a premium dark compact productivity OS, following `DESIGN.md` and the accepted `/projects` baseline.

**Important:** most app data is still preview/static data. Supabase schema, RLS, storage, migrations, server actions, real CRUD, and persistence are not wired yet.

Product is **not daily-usable yet**. It is a high-fidelity prototype with broad page coverage.

## Active Source of Truth

Read these before major work:

1. `PRD.MD` — product behavior, scope, phasing, data model, implementation order (v3.0)
2. `DESIGN.md` — visual direction, layout, density, spacing, interaction tone
3. `PROJECT_STATUS.md` — implementation state only (this file)
4. `AGENTS.md` — contributor workflow guidance

PRD v3.0 supersedes older v2.8 decisions.

## Handoff Notes (Codex → current)

Recent long work was done with Codex CLI/VS Code from `/home/moree`, focused on Web3 Hunting OS UI.

### What Codex recently finished

- Daily preview rewrite (collapsible groups, Asia/Jakarta date, softer dividers)
- Task detail panel and related Tasks preview work
- Account and wallet detail panels
- Accounts identity-card visual direction (compact charcoal persona cards, desktop hover tilt, Discord SVG, tighter card width)
- UI audit artifact: `audits/UI_AUDIT_SRC_2026-07-17.md`
- Dashboard layout experiment that was **rolled back** after rendered result looked wrong
- Scoped local commit for audit/motion tokens: `dc902a9 Add UI audit and motion polish tokens`
- Later commits include account/wallet panels and other UI polish (latest commit on branch tip: `c4a5554 Add account and wallet detail panels`)

### Agent lessons from that work

- Prefer small approved batches; propose plan before large edits
- `/projects` is the visual baseline for density and polish
- Validate **rendered layout**, not only “code is valid” (dashboard stretch regression)
- Do not make large Dashboard rewrites without clear approval
- Daily is an execution surface; primary task creation belongs on `/tasks` or project detail
- Personal Items UI scaffolding may exist, but backend work for Personal Items is Phase 1.5
- Login/auth page polish can wait until core workflow pages are stable
- GitHub push from agent shell previously failed (auth/SSH); push from an authenticated terminal if needed

### Current working tree (as of this update)

There is a **dirty working tree** with uncommitted polish/docs across many files, including:

- `AGENTS.md`, `DESIGN.md`, `PROJECT_STATUS.md`
- `src/app/globals.css`
- shared UI primitives and mobile nav
- `accounts-preview.tsx` (main recent polish target)
- smaller touch-ups across archive, auth, daily, dashboard helpers, docs, projects, settings

Before starting data-foundation work, **stabilize**: commit intentional WIP, or explicitly discard accidental leftovers. Do not stack backend work on a vague dirty tree.

## PRD v3.0 Alignment Notes

Current implementation should align with:

- Phase 1 Core ships first: Auth, Workspace, Inbox, Docs, Accounts, Wallets, Projects, Tasks, Daily, Archive
- Phase 1.5 is fast-follow: Trading, Personal Items, Settings Integrations
- Dashboard formula: `Dashboard = Inbox + Docs + Pulse`
- Dashboard must not become a mini Daily or mini Projects page
- Running/Recheck belong on Daily and Projects only, not Dashboard
- Docs is the UI label for unified notes (guides, links, templates, SOP, project references)
- One unified `notes` system later; no separate `project_notes` table
- Project-linked docs/notes use `notes.linked_project_id`
- Archive is project-scoped only
- Trading is a separate top-level Phase 1.5 area, not a project category
- Personal Items are Phase 1.5
- Project status and task status stay distinct from frequency and stage/result

## What Is Implemented Now

### App Shell and Navigation

- Open desktop-style shell: fixed sidebar + independently scrollable main workspace
- Sidebar routes: Dashboard, Inbox, Docs, Projects, Watchlist, Daily, Tasks, Accounts, Archive, Settings, inactive Trading
- Projects parent links to `/projects`; Watchlist, Daily, Tasks nested below
- Mobile nav exists but is secondary

### Dashboard Preview

- Layout accepted for now after rollback of a failed layout experiment
- Greeting, WIB date, motivation line, Quick Capture, notes/inbox/pulse-style desk content, static counts
- Quick Capture visual only
- Data is static preview

### Projects and Watchlist Preview

- `/projects` is the most mature UI baseline
- Compact table, Add Project modal, custom-capable combobox previews, Project Detail panel
- Watchlist = filtered Projects preview
- No real project CRUD or persistence

### Tasks Preview

- List, Board, Running, Recheck views
- Add Task modal; Task Detail Panel shared with Daily
- Board grouping: By Project / By Status
- Personal Item creation UI exists as preview scaffolding only (Phase 1.5 product)
- Large monolithic client file (`tasks-preview.tsx` ~1100+ lines) with mock data inline
- No real task CRUD, assignments, or task logs

### Daily Preview

- Collapsible account sections; By Account / By Project / Personal preview modes
- CSS checkbox draw animation
- Running/Recheck as non-checkbox rows
- Date defaults to Asia/Jakarta today in preview
- Static tasks + local UI state only
- Product note: Daily should not be the primary “Add task” surface for Phase 1 Core

### Inbox Preview

- Manual queue layout: search, filters, list, detail, actions
- Search is a real input but not persisted
- No real inbox CRUD or conversion flow

### Docs Preview

- Unified notes/docs direction: pinned, folders, safe-access warning, recent
- Search and new-doc actions visual/preview only
- No real docs CRUD, project links, folders, or markdown editor

### Accounts and Wallets Preview

- Tabs: Identities, Wallets, Groups
- Account Detail Panel and Wallet Detail Panel (preview)
- Identity cards: compact charcoal persona cards, desktop-only hover tilt, Discord/X/email metadata direction, tighter card width
- Avatar upload / image URL controls scaffolded visually only
- Still tuning card positioning and denser layout feel
- No real account/wallet CRUD, upload, or relations

### Archive Preview

- Project-only archived rows, reason filters, restore selection UI
- No real archive/restore persistence

### Settings Preview

- Profile, workspace, security, accounts, MVP boundary cards
- Save disabled until real editing exists
- Integrations are Phase 1.5

### Auth Preview

- Login and Signup screens exist
- Username + password UI direction; internal Supabase email adapter planned (`{username}@web3-hunting.local`)
- Dev preview auth bypass when Supabase env missing (production fail-closed)
- Real auth hardening, workspace bootstrap, and production verification still needed

## Maintainability Snapshot

Folder architecture is sound (`app` / `features` / `components` / `lib`), but several feature previews are hard to read because UI + mock data + local state live in one large client file:

| Area | Rough size | Note |
| --- | --- | --- |
| `tasks-preview.tsx` | ~1100+ lines | Highest complexity |
| `projects-preview.tsx` | ~800+ lines | Visual baseline, still heavy |
| `accounts-preview.tsx` | ~500+ lines | Recent polish target |
| `daily-preview.tsx` | ~300+ lines | Manageable but mixed concerns |

This is expected for preview-first work. Before or while starting CRUD, prefer extracting mock data, types, and subcomponents rather than growing these files further.

Tests: tooling exists (Vitest, Playwright). Coverage is still thin (mainly username helpers). No meaningful e2e suite yet.

Stack gap vs PRD: Drizzle / migrations / RLS folders are not present yet even though PRD lists them.

## Last Work Done

### Latest product/code work (Codex, recent)

- Accounts identity card direction and iterative layout polish
- Account/wallet detail panels
- Daily checklist layout and interaction polish
- Task detail panel wiring
- UI audit + motion tokens commit (`dc902a9`)
- Dashboard layout attempt rolled back after visual rejection

### Latest documentation work

- `AGENTS.md` rewritten as concise repository guidelines
- `PROJECT_STATUS.md` refreshed (this update) with Codex handoff, dirty-tree note, maintainability snapshot, and revised next sequence
- `DESIGN.md` has local uncommitted polish edits

### Latest review work (outside Codex)

- Full folder review confirmed preview-first stage and data foundation as the main value gap
- Validation re-run: `pnpm typecheck`, `pnpm lint`, `pnpm test` passed (2026-07-22)

## What Is Not Implemented Yet

### Phase 1 Core blockers (app is not “real” until these exist)

- Supabase env configured for real use
- Drizzle schema + migrations aligned to PRD v3.0
- RLS for workspace-based access
- Default personal workspace creation after signup/login
- Real username signup/login/logout against Supabase Auth
- Real CRUD: Projects, Accounts, Wallet Groups, Wallets, Tasks, Inbox, Docs, Archive
- Task account assignment persistence
- Task logs with Asia/Jakarta `logged_date`
- Daily checklist generated from real tasks / assignments / logs
- Project logo upload + Storage
- Activity logs
- Real search/filter/sort and durable URL query state
- Real detail-panel edit + save flows

### Phase 1.5 (do not treat as current Core backend work)

- Trading page
- Trade Log + FIFO realized PnL
- Portfolio holdings and transfers
- Token watchlist
- Personal Items database and persistent logs
- Settings Integrations forms and storage

### Out of scope unless PRD/user explicitly approves

- Gmail / multi-email sync / Google OAuth
- AI classification or assistant features
- Live token price feed activation
- Auto wallet balance tracking
- X/Twitter monitoring
- Team invite UI / workspace switcher UI / billing

## Known UI Caveats

- Accounts identity cards still being tuned for density, alignment, and card feel
- Some pages still need a light pass against `/projects` baseline
- Many action buttons intentionally visual-only until CRUD
- Search/filters inconsistent because data is static
- Settings shallow vs future PRD role
- Trading inactive in sidebar
- Working tree has uncommitted polish; treat visual baseline as “mostly locked” but not fully committed/clean
- Large preview files make the repo harder to read than the route list suggests

## Recommended Next Sequence

Agreed direction after review + Codex handoff:

### 0. Stabilize (do first)

1. Review uncommitted diff and commit intentional UI/docs WIP, or discard accidental leftovers
2. Stop adding new preview pages/features
3. Only touch UI if user still sees a specific roughness

### 1. Optional readability pass (recommended before backend if folder feels hard to navigate)

- Extract mock data and domain types out of large `*-preview.tsx` files
- Split panels/modals/tables into smaller components
- Do not change product behavior; structure only

### 2. Phase 1 Core data foundation

- Supabase connection
- Drizzle schema aligned to PRD v3.0
- Migrations
- RLS policies
- Workspace helpers

### 3. Real auth + default workspace

- Username signup/login/logout end-to-end
- Default personal workspace on first auth
- Remove reliance on dev bypass for real usage

### 4. CRUD order

1. Projects
2. Accounts
3. Wallet Groups and Wallets
4. Tasks and task assignments
5. Task logs and Daily generation
6. Inbox
7. Docs
8. Archive
9. Activity logs

### 5. Hold for Phase 1.5

- Trading
- Personal Items backend
- Settings Integrations

Unless the user explicitly pulls them forward.

## Validation Status

Checked 2026-07-22 during review:

```txt
pnpm typecheck  # pass
pnpm lint       # pass
pnpm test       # pass (5 username unit tests)
```

`pnpm build` was reported clean during earlier UI work; re-run after structural or data-layer changes.

```bash
pnpm -C Web3-Hunting-OS lint
pnpm -C Web3-Hunting-OS typecheck
pnpm -C Web3-Hunting-OS test
pnpm -C Web3-Hunting-OS build
```

## Current Routes

```txt
/
/inbox
/docs
/daily
/projects
/projects?view=watchlist
/tasks
/accounts
/archive
/settings
/login
/signup
```

## Important Security Rules

Never store:

- seed phrase
- raw private key
- recovery phrase
- exchange API secret
- sensitive password
- 2FA backup code

Allowed data:

- public wallet address
- wallet label
- tx hash
- proof URL
- project docs/notes
- global docs/notes
- safe access metadata
- hint where a secret is stored (e.g. Bitwarden or local vault)

Docs may store safe access metadata, but must not become a password manager.
