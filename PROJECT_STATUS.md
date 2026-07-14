# Project Status - Web3 Hunting OS

Last updated: 2026-07-14

## Current Situation

Web3 Hunting OS is currently in early Phase 1 preview implementation.

The repository has moved from documentation-only into a Next.js 15 app with a desktop-first preview shell, authentication screens, Dashboard preview, Inbox preview, Docs preview, Daily preview, Projects preview, Watchlist preview, Tasks preview, Accounts preview, Archive preview, and Settings preview.

The app is still using preview and dummy data. Real Supabase database tables, RLS policies, CRUD flows, Inbox persistence, Docs persistence, project persistence, account-wallet persistence, task logs, and activity logs are not implemented yet.

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
- Detail panel shows project identity, properties, stage/result, completion, dates, work type, project type, accounts, links, project docs, and tasks
- Removed the preview label, duplicate hero status/priority badges, and separate About textarea from the side panel preview
- Project docs are now the intended home for project-specific notes in the panel preview
- Detail panel is visual only and not connected to persistence, Docs records, or auto-created project docs yet

### Batch 2F.1 - Add Project Flow Preview

Completed on 2026-07-09.

Implemented:

- Explored a sectioned Add Project popup workflow: Identity, Classification, Accounts & Wallets, Starter Tasks
- Assigned accounts drove wallet suggestions visually
- Wallets were grouped under selected accounts in the preview
- Added project wallet creation placeholder
- Added starter task suggestion preview with explicit confirmation behavior
- Added Watchlist rule copy for registered, waiting result, joined whitelist, and similar waiting stages
- This sectioned approach was later superseded by the compact quick-create direction in Batch 2K
- Still visual only and not connected to persistence yet

### Batch 2K - Add Project Compact Quick Create Preview

Completed on 2026-07-10 and refined on 2026-07-11.

Implemented:

- Simplified Add Project popup into a compact quick-create flow
- Current top area uses compact logo slot, project name, and date aligned in one row
- Date records when the project was captured, watched, or started. It is not an end date
- Kept only useful initial fields: hunt type, stage/result, status, priority, assigned accounts, optional URL, work type, project type, and short note
- Removed heavy first-step sections from the popup preview, including detailed wallet selection, starter task generation, and long Watchlist explanation
- Reframed full logo upload, wallets, starter tasks, docs, and full links as detail-panel work after project creation
- Added project-name autofocus for a faster create feel
- Replaced native select controls with compact custom dark dropdown previews for Hunt Type, Stage/Result, Status, and Priority
- Added compact priority glyphs so the dropdown does not rely on bright color blocks
- Made Add Project dropdowns mutually exclusive so opening one closes the previous one
- Removed the short summary field so project name is the clear first input
- Clarified account wallet helper copy to explain that wallets come from selected accounts
- Reduced internal Add Project modal divider lines for a cleaner surface
- Added a subtle Add Project modal enter animation
- Replaced the priority glyph with a cleaner signal-style SVG icon
- Removed Projects header caption under the page title
- Added fixed table column widths for better Projects table header/body alignment
- Updated Projects table priority display to use the same signal-style icon as Add Project
- Made the whole project identity area clickable to open the side detail panel preview
- Removed the vague Activity column from the Projects preview until real activity log data exists
- Adjusted Completion progress alignment in both table rows and the side detail panel
- Made overflow Work Type and Project Type chips clickable so hidden tags can be inspected in a small popover
- Kept this as visual-only and did not add persistence, real logo upload, account-wallet data, or Supabase wiring
- Follow-up added persistent uppercase labels above Add Project property controls: Hunt Type, Stage, Status, and Priority
- Follow-up converted Hunt Type and Stage into custom-capable combobox controls for preview flexibility
- Follow-up converted Work Type and Project Type optional fields into custom-capable combobox controls
- Follow-up kept Status, Priority, and Date as controlled fixed fields because they map to stricter workflow meaning
- Follow-up made Add Project combobox dropdowns internally scrollable so long Work Type and Project Type option lists do not clip against the modal
- Follow-up adjusted spacing between Assigned accounts and Optional context so modal sections keep a consistent rhythm
- Follow-up removed the persistent Add Project footer preview caption so the footer only contains Cancel and Create project actions

### Batch 2J - Divider and Color Correction Pass

Completed on 2026-07-09.

Implemented:

- Kept the softer divider treatment from the visual pass
- Reverted the unapproved Projects table direction from the previous visual pass
- Removed the extra Projects Health column from the preview
- Restored the previous Projects table information structure
- Reduced excessive preview color by neutralizing fallback project marks, Add Project button tone, and progress bars
- Kept this as visual-only and did not change PRD behavior, database schema, or persistence

### Batch 2I - Visual Tone Pass 1

Completed on 2026-07-09.

Implemented:

