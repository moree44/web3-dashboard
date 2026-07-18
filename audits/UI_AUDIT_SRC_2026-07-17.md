# UI Audit - src

Date: 2026-07-17

Reviewed by skills:

| Skill | What it is | How it was used in this audit |
| --- | --- | --- |
| `emil-design-eng` | A design engineering review skill based on Emil Kowalski's philosophy of UI polish, component craft, motion decisions, and invisible details that make interfaces feel right. | Used to review layout, hierarchy, component feel, interaction polish, accessibility details, PRD/DESIGN fit, and to produce Before/After tables. |
| `find-animation-opportunities` | A restrained motion-opportunity skill that searches for places where animation genuinely helps, while rejecting motion that would make a daily product slower or noisier. | Used to identify only high-value motion candidates, provide exact motion values, and document rejected animation ideas. |

Scope:

- Scanned all files under `src/`
- Skipped `src/lib/`
- Skipped `src/middleware.ts`
- Used `emil-design-eng` for UI craft, layout, component polish, and Before/After review
- Used `find-animation-opportunities` for restrained motion opportunities and explicit motion rejections
- Checked recommendations against `AGENTS.md`, `DESIGN.md`, `PROJECT_STATUS.md`, and the Phase 1 product direction in `PRD.MD`

This is an audit file only. No app source code was changed.

## File Manifest

| # | File | Scanned | Notes |
| --- | --- | --- | --- |
| 1 | `src/app/(auth)/layout.tsx` | Yes | Auth route shell |
| 2 | `src/app/(auth)/login/page.tsx` | Yes | Login route |
| 3 | `src/app/(auth)/signup/page.tsx` | Yes | Signup route |
| 4 | `src/app/accounts/page.tsx` | Yes | Accounts route |
| 5 | `src/app/archive/page.tsx` | Yes | Archive route |
| 6 | `src/app/daily/page.tsx` | Yes | Daily route |
| 7 | `src/app/docs/page.tsx` | Yes | Docs route |
| 8 | `src/app/globals.css` | Yes | Theme, base CSS, motion primitives |
| 9 | `src/app/inbox/page.tsx` | Yes | Inbox route |
| 10 | `src/app/layout.tsx` | Yes | Root layout |
| 11 | `src/app/page.tsx` | Yes | Dashboard route |
| 12 | `src/app/projects/page.tsx` | Yes | Projects route |
| 13 | `src/app/settings/page.tsx` | Yes | Settings route |
| 14 | `src/app/tasks/page.tsx` | Yes | Tasks route |
| 15 | `src/components/layout/app-shell.tsx` | Yes | Desktop and mobile app shell |
| 16 | `src/components/layout/app-sidebar.tsx` | Yes | Desktop navigation |
| 17 | `src/components/layout/mobile-nav.tsx` | Yes | Mobile navigation |
| 18 | `src/components/shared/empty-state.tsx` | Yes | Shared empty state |
| 19 | `src/components/shared/error-state.tsx` | Yes | Shared error state |
| 20 | `src/components/shared/loading-state.tsx` | Yes | Shared loading state |
| 21 | `src/components/ui/badge.tsx` | Yes | Badge primitive |
| 22 | `src/components/ui/button.tsx` | Yes | Button primitive |
| 23 | `src/components/ui/card.tsx` | Yes | Card primitive |
| 24 | `src/components/ui/skeleton.tsx` | Yes | Skeleton primitive |
| 25 | `src/features/accounts/components/accounts-preview.tsx` | Yes | Accounts preview UI |
| 26 | `src/features/archive/components/archive-preview.tsx` | Yes | Archive preview UI |
| 27 | `src/features/auth/actions.ts` | Yes | Auth actions, no rendered UI |
| 28 | `src/features/auth/components/auth-shell.tsx` | Yes | Auth page shell |
| 29 | `src/features/auth/components/login-form.tsx` | Yes | Login form |
| 30 | `src/features/auth/components/logout-button.tsx` | Yes | Logout control |
| 31 | `src/features/auth/components/signup-form.tsx` | Yes | Signup form |
| 32 | `src/features/auth/schemas.ts` | Yes | Form validation copy |
| 33 | `src/features/daily/components/daily-preview.tsx` | Yes | Daily preview UI |
| 34 | `src/features/dashboard/components/daily-progress.tsx` | Yes | Dashboard subcomponent |
| 35 | `src/features/dashboard/components/dashboard-preview.tsx` | Yes | Dashboard preview UI |
| 36 | `src/features/dashboard/components/task-preview.tsx` | Yes | Dashboard subcomponent |
| 37 | `src/features/docs/components/docs-preview.tsx` | Yes | Docs preview UI |
| 38 | `src/features/inbox/components/inbox-preview.tsx` | Yes | Inbox preview UI |
| 39 | `src/features/projects/components/projects-preview.tsx` | Yes | Projects preview UI |
| 40 | `src/features/settings/components/settings-preview.tsx` | Yes | Settings preview UI |
| 41 | `src/features/tasks/components/tasks-preview.tsx` | Yes | Tasks preview UI |

