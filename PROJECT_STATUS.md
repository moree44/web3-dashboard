# Project Status - Web3 Hunting OS

Last updated: 2026-07-29

## Current Position

Web3 Hunting OS is in **Phase 1 Core, CRUD partially wired**.

The app has a working Next.js 15 desktop preview shell with routed UI for Dashboard, Deadlines, Inbox, Docs, Projects, Watchlist, Daily, Tasks, Accounts, Archive, Settings, Login, and Signup. Visual direction is locked around a premium dark compact productivity OS, following `DESIGN.md` and the accepted `/projects` baseline.

**Data foundation is in place:** Drizzle ORM schema (16 tables), 9 migration files, workspace helpers, auto-workspace creation on signup, Supabase Auth adapter, and Supabase Storage buckets for project logos and account avatars. Migrations through `0009_task_lifecycle_dates.sql` have been applied to the live database. RLS is verified active on all 16 application tables. **CRUD server actions now exist for Projects, Accounts, Wallets, Wallet Groups, Archive, Deadlines, and Tasks**, with create, update, and delete flows wired where noted below. **Project logo upload is complete** with file upload and clipboard paste (Ctrl+V) in both Add and Edit forms. **Account avatar upload/URL is complete** with the same storage pattern, and Projects and Tasks render assigned account avatars from those stored account records.

**Remaining gap:** Inbox, Docs, and Daily generation are still static previews with no persistence. Task logs and Activity logs are not yet implemented. Wallet Group update UI and Project wallet assignment UI are pending. Personal Items remain explicit Phase 1.5 preview scaffolding. UI foundation cleanup now standardizes feature dropdowns and date pickers through shared components instead of browser-native menus. Active HTTP URL inputs now share one normalization and validation path, so bare domains are accepted consistently and persisted with an HTTPS scheme.

## Active Source of Truth

Read these before major work:

1. `PRD.MD` — product behavior, scope, phasing, data model, implementation order (v3.1)
2. `DESIGN.md` — visual direction, layout, density, spacing, interaction tone
3. `PROJECT_STATUS.md` — implementation state only (this file)
4. `AGENTS.md` — contributor workflow guidance

PRD v3.1 supersedes v3.0 and older decisions.

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

## PRD v3.1 Alignment Notes

Current implementation should align with:

- Phase 1 Core ships first: Auth, Workspace, Inbox, Docs, Accounts, Wallets, Projects, Tasks, Daily, Archive
- Phase 1.5 is fast-follow: Trading, Personal Items, Settings Integrations
- Dashboard formula: `Dashboard = Inbox + Docs + Pulse`
- Dashboard must not become a mini Daily or mini Projects page
- Dashboard Upcoming deadlines reads standalone, Project-linked, and Task-linked Deadline records
- Task lifecycle timing uses `start_date` and `completed_at`; due dates belong only to Deadline records
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
- Sidebar routes: Dashboard, Inbox, Docs, Projects, Watchlist, Daily, Deadlines, Tasks, Accounts, Archive, Settings, inactive Trading
- Projects parent links to `/projects`; Watchlist, Daily, Deadlines, and Tasks nested below
- Mobile nav exists but is secondary

### Data Foundation

- **Drizzle ORM** installed and configured (`drizzle-orm`, `drizzle-kit`, `pg`)
- **Schema** (`src/lib/db/schema.ts`): 16 tables matching the updated PRD v3.1 Section 41
  - `workspaces`, `workspace_members`
  - `accounts`, `wallet_groups`, `wallets`
  - `projects`, `project_accounts`, `project_wallets`
  - `tasks`, `task_accounts`, `task_wallets`, `task_logs`
  - `deadlines`
  - `inbox_items`, `notes`, `activity_logs`
