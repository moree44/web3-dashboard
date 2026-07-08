# Project Status - Web3 Hunting OS

Last updated: 2026-07-08

## Current Situation

Web3 Hunting OS is currently in early Phase 1 preview implementation.

The repository has moved from documentation-only into a Next.js 15 app with a desktop-first preview shell, authentication screens, Dashboard preview, Daily preview, Projects preview, Tasks preview, Inbox preview, and Docs preview.

The app is still using preview and dummy data. Real Supabase database tables, RLS policies, CRUD flows, Inbox persistence, Docs persistence, project persistence, task logs, and activity logs are not implemented yet.

## Active Source of Truth

Active root docs:

- `AGENTS.md`
- `PRD.MD`
- `DESIGN.md`

Context docs:

- `PROJECT_STATUS.md`
- `audits/`

Backup docs should stay outside the active root docs, preferably in:

```txt
.local-backup/
```

Only active root docs should be treated as product instructions unless the user explicitly asks for comparison.

## Completed Work

### Batch 1 - Project Foundation

Completed enough to run the app locally.

Includes:

- Next.js app foundation
- TypeScript setup
- Package scripts
- Initial app routes
- Basic shared primitives
- Local dev server support

### Batch 2 - Design Foundation and Preview UI

Completed enough for visual preview.

Includes:

- Neutral royal-charcoal dark theme tokens
- Soft-depth workbench direction
- Desktop app shell
- Sidebar navigation
- Mobile navigation
- Dashboard preview
- Daily preview
- Projects preview
- Shared loading, empty, and error states
- Button, badge, card, skeleton primitives
- Plus Jakarta Sans for expressive headings

### Batch 2B - Inbox and Docs Preview Pages

Completed on 2026-06-30.

Implemented:

- Added Inbox as a top-level desktop and mobile nav item
- Added Docs as a top-level desktop nav item
- Added `/inbox` preview route
- Added `/docs` preview route
- Added Inbox preview page with static triage queue, detail panel, and visual placeholder actions
- Added Docs preview page with pinned docs, recent docs, compact folders, and safe access metadata warning
- Kept mobile nav compact with Dashboard, Inbox, Daily, Projects, Accounts

### Batch 2C - Dashboard Visual Realignment

Completed on 2026-07-04.

Implemented:

- Reworked Dashboard into a cleaner personal desk overview
- Current Dashboard layout uses: header, Quick Capture, Notes desk, Upcoming deadlines, Hunting pulse, Inbox to process, and Recent activity
- Notes desk is now the primary dashboard card because notes and references are expected to be used more often than Inbox
- Upcoming deadlines moved to the top middle position for faster scanning
- Inbox to process moved lower because raw inbox volume is expected to be lower in Phase 1
- Removed global Search and large Quick add button from Dashboard
- Restored focused Quick Capture for project links, Twitter watchlist items, notes, and inbox items
- Added date-based daily motivation line under the greeting
- Updated greeting time ranges using Asia/Jakarta time
- Reduced dashboard spacing and card padding to minimize scrolling

Current greeting ranges:

```txt
00:00 - 03:00 = Still awake
03:01 - 11:59 = Good morning
12:00 - 14:29 = Good afternoon
14:30 - 18:30 = Good evening
18:31 - 23:59 = Good night
```

### Batch 2D - Projects Preview Cleanup

Completed on 2026-07-04.

Implemented:

- Reduced Projects preview dummy data from many rows to 6 representative projects
- Removed Trading from Projects tabs
- Added Watchlist tab as a Projects view
- Kept Projects table layout mostly intact because the current layout is accepted
- Added Add Project popup preview with basic project fields
- Add Project popup is visual only and not connected to persistence yet

### Batch 2E - All Projects Layout Refinement

Completed on 2026-07-05.

Implemented:

- Refined Projects table visual hierarchy while keeping the accepted table layout
- Moved Hunt Type into project identity metadata instead of a dominant table column
- Added Stage/Result concept to represent waitlist, whitelist, eligibility, claim, mint, and similar outcomes
- Made Work Type chips visually stronger than Project Type chips
- Made Project Type chips more muted
- Changed Accounts display to compact persona initials/chips
- Added manual-first logo section to Add Project popup
- Locked automatic logo fetching as future helper only, not MVP default

### Batch 2F - Project Detail Side Panel Preview

Completed on 2026-07-05.

Implemented:

- Project names in the Projects table can now be clicked
- Clicking a project opens a right-side detail panel preview
- Detail panel shows project identity, status, priority, stage/result, completion, dates, work type, project type, accounts, links, project docs, tasks, and about notes
- Project docs are represented inside the panel as linked docs preview
- Detail panel is visual only and not connected to persistence yet

### Batch 2G - Tasks Preview Page

Completed on 2026-07-06.

Implemented:

- Added `/tasks` route with auth guard and dev preview bypass
- Added Tasks preview page with four view tabs: List, Board, Running, Recheck
- List view renders a full table with project mark, task title, status, frequency, priority, and account chips
- Initial Board view rendered a generic Kanban board
- Running and Recheck views filter to their respective statuses
- Project filter tabs let users filter by project (All, Soundness, NexusHQ, Linera, Huddle01, Drosera)
- Search bar, Status filter, Frequency filter, and More filters are visual placeholders
- Dummy tasks across representative projects
- Mobile card layout with responsive collapse of the table view
- Tasks sidebar nav item is now active and navigable

### Batch 2H - Tasks Board UI Realignment

Completed on 2026-07-08.

Implemented:

- Reworked `/tasks` preview into a cleaner cross-project work queue
- Added visual execution mode to preview tasks, such as Site interaction, Discord activity, Proof submit, Waitlist check, Claim, and Node / CLI
- Kept execution mode as visual-only for now, not a PRD/database field yet
- Refined List view with Mode, Status, Frequency, Account, Due, Last log, and Priority columns
- Added inline quick-add preview row in List view
- Reworked Board view into calm fixed columns: Todo, In progress, Recheck, Done
- Moved Running out of normal board columns and into a special Running monitor strip/view
- Clarified Running as process-based work only, such as node, CLI, prover, bot, validator, extension process, or long-running services
- Reworked Recheck view into a review queue for eligibility, waitlist, claim, mint, proof, and result checks
- Improved task card precision with compact priority/mode chips, project identity, accounts, due date, last log, notes, and proof count
- Follow-up refined Board filters from project chips into scalable filter controls
- Follow-up made Board Running monitor compact and project-filter aware

## Current Product Direction

Current preview direction:

```txt
Dashboard = personal desk overview with Quick Capture
Inbox = raw input waiting for decision
Docs = final UI name for notes, research, links, guides, SOP, templates, and safe access metadata
Daily = full checklist
Projects = full project database
Trading = portfolio wallets, trade journal, and profit/minus notes
Tasks = preview implemented, visual only
Accounts = not implemented yet
Archive = not implemented yet
Settings = not implemented yet
```

Dashboard should answer quickly:

- what notes or references matter now
- what deadlines are nearby
- what the hunting pulse looks like
- what inbox items need processing
- what changed recently
- what can be captured quickly before it is organized

Dashboard should not duplicate the full Daily checklist or the full Projects table.

## Current Routes

Available preview routes:

```txt
/
/inbox
/docs
/daily
/projects
/tasks
/login
/signup
```

Notes:

- `/` shows the current Dashboard preview.
- `/inbox` is dummy/static preview data only.
- `/docs` is dummy/static preview data only.
- `/daily` is dummy/static preview data only.
- `/projects` is dummy/static preview data only.
- `/tasks` is dummy/static preview data only.
- Routes for Accounts, Archive, and Settings appear in navigation but are not implemented yet.

## Current Auth State

Username-based auth direction is represented in code and docs.

Important decisions:

- User-facing login is username + password.
- No user-facing email field.
- No email verification in MVP.
- Supabase Auth is still used under the hood.
- Internal auth email format is `{normalized_username}@web3-hunting.local`.

Development preview bypass exists with strict safeguards:

- Only active when `NODE_ENV === "development"`.
- Only active when Supabase environment variables are missing.
- Never bypasses auth in production.
- Production fails closed if Supabase env vars are missing.

Supabase foundation, real auth verification, schema, migrations, and RLS still need a clean approved pass.

## Current Design Notes

Current accepted visual direction:

- Premium dark gradient ambience
- Royal charcoal base
- Soft-depth surfaces
- Compact productivity OS
- Solid panels for readable content
- Mostly monochrome Lucide icons
- No neon, cyberpunk, heavy glassmorphism, noisy texture, or card-wall dashboard

Dashboard now uses:

- Compact date and greeting header
- Daily rotating motivation line
- Focused Quick Capture bar
- Notes desk as primary content
- Upcoming deadlines as top-level attention content
- Hunting pulse right rail
- Inbox to process lower in the layout
- Recent activity as secondary signal

Inbox now uses:

- Search/filter preview row
- Compact inbox item list
- Right-side selected item preview
- Visual placeholder actions

Docs now uses:

- Search/quick add preview row
- Pinned docs
- Recent docs
- Compact folder cards
- Safe access metadata notice

## Preview Data Limitations

The following are still dummy/static only:

- Dashboard numbers
- Dashboard Quick Capture
- Dashboard inbox items
- Dashboard notes
- Dashboard deadlines
- Dashboard pulse
- Dashboard recent activity
- Inbox item list
- Inbox detail panel
- Inbox action buttons
- Docs pinned/recent/folder data
- Daily tasks
- Projects table, project row hierarchy, stage/result, manual logo preview, Add Project popup, and Project detail side panel
- Tasks list, board, running monitor, and recheck queue views

No real database CRUD has been implemented yet.

No Supabase schema, migration, RLS, Storage, or server actions have been implemented yet.

## PRD Alignment Check

The current direction is mostly aligned with `PRD.MD`.

Aligned:

- Dashboard remains a personal desk, not a mini Daily page or mini Projects page.
- Dashboard still follows `Dashboard = Inbox + Docs + Pulse`.
- Quick Capture remains on Dashboard and is used for raw capture.
- Inbox remains manual-first and raw, not automatic email sync.
- Docs remains knowledge and reference oriented.
- Daily remains the full checklist screen.
- Projects remains the full project database.
- Trading remains a top-level inactive sidebar menu for portfolio wallets and trade journal workflows.
- Phase 2 and Phase 3 features are still not being built.

Resolved direction:

- `Docs` is the final UI label because the area will include notes, guides, links, templates, SOP/checklist, safe access metadata, and lightweight references.
- `Trading` stays as a top-level inactive sidebar menu.
- Trading is not a Projects category. It is for portfolio wallets, trade journal, and profit/minus notes.
- Projects sidebar is a dropdown with All Project, Watchlist, Daily, and Tasks.
- Dashboard Quick Capture `Watchlist` should be treated as an Inbox item or Docs entry until a dedicated model is approved.

Still pending:

- Dashboard is currently visual preview only. PRD allows Dashboard at step 13, but final real data aggregation should wait until Inbox, Docs, Projects, Tasks, Task Logs, Archive, and Activity Logs exist.

## Important Product Rules

- Phase 1 only.
- Personal-first, not SaaS.
- Account is persona.
- Wallet is address.
- Do not merge Account and Wallet.
- L1 is a wallet type/group, never an account.
- Daily checklist is grouped by account by default.
- Daily owns the full checklist.
- Projects owns the full project database.
- Inbox owns raw input.
- Docs owns knowledge and reference content.
- Task logs are the source of truth for daily completion.
- Do not store daily done or skip state directly on tasks.
- Archive replaces Trash and requires archive reason.
- No team invite UI in MVP.
- No workspace switcher UI in MVP.
- No Gmail integration in Phase 1.
- No multi-email sync in Phase 1.
- No password vault in Phase 1.
- No X/Twitter monitoring or agent discovery in Phase 1.

