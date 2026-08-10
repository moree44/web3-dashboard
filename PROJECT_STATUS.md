# Project Status - Web3 Hunting OS

Last updated: 2026-08-10

## Current Position

Web3 Hunting OS is in **Phase 1 Core, CRUD wired + Track D React Query**.

The app has a working Next.js 15 desktop preview shell with routed UI for Dashboard, Deadlines, Inbox, Docs, Projects, Watchlist, NFTs, Daily, Tasks, Accounts, Archive, Settings, Login, and Signup. Visual direction is locked around a premium dark compact productivity OS, following `DESIGN.md` and the accepted `/projects` baseline.

**Data foundation is in place:** Drizzle ORM schema (21 tables), 16 migration files, workspace helpers, auto-workspace creation on signup, Supabase Auth adapter, and Supabase Storage buckets for project logos and account avatars. Migrations through 0015_add_personal_items.sql have been applied to the live database. Migration 0016_add_project_watchlist.sql is implemented locally but still needs to be applied before persisted Watchlist testing or deployment. The current live 20-table schema has RLS enabled on every application table; migration 0016 defines workspace RLS for the new table. **CRUD server actions now exist for Projects, Project Watchlist, NFTs, Accounts, Wallets, Wallet Groups, Archive, Deadlines, Tasks, Inbox, and Docs. Daily execution actions are also persisted, with create, update, and delete flows wired where noted below.** **Project logo upload is complete** with file upload and clipboard paste (Ctrl+V) in both Add and Edit forms. **Account avatar upload/URL is complete** with the same storage pattern, and Projects, NFTs, and Tasks render assigned account avatars from those stored account records.

**Remaining gap:** migration 0016 must be applied to Supabase before the dedicated Watchlist can persist data. Gmail remains Phase 2 because it requires OAuth and an email connector. Settings basic profile/workspace CRUD and Personal Items persistence are now live. Core Dashboard Quick Capture, overview metrics, and Hunting Pulse categories now read live workspace data. Project Wallet assignment is complete in Add/Edit Project, including existing Wallet selection and transactional custom-chain Wallet creation. UI foundation cleanup standardizes feature dropdowns and date pickers through shared components instead of browser-native menus. Active HTTP URL inputs share one normalization and validation path, so bare domains are accepted consistently and persisted with an HTTPS scheme.

## Active Source of Truth

Read these before major work:

1. PRD.MD — product behavior, scope, phasing, data model, implementation order (v3.4)
2. DESIGN.md — visual direction, layout, density, spacing, interaction tone (v2.16)
3. `PROJECT_STATUS.md` — implementation state only (this file)
4. `AGENTS.md` — contributor workflow guidance

PRD v3.4 supersedes v3.3 and older decisions.

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

## PRD v3.4 Alignment Notes

Current implementation should align with:

- Phase 1 Core ships first: Auth, Workspace, Inbox, Docs, Accounts, Wallets, Projects, NFTs, Tasks, Daily, Deadlines, Archive
- Phase 1.5 is fast-follow: Trading, Personal Items, Settings Integrations
- Dashboard formula: `Dashboard = Inbox + Docs + Pulse`
- Dashboard must not become a mini Daily or mini Projects page
- Dashboard Upcoming deadlines reads standalone, Project-linked, Task-linked, and NFT-linked Deadline records
- Task lifecycle timing uses `start_date` and `completed_at`; due dates belong only to Deadline records
- Running/Recheck belong on Daily and Projects only, not Dashboard
- Docs is the UI label for unified notes (guides, links, templates, SOP, project references)
- One unified `notes` system later; no separate `project_notes` table
- Project-linked docs/notes use `notes.linked_project_id`
- Archive is project-scoped only
- Trading is a separate top-level Phase 1.5 area, not a project category
- NFTs is a separate Phase 1 Core entity nested under Projects, not a Project Hunt Type
- Personal Items are Phase 1.5
- Project status and task status stay distinct from frequency and stage/result

## What Is Implemented Now

### App Shell and Navigation

- Open desktop-style shell: fixed sidebar + independently scrollable main workspace
- Sidebar routes: Dashboard, Inbox, Docs, Projects, Watchlist, NFTs, Daily, Deadlines, Tasks, Accounts, Archive, Settings, inactive Trading
- Projects parent links to `/projects`; Watchlist, NFTs, Daily, Deadlines, and Tasks are nested below
- Mobile nav exists but is secondary

### Data Foundation

- **Drizzle ORM** installed and configured (`drizzle-orm`, `drizzle-kit`, `pg`)
- **Schema** (src/lib/db/schema.ts): 21 tables matching the current Core plus Personal Items and Project Watchlist scope
  - `workspaces`, `workspace_members`
  - `accounts`, `wallet_groups`, `wallets`
  - `projects`, `project_accounts`, `project_wallets`, `project_watchlist_items`
  - `nft_campaigns`, `nft_campaign_accounts`, `nft_campaign_wallets`
  - `tasks`, `task_accounts`, `task_wallets`, `task_logs`
  - `deadlines`
  - `inbox_items`, `notes`, `activity_logs`
