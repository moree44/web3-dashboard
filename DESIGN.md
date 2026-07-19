# DESIGN.md — Web3 Hunting OS

**Version:** 2.11
**Status:** Current visual direction for Phase 1 preview, completed sidebar coverage, layout-first workflow, and pre-CRUD UI baseline
**Product:** Web3 Hunting OS
**Design Direction:** Premium dark compact productivity OS

---

## 1. Design Goal

Web3 Hunting OS should feel like a private, premium, desktop-first productivity OS for Web3 hunting.

The app should feel:

* calm
* compact
* premium
* clear
* personal
* fast to scan
* fast to write
* purpose-built

The app should not feel:

* terminal
* cyberpunk
* noisy crypto dashboard
* generic SaaS admin
* analytics-first dashboard
* marketing landing page
* Notion clone
* card wall

The design should support high-volume project, task, inbox, docs, account, and wallet management without feeling cluttered.

---

## 2. Core Layout Philosophy

The app uses a stable desktop shell:

```txt
Fixed Full-Height Sidebar | Open Scrollable Main Workspace
```

The shell should feel like a desktop productivity app, not a website card placed inside the browser. Avoid a large rounded outer container around the entire application on desktop.

The sidebar is the primary navigation and should stay fixed on desktop while the main content area scrolls independently.

The main content changes by route.

Every page should feel like part of the same operating system, not separate templates.

Design must prioritize:

```txt
overview first
compact density
clear hierarchy
short scan time
low visual noise
```

---

## 3. Visual Mood

Locked visual mood:

```txt
premium dark gradient
royal charcoal
soft-depth
open desktop workspace
compact productivity interface
solid content surfaces
subtle atmospheric ambience
```

Gradient is allowed, but only as ambience.

Rule:

```txt
gradient for ambience
solid surface for content
```

Do not use gradient on every card.

Do not make the interface shiny, neon, glassy, or noisy.

---

## 4. Color Direction

Use a dark royal-charcoal palette.

Recommended color feel:

```txt
Stage Top:        #3A3D42
Stage Mid:        #2A2D31
Stage Bottom:     #1E2023

Shell Base:       #1B1D20
Canvas:           #1F2125
Surface:          #24262A
Surface Elevated: #2B2E33
Surface Raised:   #31353A

Accent Navy Hint: #1D2533
Accent Slate:     #3F4956

Text Primary:     #F2F3F5
Text Secondary:   #B3B8C0
Text Muted:       #7F858D
Border Subtle:    rgba(255,255,255,0.08)
```

Semantic colors should be muted and used only for meaning:

* success
* warning
* danger
* info
* priority
* status

Do not use bright green, neon blue, or colorful crypto gradients as base UI colors.

---

## 5. Gradient Rules

Allowed:

* outer app stage
* full-height app shell ambience
* subtle dashboard header ambience
* selected or highlighted panels only when needed

Not allowed:

* every card
* every row
* every button
* sidebar item backgrounds everywhere
* heavy glow
* neon aura
* glassmorphism blur
* noisy texture

Example ambience direction:

```css
background:
  radial-gradient(circle at top center, rgba(70, 78, 92, 0.18), transparent 40%),
  linear-gradient(180deg, #3a3d42 0%, #2a2d31 35%, #1e2023 100%);
```

Content panels should mostly use solid dark surfaces with soft borders, slight elevation, and readable contrast.

Do not wrap the desktop workspace in a large browser-card frame. Use full-height shell structure with subtle sidebar/content separation instead.

---

## 6. Surface System

Use soft-depth instead of flat cards.

Surface hierarchy:

```txt
Stage              outer background
Shell              app container
Canvas             main content base
Surface            default panel
Surface Elevated   important panel
Surface Raised     active/selected/interactive element
```

Panels should have:

* subtle border
* soft shadow
* soft inner highlight if needed
* consistent radius
* compact padding

Avoid heavy card stacks.

Avoid equal-weight panels everywhere.

---


## 6C. Quick Create Modal Rule

Create flows should stay compact. The first modal captures only what is needed to create a useful record. Heavy setup belongs in detail panels after the object exists.