## Audit Tables

### `src/app/(auth)/layout.tsx`

| Before | After | Why |
| --- | --- | --- |
| Route layout delegates to auth screens and has no direct interface issue. | Keep as-is. | No UI surface to tune here. |

### `src/app/(auth)/login/page.tsx`

| Before | After | Why |
| --- | --- | --- |
| Route page is a clean composition wrapper. | Keep as-is. | The UI issues live in `login-form.tsx` and `auth-shell.tsx`, not this route. |

### `src/app/(auth)/signup/page.tsx`

| Before | After | Why |
| --- | --- | --- |
| Route page is a clean composition wrapper. | Keep as-is. | The UI issues live in `signup-form.tsx` and `auth-shell.tsx`, not this route. |

### `src/app/accounts/page.tsx`

| Before | After | Why |
| --- | --- | --- |
| Route wrapper delegates to `AccountsPreview`. | Keep as-is. | The audit findings are in `accounts-preview.tsx`. |

### `src/app/archive/page.tsx`

| Before | After | Why |
| --- | --- | --- |
| Route wrapper delegates to `ArchivePreview`. | Keep as-is. | The audit findings are in `archive-preview.tsx`. |

### `src/app/daily/page.tsx`

| Before | After | Why |
| --- | --- | --- |
| Route wrapper delegates to `DailyPreview`. | Keep as-is. | The audit findings are in `daily-preview.tsx`. |

### `src/app/docs/page.tsx`

| Before | After | Why |
| --- | --- | --- |
| Route wrapper delegates to `DocsPreview`. | Keep as-is. | The audit findings are in `docs-preview.tsx`. |

### `src/app/globals.css`

| Before | After | Why |
| --- | --- | --- |
| Motion helpers exist only for modal keyframes: `modal-backdrop-in` and `modal-card-in`. | Add shared motion tokens: `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)`, `--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1)`, `--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1)`. | Both skills point to consistent easing as the base for polished, restrained UI motion. |
| Modal entry uses keyframes only. | Prefer interruptible transition utilities for dynamic UI and use `@starting-style` where practical. | CSS transitions retarget better than keyframes when UI opens and closes quickly. |
| No global reduced-motion policy for local motion utilities. | Add `@media (prefers-reduced-motion: reduce)` that keeps opacity/color transitions and removes transform-based movement. | Reduced motion means gentler motion, not a broken or frozen UI. |
| Hover styles are spread through components without a shared touch-device guard. | Add a reusable hover-capable pattern under `@media (hover: hover) and (pointer: fine)`. | Touch devices can hold hover states after taps. |

### `src/app/inbox/page.tsx`

| Before | After | Why |
| --- | --- | --- |
| Route wrapper delegates to `InboxPreview`. | Keep as-is. | The audit findings are in `inbox-preview.tsx`. |

### `src/app/layout.tsx`