- **RLS hardening** (`src/lib/db/migrations/0007_enable_rls_and_fix_storage_policies.sql`):
  - Supersedes `0001_rls_policies.sql`, which was not successfully applied and contained a recursive `workspace_members` policy
  - Enables RLS on the original 15 application tables; migration `0008` secures `deadlines`; migrations `0010` and `0011` secure all three NFT tables
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

Server actions follow the same workspace-scoped pattern across implemented CRUD surfaces:

| Surface | File | Queries | Mutations |
| --- | --- | --- | --- |
| Auth | `src/features/auth/actions.ts` | — | signup, login |
| Projects | `src/features/projects/actions.ts` | `getProjects`, `getArchivedProjects`, `getProjectAccountOptions`, `getProjectWalletOptions` | `createProject`, `updateProject`, `archiveProject`, `restoreProject`, `deleteProject`, `uploadProjectLogo` |
| Project Watchlist | `src/features/watchlist/actions.ts` | `getWatchlistItems`, `getWatchlistPageData` | `createWatchlistItem`, `updateWatchlistItem`, `deleteWatchlistItem`, `convertWatchlistToProject` |
| NFTs | `src/features/nfts/actions.ts` | `getNftPageData`, `getNftCampaignCount` | `createNftCampaign`, `updateNftCampaign`, `deleteNftCampaign` |
| Accounts | `src/features/accounts/actions.ts` | `getAccounts` (with stats), `getWallets`, `getWalletGroups` | `createAccount`, `updateAccount`, `deleteAccount`, `uploadAccountAvatar`, `setAccountAvatarUrl`, `createWallet`, `updateWallet`, `deleteWallet`, `createWalletGroup`, `updateWalletGroup`, `deleteWalletGroup` |
| Tasks | `src/features/tasks/actions.ts` | `getTaskWorkspaceData` | `createTask`, `updateTask`, `updateTaskStatus`, `deleteTask` |
| Inbox | `src/features/inbox/actions.ts` | `getInboxPageData` | `createInboxItem`, `updateInboxItem`, `setInboxStatus`, link and conversion actions |
| Docs | `src/features/docs/actions.ts` | `getDocsPageData` | `createDocsNote`, `updateDocsNote`, `deleteDocsNote` |
| Activity | `src/features/activity/actions.ts` | `getRecentActivity` | `recordActivity` mutation event writes |
| Dashboard | `src/features/dashboard/actions.ts` | `getDashboardData` | - |

All mutations call `revalidatePath()` to refresh Next.js cache.

### Projects - CRUD wired + logo upload

- Server actions fully wired to UI:
  - **Create**: Add Project modal → `createProject` → local state insert, with logo file upload to Supabase Storage
  - **Update**: Inline edit in ProjectDetailPanel (Name, Hunt type, Status, Priority, Stage, Progress, Date, multiple Work Types, multiple Project Types, and assigned Accounts) with Edit/Save/Cancel toggle. Logo can be uploaded or pasted (Ctrl+V) in edit mode and uploads immediately.
  - **Delete**: Dropdown on ProjectRow (table), ProjectCard (mobile), and ProjectDetailPanel header → `deleteProject` → local state remove
- **Archive**: ProjectRow/ProjectCard/ProjectDetailPanel → `archiveProject` → local state remove
- **Logo upload**: Supabase Storage bucket `project-logos` with RLS policies, file picker, and clipboard paste (Ctrl+V) in both Add Project dialog and Edit mode of ProjectDetailPanel
- Page route (`/projects`) fetches real Projects, Account options, and Wallet options when not in dev preview
- Project create and edit persist Account assignments through `project_accounts` and Wallet assignments through `project_wallets`
- Add/Edit Project can select eligible existing Wallets or create a custom-chain Project Wallet inline with required label, address, and Chain
- New inline Wallets receive `wallet_type = project_wallet`; owner is optional, but an owner must be one of the selected Project Accounts
- Project and new Wallet creation share one database transaction, preventing orphan Wallets on failed Project creation
- Deselecting an Account removes Wallets owned by that Account; Shared Wallets remain eligible
- Deleting a Project unlinks `project_wallets` but never deletes reusable Wallet records
- Partial Project updates use an explicit update schema, so logo upload no longer risks injecting create defaults into unrelated fields
- Project reads include assigned account labels and avatar metadata; rows without an assignment show `Unassigned` instead of a blank cell
- Project table and mobile cards render assigned accounts as compact avatar groups, using account avatars when present and initials as fallback
- Avatar groups show up to 4 visible accounts, then a clickable `+N` overflow button that opens a popover listing every assigned account
- Avatar group overflow supports outside-click dismissal, Escape-to-close with focus return, viewport-aware placement, and internal scrolling without closing
- Project detail edit properties use the same custom dropdown surface as Add Project, avoiding browser-native select menus in the drawer
- Shared `AppSelect` now covers Projects filters/sort/page-size and Accounts wallet create/edit dropdowns, removing browser-native option menus from feature UI
- Shared `AppDatePicker` now covers Projects date filters, Add Project date, Project detail edit Date start, and the Task edit drawer Due date
- The Add Project date picker persists `date_start`; Work Type and Project Type support multiple values during create and edit
- The former stage/status-derived Watchlist filter and `/projects?view=watchlist` route state have been removed
- Preview fixtures are used only when the Supabase environment is not configured
- `projects-preview.tsx` (~1935 lines): table, cards, detail panel, add dialog, inline edit, logo upload with paste, assigned-account avatar group

