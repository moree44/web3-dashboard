# Project Status - Web3 Hunting OS

Last updated: 2026-07-27

## Current Position

Web3 Hunting OS is in **Phase 1 Core, CRUD partially wired**.

The app has a working Next.js 15 desktop preview shell with routed UI for Dashboard, Inbox, Docs, Projects, Watchlist, Daily, Tasks, Accounts, Archive, Settings, Login, and Signup. Visual direction is locked around a premium dark compact productivity OS, following `DESIGN.md` and the accepted `/projects` baseline.

**Data foundation is in place:** Drizzle ORM schema (15 tables), 7 migration files, workspace helpers, auto-workspace creation on signup, Supabase Auth adapter, and Supabase Storage buckets for project logos and account avatars. Migration `0007_enable_rls_and_fix_storage_policies.sql` supersedes the unsuccessful `0001` rollout and has been applied to the live database. RLS is verified active on all 15 application tables. **CRUD server actions now exist for Projects, Accounts, Wallets, Wallet Groups, and Archive**, with create, update, and delete flows wired where noted below. **Project logo upload is complete** with file upload and clipboard paste (Ctrl+V) in both Add and Edit forms. **Account avatar upload/URL is complete** with the same storage pattern.

**Remaining gap:** Tasks, Inbox, Docs, and Daily generation are still static previews with no persistence. Activity logs are not yet implemented. Wallet Group update UI is pending.

## Active Source of Truth

Read these before major work:

1. `PRD.MD` — product behavior, scope, phasing, data model, implementation order (v3.0)
2. `DESIGN.md` — visual direction, layout, density, spacing, interaction tone
3. `PROJECT_STATUS.md` — implementation state only (this file)
4. `AGENTS.md` — contributor workflow guidance

PRD v3.0 supersedes older v2.8 decisions.

## Agent Lessons and Project Conventions

- Prefer small approved batches; propose plan before large edits
- `/projects` is the visual baseline for density and polish
- Validate **rendered layout**, not only "code is valid"
- Do not make large Dashboard rewrites without clear approval
- Daily is an execution surface; primary task creation belongs on `/tasks` or project detail
- Server actions pattern: `Omit<typeof schema.$inferInsert, "workspaceId">` — workspaceId supplied from auth via `requireWorkspace()`
- dbToUI mapper pattern: Converts DB records to UI types, carrying through `id`, foreign keys
- Inline edit pattern: Edit button → toggle inputs/dropdowns → Save/Cancel → server action + local state update
- Use reverse label maps (e.g. `reverseWalletTypeLabels`) to convert display labels back to DB enum values
- TypeScript narrowing fix: `const p = project;` after early `if (!project) return null;` for closures
- Verify database migrations against the live database, not only by checking that a SQL file exists
- In Storage policies, qualify the file path as `storage.objects.name`; unqualified `name` can bind to `workspaces.name` inside a subquery

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

### Data Foundation

- **Drizzle ORM** installed and configured (`drizzle-orm`, `drizzle-kit`, `pg`)
- **Schema** (`src/lib/db/schema.ts`): 15 tables matching PRD v3.0 Section 41
  - `workspaces`, `workspace_members`
  - `accounts`, `wallet_groups`, `wallets`
  - `projects`, `project_accounts`, `project_wallets`
  - `tasks`, `task_accounts`, `task_wallets`, `task_logs`
  - `inbox_items`, `notes`, `activity_logs`
- **RLS hardening** (`src/lib/db/migrations/0007_enable_rls_and_fix_storage_policies.sql`):
  - Supersedes `0001_rls_policies.sql`, which was not successfully applied and contained a recursive `workspace_members` policy
  - Enables RLS on all 15 application tables
  - Uses `public.user_workspace_ids()` as a `SECURITY DEFINER` membership helper with `search_path=public`
  - Restores workspace ownership checks for `project-logos`
  - Live verification: owner sees 1 workspace; an unrelated authenticated user sees 0
- **Storage policies**:
  - `project-logos` and `account-avatars` upload paths are scoped by workspace ownership
  - Both upload policies explicitly inspect `storage.objects.name`
- **DB client** (`src/lib/db/client.ts`): Drizzle + pg Pool with dev singleton
- **Workspace helpers** (`src/lib/db/workspace.ts`): `getUserWorkspace()`, `ensureDefaultWorkspace()`
- **Auth wiring**: signup server action auto-creates default "My Workspace" with owner membership
- **DB scripts**: `pnpm db:generate`, `pnpm db:migrate`, `pnpm db:push`

### Auth

- Login and Signup screens with Supabase Auth
- Username + password UI; internal Supabase email adapter (`{username}@web3-hunting.local`)
- Dev preview auth bypass when Supabase env missing (production fail-closed)
- Default personal workspace creation on first signup

### Server Actions (CRUD)

Server actions exist for three surfaces, following the workspace-scoped pattern:

| Surface | File | Queries | Mutations |
| --- | --- | --- | --- |
| Auth | `src/features/auth/actions.ts` | — | signup, login |
| Projects | `src/features/projects/actions.ts` | `getProjects`, `getArchivedProjects`, `getProjectAccountOptions` | `createProject`, `updateProject`, `archiveProject`, `restoreProject`, `deleteProject`, `uploadProjectLogo` |
| Accounts | `src/features/accounts/actions.ts` | `getAccounts` (with stats), `getWallets`, `getWalletGroups` | `createAccount`, `updateAccount`, `deleteAccount`, `uploadAccountAvatar`, `setAccountAvatarUrl`, `createWallet`, `updateWallet`, `deleteWallet`, `createWalletGroup`, `updateWalletGroup`, `deleteWalletGroup` |

All mutations call `revalidatePath()` to refresh Next.js cache.

### Projects and Watchlist — CRUD wired + logo upload

- Server actions fully wired to UI:
  - **Create**: Add Project modal → `createProject` → local state insert, with logo file upload to Supabase Storage
  - **Update**: Inline edit in ProjectDetailPanel (Name, Hunt type, Status, Priority, Stage, Progress, Date, multiple Work Types, multiple Project Types, and assigned Accounts) with Edit/Save/Cancel toggle. Logo can be uploaded or pasted (Ctrl+V) in edit mode and uploads immediately.
  - **Delete**: Dropdown on ProjectRow (table), ProjectCard (mobile), and ProjectDetailPanel header → `deleteProject` → local state remove
- **Archive**: ProjectRow/ProjectCard/ProjectDetailPanel → `archiveProject` → local state remove
- **Logo upload**: Supabase Storage bucket `project-logos` with RLS policies, file picker, and clipboard paste (Ctrl+V) in both Add Project dialog and Edit mode of ProjectDetailPanel
- Page route (`/projects`) fetches real projects via `getProjects()` + `getProjectAccountOptions()` when not in dev preview
- Project create and edit persist multiple selected account assignments through `project_accounts`
- Project reads include assigned account labels, and rows without an assignment show `Unassigned` instead of a blank cell
- The Add Project date picker persists `date_start`; Work Type and Project Type support multiple values during create and edit
- Watchlist = filtered Projects preview (by status/stage); logic lives in `project-query.ts`
- Preview fixtures are used only when the Supabase environment is not configured
- `projects-preview.tsx` (~1640 lines): table, cards, detail panel, add dialog, inline edit, logo upload with paste

### Accounts (Identities) — CRUD wired + avatar upload

- Server actions fully wired to UI:
  - **Create**: Add Account dialog → `createAccount` → local state insert
  - **Update**: Inline edit in AccountDetailPanel (label, X, Discord, email) with Edit/Save/Cancel toggle
  - **Delete**: Dropdown on identity cards and AccountDetailPanel header → `deleteAccount` → local state remove
  - **Avatar**: file upload to Supabase Storage (`account-avatars`) + external image URL persist (`avatar_url` / `avatar_source`)
- `getAccounts()` returns wallet counts and active project names from `project_accounts`
- Page route (`/accounts`) fetches real accounts via `getAccounts()` when not in dev preview
- Identity cards: compact charcoal persona cards, desktop hover tilt, Discord/X/email metadata, real avatar when set

### Wallets — CRUD wired

- Server actions fully wired to UI:
  - **Create**: Add Wallet dialog → `createWallet` → local state insert
  - **Update**: Inline edit in WalletDetailPanel (label, address, chainType, walletType, walletGroupId, ownerAccountId) with Edit/Save/Cancel toggle
  - **Delete**: Dropdown on WalletRow and WalletDetailPanel header → `deleteWallet` → local state remove
- Uses `reverseWalletTypeLabels` to map display labels back to DB enum values in `saveEdit()`
- Owner and Group edit fields use live account/group lists as dropdown options

### Wallet Groups — CRUD partially wired

- **Create**: wired via Add Group inline
- **Delete**: Dropdown on each group card's MoreHorizontal button → `deleteWalletGroup` → local state remove
- **Update** (edit group name/description): server action exists (`updateWalletGroup`) but not yet wired to UI
- Page route fetches real groups via `getWalletGroups()` when not in dev preview

### Dashboard Preview

- Greeting, WIB date, motivation line, Quick Capture, notes/inbox/pulse-style desk content, static counts
- Quick Capture visual only
- Data is static preview

### Tasks Preview

- List, Board, Running, Recheck views
- Add Task modal; Task Detail Panel shared with Daily
- Board grouping: By Project / By Status
- Personal Item creation UI exists as preview scaffolding only (Phase 1.5)
- Large monolithic client file (`tasks-preview.tsx` ~1100+ lines) with mock data inline
- No real task CRUD, assignments, or task logs

### Daily Preview

- Collapsible account sections; By Account / By Project / Personal preview modes
- CSS checkbox draw animation
- Running/Recheck as non-checkbox rows
- Date defaults to Asia/Jakarta today in preview
- Static tasks + local UI state only