| Before | After | Why |
| --- | --- | --- |
| Root layout correctly loads Geist and Plus Jakarta. | Keep as-is. | Typography setup matches the design direction. |
| `<html lang="en">` is fixed while parts of the product docs and workflow copy are Indonesian-influenced. | Keep `en` for now unless the product intentionally localizes the UI later. | Avoid premature localization work before real content direction is approved. |

### `src/app/page.tsx`

| Before | After | Why |
| --- | --- | --- |
| Route wrapper delegates to `DashboardPreview`. | Keep as-is. | The audit findings are in `dashboard-preview.tsx`. |

### `src/app/projects/page.tsx`

| Before | After | Why |
| --- | --- | --- |
| Route wrapper passes `view` into `ProjectsPreview`. | Keep as-is. | The view logic is appropriate for the current watchlist preview route. |

### `src/app/settings/page.tsx`

| Before | After | Why |
| --- | --- | --- |
| Route wrapper delegates to `SettingsPreview`. | Keep as-is. | The audit findings are in `settings-preview.tsx`. |

### `src/app/tasks/page.tsx`

| Before | After | Why |
| --- | --- | --- |
| Route wrapper delegates to `TasksPreview`. | Keep as-is. | The audit findings are in `tasks-preview.tsx`. |

### `src/components/layout/app-shell.tsx`

| Before | After | Why |
| --- | --- | --- |
| Shell uses `lg:grid-cols-[240px_minmax(0,1fr)]` and a fixed desktop container. | Keep the desktop shell model. | It matches the fixed sidebar plus scrollable content direction in `DESIGN.md`. |
| Mobile content gets `pb-24` while mobile nav and floating action sit fixed. | Verify mobile bottom clearance after wiring real forms and lists. | The structure is right, but dense mobile pages can hide final rows behind fixed controls. |
| Shell has no visible focus skip path. | Consider a hidden `Skip to content` link before the sidebar once pages become keyboard-heavy. | Good workbench UI should stay efficient for keyboard users without animating focus jumps. |

### `src/components/layout/app-sidebar.tsx`

| Before | After | Why |
| --- | --- | --- |
| Projects submenu opens and closes instantly except for chevron rotation. | Keep submenu body mostly instant; do not add a large accordion animation. | Core navigation can be used many times a day. Motion here should stay nearly invisible. |
| Trading is a placeholder link using `href="#"`. | Use a disabled button-like nav item or link to an approved preview route when Trading is ready. | `#` implies navigation but does not move the user anywhere. |
| Active and inactive nav items rely on hover/color only. | Keep color response, but add shared `active:scale-[0.98]` only if inherited from the button/link primitive and very subtle. | Feedback helps, but sidebar animation should not slow core navigation. |
| Inbox count is hardcoded. | Keep muted styling, but later connect to real inbox count with stable width. | Count badges should not cause nav width jitter. |

### `src/components/layout/mobile-nav.tsx`

| Before | After | Why |
| --- | --- | --- |
| Floating quick-create button has no action. | Wire it to an approved quick-create menu or disable/remove it until approved. | A prominent floating button creates a strong expectation. |
| Mobile nav links have no `active:scale` feedback except the floating button. | Add subtle `active:scale-[0.97]` to mobile nav items with `transition-transform 140ms var(--ease-out)`. | Touch navigation needs tactile feedback more than hover styling. |
| Docs is absent from mobile nav by design. | Keep it out of bottom nav, but provide an eventual menu/drawer path. | `DESIGN.md` says Docs can be reached through menu/drawer or Dashboard shortcuts. |

### `src/components/shared/empty-state.tsx`

| Before | After | Why |
| --- | --- | --- |
| Empty state uses a large `min-h-64` with centered content. | Keep default, but allow a compact variant for dense workbench panels. | Large empty states are useful on full pages, but heavy inside tables or side panels. |
| Icon container uses primary color by default. | Prefer muted surface by default and semantic color only when the empty state needs action priority. | Design direction avoids over-coloring non-critical states. |

### `src/components/shared/error-state.tsx`

| Before | After | Why |
| --- | --- | --- |
| Error state uses destructive tint and optional retry. | Keep the semantic treatment. | Error states should be clear and not decorative. |
| Retry button inherits base button without press feedback. | Fix through `button.tsx` shared press feedback. | Shared primitives should carry tactile behavior. |