### Project Watchlist - dedicated discovery workspace

- Dedicated route at `/watchlist`, separate from Projects and separate from Trading Token Watchlist
- Quick add accepts an X profile URL and derives an editable project name from the handle
- Optional thesis, Chain, preset or custom multi Project Type, search, and Active/Converted views
- Uses one generic Project icon and does not request a logo
- Desktop table and compact mobile cards share the same persisted data
- Active items support edit and two-step delete; converted items remain read-only history
- `Start Project` transaction carries name, X URL, thesis, Chain, and Project Type into a new Project without re-entry
- Conversion retains the Watchlist item with `converted_project_id`, is idempotent after completion, and does not create a project logo
- React Query cache updates create/edit/delete/conversion results without a full page reload
- Dashboard Quick Capture writes the Watchlist intent directly to this entity
- Migration `0016_add_project_watchlist.sql` adds `projects.chains`, the Watchlist table, indexes, constraints, grants, and workspace RLS; it is not yet applied live

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

### Wallet Groups - CRUD wired

- **Create**: wired via Add Group inline
- **Update**: More menu opens an Edit dialog for name and description, then calls `updateWalletGroup` and refreshes local state
- **Delete**: Dropdown on each group card's MoreHorizontal button -> `deleteWalletGroup` -> local state remove
- Page route fetches real groups via `getWalletGroups()` when not in dev preview
- Focused Wallet Group and Dashboard activity smoke covers rename, reload persistence, cleanup, and the new activity event

### NFTs — dedicated CRUD workspace

- Migrations `0010_add_nft_campaigns.sql` and `0011_add_nft_campaign_wallet_tracking.sql` are applied to the live database
- `nft_campaigns`, `nft_campaign_accounts`, and `nft_campaign_wallets` use workspace-scoped RLS; catalog verification reports RLS enabled with one policy on each table
- Projects no longer accepts `nft` as a Hunt Type; the live database has zero legacy NFT Project rows
- `/nfts` provides All, Watching, Whitelist, Upcoming, Minted, and Missed views, plus search and Chain filtering
- Add/Edit NFT uses the shared modal, AppSelect, AppDatePicker, URL normalization, Account and Wallet selection, per-Wallet result status, and two-step delete confirmation patterns
- Fields stay intentionally light: Collection name, Chain, lifecycle Status, Accounts, Wallet participation, optional Mint schedule, Mint URL, and Notes
- Assigned Accounts reuse stored avatars, initials fallback, hover motion, and the interactive `+N` overflow popover
- Account-owned Wallets are filtered by exact or EVM-family Chain compatibility; ownerless Wallets remain available as Shared wallets
- A sole compatible Account Wallet is preselected visibly, while Accounts without a selected Wallet remain tracked as `need wallet`
- Wallet outcomes are tracked independently as Planned, Submitted, Whitelisted, Not whitelisted, Minted, or Skipped
- NFT list Participation shows Account avatars with a compact Whitelisted/Wallet total, including partial results such as `2/3 WL`
- Mint dates are stored as linked Deadline records rather than duplicated on NFT rows
- Creating, updating, or clearing an NFT mint date creates, synchronizes, or removes its linked Deadline
- Minted marks the linked Deadline Done; Missed marks it Cancelled
- Projects displays a separate `NFTs count →` navigation shortcut instead of an NFT filter chip
- Dashboard Hunting Pulse reads the live NFT count and its NFT pill navigates to `/nfts`

### Standalone Deadlines - CRUD wired

- Migration `0008_add_deadlines.sql` is applied to the live database
- Migration `0009_task_lifecycle_dates.sql` converted the existing Task due date into a linked Deadline and removed `tasks.due_date`
- `deadlines` has workspace-scoped RLS and optional Project, Task, and NFT Campaign foreign keys
- Server actions support create, update, delete, full-page reads, and Dashboard aggregation
- Deadline validation covers required title/date, optional 24-hour time, URL, status, and workspace-owned links
- Linking a Task infers its Project when needed and rejects mismatched Project/Task pairs
- `/deadlines` shows Upcoming, Done, and Cancelled records that may be standalone, Project-linked, Task-linked, or NFT-linked
- All Deadline rows open the same edit modal; linked Task and Project context remains visible
- Dashboard Upcoming deadlines shows up to eight nearest records on desktop and five on mobile, with a compact Add action and View more state
- Overdue is computed using the Asia/Jakarta calendar date and is not stored as mutable status
- Create/edit UI reuses shared `AppSelect` and `AppDatePicker` surfaces
- Delete uses an inline two-step confirmation inside the modal rather than a browser-native prompt

### Dashboard Preview