For Add Project, the active direction is a compact quick-create modal with:

* compact logo slot
* project name
* date field for when the project was recorded, watched, or started
* hunt type
* stage/result
* status
* priority
* assigned accounts
* optional URL, work type, project type, and short note

Move these to project detail instead of the quick-create modal:

* full logo upload workflow
* detailed wallet assignment
* starter task generation
* full docs/resources
* long Watchlist explanation
* activity/history

The modal should feel quick to open, quick to scan, and safe to skip optional fields. The project name remains the clearest first input.

Native browser select menus should be avoided in dark modals because their option popup can render with browser-default styling. Use compact custom dark dropdowns for enum-like controls such as Hunt Type, Stage/Result, Status, and Priority. Priority should use small ranking glyphs instead of bright color blocks.

Property controls in create modals must keep persistent uppercase labels above the control, matching the small muted label style used for Project Name and Date. Do not rely on the selected value alone to explain the field.

Custom-capable combobox controls are allowed only where the option list is naturally flexible. In the current preview, this applies to Hunt Type, Stage, Work Type, and Project Type. Status, Priority, and Frequency remain fixed-option controls because they map to stricter workflow or database enum behavior later.

Combobox dropdown lists inside create modals should use an internal max-height with scroll instead of overflowing the modal. This keeps long option lists predictable without adding collision logic.

When a create modal has several enum-like properties, prefer compact property controls over full stacked form controls. Only one dropdown should be open at a time. Date should be aligned as a field, not a floating or clipped chip.

Create modal footer areas should not keep persistent explanatory preview captions. Keep the footer focused on Cancel and Create actions.

Spacing between create modal sections should follow a consistent rhythm. If a section has chips or short rows, add enough bottom breathing room before the next section label so the label does not feel cramped.
 Internal modal dividers should be avoided unless they materially improve grouping. Add Project uses a subtle enter animation so opening the modal feels responsive without becoming decorative.

## 6B. Visual Tone Adjustment

The interface should avoid a terminal or code-editor feel.

Use:

* near-black base surfaces
* sidebar and app canvas separation
* open full-height desktop shell
* softer borders
* visible but subtle shadows
* inset inputs that differ from card backgrounds
* raised controls for buttons and active pills

Avoid:

* strong border outlines everywhere
* flat black panels
* equal-depth cards, inputs, and rows
* excessive terminal-like separators
* strong internal dividers inside every card

Quick Capture and form inputs should use an inset well. Cards and modal sections should use soft shadow depth rather than relying only on borders.

---

## 7. Typography

Primary font:

```txt
Geist Sans
```

Secondary heading font:

```txt
Plus Jakarta Sans
```

Typography should be calm and readable.

Suggested sizing:

```txt
Page title:        22–26px
Section title:     14–16px
Body/table text:   13–14px
Metadata:          11–12px
Tiny labels:       10–11px
```

Use monospace only for:

* wallet address
* tx hash
* command
* code
* generated key/public identifier

Avoid oversized hero typography.

---

## 8. Icon Direction

Use one consistent icon family.

Preferred:

```txt
Lucide
```

Icon rules:

* monochrome first
* rounded outline style
* muted by default
* brighter only when active
* semantic color only for state or priority
* no random colorful icon sets
* no emoji as primary UI icons

---

## 9. Navigation

Sidebar is top-level navigation.

Final desktop sidebar:

```txt
Dashboard
Inbox
Docs
Projects
  Watchlist
  Daily
  Tasks
Accounts
Archive
Trading
Settings
```

Navigation roles:

| Menu      | Role                                                 |
| --------- | ---------------------------------------------------- |
| Dashboard | Compact opening overview                             |
| Inbox     | Raw input waiting to be processed                    |
| Docs      | Notes, research, links, guides, SOP, access metadata |
| Projects  | Main project database, workflow group, and direct link to full table |
| Watchlist | Project watchlist, nested under Projects              |
| Daily     | Full checklist execution, nested under Projects      |
| Tasks     | Cross-project task management, nested under Projects |
| Trading   | Portfolio wallets, trade journal, and PnL notes      |
| Accounts  | Personas, wallets, wallet groups                     |
| Archive   | Archived projects and results                        |
| Settings  | App and workspace settings                           |