- Adjusted theme tokens toward warmer charcoal and softer depth
- Reduced terminal-like flatness by improving panel, card, control, and inset shadows
- Made Quick Capture input area feel more inset and intentional
- Softened key Projects modal and Tasks board surfaces without changing workflow logic
- Kept this as visual-only and did not change PRD behavior or data model
- Follow-up adjusted palette toward a cleaner near-black dark base with subtle borders and muted text
- Follow-up reduced terminal-like internal dividers and kept stronger lines only for major structure

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
- Refined List view with Mode, Status, Frequency, Account, Date start, and Priority columns
- Added inline quick-add preview row in List view
- Reworked Board view into calm fixed columns: Todo, In progress, Recheck, Done
- Moved Running out of normal board columns and into a special Running monitor strip/view
- Clarified Running as process-based work only, such as node, CLI, prover, bot, validator, extension process, or long-running services
- Reworked Recheck view into a review queue for eligibility, waitlist, claim, mint, proof, and result checks
- Improved task card precision with compact priority/mode chips, project identity, accounts, and Date start
- Follow-up refined Board filters from project chips into scalable filter controls
- Follow-up made Board Running monitor compact and project-filter aware
- Follow-up aligned Tasks visual direction with Projects by removing the long page caption, reducing colored chips, neutralizing project marks, removing Last activity/Last log preview noise, and making board cards more compact
- Follow-up removed per-column board add buttons and the list inline quick-add row so Add Task uses one primary entry point in the page header
- Follow-up removed duplicate Running and frequency labels from the board preview
- Follow-up added functional preview UX for Tasks search, project filter, account filter, mode filter, Add Task modal, local preview task creation, and task detail side panel
- Follow-up added By Project and By Status board grouping, with By Project as the default preview grouping
- Follow-up added multi-account selection in Add Task, capitalized frequency labels, Not started status, and Date start wording in place of Due
- Follow-up confirmed Add Task dropdowns keep persistent labels for Project, Status, Frequency, Priority, and Mode
- Follow-up kept Add Task Status, Priority, and Frequency as fixed-option controls because they map to database enum behavior later
- Follow-up removed the persistent Add Task footer preview caption so the footer only contains Cancel and Create task actions


### Batch 2L - Missing Navigation Preview Pages

Completed on 2026-07-14.

Implemented:

- Added `/accounts` preview route with Identities, Wallets, and Groups tabs
- Added `/archive` preview route for archived project review by reason
- Added `/settings` preview route for profile, workspace, and MVP boundary settings
- Wired Projects Watchlist as `/projects?view=watchlist` using the same Projects table preview
- Kept Watchlist, Accounts, Archive, and Settings as preview-only UI with dummy data
- Kept the new pages aligned to the accepted `/projects` visual baseline: compact header, soft dividers, muted chips, and calm table/card density
- Did not add Supabase persistence, CRUD, real account-wallet relations, archive actions, or settings saves

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
Accounts = preview implemented, visual only
Archive = preview implemented, visual only
Settings = preview implemented, visual only
```

Dashboard should answer quickly:

- what notes or references matter now
- what deadlines are nearby
- what the hunting pulse looks like
- what inbox items need processing
- what changed recently
- what can be captured quickly before it is organized

Dashboard should not duplicate the full Daily checklist or the full Projects table.

## Current UI Caveats

Known preview issues that are acceptable to fix before CRUD:

- Archive reason labels should be capitalized in the UI and visually softened.
- Archive colors should stay muted and semantic, not loud.
- Settings is currently shallow and should become a stronger preview of profile, workspace, security, preferences, and future integration areas.
- Future API key areas may be represented as disabled placeholders only. Real secret storage is not approved yet.
- Accounts, Archive, Settings, and Watchlist still need a visual polish pass against the `/projects` baseline.
- Search and filters are preview-level unless explicitly wired in the component.

## Recommended Next Sequence

Recommended order before CRUD:

1. User updates PRD to clarify any missing product rules.
2. Finish layout polish for Accounts, Archive, Settings, Watchlist, and any remaining Tasks cleanup.
3. Lock the core sidebar page layout baseline.
4. Start data foundation: Supabase, Drizzle schema, migrations, RLS, workspace helpers.
5. Start CRUD in order: Projects, Accounts, Wallets, Tasks, Daily logs, Archive, Inbox, Docs, Activity logs.

Reason: CRUD should be wired after the major page structures are stable. Small CRUD-required UI states can still be added during CRUD.

## Current Routes

Available preview routes:

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

Notes:

- `/` shows the current Dashboard preview.
- `/inbox` is dummy/static preview data only.
- `/docs` is dummy/static preview data only.
- `/daily` is dummy/static preview data only.
- `/projects` is dummy/static preview data only.
- `/projects?view=watchlist` filters the Projects preview to watchlist/waiting items only.
- `/tasks` is dummy/static preview data only.
- `/accounts` is dummy/static preview data only.
- `/archive` is dummy/static preview data only.
- `/settings` is dummy/static preview data only.

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

Current visual baseline:

- `/projects` is the locked spacing and visual reference for future page cleanup.
- Prefer subtle structure, compact rows, muted chips, soft dropdowns, and minimal permanent helper captions.
- Page titles should not have permanent meta summary lines above them. Use tab counters and badges instead when counts are needed.

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
- Projects sidebar is a dropdown where the Projects parent directly links to `/projects`, with Watchlist, Daily, and Tasks nested below it.
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

Latest commands passing after Add Project and Add Task modal polish:

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
Batch 2L - Remaining Sidebar Preview Pages
```

Suggested scope:

- Add `/accounts` preview page with Identities, Wallets, and Groups tabs.
- Add `/archive` preview page with archive reason filters.
- Add `/settings` preview page with minimal workspace and profile summary.
- Keep Docs as the final UI label.
- Keep Trading as an inactive top-level menu for now.
- Keep Projects as the direct `/projects` link with Watchlist, Daily, and Tasks nested below it.

After sidebar preview pages are visually aligned, continue to Supabase foundation, schema, migrations, RLS, and real Server Actions.