- Greeting, WIB date, motivation line, and the accepted compact desk layout remain intact
- Notes desk reads pinned and recent persisted Docs records outside development preview
- Inbox to process reads new and reviewing persisted Inbox records outside development preview
- Recent activity reads persisted Activity Log records with workspace scoping and relative timestamps
- Quick Capture sends the Watchlist intent directly to Project Watchlist; Project, Note, and Inbox intents remain raw Inbox captures for triage
- Upcoming deadlines now reads persisted Deadline records regardless of whether they link to a Project, Task, or NFT Campaign
- The Due metric uses the complete upcoming Deadline count and Open navigates to `/deadlines`

### Activity Logs - persisted mutation feed

- `recordActivity()` writes workspace-scoped mutation events without blocking the originating CRUD action if logging fails
- Accounts, Wallets, Wallet Groups, Projects, Tasks, Daily Task Logs, Inbox, Docs, Deadlines, and NFT Campaign mutations emit activity events
- `getRecentActivity()` and `getDashboardData()` provide workspace-scoped recent activity for the Dashboard
- Live migration `0014_activity_logs_set_null_targets.sql` changes target foreign keys to `ON DELETE SET NULL`, preserving history when a referenced CRUD record is deleted

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
- Personal Item creation, completion toggle, and delete now persist through the workspace-scoped Personal Items table
- Task Logs are persisted through the Daily execution surface; Activity Logs remain separate
- **TanStack Query + optimistic UI pilot (2026-08-04):** Tasks and Personal Items now run through React Query instead of blocking `await serverAction() → setState`. Status change, edit save, delete, and Personal Item mutations apply optimistically (UI updates instantly, server syncs in background, rollback on error). Task creation stays commit-waiting ("Creating..." until the server returns) so the direct-SQL e2e smoke never races the insert. Cache is keyed `["tasks"]`; preview mode never refetches, real mode refetches on mount (`staleTime 0`) to reconcile with fresh RSC initialData.

### Daily — persisted execution

- Reads workspace-scoped Tasks and effective Account assignments outside development preview
- Generates Once, Daily, Weekly, and Monthly checklist rows for the selected Asia/Jakarta date
- Keeps Running and Recheck tasks visible as monitoring rows
- Persists Done, Skip, Pending reset, transaction hash, proof URL, and notes through `task_logs`
- Date navigation, account/project grouping, search, and Hide done filters are functional
- Personal Items are persisted with create, done/pending, delete, and Daily recurrence visibility

### Inbox — manual-first CRUD

- `/inbox` reads workspace-scoped `inbox_items` with linked Project, Task, and Docs labels
- Capture and edit persist title, content, URL, sender, detected project, and priority
- Search, status filter, priority filter, detail editing, Review, Ignore, and Archive are functional
- Explicit confirmation converts an item into a Project, Task, or Docs note
- Existing Projects and Tasks can be linked without automatic conversion
- Conversion actions update the Inbox relationship and status atomically with the new target record
- Capture is disabled while a mutation is pending to prevent async state overwrite
- Manual and quick capture remain the only Phase 1 sources; Gmail stays Phase 2

### Docs — persisted unified notes

- Workspace-scoped note CRUD with Markdown textarea, folders, pinning, project links, search, and delete confirmation
- Safe-secret validation rejects seed phrases, private keys, recovery phrases, and 2FA backup codes
- Notes can be created directly or from an Inbox item

### Archive — CRUD wired

- **Restore**: Select checkboxes → Restore selected button → `restoreProject` → local state remove
- **Permanent delete**: Per-row trash button → `deleteProject` → local state remove
- Page route (`/archive`) fetches real archived projects via `getArchivedProjects()` when not in dev preview
- Reason-filter tabs (Claimed, Dropped, Scam Risk, Expired, Not Worth, Duplicate, Completed, Other) with counts
- Mobile card layout with restore/delete parity
- Server actions revalidate `/projects`, `/archive`, `/daily`, and `/tasks` on every mutation

### Settings CRUD

- Profile display name and workspace name can be edited and persisted
- Username, login method, timezone, workspace counts, and security boundaries remain read-only by design
- Settings Integrations remain Phase 1.5

## Maintainability Snapshot

Folder architecture is sound (`app` / `features` / `components` / `lib`), but several feature previews are hard to read because UI + mock data + local state live in one large client file:

| Area | Rough size | CRUD Status |
| --- | --- | --- |
| `tasks-preview.tsx` | ~330 lines | CRUD wired; Personal Item CRUD is persisted; React Query + optimistic mutations (`tasks-query.ts` holds the hooks) |
| `accounts-preview.tsx` | ~1600+ lines | CRUD wired (identities, wallets, groups); React Query + optimistic mutations (`accounts-query.ts` holds the hooks) |
| `projects-preview.tsx` | ~2100+ lines | CRUD wired + logo upload + Account/Wallet assignment + custom-chain Wallet creation; React Query + optimistic mutations (`projects-query.ts` holds the hooks) |
| `nfts-preview.tsx` | ~200 lines | CRUD wired; React Query cache (`nfts-query.ts`); dialog still owns create/update/delete server calls |
| `deadlines-preview.tsx` | ~230 lines | CRUD wired; React Query cache (`deadlines-query.ts`); dialog still owns create/update/delete server calls |
| `docs-workspace.tsx` | ~100 lines | Docs CRUD wired; React Query + commit-waiting save/delete (`docs-query.ts`) |
| `inbox-workspace.tsx` | ~200 lines | Inbox CRUD wired; React Query + optimistic status + process refresh (`inbox-query.ts`) |
| `archive-preview.tsx` | ~350 lines | CRUD wired (restore, delete); React Query + commit-waiting mutations (`archive-query.ts`); inline two-step delete |
| `daily-workspace.tsx` | ~350 lines | Task Log + Daily execution; React Query date-scoped cache (`daily-workspace-query.ts`) with optimistic Done/Skip and personal toggle; Motion `layout` on checklist rows |

Unit tests: 18 files, 78 tests total, including shared HTTP URL normalization, Project and NFT partial-update safety, Project Wallet assignment validation, custom-chain Wallet creation input, Daily Once/Daily/Weekly/Monthly scheduling, NFT Wallet Chain compatibility, Deadline validation, Task filtering/fallback, Quick Add, detailed Add Task with linked Deadline, completion duration, edit drawer, nested dropdown dismissal, advanced filters, Recheck Review coverage, Daily per-account generation coverage, and new Projects/Accounts preview React Query coverage (`projects-preview.test.tsx`, `accounts-preview.test.tsx`).

E2E diagnostics now include focused Accounts/Projects, Project Wallet assignment, NFT Wallet participation, Docs/Daily, Inbox, and a full application smoke suite. The latest focused Project Wallet browser smoke passed login, custom-chain Wallet creation, reload persistence, Project unlink behavior, Wallet survival, cleanup, and captured no console or page errors.

## Latest Change Batch

The 2026-08-01 Phase 1 Core batch includes:

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
- Dashboard aggregation of standalone, Project-linked, Task-linked, and NFT-linked Deadlines
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
- Dedicated `/nfts` CRUD workspace with Account assignment, lifecycle status, Chain filtering, and compact list/mobile layouts
- Live migration `0010_add_nft_campaigns.sql` with NFT tables, RLS, Project Hunt Type constraint, and linked NFT Deadline relation
- Live migration `0011_add_nft_campaign_wallet_tracking.sql` with per-Wallet outcome status and workspace-scoped RLS
- NFT Account and Wallet participation flow with Chain compatibility, Shared wallets, partial whitelist outcomes, and `need wallet` visibility
- Automatic NFT mint Deadline create/update/remove lifecycle
- NFT navigation under Projects, separate Projects-page shortcut, and live Dashboard Hunting Pulse count
- Project Hunt Types reduced to Free Hunts, Retro, and Waitlist
- Project Wallet selection and inline custom-chain Wallet creation in Add/Edit Project
- Transactional Project and Project Wallet creation with workspace and owner validation
- Safe Project deletion that unlinks but preserves Wallet records
- Explicit partial Project update schema that protects unrelated fields during logo upload
- Live migration `0012_task_logs_daily_indexes.sql` with the PRD-required daily unique constraint and Task Log query indexes
- Tested Daily scheduling foundation for Once, Daily, Weekly, Monthly, Running, and Recheck behavior
- Workspace-scoped Task Log read and upsert actions with WIB dates, relation validation, and daily unique-conflict handling
- Real Daily execution surface with Account fallback, per-account Once completion, date navigation, Done, Skip, Pending reset, proof/transaction/note logging, filtering, and separate Running/Recheck
- Live migration `0013_add_note_folders.sql` with verified nullable `notes.folder` column and folder index
- Live migration `0014_activity_logs_set_null_targets.sql` with `ON DELETE SET NULL` Activity Log target FKs verified live
- Wallet Group rename/description edit dialog wired to the existing update action with reload persistence
- Workspace-scoped Activity Log mutation events wired across Core CRUD, Daily Task Logs, Inbox, Docs, Deadlines, and NFT Campaigns
- Dashboard Inbox, Notes desk, Recent activity, overview metrics, Hunting Pulse categories, and Quick Capture are activated from live workspace data
- Settings profile and workspace name editing with owner validation and persisted Supabase display metadata
- Live migration `0015_add_personal_items.sql` with workspace RLS, Personal Items CRUD, and Daily recurrence visibility
- Workspace-scoped Docs CRUD with Markdown textarea, folder, pin, project link, search, safe-secret validation, and delete confirmation
- Manual-first Inbox capture, edit, filters, explicit Project/Task/Docs conversion, link actions, and reload persistence smoke coverage
- Shared AppSelect viewport-aware positioning so Inbox and other feature menus stay inside the visible browser surface
- PRD v3.4 and DESIGN v2.16 alignment
- Targeted Wallet Group/Dashboard, Docs/Daily, and Inbox Playwright smoke coverage
- Updated implementation and validation status

The 2026-08-10 dedicated Project Watchlist batch includes:

- New `project_watchlist_items` schema and migration with workspace RLS, active X URL uniqueness, conversion history, and a nullable converted Project link
- Dedicated `/watchlist` list-first workspace with quick X capture, editable details, Active/Converted views, responsive rows/cards, and no logo input
- Atomic `Start Project` conversion that carries discovery fields into a Project and preserves the Watchlist record
- Project `chains[]` support so Chain remains distinct from Project Type after conversion
- Dashboard Watchlist Quick Capture now calls the Watchlist action directly; other capture intents still go to Inbox
- Removed the former Projects Watchlist tab, status/stage classifier, `view=watchlist` parsing, and related unit tests
- Updated sidebar and E2E route expectations to `/watchlist`
- Migration `0016_add_project_watchlist.sql` remains pending on the live Supabase database

The 2026-08-04 TanStack Query pilot batch includes:

- `@tanstack/react-query` v5 installed; root layout wrapped with a client `QueryProvider` (defaults: staleTime 5 min, no refetch-on-window-focus, retry 1)
- New `src/features/tasks/tasks-query.ts` with query keys, pure optimistic record builders (`optimisticTask`, `applyTaskEdit`, `optimisticPersonalItem`), `useTaskWorkspace`, and `useTasksMutations` (create/save/status/delete + Personal Item add/toggle/remove)
- Tasks and Personal Items refactored from blocking `await serverAction() → setState` to optimistic React Query mutations with cancel-and-snapshot `onMutate`, rollback `onError`, and merge `onSuccess`; create stays commit-waiting for e2e direct-SQL safety
- Preview mode (`developmentPreview`) uses locally-built records with `staleTime: Infinity` and no invalidation; real mode refetches on mount to reconcile with RSC `initialData`
- `tasks-preview.tsx` no longer holds task/personal-item state; busy states aggregate mutation `isPending`
- Unit tests updated with a `QueryClientProvider` render wrapper and preview-mode action mocks; full verification passed (typecheck, lint 0 warnings, 71 unit tests, production build, and both e2e specs)

The 2026-08-06 Projects/Accounts React Query + motion + delete batch includes:

- **Projects React Query** (`src/features/projects/projects-query.ts`, `preview-data.ts`): `getProjectsWorkspaceData` action combines projects, account options, wallet options, and NFT count; page and preview now run entirely through the query cache. Create stays commit-waiting ("Creating..."); edit/archive/delete are optimistic with rollback; logo upload is not optimistic (needs the server publicUrl) and merges on success.
- **Accounts React Query** (`src/features/accounts/accounts-query.ts`, `preview-data.ts`): `getAccountsWorkspaceData` combines accounts, wallets, and wallet groups; accounts/wallets/groups all follow the same create-commit-waiting / update-optimistic / delete-optimistic split, with avatar upload/URL merging on success.
- **CSS-only motion infrastructure** (`src/lib/use-presence.ts` + `globals.css`): exit keyframes (modal/drawer backdrop + card/panel), dropdown `popup-in` entrance on `AppSelect`/`AppDatePicker` and the Projects hand-rolled dropdowns, and `row-enter-in` row entrance on Projects/Accounts lists. All sit under the existing reduced-motion kill switch. Drawers/modals/dialogs across Projects, Accounts, Tasks, NFTs, Deadlines, and Docs now animate out via the presence hook (Docs editor gained its missing entrance classes).
- **Standardized inline two-step delete** (`src/components/ui/confirm-delete.tsx`): replaced the remaining native `confirm()` calls in Projects (project delete) and Accounts (account/wallet/group deletes) with an armed "Confirm delete" button that auto-disarms; e2e specs updated to the second click.
- **Recheck specs brought up to date** (`manual-recheck.spec.ts`, `prod-menu-recheck.spec.ts`): capture-strip intent toggles, tasks drawer identity-button click target, functional Projects filters / Accounts Add modal, empty-preview Inbox state, and removed the vanished Docs Quick add assertion; `actionTimeout` prevents stale-selector hangs.

Local `tmp-*-report.txt` diagnostic outputs are ignored and are not part of the source release.

## What Is Not Implemented Yet

### Phase 1 Core remaining

| Priority | Area | Current state | Work still required |
| --- | --- | --- | --- |
| 1 | Task Logs | **Wired**: workspace-scoped reads and unique daily upserts validate Task, Project, Account, and Wallet relations | Daily execution remains separate from the mutation Activity Log feed |
| 2 | Daily | **Wired**: real Tasks, effective Account assignments, Task Logs, date navigation, execution actions, filters, and persisted Personal Items | Advanced Personal Item editing can expand later if needed |
| 3 | Inbox | **Wired**: workspace-scoped capture/edit/status actions, search/filter UI, explicit Project/Task/Docs conversion, and link actions | Gmail remains Phase 2; Dashboard Inbox summary is now live for new and reviewing items |
| 4 | Docs | **Wired**: Note CRUD, Markdown textarea, folder, pinning, project links, and persisted search | Dashboard Notes desk is live; Note capture remains an Inbox triage item |
| 5 | Activity Logs | **Wired**: mutation events, recent activity query, and delete-safe target foreign keys | Add pagination and richer history views when the product scope requires them |
| 6 | Wallet Groups | **Wired**: create, rename/description edit, and delete UI | Add richer group management only if the product scope expands |
| 7 | Dashboard activation | **Wired**: Quick Capture, Inbox, Notes desk, Recent activity, Deadlines, overview metrics, and Hunting Pulse categories use workspace data | Keep Dashboard as a lightweight overview; add richer aggregation only when product scope requires it |
| 8 | Settings | **Wired**: profile display name and workspace name CRUD with workspace ownership validation | Integrations and deeper security controls remain Phase 1.5 |