Do not add hunt categories to sidebar. Projects may contain workflow children only: Watchlist, Daily, and Tasks. The Projects parent is a direct link to the full project table.

Hunt categories stay inside Projects as tabs or filters on the Projects page.

Examples:

```txt
All
Free Hunts
Retro
NFT
Waitlist
```

Trading is not a Projects category. Trading has its own sidebar menu for portfolio wallets, trade journal, and profit/minus notes.

---

## 10. Sidebar Visual Treatment

Sidebar should feel clean, compact, and desktop-app-like.

Rules:

* active item uses a soft raised pill
* inactive items are muted
* icons are aligned and monochrome
* spacing is compact
* sidebar should not feel like a colorful app launcher
* badge count is allowed for Inbox

Example:

```txt
Inbox   4
```

Inbox count badge should be small, muted, and not visually aggressive.

Use red only for truly urgent state.

---

## 11. Mobile Navigation

Mobile bottom navigation should prioritize core actions:

```txt
Dashboard
Inbox
Daily
Projects
Accounts
```

Docs can be reached from menu/drawer or Dashboard shortcuts.

Mobile must remain usable, but desktop is the primary target.

---

## 12. Dashboard Role

Dashboard is a compact opening overview.

It is not the main workspace.

Dashboard should help the user understand the current state in under 30 seconds.

Dashboard should show:

* important numbers
* pinned/important docs
* inbox highlights
* today summary
* running/recheck signals
* upcoming deadlines
* recent activity

Dashboard should not duplicate full pages.

Dashboard is not:

* full Inbox
* full Docs
* full Daily checklist
* full Projects table
* analytics KPI wall
* crypto news dashboard

Locked formula:

```txt
Dashboard = compact opening overview
```

Route ownership:

```txt
Dashboard = overview
Inbox = raw input processing
Docs = notes/research/knowledge storage
Daily = checklist execution
Projects = project database management
```

---

## 13. Dashboard Layout

**v3.0 change:** the "Today Desk | Signal Rail" two-column formula is retired. The implementation evolved into a five-panel grid with no separate top-level status strip — overview numbers live inside the Hunting Pulse panel instead.

Dashboard must be compact and should avoid long vertical scrolling on normal desktop viewport.

Target:

```txt
1440 × 900 desktop viewport
main overview visible without long scroll
```

Small laptop or mobile may scroll, but default desktop should feel like one clean overview.

Locked structure:

```txt
Header + Quick Capture
Five-panel grid
```

Example layout:

```txt
┌──────────────────────────────────────────────────────────┐
│ Header + Quick Capture                                   │
├───────────────────┬───────────────────┬──────────────────┤
│ Notes desk         │ Upcoming deadlines │ Hunting pulse    │
│ - Pinned notes      │ - nearest dates    │ - Overview tiles │
│ - Recent notes      │                    │ - Category pills │
│                     │                    │ (spans 2 rows)   │
├───────────────────┼───────────────────┤                  │
│ Inbox to process    │ Recent activity    │                  │
└───────────────────┴───────────────────┴──────────────────┘
```

Each panel is its own bounded card (soft-panel, no persistent subtitle line under the title — see Section 14). Hunting Pulse is visually taller, spanning two row-heights, since it carries both the Overview stat tiles and the Category pills.

There is no separate "Compact Status Line" strip above the panels — overview numbers (Projects, Active, Inbox, Due, Running, Archived) render as small tiles inside the Hunting Pulse panel itself.

---

## 14. Dashboard Sections

**v3.0 change:** the "Today Desk" and "Signal Rail" grouping containers are retired. Each dashboard section below is now its own standalone panel in the five-panel grid (Section 13) — there is no outer wrapper grouping three or four of them together.

### Header

Compact, not a large hero.

Example:

```txt
Good evening, Moree
Saturday, July 18 · WIB
```

A short rotating motivational line may render under the header (decorative only).

### Quick Capture

Quick Capture should be visible but not oversized.

Placeholder:

```txt
Capture project link, Twitter watchlist, note, or inbox item...
```