### `src/components/shared/loading-state.tsx`

| Before | After | Why |
| --- | --- | --- |
| Loading uses simple skeleton blocks. | Keep simple skeletons; do not add shimmer. | The animation opportunity skill rejects richer shimmer here because it adds noise to a productivity OS. |
| Loading card spacing is a little generic. | Add compact variants later for table, row, and side-panel loading. | Dense app areas need skeletons that preserve real layout density. |

### `src/components/ui/badge.tsx`

| Before | After | Why |
| --- | --- | --- |
| Badge primitive is compact and semantic. | Keep sizing and muted semantic variants. | It matches the design rules for status, frequency, priority, source, and type. |
| Badge text uses `text-xs` globally. | Consider a `sm` or `dense` size if tables keep adding `className="text-[10px]"`. | Avoid repeated one-off sizing in dense table views. |

### `src/components/ui/button.tsx`

| Before | After | Why |
| --- | --- | --- |
| Base button uses `transition-colors` only. | Add `transition-[background-color,color,border-color,transform] duration-150 ease-out active:scale-[0.97]`. | Buttons should confirm the interface heard the press. |
| Button variants do not include a raised/tactile default surface except where `soft-control` is manually added. | Consider a `raised` or `soft` variant that encodes the accepted control style. | Repeating `soft-control` manually makes tactile polish inconsistent. |
| No reduced-motion handling for transform press feedback. | In reduced motion, keep color/border transition and disable scale. | Transform feedback should respect motion sensitivity. |

### `src/components/ui/card.tsx`

| Before | After | Why |
| --- | --- | --- |
| Card primitive uses `rounded-xl`, border, `bg-card`, and `py-5`. | Keep as a generic primitive, but avoid using it for page sections on dashboard/workbench screens. | `DESIGN.md` prefers solid panels and avoids card walls. |
| Card does not encode soft-depth. | Consider adding `soft-panel` only where the primitive is used as an actual card, not nested inside another panel. | Depth should be consistent but not over-applied. |

### `src/components/ui/skeleton.tsx`

| Before | After | Why |
| --- | --- | --- |
| Skeleton uses `animate-pulse`. | Keep pulse subtle. | A richer shimmer was considered and rejected because it adds motion noise. |
| Skeleton has no reduced-motion override here. | Add reduced-motion handling in global CSS if needed. | Loading should not create unnecessary motion for sensitive users. |

### `src/features/accounts/components/accounts-preview.tsx`

| Before | After | Why |
| --- | --- | --- |
| Identities use cards while Wallets use a desktop-only table. | Add compact mobile wallet cards for the Wallets tab. | On mobile, the Wallets content is hidden because the table is `lg:block` only. |
| Tab content swaps instantly between Identities, Wallets, and Groups. | Add a very subtle panel entry: `opacity 140ms var(--ease-out), transform 140ms var(--ease-out)` from `translateY(3px)`. | Occasional tab changes benefit from preventing a jarring content swap. |
| Account cards show metrics as large mini KPI boxes. | Reduce metric visual weight or convert to inline metadata rows. | Accounts should feel like identity records, not analytics cards. |
| Search input changes placeholder based on tab, but Groups still says search accounts. | Use tab-specific placeholder for Groups. | Small text details compound into a cleaner workbench feel. |
| Filter chips `Workspace scoped` and `Wallet usage` look clickable but are static. | Either wire them, mark them as status chips, or remove until functional. | Controls should not pretend to be active filters. |

### `src/features/archive/components/archive-preview.tsx`