### Task Logs and Daily implementation notes

Task Logs and Daily are now implemented on top of the completed foundation:

- `task_logs` already has workspace RLS and migration `0012_task_logs_daily_indexes.sql` is live
- `task_logs_unique_daily` enforces one Task + Account + WIB date record
- Once, Daily, Weekly, Monthly, Running, and Recheck schedule behavior is covered in `daily-schedule.ts`
- No Task Log rows existed when migration `0012` was applied
- `/daily` reads persisted workspace Tasks and Task Logs outside development preview; mutations use an optimistic local patch guarded per row to prevent duplicate submissions
- Personal Items remain separate from Task Logs, but now persist in `personal_items` and appear in the Daily workspace by recurrence

### Phase 1.5 (do not treat as current Core work)

- Trading page
- Trade Log + FIFO realized PnL
- Portfolio holdings and transfers
- Token watchlist
- Advanced Personal Item fields and richer history views
- Settings Integrations forms and storage

### Out of scope unless PRD/user explicitly approves

- Gmail / multi-email sync / Google OAuth
- AI classification or assistant features
- Live token price feed activation
- Auto wallet balance tracking
- X/Twitter monitoring
- Team invite UI / workspace switcher UI / billing

## Known UI Caveats

- Dashboard Inbox summary, Notes desk, and Recent activity read live data; full Inbox processing is live on `/inbox`
- Dashboard Quick Capture persists Watchlist URLs directly to Project Watchlist; other intents remain Inbox triage items, and overview/Hunting Pulse values use workspace-scoped aggregate queries
- Settings profile and workspace controls are live; Integrations remain Phase 1.5 and Gmail remains Phase 2
- Shared dropdown/date picker foundation is consistent across the audited feature surfaces, but some More menus and browser confirm/prompt flows still need a later UX consistency pass
- Search/filters remain inconsistent on preview-only areas
- Settings shallow vs future PRD role
- Trading inactive in sidebar
- Large preview files make the repo harder to read than the route list suggests, especially `projects-preview.tsx` after adding the assigned-account avatar group

## CRUD Implementation Order (PRD v3.4)

```
DONE     1. Projects: create, update, delete, archive, logo upload wired
DONE     1b. Project Wallets: existing assignment and custom-chain creation wired
DONE     2. Accounts: create, update, delete wired
DONE     3. Wallets: create, update, delete wired
DONE     3b. Wallet Groups: create, rename/description edit, and delete wired
DONE     4. Archive: restore and permanent delete wired
DONE     5. Standalone Deadlines: CRUD, Dashboard aggregation, RLS wired
DONE     6. Tasks: CRUD, assignments, linked Deadlines, views, filters, actions wired
DONE     7. Task Logs and Daily: real generation, persisted execution, and schedule rules wired
DONE     8. Inbox: workspace CRUD, search/filter, explicit conversion, and smoke coverage
DONE     9. Docs: CRUD, folders, pinning, project links, and Markdown textarea wired
DONE     10. Activity logs: mutation events, recent activity query, and delete-safe FKs
DONE     11. Project Watchlist: dedicated CRUD UI, conversion, Dashboard capture, and migration file wired locally
```

## Validation Status

Dedicated Project Watchlist batches checked 2026-08-10:

```txt
pnpm typecheck  # pass
pnpm lint       # pass, 0 warnings
pnpm test       # pass, 21 files and 81 tests
Targeted Watchlist, Project query, and Dashboard Quick Capture tests  # pass
git diff --check  # pass
Production build and real-DB Playwright are deferred until migration 0016 is applied
```

Projects/Accounts React Query + motion + delete batch checked 2026-08-06:

```txt
pnpm typecheck  # pass
pnpm lint       # pass, 0 warnings
pnpm test       # pass, 18 files and 78 tests
pnpm build      # pass, production build includes all routes
Real-mode smoke suite (real DB, test/test1234) — all 8 pass:
accounts-projects-smoke.spec.ts        # pass
project-wallet-smoke.spec.ts           # pass
wallet-group-dashboard-smoke.spec.ts   # pass
delete-linked-fk.spec.ts               # pass
full-smoke.spec.ts                     # pass
nft-wallet-smoke.spec.ts               # pass
docs-daily-smoke.spec.ts               # pass
inbox-smoke.spec.ts                    # pass
Preview-mode recheck specs (dev server, no auth) — both pass, 0 BUG lines:
manual-recheck.spec.ts    # pass, all OK incl. route sweep + interactions + screenshots
prod-menu-recheck.spec.ts # pass, first visits 1.1–1.8s, warm 1.2–1.4s, client nav 0.3–0.5s — no perf regression
```