- **RLS hardening** (`src/lib/db/migrations/0007_enable_rls_and_fix_storage_policies.sql`):
  - Supersedes `0001_rls_policies.sql`, which was not successfully applied and contained a recursive `workspace_members` policy
  - Enables RLS on the original 15 application tables; migration `0008` adds the same workspace policy to `deadlines`
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
| Tasks | `src/features/tasks/actions.ts` | `getTaskWorkspaceData` | `createTask`, `updateTask`, `updateTaskStatus`, `deleteTask` |

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
- Project reads include assigned account labels and avatar metadata; rows without an assignment show `Unassigned` instead of a blank cell
- Project table and mobile cards render assigned accounts as compact avatar groups, using account avatars when present and initials as fallback
- Avatar groups show up to 4 visible accounts, then a clickable `+N` overflow button that opens a popover listing every assigned account
- Avatar group overflow supports outside-click dismissal, Escape-to-close with focus return, viewport-aware placement, and internal scrolling without closing
- Project detail edit properties use the same custom dropdown surface as Add Project, avoiding browser-native select menus in the drawer
- Shared `AppSelect` now covers Projects filters/sort/page-size and Accounts wallet create/edit dropdowns, removing browser-native option menus from feature UI
- Shared `AppDatePicker` now covers Projects date filters, Add Project date, Project detail edit Date start, and the Task edit drawer Due date
- The Add Project date picker persists `date_start`; Work Type and Project Type support multiple values during create and edit
- Watchlist = filtered Projects preview (by status/stage); logic lives in `project-query.ts`
- Preview fixtures are used only when the Supabase environment is not configured
- `projects-preview.tsx` (~1935 lines): table, cards, detail panel, add dialog, inline edit, logo upload with paste, assigned-account avatar group

### Accounts (Identities) — CRUD wired + avatar upload

- Server actions fully wired to UI:
  - **Create**: Add Account dialog → `createAccount` → local state insert
  - **Update**: Inline edit in AccountDetailPanel (label, X, Discord, email) with Edit/Save/Cancel toggle
  - **Delete**: Dropdown on identity cards and AccountDetailPanel header → `deleteAccount` → local state remove
  - **Avatar**: file upload to Supabase Storage (`account-avatars`) + external image URL persist (`avatar_url` / `avatar_source`)
- `getAccounts()` returns wallet counts and active project names from `project_accounts`
- Page route (`/accounts`) fetches real accounts via `getAccounts()` when not in dev preview
- Identity cards: compact charcoal persona cards, desktop hover tilt, Discord/X/email metadata, real avatar when set
- Account avatars are reused by Projects assigned-account avatar groups, so account identity is consistent across `/accounts` and `/projects`

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

### Standalone Deadlines - CRUD wired

- Migration `0008_add_deadlines.sql` is applied to the live database
- Migration `0009_task_lifecycle_dates.sql` converted the existing Task due date into a linked Deadline and removed `tasks.due_date`
- `deadlines` has workspace-scoped RLS, two indexes, and optional Project/Task foreign keys
- Server actions support create, update, delete, full-page reads, and Dashboard aggregation
- Deadline validation covers required title/date, optional 24-hour time, URL, status, and workspace-owned links
- Linking a Task infers its Project when needed and rejects mismatched Project/Task pairs
- `/deadlines` shows Upcoming, Done, and Cancelled records that may be standalone, Project-linked, or Task-linked
- All Deadline rows open the same edit modal; linked Task and Project context remains visible
- Dashboard Upcoming deadlines shows up to eight nearest records on desktop and five on mobile, with a compact Add action and View more state
- Overdue is computed using the Asia/Jakarta calendar date and is not stored as mutable status
- Create/edit UI reuses shared `AppSelect` and `AppDatePicker` surfaces
- Delete uses an inline two-step confirmation inside the modal rather than a browser-native prompt

### Dashboard Preview

- Greeting, WIB date, motivation line, Quick Capture, notes/inbox/pulse-style desk content, static counts
- Quick Capture visual only
- Notes, Inbox, activity, and most pulse counts remain static preview data
- Upcoming deadlines now reads persisted Deadline records regardless of whether they link to a Project or Task
- The Due metric uses the complete upcoming Deadline count and Open navigates to `/deadlines`

### Tasks - CRUD wired

- Route reads workspace-scoped Tasks, active Projects, assigned Project Accounts, and assigned Project Wallets from the database
- Quick Add remains inline and follows PRD defaults: Todo, Once, Medium, today's Asia/Jakarta Start date, and no task_accounts rows so all Project Accounts are inherited
- Add Task opens a centered detailed modal matching Add Project, with a logo-aware Project selector, lifecycle properties, Account and Wallet assignment, optional linked Deadline, URL, and description
- Detail drawer supports edit/save for title, Project, status, frequency, priority, Start date, Account assignments, optional Project Wallet, URL, and description
- Delete uses an inline two-step confirmation; Tasks with existing logs return a safe Dropped-state instruction instead of breaking foreign keys
- Statuses now match the permanent PRD enum exactly: Todo, In progress, Running, Recheck, Done, and Dropped
- List, Board, Running, and Recheck read the same persisted state; Board supports By Project and By Status
- Search plus Project, Account, status, frequency, and priority filters are functional
- Row/card More menu supports Edit and Mark done; Recheck Review opens the same edit drawer
- Account assignments use stored avatars with initials fallback. Empty explicit assignment consistently resolves through project_accounts
- Marking a Task Done records `completed_at`; reopening clears it, and the UI derives human completion duration from Start date
- Personal Item creation remains visibly marked Preview and local-only because persistence belongs to Phase 1.5
- Task logs are not implemented in this batch

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
| `tasks-preview.tsx` | ~316 lines | CRUD wired; Personal Item remains preview |
| `accounts-preview.tsx` | ~1600+ lines | CRUD wired (identities, wallets, groups) |
| `projects-preview.tsx` | ~1935 lines | CRUD wired + logo upload + paste + assigned-account avatar group |
| `archive-preview.tsx` | ~278 lines | CRUD wired (restore, delete) |
| `daily-preview.tsx` | ~300+ lines | Static preview |