Quick actions:

```txt
Project
Watchlist
Note
Inbox
```

### Notes desk

Links to `/docs`. Combines pinned and recent Docs entries in one panel.

* Pinned notes — up to 3 items
* Recent notes — up to 3 items

Each item shows title and short metadata (folder/type, updated time).

### Upcoming deadlines

Links to `/daily`. Shows the nearest date-sensitive items.

Limit: 3 items. Each item shows title, short context, and a due label (e.g. "Today", "Tomorrow", or a date).

### Hunting pulse

Links to `/projects`. Spans two row-heights in the grid since it carries two groups:

* **Overview** — small stat tiles: Projects, Active, Inbox, Due, Running, Archived
* **Categories** — compact pill counts: Testnet, Free Hunt, Retro, NFT, Waitlist

Trading is not shown here — Trading has its own sidebar section (Section 39A of PRD).

Running/Recheck does not appear as an expandable list inside Hunting Pulse — "Running" is a number tile only. The live Running/Recheck list lives in Daily and Projects, not Dashboard.

Use small chips or short rows, not large cards.

### Inbox to process

Links to `/inbox`. Shows raw input that may need attention.

Limit: 3 items. Each item shows title, source/metadata, and a priority/status badge.

### Recent activity

Links to `/projects`. Shows the latest changes across the workspace as a compact short list — title/action text and relative time (e.g. "8m", "24m", "1h").

### Open question — Reminders panel

An earlier planning pass considered adding a dedicated "Reminders" panel/section to the dashboard. This was not implemented in the shipped five-panel grid — confirm whether it's still wanted before building it. If added later, it becomes a sixth standalone panel following the same shape as the others, not a sub-section nested inside another panel.

---

## 15. Dashboard Must Avoid

Do not put these on Dashboard:

```txt
full Daily checklist
full Projects table
large Active Hunts table
large Today Focus list
large Account Workload card
large Hunting Overview card wall
crypto news
token price widget
Gmail inbox clone
AI summary wall
long vertical scroll
many equal-weight panels
fragmented widget wall
three separate right-side signal cards
uneven columns with accidental blank space
Running / Recheck section on dashboard
Trading category in Hunting Pulse or Projects tabs
```

Dashboard should be overview, not execution surface.

---

## 16. Inbox Page Direction

Inbox is a top-level route.

Inbox is for raw input waiting to be processed.

Inbox is not email-only.

Sources may include:

```txt
manual
quick capture
future Gmail
future X/Twitter
future browser extension
```

Phase 1 should focus on manual and quick-capture inbox items.

Inbox layout direction:

```txt
Header + search/filter
Inbox list
Detail drawer or side panel
Action area
```

Inbox actions:

```txt
Create Project
Create Task
Save to Docs
Link to Project
Ignore
Archive
```

Inbox should feel like a compact triage queue, not a full Gmail clone.

---

## 17. Docs Page Direction

Docs replaces separate Notes.

Docs is the place for:

* notes
* research
* useful links
* guides
* SOP
* setup commands
* templates
* account access metadata

Docs is not a raw password manager.

Docs can store access metadata, but should not store raw passwords, seed phrases, private keys, recovery phrases, exchange API secrets, or 2FA backup codes.

Safe access metadata example:

```txt
Account: Wdym Gmail
Login URL: gmail.com
Email: example@gmail.com
Password location: Bitwarden
2FA: enabled
Notes: used for waitlist/project registration
```

Unsafe:

```txt
plain password
seed phrase
raw private key
2FA backup code
```

### Docs Layout

Docs should use a hybrid file-library model.

Docs Home:

```txt
Search
Quick Add
Pinned
Recent
Folder Cards
```

Recommended folders:

```txt
Research
Tools & Links
Guides / SOP
Project References
Accounts & Access
Templates
Personal Notes
```

Folder cards can take inspiration from dark desktop file-library UI, but should remain compact.

Inside a folder, use list/table layout rather than giant cards.

Docs should feel like a premium knowledge library.

---

## 18. Daily Page Direction

Daily owns checklist execution.

Dashboard must not duplicate Daily.

Daily should show:

* checklist grouped by account
* running/recheck split
* done/skip/pending actions
* compact task rows
* project logo/name
* account label
* status and frequency badges

Daily default grouping:

```txt
By Account
```

Running and Recheck tasks should not appear as normal checkboxes.

---

## 18A. Project Row Visual Hierarchy

Projects table should stay table-first but read cleaner than a raw Notion database.

Default row hierarchy:

```txt
Project identity = logo/manual initials + project name + hunt type + stage/result
Status = work condition
Priority = importance
Work Type = what work is being done
Project Type = technology/domain
Account = assigned personas
Completion = manual progress
Date start = start or important date
Activity = latest change
```

Rules:

* project logo is manual-first in MVP
* use initials fallback when no logo exists
* Hunt Type appears as metadata or filter, not a dominant table column
* Work Type is visually stronger than Project Type
* Project Type uses muted chips
* Account uses compact persona initials/chips
* Stage/result tracks waitlist, whitelist, eligibility, claim, mint, and similar outcomes separately from status

---

## 19. Projects Page Direction

Projects owns the full project database.

Desktop view should be table-first.

Projects should support:

* hunt category tabs, excluding Trading
* search
* filters
* compact rows
* project logo/initial
* status
* priority
* hunt type
* work types
* accounts
* wallets
* progress
* dates
Dashboard must not duplicate this full table.

Avoid vague preview columns such as Activity unless they are backed by a clear activity log or last-updated field. If needed later, use a clearer label such as Last updated.

Mobile should use compact project cards instead of squeezing table columns.

---

## 19B. Project Detail Side Panel

Clicking a project row should open a right-side detail panel.

The detail panel keeps the project table visible in the background and gives fast access to:

* project properties
* status, priority, stage/result, completion, dates
* work type and project type
* accounts and wallets
* links
* project docs
* project tasks

Project-specific notes should live in linked Project docs, not in a separate free-floating About textarea inside the panel. The side panel may show a main project doc, setup notes, result notes, and task links as compact rows.

Future connected behavior: creating a project should create or prepare a project doc record using the project name. Active grind/testnet projects and Watchlist projects may later be organized differently in Docs, but the preview should avoid exposing folder complexity before the Docs system is real.

The panel should feel like a compact project page, not a full-screen document editor.

### Add Project Quick Create Preview

Add Project should not feel like a heavy setup form. The current direction is quick create first, detail completion later.

The modal layout should prioritize:

```txt
Logo | Project name | Date
Hunt type | Stage | Status | Priority
Assigned accounts
Optional context
```

Date means the date the project was recorded, added to Watchlist, or started. It is not an end date.

Accounts are selected in quick create. Wallet choices are completed later from the project detail because wallets belong to personas in the Accounts area.

Starter tasks are not shown as a heavy first-step section. They can be suggested later after project creation, and should never be auto-created without user confirmation.

Watchlist behavior remains a product rule, but long explanatory Watchlist copy should not clutter the quick-create modal.

The current Add Project preview keeps the footer action-only, uses scrollable dropdown menus for custom-capable fields, and preserves clear spacing between Assigned accounts and Optional context.

---

## 19A. Trading Page Direction

Trading owns portfolio and trade journal workflows.

Trading is for:

* portfolio wallets
* trade journal entries
* entry and exit notes
* profit/minus notes
* wallet exposure notes
* lightweight watchlist references

Trading is not a Projects category.

Trading should feel like a calm ledger, not a crypto exchange terminal. Keep it table-first, compact, and manually maintained in Phase 1.

---

## 20. Tasks Page Direction

Tasks is for cross-project task management.

Use `/projects` → `All Project` as the locked visual baseline for spacing, density, dark surfaces, subtle dividers, button treatment, chip treatment, dropdowns, and modal polish. Other workbench pages should follow that direction before inventing a new visual language.

Use compact list-first layout, with Board as a clean secondary work surface.

Primary views:

```txt
List
Board
Running
Recheck
```

List view is for dense scanning and editing across many projects.

Board view should feel like a precise task board:

* support By Project and By Status grouping
* default preview grouping can be By Project because the user often thinks by active project
* calm fixed-width lanes
* compact cards
* single Add Task action in the page header, no per-lane plus controls unless real UX requires it later
* two-line max task titles
* when grouped by project, do not repeat the project name inside every card
* status, mode, frequency, assigned account chips, and Date start visible without opening detail
* descriptions, notes count, proof count, and long logs should move to detail panels later
* scalable filters instead of horizontal chips for every project
* compact Running monitor rows that respect the active project filter
* subtle hover only
* no neon or noisy card styling

Board columns for normal work:

```txt
Not started
Todo
In progress
Recheck
Done
```

Running is not treated as a generic board column by default.

Add Task can use a compact quick-create modal in preview and later should connect to project tasks, Daily generation, and task logs. It should support multi-account assignment because crypto tasks often apply to multiple personas. Search and filters should be functional wherever possible, even before persistence, so the workflow can be tested with preview data.

Add Task quick-create modal should follow the same field-label discipline as Add Project. Project, Status, Frequency, Priority, Mode, Assigned accounts, Date start, and Short note should have visible persistent labels. Status, Frequency, and Priority remain fixed-option controls. Date start uses the custom dark date picker, not a native browser date popup.

Running is a special monitoring state for process-based work only, such as:

* node
* CLI
* prover
* bot
* validator
* extension process
* long-running service

Normal website/testnet/Discord/form/proof tasks should use Not started, Todo, In progress, Recheck, Done, or Skipped later when implemented.

Every task row or card should show:

* title
* project mark or logo
* project name
* execution mode, visual-only for now
* assigned account chips
* status badge
* frequency badge
* Date start or monitoring window
* last log or last check
* priority only when meaningful, especially high priority

Suggested visual execution modes:

```txt
Site interaction
Discord activity
Form registration
Waitlist check
Proof submit
Claim
Node / CLI
Research
Other
```

This mode is currently visual preview only. Do not add a database field until PRD approval.

---

## 21. Accounts Page Direction

Accounts is for personas, wallets, and wallet groups.

Tabs:

```txt
Identities
Wallets
Groups
```

Account is persona.

Wallet is address.

Do not merge account and wallet.

---



### Sidebar Page Precision Cleanup

After the open desktop shell update, page titles should stay short and direct. Use labels such as Docs, Inbox, Projects, Tasks, Daily, Accounts, Archive, and Settings as primary page titles. Longer explanations belong in panel content only when they help the current task. Older hard `border-border` panel treatments should be softened to the current soft-divider direction, especially on Docs and Inbox. Daily should not present Add Task as a primary header action while task creation is owned by Tasks and project workflows.

## 21B. Sidebar Page Completion Baseline

Accounts, Archive, and Settings should follow the accepted `/projects` visual baseline during preview work.

Use:

* compact page header with the page title as the first visible header element
* muted filter/tab rows where needed
* soft dividers only for major structure
* compact tables or cards depending on the content density
* dummy data only until Supabase and CRUD wiring are approved

Do not add permanent explanatory subtitles under these page titles. Use tab counters, badges, and concise row metadata instead.

## 21C. Archive Page Direction

Archive is project-only in Phase 1.

Archive should be table-first and should stay calmer than the active Projects table.

Use:

* compact archive reason filters
* muted semantic reason badges
* Title Case reason labels in the UI, such as Claimed, Dropped, Scam Risk, Expired, Not Worth, Duplicate, Completed, and Other
* restore actions as explicit controls
* archive date as supporting metadata

Avoid:

* bright archive colors
* treating Archive like Trash
* permanent explanatory captions in the page header
* delete-first language

## 21D. Settings Page Direction

Settings should not feel blank, but it should not pretend future integrations are implemented.

Preview Settings can show sections for:

* profile
* workspace
* account security
* authentication method
* app preferences
* future integrations
* future API key placeholders
* data and storage boundaries

Security rule: do not store or display real API keys, secrets, seed phrases, private keys, recovery phrases, or exchange API secrets unless a future PRD explicitly defines a secure storage model. Future API key sections should be disabled placeholders or safe metadata until approved.

## 21E. Layout Before CRUD Rule