TanStack Query + optimistic UI Tasks pilot checked 2026-08-04:

```txt
pnpm typecheck  # pass
pnpm lint       # pass, 0 warnings
pnpm test       # pass, 16 files and 71 tests
pnpm build      # pass
docs-daily-smoke.spec.ts       # pass, 1.6m
delete-linked-fk.spec.ts       # pass, 2.4m (added page.reload() after /docs goto to defeat Chromium bfcache staleness)
```

Checked 2026-08-03 after Core Dashboard activation and targeted static validation:

```txt
pnpm typecheck  # pass
pnpm lint       # pass, 0 warnings
pnpm exec vitest run --passWithNoTests --maxWorkers=1  # pass, 16 files and 71 tests
pnpm build      # pass
```

Core Dashboard activation in this batch was additionally checked with:

```txt
pnpm typecheck  # pass
pnpm lint       # pass, 0 warnings
```

Live database metadata verification:

```txt
Application tables found             20
Tables with RLS enabled              20
Application policies                22
user_workspace_ids SECURITY DEFINER true
user_workspace_ids search_path      public
Owner-visible workspaces             1
Unrelated-user-visible workspaces    0
Avatar upload ownership policy       present
Project logo ownership policy        present
Deadline workspace policy            present
project_wallets RLS                  enabled, 1 workspace policy
personal_items RLS                  enabled, 1 workspace policy
```

Focused Project Wallet regression:

```txt
Create Project accepts eligible existing Wallets and inline custom-chain Wallets
Inline Wallet requires label, address, and free-text Chain
Inline Wallet Type is fixed server-side to project_wallet
Owner Account is optional; when present it must be a selected Project Account
Deselecting an Account removes existing and draft Wallets owned by that Account
Project and new Wallet creation run in one database transaction
Partial Project updates do not inject create defaults into logo or property updates
Project deletion unlinks project_wallets and preserves the Wallet record
Focused Playwright login smoke passed 1/1 in 1.1 minutes
Browser reload preserved the custom Wallet label, address, Chain, and assignment
Add Task immediately exposed the assigned custom Project Wallet after selecting its Project
Project deletion left the Wallet visible in Accounts before explicit smoke cleanup
0 browser console errors or page errors were captured
Live migration 0014 verified six Activity Log target constraints use ON DELETE SET NULL
Production build includes /projects
Focused Wallet Group and Dashboard smoke:
Wallet Group create, rename/description edit, reload persistence, live Dashboard activity event, cleanup, and 0 console/page errors passed 1/1
Focused Docs and Daily smoke:
Docs CRUD, Daily Task Log execution, reload persistence, cleanup, and 0 console/page errors passed 1/1 after Activity Log delete-FK fix
Inbox manual-first CRUD smoke:
Inbox capture/edit/status, Project/Task/Docs conversion, reload persistence, cleanup, hydration-safe capture retry, and 0 console/page errors passed 1/1 after Activity Log delete-FK fix
Targeted current smoke prefixes (Wallet Group, Docs/Daily, Inbox) left 0 matching database rows
Personal Items: migration 0015 applied, RLS enabled with one workspace policy
Settings: profile display name and workspace name use persisted server actions
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

Focused NFTs regression:

```txt
Migration 0010 applied to the live database
RLS enabled with one workspace policy on nft_campaigns and nft_campaign_accounts
Migration 0011 applied to the live database
RLS enabled with one workspace policy on nft_campaign_wallets
NFT Wallet insert and Submitted to Whitelisted update passed inside a rolled-back transaction
0 legacy Project rows use the former NFT Hunt Type
NFT Campaign to Deadline foreign key smoke passed inside a rolled-back transaction
Bare mint URLs normalize to HTTPS; invalid time and non-HTTP URLs are rejected
Add NFT modal Account and auto-compatible Wallet selection payload are covered
Duplicate Wallet assignments and incompatible Chain families are rejected
Partial NFT updates do not inject create defaults or clear Account/Wallet assignments
Focused Playwright login and NFT Wallet smoke passed 1/1 in 50.8 seconds
Browser reload preserved Submitted and Whitelisted Wallet states and the 1/1 WL summary
Desktop and 390px mobile layouts passed without horizontal overflow
Browser smoke cleanup left 0 Campaign, 0 Wallet, and 0 Account test records
No browser console errors or page errors were captured
Production build includes /nfts
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

Previous full smoke baseline before the 2026-08-02 activation batch:

```txt
4 of 8 specs passed: Docs/Daily, Inbox, NFT Wallet, and Project Wallet
1 stale test selector: account avatar URL input expected an old placeholder
1 product gap at that time: Wallet Group rename/edit, now fixed
2 manual recheck specs stopped on the login harness before exercising the app
The full suite was not rerun after this batch by request; targeted smoke coverage below is current
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
/watchlist
/nfts
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