Unit tests: 9 files, 44 tests total, including shared HTTP URL normalization, Deadline validation, Task filtering/fallback, Quick Add, detailed Add Task with linked Deadline, completion duration, edit drawer, nested dropdown dismissal, advanced filters, and Recheck Review coverage.

E2E diagnostics now include focused Accounts/Projects coverage and a full application smoke suite. The latest full smoke run after RLS activation completed 37 checks successfully, found 1 known product gap (Wallet Group rename is not reachable from the UI), and captured no console errors.

## Latest Change Batch

The 2026-07-28 Phase 1 Core batch includes:

- Auth and default-workspace hardening
- Database migrations `0002` through `0007`
- Live migration `0008_add_deadlines.sql` with workspace RLS
- Live RLS activation and Storage ownership policy fixes
- Projects, Accounts, Wallets, Wallet Groups, and Archive CRUD wiring
- Project logo and Account avatar Storage flows
- Projects assigned-account avatar group, including real account avatars, initials fallback, hover motion, and `+N` overflow popover for all assigned accounts
- Project detail edit dropdown consistency pass for Hunt type, Status, Stage, and Priority
- Shared dropdown consistency pass for Projects filters, Projects pagination, Accounts wallet create/edit fields, and Tasks filter/Add Task fields
- Shared date picker consistency pass for Projects filters, Projects create/edit dates, and Tasks Add Task date
- Standalone Deadline CRUD with optional Project and Task relations
- Dashboard aggregation of standalone, Project-linked, and Task-linked Deadlines
- New `/deadlines` route with Upcoming, Done, and Cancelled views
- Deadline modal consistency pass using shared dropdown and date picker foundations
- Nested dropdown Escape behavior covered so closing a dropdown does not close the parent modal
- Workspace-scoped Tasks CRUD, inline quick add, edit/delete drawer, Account fallback, optional Project Wallet, status actions, and functional filters
- Tasks UI refactor from inline mock data to server-loaded typed records while retaining the accepted compact list/board design
- Shared HTTP URL normalization and validation for Project URL, Task URL, Deadline URL, and Account Avatar Image URL, including bare-domain input such as test.com
- Live migration `0009_task_lifecycle_dates.sql`: Task Start date and completion timestamp, legacy due-date conversion to linked Deadline, and removal of `tasks.due_date`
- Dual Task creation flow with retained Quick Add and a detailed Add Task modal matching Add Project
- Optional linked Deadline creation inside the detailed Add Task transaction
- Dashboard Deadline capacity increased to eight desktop items and five mobile items
- Project query unit coverage and CRUD smoke diagnostics
- Focused account avatar group regression coverage
- Updated implementation and validation status

Local `tmp-*-report.txt` diagnostic outputs are ignored and are not part of the source release.

## What Is Not Implemented Yet

The next approved product direction to plan is a dedicated NFTs workspace nested under Projects. It should not reuse the full Project create model because NFT records need a smaller chain-oriented field set. Navigation, fields, data model, and migration are not implemented yet and require a separate approved plan.

### Phase 1 Core remaining (ordered by priority)

1. **Task logs** — with Asia/Jakarta `logged_date`
2. **Daily generation** — from real tasks / assignments / logs (replaces static preview)
3. **Inbox CRUD** — server actions + UI wiring + conversion flow to tasks/notes
4. **Docs CRUD** — server actions + markdown editor + project links + folders
5. **Activity logs** — auto-generated from mutations
6. **Wallet Group edit UI** — `updateWalletGroup` action exists but not wired to UI
7. **Project wallet assignment** — wallets still pending in project create/edit

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