| Before | After | Why |
| --- | --- | --- |
| Archive reason badges render lowercase values like `claimed` and `scam risk`. | Render Title Case labels: `Claimed`, `Scam Risk`, `Not Worth`, `Duplicate`. | `DESIGN.md` explicitly calls for Title Case reason labels. |
| A preview archived project uses `hunt: "Trading"`. | Remove Trading from project archive examples or move it to a future Trading ledger preview. | PRD says Trading is not a Projects category. |
| `Restore selected` appears active without row selection. | Hide it, disable it, or add visible selection checkboxes. | Active bulk actions without selection state feel unfinished. |
| `Archived date` and `Reason filter` look clickable but are static. | Either wire filters, make them disabled, or style as preview chips. | Static controls create false affordances. |
| Archive mobile cards omit the result detail. | Include the result line in mobile cards. | Archive review depends on reason and result context. |

### `src/features/auth/actions.ts`

| Before | After | Why |
| --- | --- | --- |
| No rendered UI in this file. | Keep UI audit findings in the form components. | Actions are out of visual scope. |
| Server error strings flow into form alerts. | Keep messages short and user-safe, without internal generated email. | Auth UI must never expose the Supabase adapter email. |

### `src/features/auth/components/auth-shell.tsx`

| Before | After | Why |
| --- | --- | --- |
| Auth shell uses a plain full-screen centered card. | Keep the calm centered auth shell. | It avoids marketing-page treatment and matches personal-first scope. |
| Auth surface uses `bg-secondary` and `border-border/20`, slightly flatter than app shell. | Add a faint `soft-panel` treatment or align surface tokens with the app shell. | Auth should feel part of the same premium OS without becoming decorative. |
| Auth title is fine, but the icon block has no workspace identity text. | Optional: add compact `Hunting OS` identity text near the mark if the screen feels too anonymous. | A private workbench should feel personal, but not like a landing page. |

### `src/features/auth/components/login-form.tsx`

| Before | After | Why |
| --- | --- | --- |
| Inputs show errors visually but do not wire `aria-invalid` and `aria-describedby`. | Add ids for hint/error text and connect them to inputs. | Accessibility details make forms feel reliable. |
| Submit button changes text while submitting. | Keep behavior, but consider a small spinner only if submit latency becomes noticeable. | Avoid decorative loading unless it communicates waiting. |
| Input class is local and duplicated with signup. | Extract a shared auth field primitive after CRUD/auth stabilizes. | Reduces drift between login and signup polish. |

### `src/features/auth/components/logout-button.tsx`

| Before | After | Why |
| --- | --- | --- |
| Logout button is a simple sidebar row with hover only. | Let it inherit shared button/link press feedback or add `active:scale-[0.98]`. | Destructive-ish actions should feel deliberate and responsive. |
| Logout is a full-width row with no confirmation. | Keep no confirmation for now. | Logout is reversible through login and should stay quick. |

### `src/features/auth/components/signup-form.tsx`

| Before | After | Why |
| --- | --- | --- |
| Inputs show hints and errors but do not wire `aria-invalid` and `aria-describedby`. | Add ids for hint/error text and connect them to inputs. | Screen readers should get the same form guidance sighted users get. |
| Hint text can compete with labels on narrow widths. | Stack hint under the label on small screens. | Prevents cramped label rows on mobile. |
| Input class is duplicated with login. | Extract a shared auth field primitive after auth UI settles. | Keeps form polish consistent. |

### `src/features/auth/schemas.ts`

| Before | After | Why |
| --- | --- | --- |
| No rendered UI in this file. | Keep as-is. | Validation copy appears through forms and is currently clear enough. |
| Username validation rejects uppercase as required. | Keep this behavior and keep UI copy explicit. | Matches PRD username rules. |

### `src/features/daily/components/daily-preview.tsx`

| Before | After | Why |
| --- | --- | --- |
| Expanded checklist bodies mount instantly. | Add subtle body entry only: `opacity 160ms var(--ease-out), transform 160ms var(--ease-out)` from `translateY(-4px)`. | State indication helps without making daily checklist work feel slow. |
| `MoreHorizontal` inside the section toggle is a `span` with `aria-label`. | Make it a real button or remove its label until actionable. | A labeled non-button is confusing for assistive tech and mouse users. |
| Task completion checkbox has no accessible label. | Add `aria-label` like `Mark Soundness task done`. | Daily is a core workflow and needs reliable controls. |
| Date button is visual only. | Disable it or wire a date picker when approved. | Static controls should not look functional. |
| Running and recheck panel is well placed in Daily. | Keep it here, not on Dashboard. | Matches PRD ownership. |