The current implementation is still in layout-first preview mode.

Before CRUD begins, core sidebar pages should be visually acceptable enough that CRUD can be wired without repeatedly changing large layout structures.

Small CRUD-required UI changes are allowed later, such as loading states, empty states, error messages, save states, edit buttons, and confirmation dialogs.

Major page layout changes should be completed before Supabase and server actions are wired, because changing layout after CRUD increases risk and slows debugging.

## 22. Density Rules

The app should be compact but readable.

Use:

* smaller section headers
* compact rows
* limited item counts on Dashboard
* controlled panel heights
* short metadata lines
* clear “View all” links

Avoid:

* oversized cards
* large empty padding
* unnecessary vertical stacking
* long Dashboard scroll
* repeated section headers
* many panels with equal visual weight

---

## 23. Component Rules

### Buttons

Buttons should feel tactile but calm.

Use:

* subtle raised surface
* clear hover state
* muted accent for primary action
* no neon glow

### Badges

Badges should be compact and semantic.

Use badges for:

* status
* frequency
* priority
* source
* type

Avoid large colorful badges.

### Cards / Panels

Panels should be solid surface with soft-depth.

Do not overuse cards on Dashboard.

### Tables

Tables should be compact and readable.

Use sticky headers where useful.

### Drawers

Drawers are preferred for detail/edit flows where context should be preserved.

Good use cases:

* Inbox item detail
* Task detail
* Project quick edit
* Docs metadata edit

---

## 24. Empty / Loading / Error States

Empty states should be useful and compact.

Avoid large illustration-heavy empty states.

Examples:

```txt
No inbox items yet.
Capture a link, note, project idea, or reminder.
```

```txt
No pinned docs.
Pin important research, links, or SOPs to see them here.
```

Loading states should use subtle skeletons.

Error states should be clear and not expose provider internals.

---

## 25. Design Acceptance Checklist

Before closing a visual/design batch, verify:

* Dashboard is a compact opening overview
* Dashboard uses the five-panel grid structure (Section 13)
* Dashboard fits normal desktop view without long scroll
* Dashboard has five standalone panels: Notes desk, Upcoming deadlines, Hunting pulse, Inbox to process, Recent activity
* Dashboard does not duplicate Daily
* Dashboard does not duplicate Projects
* Sidebar includes Inbox and Docs
* Notes are merged into Docs
* Inbox is top-level
* Docs has folder/library direction
* Overview numbers are compact, living inside the Hunting Pulse panel, not large KPI cards
* Notes desk contains pinned and recent Docs entries
* Hunting Pulse contains Overview stat tiles and Category pills, not Running/Recheck
* Dashboard avoids fragmented widget cards and accidental blank middle space
* Visual mood uses premium dark gradient ambience
* Content panels remain mostly solid and readable
* No neon, cyberpunk, heavy glass, noisy texture, or card wall
* Icons are consistent and monochrome
* Semantic colors are muted and purposeful
* Daily remains checklist owner
* Projects remains database owner
* Inbox remains raw input owner
* Docs remains knowledge/notes owner


---

## 26. Dashboard Structure Lock

For the current Phase 1 preview, the implemented UI should follow this final split:

```txt
Dashboard = compact opening overview
Inbox = raw input
Docs = notes, research, links, guides, SOP, templates, and safe access metadata
Daily = full checklist
Projects = full project database
```

Rules:

* Dashboard stays compact and should not become a mini Daily, mini Projects, Gmail clone, analytics wall, or widget wall.
* Dashboard uses the five-panel grid: Notes desk, Upcoming deadlines, Hunting pulse, Inbox to process, Recent activity (Section 13).
* The desktop sidebar stays fixed while the main content area scrolls.
* Inbox and Docs are preview routes with dummy/static data only.
* Notes are merged into Docs for top-level navigation and preview UI.
* Docs may show safe access metadata, such as login URL, username/email, and password location.
* Docs must never show raw passwords, seed phrases, private keys, recovery phrases, exchange API secrets, or 2FA backup codes.
* Gmail integration, multi-email sync, password vault behavior, AI processing, and real database CRUD remain out of scope for this batch.