- Some preview-only pages (inbox, docs, daily) still have visual-only action buttons
- Shared dropdown/date picker foundation is now consistent across the audited feature surfaces, but More menus, browser confirm/prompt flows, and disabled preview-only controls still need a later UX activation pass
- Search/filters inconsistent because data is static on non-wired pages
- Settings shallow vs future PRD role
- Trading inactive in sidebar
- Large preview files make the repo harder to read than the route list suggests, especially `projects-preview.tsx` after adding the assigned-account avatar group

## CRUD Implementation Order (PRD v3.1)

```
DONE     1. Projects: create, update, delete, archive, logo upload wired
DONE     2. Accounts: create, update, delete wired
DONE     3. Wallets: create, update, delete wired
PARTIAL  3b. Wallet Groups: create and delete wired; update action exists but UI pending
DONE     4. Archive: restore and permanent delete wired
DONE     5. Standalone Deadlines: CRUD, Dashboard aggregation, RLS wired
DONE     6. Tasks: CRUD, assignments, due dates, views, filters, actions wired
NEXT     7. Task logs / Daily generation
PENDING  8. Inbox
PENDING  9. Docs
PENDING  10. Activity logs
```

## Validation Status

Checked 2026-07-29 after Task lifecycle, detailed Add Task, linked Deadline, and Dashboard capacity changes:

```txt
pnpm typecheck  # pass
pnpm lint       # pass, 0 warnings
pnpm test       # pass, 9 files and 44 tests
pnpm build      # pass
```

Live database metadata verification:

```txt
Application tables found             16
Tables with RLS enabled              16
Application policies                18
user_workspace_ids SECURITY DEFINER true
user_workspace_ids search_path      public
Owner-visible workspaces             1
Unrelated-user-visible workspaces    0
Avatar upload ownership policy       present
Project logo ownership policy        present
Deadline workspace policy            present
```

Focused Deadline regression:

```txt
Standalone deadline validation accepts valid title/date/time
Invalid 24-hour time and invalid URL are rejected
Asia/Jakarta date calculation is deterministic
Today, Tomorrow, In N days, and Overdue labels are covered
Deadline sorting covers dates with and without explicit time
Project and related Task selections are submitted together
Escape closes a nested dropdown before closing the Deadline modal
Live migration 0008 reports RLS enabled with one Deadline policy
Live migration 0009 converted 1 Task due date into 1 linked Deadline; all 3 Tasks received Start dates
Database insert, status update, and delete smoke passed inside a rolled-back transaction
Production build includes /deadlines
```

Focused Tasks CRUD regression:

```txt
Quick Add creates Todo / Once / Medium tasks with Project Account fallback
Detailed Add Task creates full Task properties and an optional linked Deadline in one transaction
Task edit persists Project, status, frequency, priority, Start date, accounts, wallet, URL, and description
Done transitions record completion time and render same-day, day, week, or month duration
Database Start date, linked Deadline, and completed timestamp smoke passed inside a rolled-back transaction
Bare URLs such as test.com normalize to https://test.com before validation and Task persistence
Task delete removes assignment joins first and protects Tasks that already have logs
Account filter uses effective Project Accounts when task_accounts is empty
Status, frequency, priority, Project, Account, and search filters compose correctly
Recheck Review opens the edit drawer; More menu supports Edit and Mark done
Desktop 1440px and mobile 390px rendered with no horizontal overflow
Action popover stays inside the mobile viewport; drawer fills the mobile viewport
0 browser console or page errors across checked Tasks states
Database create, assignment, update, and delete smoke passed inside a rolled-back transaction
Production build includes /tasks
```

Latest full smoke run after migration `0007`:

```txt
37 checks passed
1 known product gap: Wallet Group rename/edit option is missing in the UI
0 console errors
Project logo upload and persistence passed
Account avatar upload, persistence, and fetchability passed
```

Latest focused UI regression after assigned-account avatar group and dropdown consistency work:

```txt
Account avatars appear in Project rows/cards when avatar_url exists
Initial-letter fallback remains for accounts without an avatar
+N overflow opens a popover listing every assigned account
Popover stays open while its own list scrolls
Escape closes the popover and returns focus to the +N button
Outside pointerdown closes the popover
Project detail edit dropdowns no longer use browser-native select menus
Projects filter/sort/page-size dropdowns no longer use browser-native select menus
Accounts wallet create/edit dropdowns no longer use browser-native select menus
Tasks filter/Add Task dropdowns no longer use browser-native select menus
Projects and Tasks date fields no longer use browser-native date inputs
Shared AppDatePicker covers date entry with the same dark surface language as AppSelect
```

## Current Routes

```txt
/
/inbox
/docs
/daily
/deadlines
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