## Security Rules

Never store:

- seed phrase
- raw private key
- recovery phrase
- exchange API secret
- sensitive passwords
- 2FA backup code

Allowed:

- public wallet address
- wallet label
- tx hash
- proof URL
- project notes
- global notes or docs
- safe access metadata
- hint where private key or password is stored

Docs may show safe access metadata such as login URL, account label, username/email, and password location like Bitwarden or local vault.

Docs must not act as a password manager.

## Current Key Files

Docs:

- `AGENTS.md`
- `PRD.MD`
- `DESIGN.md`
- `PROJECT_STATUS.md`
- `audits/AUDIT_2026-06-28.md`
- `audits/AUDIT_2026-06-29.md`

App shell and layout:

- `src/app/layout.tsx`
- `src/app/globals.css`
- `src/app/page.tsx`
- `src/components/layout/app-shell.tsx`
- `src/components/layout/app-sidebar.tsx`
- `src/components/layout/mobile-nav.tsx`

Dashboard preview:

- `src/features/dashboard/components/dashboard-preview.tsx`
- `src/features/dashboard/components/task-preview.tsx`
- `src/features/dashboard/components/daily-progress.tsx`

Inbox and Docs preview:

- `src/app/inbox/page.tsx`
- `src/app/docs/page.tsx`
- `src/features/inbox/components/inbox-preview.tsx`
- `src/features/docs/components/docs-preview.tsx`

Projects and Daily preview:

- `src/app/projects/page.tsx`
- `src/app/daily/page.tsx`
- `src/features/projects/components/projects-preview.tsx`
- `src/features/daily/components/daily-preview.tsx`

Tasks preview:

- `src/app/tasks/page.tsx`
- `src/features/tasks/components/tasks-preview.tsx`

Auth-related files:

- `src/features/auth/actions.ts`
- `src/features/auth/schemas.ts`
- `src/features/auth/components/login-form.tsx`
- `src/features/auth/components/signup-form.tsx`
- `src/features/auth/components/logout-button.tsx`
- `src/lib/auth/username.ts`
- `src/lib/auth/session.ts`
- `src/lib/supabase/client.ts`
- `src/lib/supabase/server.ts`
- `src/lib/supabase/middleware.ts`
- `src/middleware.ts`

## Validation Results

Latest commands passing after Tasks Board UI Realignment:

```txt
pnpm lint
pnpm typecheck
pnpm build
```

Build routes generated:

```txt
/
/daily
/docs
/inbox
/projects
/tasks
/login
/signup
```

## Known Limitations

- Preview data is static and not connected to Supabase.
- Dashboard Quick Capture is visual only.
- Inbox buttons are visual placeholders only.
- Docs buttons are visual placeholders only.
- Tasks preview is done and visually realigned (visual only, not connected to persistence).
- Accounts, Archive, and Settings are still navigation placeholders or future implementation areas.
- Trading page is not implemented yet, but the top-level menu direction is now approved.
- Dashboard may still scroll slightly on some laptop viewports, but current visual direction is accepted for now.

## Recommended Next Batch

Recommended next step:

```txt
Batch 2H - Remaining Sidebar Preview Pages
```

Suggested scope:

- Add `/accounts` preview page with Identities, Wallets, and Groups tabs.
- Add `/archive` preview page with archive reason filters.
- Add `/settings` preview page with minimal workspace and profile summary.
- Keep Docs as the final UI label.
- Keep Trading as an inactive top-level menu for now.
- Projects sidebar uses a dropdown: All Project, Watchlist, Daily, Tasks.

After sidebar preview pages are visually aligned, continue to Supabase foundation, schema, migrations, RLS, and real Server Actions.