### Inbox Preview

- Manual queue layout: search, filters, list, detail, actions
- Search is a real input but not persisted
- No real inbox CRUD or conversion flow

### Docs Preview

- Unified notes/docs direction: pinned, folders, safe-access warning, recent
- Search and new-doc actions visual/preview only
- No real docs CRUD, project links, folders, or markdown editor

### Archive — CRUD wired

- **Restore**: Select checkboxes → Restore selected button → `restoreProject` → local state remove
- **Permanent delete**: Per-row trash button → `deleteProject` → local state remove
- Page route (`/archive`) fetches real archived projects via `getArchivedProjects()` when not in dev preview
- Reason-filter tabs (Claimed, Dropped, Scam Risk, Expired, Not Worth, Duplicate, Completed, Other) with counts
- Mobile card layout with restore/delete parity
- Server actions revalidate `/projects`, `/archive`, `/daily`, and `/tasks` on every mutation

### Settings Preview

- Profile, workspace, security, accounts, MVP boundary cards
- Save disabled until real editing exists
- Integrations are Phase 1.5

## Maintainability Snapshot

Folder architecture is sound (`app` / `features` / `components` / `lib`), but several feature previews are hard to read because UI + mock data + local state live in one large client file:

| Area | Rough size | CRUD Status |
| --- | --- | --- |
| `tasks-preview.tsx` | ~1100+ lines | Static preview |
| `accounts-preview.tsx` | ~1600+ lines | CRUD wired (identities, wallets, groups) |
| `projects-preview.tsx` | ~1640+ lines | CRUD wired + logo upload + paste |
| `archive-preview.tsx` | ~278 lines | CRUD wired (restore, delete) |
| `daily-preview.tsx` | ~300+ lines | Static preview |

Unit tests: 2 files, 20 tests total (project-query: 12, username/auth: 8).

E2E diagnostics now include focused Accounts/Projects coverage and a full application smoke suite. The latest full smoke run after RLS activation completed 37 checks successfully, found 1 known product gap (Wallet Group rename is not reachable from the UI), and captured no console errors.

## Latest Change Batch

The 2026-07-27 Phase 1 Core batch includes:

- Auth and default-workspace hardening
- Database migrations `0002` through `0007`
- Live RLS activation and Storage ownership policy fixes
- Projects, Accounts, Wallets, Wallet Groups, and Archive CRUD wiring
- Project logo and Account avatar Storage flows
- Project query unit coverage and CRUD smoke diagnostics
- Updated implementation and validation status

Local `tmp-*-report.txt` diagnostic outputs are ignored and are not part of the source release.

## What Is Not Implemented Yet

### Phase 1 Core remaining (ordered by priority)

1. **Tasks CRUD** — server actions + UI wiring (create, update, delete, assign accounts/wallets)
2. **Task logs** — with Asia/Jakarta `logged_date`
3. **Daily generation** — from real tasks / assignments / logs (replaces static preview)
4. **Inbox CRUD** — server actions + UI wiring + conversion flow to tasks/notes
5. **Docs CRUD** — server actions + markdown editor + project links + folders
6. **Activity logs** — auto-generated from mutations
7. **Wallet Group edit UI** — `updateWalletGroup` action exists but not wired to UI
8. **Project wallet assignment** — wallets still pending in project create/edit

### Phase 1.5 (do not treat as current Core work)

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

- Some preview-only pages (tasks, inbox, docs, daily) still have many visual-only action buttons
- Search/filters inconsistent because data is static on non-wired pages
- Settings shallow vs future PRD role
- Trading inactive in sidebar
- Large preview files make the repo harder to read than the route list suggests

## CRUD Implementation Order (PRD v3.0)

```
DONE     1. Projects: create, update, delete, archive, logo upload wired
DONE     2. Accounts: create, update, delete wired
DONE     3. Wallets: create, update, delete wired
PARTIAL  3b. Wallet Groups: create and delete wired; update action exists but UI pending
DONE     4. Archive: restore and permanent delete wired
NEXT     5. Tasks
PENDING  6. Task logs / Daily generation
PENDING  7. Inbox
PENDING  8. Docs
PENDING  9. Activity logs
```

## Validation Status

Checked 2026-07-27 after closing the RLS and Storage policy work from the previous session:

```txt
pnpm typecheck  # pass
pnpm lint       # pass, 0 warnings
pnpm test       # pass, 2 files and 20 tests
```

Live database metadata verification:

```txt
Application tables found             15
Tables with RLS enabled              15
Application policies                17
user_workspace_ids SECURITY DEFINER true
user_workspace_ids search_path      public
Owner-visible workspaces             1
Unrelated-user-visible workspaces    0
Avatar upload ownership policy       present
Project logo ownership policy        present
```

Latest full smoke run after migration `0007`:

```txt
37 checks passed
1 known product gap: Wallet Group rename/edit option is missing in the UI
0 console errors
Project logo upload and persistence passed
Account avatar upload, persistence, and fetchability passed
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