### `src/features/dashboard/components/daily-progress.tsx`

| Before | After | Why |
| --- | --- | --- |
| Component appears to represent daily progress on Dashboard. | Use only if Dashboard keeps a compact Today Brief, not a full Daily preview. | Dashboard should not duplicate Daily. |
| Progress visuals can become KPI-like. | Keep any progress display as a compact signal row. | PRD rejects KPI-wall dashboard treatment. |

### `src/features/dashboard/components/dashboard-preview.tsx`

| Before | After | Why |
| --- | --- | --- |
| Dashboard is multiple separate panels: Notes desk, Deadlines, Hunting pulse, Inbox, Recent activity. | Re-align to `Header + Quick Capture`, compact status line, `Today Desk | Signal Rail`. | `DESIGN.md` locks Dashboard V3 to one Today Desk and one Signal Rail. |
| Running/Recheck appears inside Hunting pulse. | Remove Running/Recheck from Dashboard and keep it in Daily/Tasks/Projects. | PRD and design direction remove Running/Recheck from Dashboard. |
| Overview metrics are rendered as tiles in Hunting pulse. | Use one compact horizontal status line instead of mini KPI tiles. | Dashboard should be scannable, not analytics-first. |
| Quick Capture is a static well with action buttons. | Either make the capture well focusable/input-like or visually mark it as preview-only. | A search/capture well should not pretend to accept text if it does not. |
| Many row buttons rely on hover only. | Use shared press feedback and avoid row entrance animation. | Row animation in dashboard lists would add noise. |

### `src/features/dashboard/components/task-preview.tsx`

| Before | After | Why |
| --- | --- | --- |
| Task preview can make Dashboard feel like a mini Daily page. | Use this only for compact links/signals, not a checklist surface. | Daily owns execution. Dashboard owns overview. |
| Row buttons rely on hover only. | Use shared press feedback if kept. | Press feedback is enough; no list animation needed. |

### `src/features/docs/components/docs-preview.tsx`

| Before | After | Why |
| --- | --- | --- |
| H1 is long: `Notes, research, links, and safe access metadata`. | Use compact title `Docs` and move descriptors into folder/search context if needed. | Workbench pages should not feel like landing sections. |
| Search area is a static `div` with placeholder text. | Use a real input or restyle as a non-interactive preview surface. | It currently looks interactive but cannot receive focus. |
| Pinned docs use three cards. | Keep pinned docs compact, but avoid expanding into card-wall layout as data grows. | Docs should be a library, not a marketing card grid. |
| Folder cards are appropriate. | Keep them compact and use list/table layout inside folders later. | Matches `DESIGN.md` Docs direction. |
| Safe access metadata warning is useful but visually large. | Keep the warning, but make it collapsible or compact once real Docs content exists. | Security guidance matters, but should not dominate daily library use. |

### `src/features/inbox/components/inbox-preview.tsx`

| Before | After | Why |
| --- | --- | --- |
| Inbox detail is a right-side static panel, not a drawer. | Later convert selected item detail to a drawer or persistent side panel with selection state. | `DESIGN.md` prefers detail drawers/panels for triage context. |
| Search area is a static `div` with placeholder text. | Use a real input or mark it as preview-only. | Search should be keyboard-focusable when it looks like a field. |
| Inbox list rows are buttons but no selected row state is shown. | Add selected row styling matching the right panel. | Triage needs a clear relationship between list and detail. |
| Action buttons are static placeholders. | Disable them or wire preview state. | Processing actions are central to Inbox and should not look complete if inactive. |
| Row hover only. | Use shared press feedback, no row entrance animation. | Inbox is a repeated triage workflow. Keep motion restrained. |

### `src/features/projects/components/projects-preview.tsx`

| Before | After | Why |
| --- | --- | --- |
| Project detail side panel appears instantly from the right. | Add drawer motion: `transform translateX(100%)` to `translateX(0)`, `opacity 0` to `1`, `260ms var(--ease-drawer)` for transform and `180ms var(--ease-out)` for opacity. | Occasional drawer openings benefit from spatial consistency. |
| Add Project modal uses keyframe entry. | Prefer shared modal transition utilities with `@starting-style`, keep modal origin centered. | Modals are occasional and should feel responsive without custom keyframe drift. |
| Dropdowns and date picker appear instantly from trigger. | Add popover entry: `opacity 150ms var(--ease-out), transform 150ms var(--ease-out)` from `translateY(-2px) scale(0.97)`, origin top-left. | Custom menus should feel connected to their trigger. |
| Custom selects and comboboxes lack listbox roles and keyboard navigation. | Add `aria-haspopup`, `role="listbox"`, `role="option"`, `aria-selected`, Escape close, and arrow navigation. | Native-like custom controls need accessibility details. |
| Project tabs for hunt categories use `href="/projects"` but do not filter. | Wire filters or style inactive categories as disabled preview chips. | A tab that navigates to the same unfiltered view feels broken. |
| More-filter and column buttons are static. | Disable, wire, or mark as preview-only. | False affordances hurt trust before CRUD. |
| Table rows are dense and stable. | Do not animate table row entrances. | Projects is a high-frequency database view and should stay still. |

### `src/features/settings/components/settings-preview.tsx`

| Before | After | Why |
| --- | --- | --- |
| `Save changes` is active while fields are read-only. | Remove it, disable it, or add editable preview controls. | Active controls should do something. |
| Settings content is shallow compared with the approved direction. | Expand into compact sections: Profile, Workspace, Security, Preferences, Future Integrations, Data Boundaries. | `DESIGN.md` says Settings should not feel blank but must not pretend future integrations are implemented. |
| MVP boundary copy is useful but reads like documentation. | Convert to muted status rows or disabled setting rows. | Settings should feel like an app surface, not a static note. |
| Future integrations are absent. | Add disabled placeholders only, no real keys or secret storage. | PRD forbids live integrations and real secret storage in this phase. |

### `src/features/tasks/components/tasks-preview.tsx`

| Before | After | Why |
| --- | --- | --- |
| Task detail side panel appears instantly from the right. | Add the same drawer motion as Projects: `260ms var(--ease-drawer)` transform and `180ms var(--ease-out)` opacity. | Detail panels should share a spatial language. |
| Add Task modal and dropdowns repeat custom control patterns from Projects. | Extract shared modal/select/date primitives before wiring CRUD. | Prevents drift in keyboard behavior, labels, spacing, and motion. |
| Newly created preview task appears instantly in the list/board. | Animate only the new item: `opacity 0; transform translateY(4px)` to settled over `180ms var(--ease-out)`. | Occasional insertions benefit from a bridge without animating the whole table. |
| Board/list/running/recheck view switches replace large content blocks instantly. | Add a very subtle opacity-only transition if needed, but avoid board column staggers. | View swaps are occasional, but board content is functional data. |
| Custom filters lack full listbox semantics and Escape/outside-close handling. | Add the same accessible menu behavior as Project controls. | Filter controls are core to task work. |
| Board lanes use fixed width and compact cards. | Keep this. | It matches the Tasks page direction and avoids noisy kanban styling. |

## Animation Opportunities That Passed The Gate

| # | Location | Today | Purpose | Frequency | Suggested motion |
| --- | --- | --- | --- | --- | --- |
| 1 | `src/components/ui/button.tsx` | Buttons mostly change color only. | Feedback | Tens/day | `:active { transform: scale(0.97); }` with `transition: transform 160ms cubic-bezier(0.23, 1, 0.32, 1), background-color 160ms ease, color 160ms ease`. Reduced motion: remove transform and keep color. |
| 2 | `src/features/projects/components/projects-preview.tsx`, `src/features/tasks/components/tasks-preview.tsx` | Detail drawers appear instantly. | Spatial consistency | Occasional | Drawer enters from right: `opacity: 0; transform: translateX(100%)` to `opacity: 1; transform: translateX(0)`, `transition: transform 260ms cubic-bezier(0.32, 0.72, 0, 1), opacity 180ms cubic-bezier(0.23, 1, 0.32, 1)`. Exit same path. Reduced motion: opacity 140ms only. |
| 3 | `src/features/projects/components/projects-preview.tsx`, `src/features/tasks/components/tasks-preview.tsx` | Dropdown menus and date popovers pop in instantly. | Spatial consistency | Occasional | Popover entry from trigger: `transform-origin: top left; @starting-style { opacity: 0; transform: translateY(-2px) scale(0.97); } transition: opacity 150ms cubic-bezier(0.23, 1, 0.32, 1), transform 150ms cubic-bezier(0.23, 1, 0.32, 1)`. Reduced motion: opacity 120ms only. |
| 4 | `src/features/daily/components/daily-preview.tsx` | Expanded checklist content mounts instantly. | State indication | Tens/day | Inner body only: `@starting-style { opacity: 0; transform: translateY(-4px); } transition: opacity 160ms cubic-bezier(0.23, 1, 0.32, 1), transform 160ms cubic-bezier(0.23, 1, 0.32, 1)`. Reduced motion: opacity 100ms only. |
| 5 | `src/features/accounts/components/accounts-preview.tsx` | Tab content swaps abruptly. | Preventing a jarring change | Occasional | Tab panel: `@starting-style { opacity: 0; transform: translateY(3px); } transition: opacity 140ms cubic-bezier(0.23, 1, 0.32, 1), transform 140ms cubic-bezier(0.23, 1, 0.32, 1)`. Reduced motion: opacity 100ms only. |
| 6 | `src/features/tasks/components/tasks-preview.tsx` | New preview task inserts instantly. | Preventing a jarring change | Occasional | New row/card only: `@starting-style { opacity: 0; transform: translateY(4px); } transition: opacity 180ms cubic-bezier(0.23, 1, 0.32, 1), transform 180ms cubic-bezier(0.23, 1, 0.32, 1)`. No stagger. Reduced motion: opacity 100ms only. |

## Animation Candidates Rejected

| Candidate | Rejection |
| --- | --- |
| Sidebar nav open/close and route active movement in `app-sidebar.tsx` | Rejected: core navigation can be used 100+ times/day. Keep it instant. |
| Animated dashboard metric counts in `dashboard-preview.tsx` | Rejected: functional data the user is scanning. Decoration hinders. |
| Project table row entrances in `projects-preview.tsx` | Rejected: dense database view. Frequent scanning should stay still. |
| Task board column stagger in `tasks-preview.tsx` | Rejected: board is functional work management. Stagger slows repeated use. |
| Rich skeleton shimmer in `skeleton.tsx` | Rejected: existing pulse is enough for this calm productivity OS. |

## Highest Priority Fix Order

| Priority | Change | Why |
| --- | --- | --- |
| 1 | Re-align Dashboard toward `Today Desk | Signal Rail` and remove Running/Recheck from Dashboard. | Biggest PRD and design alignment issue. |
| 2 | Add shared button press feedback and shared motion tokens. | Small effort, broad feel improvement. |
| 3 | Add drawer motion and accessible close behavior to Project and Task detail panels. | High leverage spatial consistency for occasional detail flows. |
| 4 | Make custom selects/date popovers accessible and lightly animated. | These controls are central to Add Project and Add Task. |
| 5 | Polish Accounts, Archive, and Settings against the `/projects` baseline. | Matches `PROJECT_STATUS.md` recommended next visual cleanup. |
| 6 | Replace static fake controls with disabled, preview-only, or wired controls. | Reduces false affordances before CRUD. |

## Verdict

The interface is already close to the right restrained motion profile for a daily Web3 workbench. It does not need animated metrics, table row entrances, board staggers, or sidebar motion. The strongest improvements are layout alignment on Dashboard, better tactile primitives, drawer spatial consistency, accessible custom controls, and cleaning up static preview controls that look interactive.
