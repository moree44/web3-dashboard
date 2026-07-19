# PRD — Web3 Hunting OS

**Version:** 3.0
**Status:** Implementation-ready draft. Supersedes v2.8. Synced against current UI implementation and product decisions made after v2.8.
**Primary Use:** Personal Web3 hunting workbench
**Product Type:** Private Web3 activity tracker, inbox, notes system, task manager, account/wallet tracker, project dashboard, and personal trading ledger
**Stack:** Next.js 15 · TypeScript · Tailwind CSS · shadcn/ui · Supabase PostgreSQL · Supabase Auth · Supabase Storage · Supabase RLS · Drizzle ORM · Zod · React Hook Form · Vercel

### v3.0 Phasing Note

To reach a usable state quickly, implementation is split into two waves within Phase 1:

```
Phase 1 Core       Auth, Workspace, Inbox, Docs, Accounts, Wallets,
                    Projects, Tasks, Daily, Archive
                    → build and ship first

Phase 1.5          Trading (Trade Log, Portfolio, Token Watchlist),
                    Personal Items, Settings Integrations
                    → fully specified in this document, built as
                      a fast-follow after Core is usable
```

Both waves are fully specified below so implementation does not need to pause for further spec work. Phase 1.5 items are marked accordingly in their section headers.

---

## 1. Product Overview

Web3 Hunting OS adalah aplikasi private personal untuk mencatat, mengelola, dan menjalankan aktivitas Web3 hunting dengan lebih cepat dan jelas daripada workflow Notion sebelumnya.

Produk ini bukan SaaS pada Phase 1. Fokusnya adalah satu user yang mengelola banyak project, persona/account, wallet, task, daily activity, inbox item, notes, archive, dan activity log dari desktop.

Aplikasi menggantikan workflow Notion yang digunakan untuk:

* testnet dan grind project
* node / CLI running
* role grinding
* NFT mint / whitelist
* retroactive interaction
* waitlist / early access
* trading activity
* portfolio wallet dan trade journal
* daily checklist
* account dan wallet usage
* project notes
* global notes
* raw input / inbox item
* archive / result tracking

Notion menjadi lambat dan sulit dipindai ketika database, relations, dan content bertambah. Web3 Hunting OS harus mempertahankan fleksibilitas database-style workflow tetapi terasa lebih cepat, lebih terstruktur, dan lebih mudah digunakan setiap hari.

Database tetap future-ready untuk workspace/member system, tetapi MVP tetap personal-first.

---

## 2. Main Problem

Workflow Notion lama masih kurang clean karena:

* sulit tahu account mana yang sudah mengerjakan task tertentu
* daily checklist per account belum jelas
* wallet yang dipakai per project sering dicatat manual
* project yang sudah cair, scam risk, dropped, atau expired bercampur di Trash
* relasi antara project, account, wallet, task, dan notes belum smooth
* tidak ada tempat cepat untuk menaruh raw idea, link, email copy, atau reminder sebelum diproses
* catatan global dan catatan project sering bercampur
* tidak ada dashboard personal yang berfungsi seperti meja kerja harian
* tambah task baru terasa berat karena harus isi banyak field sekaligus

---

## 3. Product Goals

Tujuan utama:

* menjadi personal command desk untuk Web3 hunting
* menyediakan tempat cepat untuk capture raw input
* memisahkan Inbox, Docs, Daily, Projects, dan Trading secara jelas
* mengelola ratusan active dan archived projects tanpa clutter
* membuat project database lebih cepat dipindai daripada Notion
* memudahkan tracking project, task, account, dan wallet
* menampilkan daily checklist per account
* menyimpan history task dan activity log
* memisahkan active, running, recheck, archive, dan claimed result
* menyediakan global notes dan project notes yang terstruktur
* membuat task entry cepat — ketik judul, Enter, selesai
* mengutamakan read/write workflow, bukan analytics atau presentation
* tetap terasa personal, calm, dan focused; bukan terminal, cyberpunk, atau SaaS admin panel

---

## 4. Product Mental Model

Dashboard bukan mini Daily page.

Dashboard bukan mini Projects page.

Dashboard adalah personal desk.

Formula utama:

```txt
Dashboard = Inbox + Docs + Pulse
Daily = full checklist
Projects = full project database
```

Artinya:

* Dashboard digunakan untuk melihat input mentah, pinned docs, recent docs, dan pulse penting.
* Daily digunakan untuk eksekusi checklist penuh.
* Projects digunakan untuk mengelola database project penuh.
* Tasks digunakan untuk cross-project task management.
* Inbox digunakan untuk raw input yang belum diproses.
* Docs digunakan untuk knowledge, alpha notes, strategy, setup notes, links, templates, SOP/checklist, dan referensi ringan.

---

## 5. Target User

### Primary User

Personal Web3 hunter yang mengelola banyak project, account, wallet, email waitlist, notes, dan aktivitas harian.

Contoh account/persona:

* Moree
* Wdym
* Wayss
* account tambahan di masa depan

### Future User

Partner atau tim kecil yang bisa masuk ke workspace yang sama.

Namun untuk MVP, fitur invite member dan role management UI tidak perlu dibangun dulu.

---

## 6. Authentication Decision

Aplikasi wajib menggunakan login system.

### User-Facing Auth

UI autentikasi MVP menggunakan:

```txt
Username + password
```

User tidak diminta memasukkan email dan tidak melalui email verification.

Signup fields:

```txt
username
display_name
password
password_confirmation
```

Login fields:

```txt
username
password
```

### Username Rules

`username` harus:

* lowercase
* 3–24 characters
* hanya menggunakan `a-z`, `0-9`, dan underscore
* unique

Validation pattern:

```txt
^[a-z0-9_]{3,24}$
```

Whitespace di awal/akhir dibuang. Uppercase dan karakter di luar pattern ditolak, bukan disimpan diam-diam.

### Supabase Auth Adapter

Supabase Auth tetap digunakan sebagai auth provider.

Karena Supabase password auth membutuhkan email atau phone, server membentuk email internal dari username:

```txt
{normalized_username}@web3-hunting.local
```

Rules:

* internal email hanya adapter identifier untuk Supabase Auth
* internal email tidak pernah ditampilkan sebagai login identifier utama
* internal email tidak boleh muncul di form, navigation, profile summary, atau activity log
* username dan `display_name` disimpan di Supabase user metadata
* uniqueness username untuk MVP ditegakkan oleh uniqueness internal email di Supabase Auth
* account/persona email pada Account Model adalah data tracking yang berbeda dari auth email

### Auth Flow

```txt
1. User signs up with username, display name, and password
2. Server validates username and builds the internal email
3. Supabase Auth creates the user without email verification
4. Username and display name are stored in user metadata
5. On the first authenticated app request, the system ensures a personal workspace exists
6. User is redirected to the protected app
```

Login menggunakan username untuk membentuk internal email yang sama, kemudian memanggil Supabase password sign-in.

Authentication errors harus aman dan tidak menampilkan internal email atau detail provider.

### Personal Workspace Rule

Aplikasi primarily personal-first.

Setiap user punya satu default workspace otomatis. Nama workspace menggunakan:

```txt
{display_name} Hunting OS
```

Fallback jika display name kosong:

```txt
{username} Hunting OS
```

Semua data seperti inbox items, notes, projects, accounts, wallets, tasks, notes, dan logs harus memiliki `workspace_id`.

### MVP Scope

Build:

* username signup
* username login
* logout
* session handling
* protected routes
* default workspace auto-create

Do not build yet:

* email verification page or flow
* user-facing auth email fields
* Google login
* invite member UI
* switch workspace UI
* role permission UI
* billing
* organization settings

### Supabase Configuration Requirement

For MVP, Supabase email confirmation must be disabled because generated internal emails are not deliverable user addresses. Public signup remains enabled.

---

## 7. Deployment Decision

Deployment menggunakan kombinasi:

```txt
Frontend hosting: Vercel
Backend platform: Supabase
```

### Final Architecture

```txt
Next.js App
  ↓
Hosted on Vercel

Supabase
  ├── Auth
  ├── PostgreSQL
  ├── Storage
  ├── RLS
  └── Edge Functions later if needed
```

### Reason

Supabase menjadi backend core untuk data, login, storage, dan future backend tools.

Vercel digunakan untuk host frontend Next.js agar deploy lebih smooth, terutama untuk App Router, Server Components, Server Actions, GitHub deploy, dan preview deployment.

---

## 8. Core Product Concept

Produk ini memakai konsep utama:

```txt
Account = persona / identitas kerja
Wallet = address yang digunakan
Project = garapan Web3
Task = pekerjaan dalam project
Task Log = bukti/status aktivitas per hari
Personal Item = checklist pribadi tanpa project (Phase 1.5)
Inbox Item = raw input yang belum diproses
Note = catatan personal atau project knowledge (satu sistem, lihat Section 10)
Trade Log = satu baris histori trade CEX (Phase 1.5)
Portfolio Holding = saldo wallet/CEX pada satu titik waktu (Phase 1.5)
```

Relasi utama:

```txt
Workspace
├── Inbox
├── Docs
│   └── Notes (global, dan project-linked via linked_project_id)
├── Accounts
│   └── Wallets (owner_account_id)
├── Wallet Groups
│   └── Wallets (wallet_group_id, untuk wallet tanpa owner tunggal)
├── Projects
│   ├── Assigned Accounts
│   ├── Assigned Wallets (project_wallet)
│   ├── Tasks
│   │   └── Task Logs
│   └── Activity Logs
├── Daily
│   ├── Task Checklist (task dengan project_id)
│   └── Personal Items (checklist tanpa project_id) — Phase 1.5
├── Trading — Phase 1.5
│   ├── Trade Logs
│   ├── Portfolio Holdings
│   ├── Portfolio Transfers
│   └── Token Watchlist
└── Archive (project-only)
```

### Catatan Relasi Penting

**Wallet punya dua entry point pembuatan, satu sumber data:**

```txt
Dibuat dari Account detail
  → owner_account_id otomatis ke-set ke account itu
  → wallet_type default "main", bisa diubah manual

Dibuat dari Project detail
  → wallet_type otomatis "project_wallet"
  → otomatis linked ke project itu
  → owner_account_id tetap harus dipilih manual

Wallet tanpa owner (owner_account_id = null)
  → masuk wallet_group (mis. "L1", "Burner")
  → dipakai untuk wallet acak lintas-project
```

Kedua jalur di atas menulis ke tabel `wallets` yang sama. Tidak ada tabel wallet terpisah per entry point.

**`chain_type` pada wallet adalah free text, bukan enum.** Boleh diisi EVM, Solana, Sui, Aptos, Cosmos, atau chain apa pun — tidak dibatasi daftar tetap.

**Notes adalah satu sistem, bukan dua.** Note yang ditulis dari dalam Project Detail dan note global di halaman Docs sama-sama masuk ke tabel `notes` yang sama, dibedakan lewat `linked_project_id`. Tidak ada tabel `project_notes` terpisah. Lihat Section 10 untuk detail.

**Task vs Personal Item.** Task selalu terikat ke `project_id` dan punya assigned accounts/wallet/proof. Personal Item tidak terikat project sama sekali, field-nya lebih ringan (judul, frekuensi, catatan opsional), untuk checklist pribadi non-crypto seperti cek berita atau update market. Lihat Section 20A.

---

## 9. Inbox System

Inbox adalah tempat untuk raw input sebelum menjadi project, task, note, atau archived item.

Inbox bukan email-only.

Phase 1 Inbox bersifat manual-first.

Future versions dapat menambahkan Gmail dan multi-email integration.

### Phase 1 Inbox Sources

```txt
manual
quick_capture
```

### Future Inbox Sources

```txt
gmail
twitter_x
browser_extension
api
```

Only manual and quick_capture are in Phase 1.

### Inbox Item Examples

```txt
New project link
Waitlist reminder
Mint link
Eligibility result
Campaign reminder
Project update
Raw note
Email copied manually
X thread copied manually
```

### Inbox Item Fields

```txt
id
workspace_id
source
title
content
url
sender
received_at
status
priority
detected_project_name
linked_project_id
linked_task_id
linked_note_id
created_at
updated_at
```

### Inbox Source

```txt
manual
quick_capture
gmail
twitter_x
browser_extension
api
```

Only `manual` and `quick_capture` are used in Phase 1.

### Inbox Status

```txt
new
reviewing
linked
converted
ignored
archived
```

| Status    | Description                            |
| --------- | -------------------------------------- |
| new       | Baru masuk dan belum diproses          |
| reviewing | Sedang dicek                           |
| linked    | Sudah dihubungkan ke project/task/note |
| converted | Sudah dibuat menjadi project/task/note |
| ignored   | Tidak relevan                          |
| archived  | Disimpan tapi tidak aktif              |

### Inbox Priority

```txt
high
medium
low
```

### Inbox Actions

User can process an inbox item into:

```txt
Create Project
Create Task
Save as Note
Link to Existing Project
Link to Existing Task
Archive
Ignore
```

### Inbox Rules

```txt
Inbox items are raw and should not automatically become projects or tasks.
User confirmation is required before conversion.
Dashboard should show a compact Inbox to Process preview.
Full inbox management lives in the Inbox page.
```

---

## 10. Docs / Notes System

**v3.0 change:** Notes adalah satu sistem tunggal. Tidak ada lagi tabel `project_notes` terpisah dari tabel `notes`. Note yang ditulis dari dalam Project Detail dan note global di Docs sama-sama disimpan di tabel `notes`, dibedakan lewat `linked_project_id`.

Aplikasi memakai label UI `Docs`. Docs adalah tempat untuk semua notes: knowledge umum, temuan project, temuan tools, guide, SOP, template, dan safe access metadata.

### Note Fields (tabel tunggal)

```txt
id
workspace_id
title
content
note_type
pinned
linked_project_id
linked_task_id
linked_account_id
linked_wallet_id
linked_inbox_item_id
created_at
updated_at
```

### Note Types

```txt
general
alpha
research
setup
commands
links
reminder
strategy
result
private_note
keys_hint
```

### Folder System

Docs ditampilkan dalam struktur folder + notes di dalamnya, bukan flat list. Folder adalah kategori tampilan (bisa berbasis `note_type`, atau kategori manual), bukan tabel terpisah — cukup grouping di level UI/query.

Folder default:

```txt
Research
Tools & Links
Guides / SOP
Project References     — otomatis berisi semua note dengan linked_project_id terisi
Accounts & Access
Templates
Personal Notes
```

Folder "Project References" adalah view otomatis: semua `notes` yang punya `linked_project_id` muncul di sini, dikelompokkan per project. Note yang ditulis dari dalam Project Detail otomatis masuk folder ini tanpa aksi tambahan dari user.

### Notes Rules

```txt
Notes can be global or linked to a project (or task/account/wallet/inbox item).
Writing a note from inside Project Detail automatically sets linked_project_id.
Pinned notes may appear on the dashboard.
Recent notes may appear on the dashboard.
Never store seed phrases, raw private keys, recovery phrases, exchange API secrets, or sensitive passwords.
```

### Security Rule

Jangan simpan seed phrase atau private key asli di database.

Boleh simpan:

* public address
* wallet label
* hint lokasi penyimpanan
* notes non-sensitive
* command setup
* generated public key
* GitHub link
* proof link

Safe example:

```txt
Private key stored in local vault
```

Unsafe example:

```txt
seed phrase / raw private key
```

---

## 11. Account Model

Account adalah persona utama yang digunakan untuk mengerjakan project.

Contoh:

```txt
Moree
Wdym
Wayss
```

Account dapat memiliki:

* label
* avatar / initials
* color
* X username
* X URL
* Discord username
* email
* notes
* banyak wallet

Important rule:

```txt
Account is not Wallet.
Account is persona.
Wallet is address.
```

Account email adalah tracking data, bukan auth email.

---

## 12. Wallet Model

Wallet adalah address yang digunakan dalam project atau task.

Wallet bisa:

* dimiliki oleh account tertentu
* masuk ke wallet group tertentu
* digunakan di satu project
* digunakan di banyak project
* tidak punya owner account

### Wallet Types

```txt
main
project_wallet
burner
l1
testnet
retro
nft
other
```

### Explanation

| Type           | Description                          |
| -------------- | ------------------------------------ |
| main           | Wallet utama milik account           |
| project_wallet | Wallet khusus untuk project tertentu |
| burner         | Wallet sementara / burner            |
| l1             | Wallet random / L1 wallet            |
| testnet        | Wallet khusus testnet                |
| retro          | Wallet untuk retro interaction       |
| nft            | Wallet untuk mint / whitelist        |
| other          | Lainnya                              |

### Wallet Groups

Wallet group digunakan untuk mengelompokkan wallet yang bukan persona utama.

Contoh:

```txt
L1
Burner
Retro Wallets
NFT Mint Wallets
Project Specific
```

Contoh struktur:

```txt
Moree
├── Moree EVM Main
├── Moree SOL Main
└── Project Wallet tertentu

Wdym
├── Wdym EVM Main
└── Wdym SOL Main

L1
├── L1 Wallet 01
├── L1 Wallet 02
└── L1 Wallet 03
```

### Rule

Jika sebuah project membuat wallet baru khusus untuk project itu, wallet tersebut harus dibuat sebagai:

```txt
project_wallet
```

Jika wallet adalah random/burner yang bisa dipakai di banyak project, wallet tersebut masuk ke group:

```txt
L1
Burner
Retro Wallets
```

L1 adalah wallet type atau wallet group, bukan account/persona.

---

## 13. Project Model

Project adalah satu garapan Web3.

Contoh:

* Soundness
* Linera
* Huddle01
* NexusHQ
* Drosera
* GensynAI
* ORO AI
* Dawn
* PondGNN

Project bisa dihubungkan ke:

* banyak account
* banyak wallet
* banyak task
* banyak notes
* banyak activity logs
* inbox items

### Project Fields

```txt
id
workspace_id
name
slug
description
logo_url
logo_path
logo_source
hunt_type
status
priority
work_types[]
project_types[]
progress_estimate
stage_result
date_start
date_end
website_url
twitter_url
discord_url
github_url
docs_url
notes
is_archived
archive_reason
archived_at
created_at
updated_at
```

---

## 14. Hunt Types

Hunt type adalah kategori besar project.

```txt
free_hunts
retro
nft
waitlist
```

| Hunt Type  | Description                                                           |
| ---------- | --------------------------------------------------------------------- |
| free_hunts | Testnet, node, CLI, role grinding, point farming, Galxe, Zealy, badge |
| retro      | Retroactive protocol interaction                                      |
| nft        | Mint, whitelist, NFT campaign                                         |
| waitlist   | Early access, form, registration, check result                        |

Trading bukan hunt type project di Phase 1. Trading adalah menu sendiri untuk portfolio wallet, trade journal, dan catatan profit/minus.

---

## 15. Work Types

Work type adalah detail aktivitas dalam project.

```txt
testnet
node
cli_running
point_system
farm_role
daily_task
galxe
zealy
depin
extension
submit_proof
badge
mint
whitelist
early_access
retro_interaction
testnet_registration
complete_task
collect_badge
```

Satu project boleh punya banyak work type.

Example:

```txt
Soundness
hunt_type: free_hunts
work_types: testnet_registration, testnet, submit_proof
project_types: ZK, Verif Layer
assigned_accounts: Moree, Wdym
```

---

## 16. Project Status

```txt
watching
in_progress
running
paused
done
dropped
archived
```

| Status      | Description                                               |
| ----------- | --------------------------------------------------------- |
| watching    | Project sedang dipantau, belum aktif digarap              |
| in_progress | Sedang dikerjakan manual                                  |
| running     | Node, CLI, prover, bot, atau process sedang berjalan      |
| paused      | Berhenti sementara                                        |
| done        | Sudah selesai tapi masih worth disimpan di active history |
| dropped     | Tidak dilanjutkan                                         |
| archived    | Masuk archive                                             |

---

## 17. Priority

```txt
high
medium
low
```

Priority wajib masuk MVP karena user perlu cepat tahu project mana yang penting.

---

## 18. Progress Estimate

Field progress bersifat manual.

Gunakan:

```txt
progress_estimate
```

---

## 18A. Stage / Result

Stage/result adalah posisi hasil project yang terpisah dari status kerja. Ini dipakai untuk waitlist, whitelist, eligibility, claim, mint, atau result lain yang belum tentu berarti project selesai.

Gunakan field:

```txt
stage_result
```

**v3.0 change:** `stage_result` bukan CHECK-constrained enum. Field ini free text dengan starter preset yang bisa dipilih lewat combobox, dan user boleh mengetik value custom kapan saja. Preset ini bisa dihapus/diedit, bukan daftar permanen.

Starter preset values:

```txt
not_applicable
watching
registered
joined_discord
waiting_result
accepted
whitelisted
not_eligible
claimable
mint_open
```

Catatan: value `done` sengaja tidak masuk preset Stage. Project yang sudah selesai/claimed masuk ke Archive (`archive_reason: claimed`), bukan Stage. Stage mengurus "posisi project selagi masih aktif", Archive mengurus "bagaimana project itu berakhir".

### Default per Hunt Type

Field Stage tetap tampil untuk semua Hunt Type (tidak disembunyikan secara dinamis), tapi default value-nya berbeda:

```txt
Hunt Type: waitlist, nft   → default "watching"
Hunt Type: free_hunts, retro → default "not_applicable"
```

Alasan: Waitlist dan NFT project memang berjalan lewat tahapan menunggu hasil eksternal, jadi Stage relevan sejak awal. Free Hunts dan Retro biasanya dikerjakan langsung (testnet, interaction) sehingga progress sudah cukup terwakili oleh `status`.

Contoh:

```txt
Status: Watching
Hunt Type: Waitlist
Work Type: Early access / Waitlist registration
Stage Result: Waiting result
```

Jangan dihitung otomatis dari task logs untuk MVP.

Reason:

* beberapa project punya progress subjektif
* tidak semua progress bisa dihitung dari task
* ada project tanpa task yang tetap bisa dianggap 100%
* Web3 hunting sering dinilai dari role, submit proof, mint, atau result eksternal

---

## 19. Project Logo System

Setiap project harus bisa memiliki logo agar lebih mudah dikenali.

### Fields

```txt
logo_url
logo_path
logo_source
```

### Logo Source

```txt
uploaded
external_url
favicon
manual
none
```

### MVP Requirements

User bisa:

* upload logo secara manual
* paste image URL
* melihat fallback initials jika logo kosong

Uploaded logo disimpan di Supabase Storage.

Storage path:

```txt
project-logos/{workspace_id}/{project_id}/logo.png
```

Logo harus tampil di:

* project table
* project detail
* task card
* daily checklist
* dashboard pulse / project preview

### Fallback

Jika tidak ada logo:

```txt
Soundness → S
NexusHQ → N
Drosera → D
```

---

## 20. Task Model

Task is a specific piece of work inside a project.

Task can be assigned to specific accounts and an optional wallet.

### Task Fields

```txt
id
workspace_id
project_id
title
description
status
frequency
priority
url
sort_order
due_date
created_at
updated_at
```

### Task Status

```txt
todo
in_progress
running
recheck
done
dropped
```

**v3.0 change:** renamed from `skipped` to `dropped`. This is a permanent task-level state — the task will not be worked on again, even though its parent project stays active. This is different from a daily miss recorded in `task_logs.status = 'skip'` (Section 23), which only means "not done today, reappears tomorrow" for recurring tasks. Do not confuse the two: `tasks.status = 'dropped'` is permanent, `task_logs.status = 'skip'` is a single day's record.

When marking a task as `dropped`, the reason (if any) is recorded as free text in the related `task_logs.notes` field rather than a separate archive-style reason enum. This keeps Archive (Section 24) exclusively project-scoped — there is no parallel archive system for individual tasks.

### Task Frequency

```txt
once
daily
weekly
monthly
custom
```

### Task Behavior Rules

Status and frequency are separate concepts.

`frequency` controls how often a task appears.
`status` controls the current work state of the task.

| Case          | Source field          | Daily checklist behavior                        |
| ------------- | --------------------- | ----------------------------------------------- |
| One-time task | `frequency = once`    | Shown as checkbox until done, then disappears   |
| Daily task    | `frequency = daily`   | Shown as checkbox every day                     |
| Weekly task   | `frequency = weekly`  | Shown on relevant day only                      |
| Monthly task  | `frequency = monthly` | Shown on relevant day only                      |
| Running task  | `status = running`    | Shown as info card, not checkbox                |
| Recheck task  | `status = recheck`    | Shown in separate Recheck section, not checkbox |

Rule:

```txt
Tasks with status 'running' or 'recheck' must NOT appear as checkboxes in the daily checklist.
They appear as a separate info section below the checklist.

Only tasks with status 'todo' or 'in_progress' and frequency 'daily'/'once'/'weekly'/'monthly'
appear as actionable checkboxes.

Do not add 'running' or 'recheck' to the frequency enum.
Do not add 'daily' to the status enum.
```

### Task Assignment

Task can be assigned to:

* all accounts in the project
* specific accounts only
* a specific wallet
* a specific account + wallet combination

Example:

```txt
Project: Soundness

Task: Generate address
Assigned accounts: Moree, Wdym
Wallet: project_wallet
Frequency: once

Task: Submit proof
Assigned accounts: Moree only
Frequency: once

Task: Daily check-in
Assigned accounts: Moree, Wdym, Wayss
Frequency: daily

Task: Run prover node
Assigned accounts: Moree
Status: running
Frequency: custom

Task: Recheck eligibility
Assigned accounts: Wdym
Status: recheck
```

### Task Assignment Fallback Rule

If a task has no entries in task_accounts, it is treated as assigned to all accounts listed in project_accounts for its parent project.

This rule must be applied consistently across:

* Daily checklist generation
* Project detail tasks tab
* Dashboard pulse / preview

Logic:

```txt
If task_accounts for task X is not empty → show only for accounts in task_accounts
If task_accounts for task X is empty → show for all accounts in project_accounts
```

---

## 20A. Personal Item Model (Phase 1.5)

Personal Item is a lightweight checklist entry that is not tied to any project. It exists for recurring personal habits that are still worth tracking in Daily but don't belong to Web3 hunting work — e.g. checking crypto news, market updates, or hot topics on X.

This is intentionally a separate, lighter entity from Task — it does not have project assignment, account assignment, wallet assignment, or proof/log tracking.

### Personal Item Fields

```txt
id
workspace_id
title
frequency
note
status
created_at
updated_at
```

### Personal Item Frequency

Reuses the same frequency values as Task:

```txt
once
daily
weekly
monthly
custom
```

### Personal Item Status

```txt
todo
done
dropped
```

No `running` or `recheck` states — those are process-monitoring concepts that don't apply to personal checklist items.

### Where Personal Item Appears

```txt
Daily page    → new tab/filter alongside "By Account" and "By Project",
                 e.g. "Personal"
Tasks page    → quick-add entry point also available here, so a
                 Personal Item can be created without leaving Tasks
```

Personal Item does not appear on Dashboard's Hunting Pulse or any other Dashboard panel — it is a Daily-only concept for Phase 1.5.

---

## 21. Task Entry UX

Task entry must be fast. Adding a task should not feel like filling a form.

### Quick Add Flow

```txt
User clicks [+ Add task] or uses Quick Capture
→ Inline input appears
→ User types task title
→ Presses Enter to save
→ Task is created with defaults:
   status: todo
   frequency: once
   priority: medium
   assigned: all accounts in project (fallback rule)
→ Input resets, ready for next task
```

Defaults are intentional. Most tasks can be used as-is without extra fields.

### Detail Edit

After quick add, user can open task detail drawer/panel to fill optional fields:

```txt
description
frequency
priority
url
assigned accounts
assigned wallet
due_date
notes
```

### Rule

```txt
Quick add must work from:
- Project detail Tasks tab
- Daily checklist page
- Tasks page
- Dashboard Quick Capture if approved by context

Do not require modal or form for basic task creation.
Detail drawer opens only when user explicitly clicks to edit.
```

---

## 22. Task Display in UI

Each task row must display both status and frequency as separate badges.

This is required because two tasks with the same status can have very different meanings:

```txt
Daily check-in    [Todo]  · daily   ← will reappear tomorrow
Generate address  [Todo]  · once    ← only needs to be done once
```

### Badge Display Rules

```txt
Status badge → always shown
Frequency badge → always shown
Priority badge → shown only if high
```

Example task rows:

```txt
[logo] Daily check-in         [Todo] [daily]   Moree, Wdym
[logo] Submit proof           [Todo] [once]    Moree          [high]
[logo] Galxe quest            [Done] [once]    Wdym
[logo] Run prover node        [Running] [custom] Moree
[logo] Recheck eligibility    [Recheck] [once]  Wdym
```

---

## 23. Task Logs

Task log is an activity ledger.

One log = one account completing one task on one date.

### Fields

```txt
id
workspace_id
task_id
project_id
account_id
wallet_id
status
logged_date
tx_hash
proof_url
notes
created_at
updated_at
```

### Log Status

```txt
done
skip
pending
```

### Important Rule

Do not store done/skip status directly on the task for daily activity.

Daily status must come from `task_logs`.

### Unique Constraint

MVP rule:

```txt
One account can have only one log for one task on one logged_date.
```

Use this unique index:

```sql
CREATE UNIQUE INDEX task_logs_unique_daily
ON task_logs(task_id, account_id, logged_date);
```

`wallet_id` is stored as additional information in the log, not part of the unique constraint, because wallet is optional and should not create duplicate daily logs for the same task/account/date.

If future versions need multiple wallets for the same task/account/date, this can be redesigned later with wallet-aware unique indexes. For MVP, keep the rule simple.

### Timezone Rule

All timestamp columns are stored as `timestamptz` UTC in Supabase.

`logged_date` in `task_logs` must be generated using Asia/Jakarta timezone (WIB, UTC+7), not UTC.

Use this in Server Actions:

```ts
const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
```

---

## 24. Archive System

Trash diganti menjadi Archive.

Archive bukan delete. Semua data tetap disimpan.

**Archive is project-scoped only.** There is no separate archive system for tasks. This is confirmed for v3.0 — Archive applies exclusively to Projects, not Tasks.

### Cascade Behavior

When a project is archived, its tasks are not individually archived — they simply stop appearing in Daily and active views because their parent project is archived. No `is_archived` flag is needed on the `tasks` table itself.

For dropping a single task while its parent project stays active, use `tasks.status = 'dropped'` (Section 20) instead — this does not touch Archive at all.

### Archive Reasons

**v3.0 change:** `archive_reason` is free text, not a CHECK-constrained enum. The list below is a starter preset shown in a combobox — user can select from it, edit it, remove entries, or type a custom reason at any time.

Starter preset:

```txt
claimed
dropped
scam_risk
expired
not_worth
duplicate
completed
other
```

| Reason    | Description                           |
| --------- | ------------------------------------- |
| claimed   | Sudah cair / dapat result             |
| dropped   | Stop dikerjakan                       |
| scam_risk | Terlihat janggal / berpotensi scam    |
| expired   | Event/task sudah lewat                |
| not_worth | Effort tidak sebanding                |
| duplicate | Entry double                          |
| completed | Selesai dan tidak perlu dipantau lagi |
| other     | Alasan lain                           |

Archive page harus bisa filter berdasarkan reason, termasuk reason custom yang ditambahkan user.

---

## 25. Main Navigation

Desktop sidebar:

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

**v3.0 change:** `Projects` parent item is itself a direct link to the full project table (no separate "All Project" child). Clicking the sidebar label "Projects" opens `/projects` directly; the chevron only toggles expand/collapse of its sub-items (Watchlist, Daily, Tasks). This avoids the earlier confusing pattern of two adjacent items both meaning "the same list of all projects."

### Navigation Roles

| Menu      | Purpose                                                   |
| --------- | --------------------------------------------------------- |
| Dashboard | Personal desk: inbox, docs, and pulse                     |
| Inbox     | Raw input waiting to be processed                         |
| Docs      | Notes, guides, links, templates, SOP, and safe references |
| Projects  | Main project database — parent item links directly to the full table, also groups Watchlist/Daily/Tasks |
| Watchlist | Filtered Projects view for stage-pending items, nested under Projects |
| Daily     | Full checklist grouped by account, plus Personal Items (Phase 1.5), nested under Projects |
| Tasks     | Cross-project task management, nested under Projects      |
| Trading   | Trade log, portfolio, and token watchlist (Phase 1.5)     |
| Accounts  | Identities, wallets, and groups                           |
| Archive   | Archived projects and results (project-scoped only)       |
| Settings  | Workspace, account, and integration settings              |

Sidebar harus tetap kecil dan stabil. Projects boleh menjadi dropdown workflow, tetapi hunt category tetap tidak menjadi top-level navigation.

Project categories tetap filters/tabs di dalam Projects page, bukan sidebar child:

```txt
All
Free Hunts
Retro
NFT
Waitlist
```

Trading tidak menjadi category Projects. Trading hidup sebagai menu sendiri.

Mapping workflow Notion lama:

| Notion page                   | Web3 Hunting OS location |
| ----------------------------- | ------------------------ |
| Testnet and Grind drop        | Projects → Free Hunts    |
| Retro                         | Projects → Retro         |
| NFT                           | Projects → NFT           |
| Waitlist/check                | Projects → Waitlist      |
| Trading Activity / portfolio  | Trading                  |
| Trash                         | Archive                  |
| Daily Checklist               | Daily                    |
| Raw ideas / links / reminders | Inbox                    |
| General notes / references    | Docs                     |

Accounts tabs:

```txt
Identities
Wallets
Groups
```

Tasks views:

```txt
List
Board
Running
Recheck
```

Daily remains a dedicated top-level screen and is not duplicated as the primary Tasks view.

---

## 26. Dashboard UX

**v3.0 change:** this section is rewritten to match the actual shipped dashboard structure. The earlier "Today Desk | Signal Rail" two-column formula and "Running / Recheck" as a dashboard section are both retired — the real implementation evolved into a five-panel grid, and Running/Recheck moved to Daily and Projects only (confirmed in Section 44).

Dashboard adalah personal command desk.

Dashboard bukan mini Daily page, mini Projects page, atau analytics dashboard.

Formula:

```txt
Dashboard = Inbox + Docs + Pulse
```

Dashboard harus menjawab:

```txt
What needs to be processed?
What did I recently capture?
What notes are important?
What's coming up soon?
What happened recently?
```

### Dashboard Panel Structure

Five panels in a grid, not a two-column "desk vs rail" split:

```txt
Header + Quick Capture (full width)
├── Notes desk         → links to /docs
├── Upcoming deadlines → links to /daily
├── Hunting pulse      → links to /projects (spans two row-heights)
├── Inbox to process   → links to /inbox
└── Recent activity    → links to /projects
```

Each panel has a consistent shape: icon + title in the header row, a small "Open" link to its full page, and compact content below — no persistent subtitle line under the panel title (removed in an earlier cleanup pass, do not reintroduce it).

### Header

Example:

```txt
Good evening, Moree.
Saturday, July 18 · WIB
```

The header should stay compact. It should not become a marketing hero. A short rotating motivational line may appear under the header (e.g. "Consistency finds what noise misses.") — this is decorative only, not a functional element.

### Quick Capture

Quick Capture is the fastest way to save raw thoughts, links, project ideas, tasks, wallet notes, or reminders.

Input placeholder:

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

Quick Capture should not require a modal for basic capture. Watchlist is a capture intent only and should become an inbox item or docs entry unless a dedicated model is approved later.

### Notes desk

Shows pinned and recent Docs entries together in one panel (not two separate "Pinned Docs" / "Recent Docs" panels as in earlier drafts).

```txt
Pinned notes    — notes marked pinned=true
Recent notes    — most recently created/updated notes
```

Examples:

```txt
Wallet warm-up rules
Project setup checklist
Safe access metadata
Project Alpha command note (updated 8m ago)
```

### Upcoming deadlines

Shows the nearest date-sensitive items.

Examples:

```txt
Project Alpha proof — Submit before reset — Today
Project Beta result check — Waitlist eligibility — Tomorrow
Project Gamma campaign — Interaction window — Jul 18
```

### Hunting pulse

Shows a compact status summary. It replaces large KPI card walls.

```txt
Overview       — Projects, Active, Inbox, Due, Running, Archived
                 (small stat tiles)
Categories     — Testnet, Free Hunt, Retro, NFT, Waitlist
                 (compact pill counts)
```

**v3.0 note:** Running/Recheck rows do not appear inside Hunting Pulse on Dashboard — that live monitoring list belongs to Daily and Projects only (Section 44). Hunting Pulse's "Running" count is a number tile only, not an expandable list.

### Inbox to process

Shows raw captured items that still need review. Limit to a few items — full triage happens on the Inbox page.

Examples:

```txt
Project Alpha waitlist result — Manual capture — Review
Project Beta link captured — Quick capture — Process
```

Actions available from the Inbox page (not inline on Dashboard):

```txt
Create Project
Create Task
Save as Note
Link to Project
Archive
Ignore
```

No item should automatically create a project or task without user confirmation.

### Recent activity

Shows the latest changes across the workspace as a short list.

Examples:

```txt
Saved Project Alpha command note — 8m
Processed Project Beta reminder — 24m
Moved Project Gamma to Running — 1h
```

### Dashboard Must Not Show

```txt
Full Daily checklist
Full Projects table
Running / Recheck as its own dashboard section
Crypto news
Gmail-connected inbox
X/Twitter monitoring
AI summaries
Token price widget
Trading data (Trading has its own dedicated page)
```

---

## 27. Inbox Page

Inbox page is for processing raw input.

### Inbox Page Layout

```txt
Inbox
Search / filters / quick capture

New
Reviewing
Linked
Converted
Ignored
Archived
```

### Inbox List Item

Each inbox item should show:

```txt
title
source
priority
detected_project_name
linked project/task/note if any
created_at or received_at
status
```

### Inbox Detail

Inbox detail/drawer should allow:

```txt
edit title/content
open URL
set priority
link to existing project
create project
create task
save as note
ignore
archive
```

### Inbox Rules

* Inbox is raw input.
* Inbox is not email-only.
* Manual Inbox is Phase 1.
* Gmail Inbox is future.
* No auto conversion without user confirmation.

---

## 28. Docs Page

Docs page is for global notes, guides, links, templates, SOP/checklist, and knowledge.

### Docs Page Layout

```txt
Docs
Search
Pinned
Recent
All Docs
```

### Docs Filters

```txt
all
pinned
alpha
research
setup
commands
links
reminder
strategy
result
private_note
project-linked
```

### Docs List Item

Each note should show:

```txt
title
note_type
pinned status
linked project/task/account/wallet if any
updated_at
short content preview
```

### Note Detail

Note detail/editor should allow:

```txt
edit title
edit content
change note_type
pin/unpin
link to project
link to task
link to account
link to wallet
link to inbox item
delete/archive if supported
```

For MVP, markdown textarea is enough.

---

## 29. Daily Page

Daily adalah halaman utama untuk rutinitas dan checklist penuh.

Default view: by account.

### Layout

```txt
Daily Checklist — Today

Moree                          6/10 completed

Checklist
[ ] Huddle01 — Daily check-in     [daily]
[x] Linera — Galxe task           [daily]
[ ] Soundness — Submit proof      [once]   [high]

Running / Recheck
→ NexusHQ — Run prover            [running]
→ Huddle01 — Badge check          [recheck]

---

Wdym                           3/7 completed

Checklist
[x] Huddle01 — Daily check-in     [daily]
[ ] Linera — Testnet incentive    [daily]

Running / Recheck
→ Soundness — Submit proof        [recheck]
```

### View Toggle

```txt
By Account | By Project
```

### Actions

User can:

* mark done
* mark skip
* reset to pending
* open project
* open task detail
* add note
* attach tx hash
* attach proof URL

---

## 30. Projects Page

Projects adalah strongest management screen dan primary replacement untuk Notion project databases.

### Default View

Full-width compact table designed for hundreds of projects.

### Secondary Views

```txt
Board
Timeline
```

### Required Table Behavior

* sticky column header
* fast search
* hunt type tabs
* status, priority, account, wallet, and date filters
* sortable columns
* column visibility control
* compact row density
* pinned or immediately accessible quick-add action
* pagination or virtualization when volume requires it
* preserve filter/sort state in URL search parameters
* open project detail without losing table context

### Default Columns

```txt
Project
Status
Priority
Hunt Type
Work Types
Project Types
Accounts
Wallets
Progress
Start Date
Last Activity
```

Project logo and name remain visually strongest. Status, priority, tags, and accounts use compact chips. Color is reserved for meaning and never fills the entire row.

### Mobile

Do not squeeze the desktop table into a narrow viewport. Convert each project into a structured compact row/card containing the most important fields, with filters in a sheet or drawer.

### Archive Visibility

Archived projects are excluded by default and accessed through Archive or an explicit filter.

---

## 31. Project Detail Page

Project detail harus lebih clean dari Notion.

### Header

```txt
[logo] Soundness
In progress · High · Free Hunts
```

Quick actions:

```txt
+ Add Task
+ Add Account
+ Add Wallet
Archive
```

### Tabs

```txt
Overview
Tasks
Accounts & Wallets
Notes
Activity
```

### Overview Tab

Show summary cards:

```txt
Project Info
Status
Priority
Progress
Hunt Type
Work Types
Project Types
Start Date
Links
Latest Notes
```

### Tasks Tab

Show all project tasks with status and frequency badges.

Each task row:

```txt
Generate address      [Done]       [once]    Moree, Wdym
Submit proof          [In progress][once]    Moree          [high]
Daily check-in        [Todo]       [daily]   Moree, Wdym, Wayss
Run prover node       [Running]    [custom]  Moree
Recheck eligibility   [Recheck]    [once]    Wdym
```

Quick add input pinned at bottom of task list:

```txt
[ + Add a task... ]
```

### Accounts & Wallets Tab

Show all assigned accounts and wallets used.

```txt
Moree
Email: hidden/optional
X: @...
Discord: ...
Wallets used:
- Moree EVM Main
- Project-specific wallet

Wdym
Email: hidden/optional
X: @...
Discord: ...
Wallets used:
- Wdym EVM Main
- Project-specific wallet

L1 Wallets
- L1 Wallet 02
```

### Notes Tab

Support structured project notes.

Sections can include:

```txt
Setup Notes
Commands
Generated Address
Links
Result Notes
Private Hints
```

For MVP, use markdown textarea.

### Activity Tab

Show history:

```txt
Today
- Moree marked Submit Proof as done
- Wdym added project wallet
- Project status changed to In progress
```

---

## 32. Tasks Page

Tasks is the cross-project work-management screen.

### Default View

Dense List view for fast scanning and editing across many projects.

### Alternate Views

```txt
Board
Running
Recheck
```

Board columns:

```txt
Todo
In Progress
Running
Recheck
Done
```

Every task row/card must show:

* project logo or initials
* task title
* project name
* assigned accounts
* status badge
* frequency badge
* priority only when high

Quick add remains inline. Basic task creation never requires a modal. Board is useful for visual status management, while List remains better for high-volume daily work.

---

## 33. Accounts Page

Accounts page manages identities, wallets, and wallet groups.

### Tabs

```txt
Identities
Wallets
Groups
```

### Account Card (Identities tab, main grid)

**v3.0 change:** Card is trimmed — it no longer lists every wallet as pills. This prevents cards from growing uneven and cluttered as the number of wallets per account grows. Wallets are shown as a count only; full detail lives in the Account Detail Panel.

```txt
[avatar] Moree
Personal hunting identity

Projects: 12       Daily tasks: 8
X: @moree
Discord: moree.web3
Email: tracking only

Wallets: 3          (count only, not listed)
```

Card is clickable — clicking anywhere on it opens the Account Detail Panel.

### Account Avatar

Account may have a profile photo, following the same pattern as Project Logo System (Section 19): upload manually or paste an image URL, fallback to initial-letter circle if empty. Phase 1 ships this as a working UI (upload control, URL input, fallback state) even before Supabase Storage wiring is complete — the control should feel real, storage connection can follow once Storage is implemented.

Storage path (once wired):

```txt
account-avatars/{workspace_id}/{account_id}/avatar.png
```

### Account Detail Panel

**v3.0 change:** Account Detail opens as a right-side panel (drawer), not a separate full page — following the same pattern as Project Detail's side panel (Section 19B). This keeps the Identities grid visible/context-preserved behind the panel.

Panel content, top to bottom:

```txt
Header      avatar (clickable, editable) + name + handle

Quick stats  Projects count, Daily tasks count

Wallets      list of wallets where owner_account_id = this account
             "+ Add wallet" button — creates a wallet with
             owner_account_id pre-filled to this account
             clicking a wallet row opens Wallet Detail Panel (Section 34)

Active projects   list of projects this account is assigned to,
                   each row clickable → opens Project Detail Panel

Profile      X, Discord, Email (tracking only)
```

Wallets without a clear single owner (e.g. L1, burner wallets) are not managed from this panel — they are added from the global Wallets tab instead (Section 34).

---

## 34. Wallet Detail Page

**v3.0 change:** Wallet Detail is a right-side panel (drawer), matching Project Detail and Account Detail. It opens from clicking any wallet row — in the global Wallets tab, or from inside an Account Detail Panel.

Wallet detail helps track wallet usage.

Panel content:

```txt
Header       icon + wallet label + address (with copy button)

Properties   Chain, Type, Group, Owner
             Owner is a clickable link back to the Account Detail
             Panel when owner_account_id is set. Shows "No persona"
             when owner_account_id is null (e.g. L1/burner wallets).

Used in      list of projects this wallet is assigned to,
             each row clickable → opens Project Detail Panel

Recent activity   short list of recent task logs or transfers
                   involving this wallet
```

Example data:

```txt
L1 Wallet 02

Chain: EVM
Type: L1
Group: L1
Owner: No persona

Used in:
- Retro Project A
- Waitlist Project B
- NFT Mint C

Recent Activity:
- Done task X
- Submitted form Y
```

This is useful for random wallets and project-specific wallets alike.

### Wallet Type Display Formatting

**v3.0 fix:** raw enum values (`main`, `l1`, `project_wallet`) must not be displayed as-is in the UI. Apply title-case formatting with underscores converted to spaces: `main` → "Main", `l1` → "L1", `project_wallet` → "Project wallet".

### Wallet Creation Entry Points

Confirmed dual entry point, both writing to the same `wallets` table (see Section 8 for the relation note):

```txt
From Account Detail Panel  → owner_account_id pre-filled,
                              wallet_type defaults to "main"

From Project Detail Panel  → wallet_type defaults to
                              "project_wallet", auto-linked to
                              that project, owner_account_id
                              still must be picked manually

From global Wallets tab    → no pre-fill, used for L1/burner/
                              ownerless wallets assigned to a
                              wallet_group instead
```

`chain_type` is free text in all three entry points — not restricted to a fixed chain list.

---

## 35. Future Gmail Integration

Gmail integration is not part of Phase 1.

It belongs to Phase 2 or Phase 3.

The goal is to detect project-related emails such as:

```txt
waitlist accepted
early access
whitelist result
testnet registration
eligibility result
claim reminder
mint is live
campaign deadline
verify your email
```

### Multi Email Concept

A single Web3 Hunting OS user may connect multiple email inboxes in the future.

Example:

```txt
One Web3 Hunting OS user
├── Accounts / personas
│   ├── Moree
│   ├── Wdym
│   └── Wayss
└── Connected Email Inboxes
    ├── main Gmail
    ├── waitlist Gmail
    ├── burner Gmail
    └── project-specific Gmail
```

Important rule:

```txt
Auth username is not email.
Account/persona is not email.
Connected email inbox is only an input source.
```

### Future Connected Email Account Fields

```txt
id
workspace_id
provider
email_address
label
linked_account_id
status
last_sync_at
created_at
updated_at
```

### Future Email Inbox Rules

```txt
Do not scan all email by default.
Prefer selected Gmail labels or search filters.
Deduplicate by provider message ID.
Never auto-create projects or tasks without confirmation.
Allow user to link email to an existing project.
Allow user to ignore or archive irrelevant emails.
```

### Future Email Search Filters

Examples:

```txt
subject contains waitlist
subject contains early access
subject contains whitelist
subject contains testnet
subject contains accepted
subject contains eligibility
subject contains invite
subject contains claim
subject contains mint
```

### Future Email Flow

```txt
Connect Gmail account
Choose labels or filters to scan
App imports matching emails into Inbox
User reviews each item
User converts item to Project / Task / Note
User archives or ignores irrelevant items
```

---

## 36. UI / UX Direction

The product should feel like a private, high-volume workbench for one Web3 hunter.

Design personality:

```txt
personal
quiet
clear
dense but breathable
fast to scan
fast to write
stable
purpose-built
```

The product is not:

```txt
SaaS marketing dashboard
terminal
cyberpunk interface
generic admin template
Notion clone
analytics-first product
crypto news portal
```

Notion is a workflow reference only: flexible tables, filters, boards, and project pages. The visual design must be clearer and more structured than Notion.

Detailed visual rules, component anatomy, spacing, density, and responsive behavior live in `DESIGN.md`. PRD controls product behavior; DESIGN.md controls presentation.

---

## 37. Color Palette

Use a neutral / royal-charcoal dark theme.

Base colors must remain neutral. Semantic colors are used only for status, priority, progress, validation, and focused actions.

Required roles:

```txt
stage
canvas
shell
sidebar
surface
surface elevated
surface raised
surface hover
border subtle
text primary
text secondary
text muted
accent
success
warning
danger
info
archive
```

Do not use semantic colors for normal headings, paragraphs, large backgrounds, or entire table rows.

Exact tokens and contrast requirements are defined in `DESIGN.md`.

---

## 38. Typography

Primary font:

```txt
Geist Sans
```

Secondary expressive heading font:

```txt
Plus Jakarta Sans
```

Typography should prioritize reading tables, forms, notes, inbox items, and task lists.

* body and row text: 13–14px desktop
* supporting metadata: 11–12px
* page title: 22–26px
* avoid oversized hero typography
* use tabular numbers for progress and dates
* keep letter spacing neutral

Use monospace only for wallet address, tx hash, CLI command, and code block.

---

## 39. Layout System

### Desktop

Desktop is primary.

```txt
Stable sidebar | Full-width content workspace
```

* sidebar approximately 220–240px
* compact top bar for title, search, filters, and quick actions
* content uses available width, especially Projects, Inbox, Docs, and Tasks
* dashboard should avoid unnecessary long scrolling
* tables, lists, tabs, drawers, and split panels are preferred over decorative card grids

### Mobile

Mobile must remain functional:

```txt
Dashboard | Inbox | Daily | Projects | Accounts
```

Use a floating quick-create action. Tables become structured rows. Forms use full-width inputs. Filters open in sheets/drawers. Core create, edit, complete, archive, note, and inbox actions remain available.

### Read/Write Rules

* primary actions remain near their content
* quick add should be reachable without scrolling when practical
* opening a detail view must preserve list context
* notes use a calm full-width editor
* inbox processing uses drawers or split view
* loading, empty, and error states must not shift the page unexpectedly

See `DESIGN.md` for exact responsive and component specifications.

---

## 39A. Trading Page Direction (Phase 1.5)

Trading is a separate top-level menu, not a Projects category. It covers three sub-areas: Trade Log with realized PnL, Portfolio, and Token Watchlist.

Trading should feel like a calm personal ledger, not a crypto exchange terminal (per DESIGN.md 19A).

### Trade Log

Records spot CEX trade history and computes realized PnL.

**Import flow — paste and parse, not manual form entry:**

```txt
1. User pastes raw trade history text copied from the exchange
2. System parses it into structured rows
3. PREVIEW is shown before anything is saved — parsed rows,
   date range covered, and any rows that failed to parse
   (flagged, not silently dropped)
4. Duplicate detection — rows with an exchange_order_id already
   present in trade_logs are automatically skipped, so re-pasting
   an overlapping date range is safe
5. User confirms → only then rows are written to trade_logs
```

No auto-save without user confirmation — same principle as Inbox (Section 9).

**Partial fills:** if one order fills across multiple trade history rows, each row is stored separately, not merged. FIFO matching (below) operates per-row, so partial fills are handled correctly without extra logic.

**Fee handling:** `fee_amount` and `fee_currency` are captured per-row exactly as they appear in the pasted source. Fee currency is not assumed — it can be the quote currency (e.g. USDT) or the base currency (e.g. SOL) depending on trade side and exchange. Do not derive fee from a percentage; always take the literal value from the source.

### Trade Log Fields

```txt
id
workspace_id
exchange
pair
market_type
order_type
side
total_quote
price
amount_base
fee_amount
fee_currency
executed_at
exchange_order_id
notes
created_at
```

### Realized PnL — FIFO Matching

**Confirmed approach:** Realized PnL via FIFO (First In, First Out) matching, not simple daily net cash flow.

Reason: spot trades can carry a position open across multiple days. A simple "sells minus buys per day" calculation would show a misleading large loss on the day a position is opened and a misleading large gain on the day it's closed, even when the trade was genuinely profitable. FIFO matching pairs each sell against the oldest unmatched buy(s) for that pair, so PnL is attributed to the day a position is realized (closed), not the day capital moved.

```txt
Rule: every SELL row is matched against the oldest unmatched
BUY row(s) for the same pair, oldest first. A sell can consume
multiple buy lots if quantities don't align 1:1.

Unmatched BUY rows (still held, not yet sold) do not appear in
the PnL calendar — they are reflected in Portfolio Holdings
instead (see below), because their gain/loss isn't realized yet.

Realized PnL for a matched pair = 
  (sell price - buy price) × matched quantity - proportional fees
```

FIFO is the default and only matching method for Phase 1.5 — no LIFO toggle.

### Trade Log Calendar View

Calendar UI where each day shows net realized PnL for trades closed that day (e.g. "+$12" or "-$23"). Clicking a day shows the individual matched trades contributing to that total.

### Portfolio

Tracks current holdings across on-chain wallets and CEX accounts, plus fund movement between them.

**Phase 1.5 scope: manual entry only.** No live RPC or exchange API balance fetching — that requires the Settings Integrations API keys (Section 39B) to move beyond scaffolding, which is out of scope for this wave.

### Portfolio Holding Fields

```txt
id
workspace_id
source_type          -- 'wallet' or 'cex'
source_label          -- e.g. "Moree EVM Main" or "Bybit"
linked_wallet_id      -- nullable, set when source_type = 'wallet'
asset
amount
recorded_at
created_at
```

### Portfolio Transfer Fields

Records movement of funds between two sources — CEX to CEX, or CEX to bank (fiat off-ramp).

```txt
id
workspace_id
from_source
to_source
asset
amount
transferred_at
notes
created_at
```

Example: "Withdrew IDR from Pintu to bank account" or "Moved USDT from Binance to Bybit."

### Token Watchlist

**Confirmed scope for Phase 1.5: manual watchlist only.** User adds tokens they want to keep an eye on; no live price feed integration yet (that is tied to the Crypto Price Feed API key in Settings Integrations, Section 39B, which is scaffold-only in this phase).

### Token Watchlist Fields

```txt
id
workspace_id
symbol
chain
note
added_at
```

Purpose: a quick personal shortlist to scan instead of checking exchanges one-by-one, per the user's stated need. Does not connect to the separately-existing price alert bot (external, still in testing) — that integration is not scoped for Phase 1.5 and would be considered later as its own connector.

---

## 39B. Settings — Integrations (Phase 1.5)

Settings gains a new "Integrations" section for API keys the user plans to use for real-time data.

**Confirmed scope: UI/form only in this phase.** The form captures and stores the key, but no fetch, sync, or active use of the key happens yet. This mirrors how Trading's Portfolio and Token Watchlist are manual-only until these integrations become functional.

### Integrations Fields

```txt
Crypto Price Feed
  provider        -- e.g. CoinGecko, CoinMarketCap, Custom
  api_key         -- stored server-side, masked in UI, never
                     returned in plaintext to the client
  status          -- "Not connected" until Phase 2+ activation

AI Assistant
  provider        -- e.g. OpenAI, Anthropic, Custom endpoint
  api_key         -- same storage/masking rule as above
  status          -- "Not connected" until Phase 2+ activation
```

### Security Rule for API Keys

Unlike wallet addresses or trade history, API keys are credentials and must be handled accordingly:

```txt
Stored server-side only, never exposed in client-side bundles
Masked in UI at all times after saving (e.g. ••••••1234)
Never returned in plaintext by any read query
If an exchange API key is ever added in a future phase for live
trading data, it should be scoped read-only on the exchange side
wherever the exchange supports permission scoping
```

---

## 40. Technical Stack

### Frontend

```txt
Next.js 15 App Router
TypeScript
Tailwind CSS
shadcn/ui
React Hook Form
Zod
```

### Backend

```txt
Supabase PostgreSQL
Supabase Auth
Supabase Storage
Supabase RLS
Drizzle ORM
```

### Deployment

```txt
Vercel
```

### Data Access Pattern

```txt
Read data:
Server Components

Write data:
Server Actions

Complex query:
Route Handlers if needed
```

Use Server Actions for:

```txt
createProject
updateProject
archiveProject
createTask
updateTaskStatus
createAccount
createWallet
markTaskDone
quickAddTask
createInboxItem
updateInboxItem
convertInboxItem
createNote
updateNote
pinNote
```

Use API routes only for complex dashboard aggregation or future integrations.

---

## 41. Database Schema Draft

### workspaces

```sql
id uuid primary key
name text not null
owner_id uuid references auth.users(id)
created_at timestamptz default now()
updated_at timestamptz default now()
```

### workspace_members

```sql
id uuid primary key
workspace_id uuid references workspaces(id)
user_id uuid references auth.users(id)
role text check (role in ('owner', 'member'))
joined_at timestamptz default now()
```

### inbox_items

```sql
id uuid primary key
workspace_id uuid references workspaces(id)
source text check (source in ('manual','quick_capture','gmail','twitter_x','browser_extension','api'))
title text not null
content text
url text
sender text
received_at timestamptz
status text check (status in ('new','reviewing','linked','converted','ignored','archived'))
priority text check (priority in ('high','medium','low'))
detected_project_name text
linked_project_id uuid references projects(id)
linked_task_id uuid references tasks(id)
linked_note_id uuid references notes(id)
created_at timestamptz default now()
updated_at timestamptz default now()
```

### notes

**v3.0 change:** this is now the single notes table for both global and project-linked notes. The separate `project_notes` table from v2.8 is removed — see Section 10.

```sql
id uuid primary key
workspace_id uuid references workspaces(id)
title text
content text
note_type text check (note_type in ('general','alpha','research','setup','commands','links','reminder','strategy','result','private_note','keys_hint'))
pinned boolean default false
linked_project_id uuid references projects(id)
linked_task_id uuid references tasks(id)
linked_account_id uuid references accounts(id)
linked_wallet_id uuid references wallets(id)
linked_inbox_item_id uuid references inbox_items(id)
created_at timestamptz default now()
updated_at timestamptz default now()
```

### accounts

```sql
id uuid primary key
workspace_id uuid references workspaces(id)
label text not null
avatar_url text
avatar_source text check (avatar_source in ('uploaded','external_url','manual','none'))
color text
x_username text
x_url text
discord_username text
email text
notes text
created_at timestamptz default now()
updated_at timestamptz default now()
```

`avatar_url` and `avatar_source` added in v3.0, mirroring the Project Logo System pattern (Section 19).

### wallet_groups

```sql
id uuid primary key
workspace_id uuid references workspaces(id)
name text not null
description text
created_at timestamptz default now()
updated_at timestamptz default now()
```

### wallets

```sql
id uuid primary key
workspace_id uuid references workspaces(id)
owner_account_id uuid references accounts(id)
wallet_group_id uuid references wallet_groups(id)
label text not null
address text not null
chain_type text
wallet_type text check (wallet_type in ('main','project_wallet','burner','l1','testnet','retro','nft','other'))
notes text
created_at timestamptz default now()
updated_at timestamptz default now()
```

`chain_type` remains free text (not a CHECK enum) — confirmed in Section 8, supports any chain name, not restricted to EVM/Solana.

### projects

```sql
id uuid primary key
workspace_id uuid references workspaces(id)
name text not null
slug text
description text
logo_url text
logo_path text
logo_source text check (logo_source in ('uploaded','external_url','favicon','manual','none'))
hunt_type text check (hunt_type in ('free_hunts','retro','nft','waitlist'))
status text check (status in ('watching','in_progress','running','paused','done','dropped','archived'))
priority text check (priority in ('high','medium','low'))
work_types text[]
project_types text[]
progress_estimate numeric default 0
stage_result text
date_start date
date_end date
website_url text
twitter_url text
discord_url text
github_url text
docs_url text
notes text
is_archived boolean default false
archive_reason text
archived_at timestamptz
created_at timestamptz default now()
updated_at timestamptz default now()
```

`stage_result` and `archive_reason` are intentionally free text (no CHECK constraint) — starter preset values are enforced at the application/UI level via combobox, not the database, per Section 18A and Section 24.

### project_accounts

```sql
project_id uuid references projects(id)
account_id uuid references accounts(id)
primary key (project_id, account_id)
```

### project_wallets

```sql
project_id uuid references projects(id)
wallet_id uuid references wallets(id)
primary key (project_id, wallet_id)
```

### tasks

**v3.0 change:** `status` enum value `skipped` renamed to `dropped` — see Section 20.

```sql
id uuid primary key
workspace_id uuid references workspaces(id)
project_id uuid references projects(id)
title text not null
description text
status text check (status in ('todo','in_progress','running','recheck','done','dropped'))
frequency text check (frequency in ('once','daily','weekly','monthly','custom'))
priority text check (priority in ('high','medium','low'))
url text
sort_order int default 0
due_date date
created_at timestamptz default now()
updated_at timestamptz default now()
```

### task_accounts

```sql
task_id uuid references tasks(id)
account_id uuid references accounts(id)
primary key (task_id, account_id)
```

### task_wallets

```sql
task_id uuid references tasks(id)
wallet_id uuid references wallets(id)
primary key (task_id, wallet_id)
```

### task_logs

```sql
id uuid primary key
workspace_id uuid references workspaces(id)
task_id uuid references tasks(id)
project_id uuid references projects(id)
account_id uuid references accounts(id)
wallet_id uuid references wallets(id)
status text check (status in ('done','skip','pending'))
logged_date date not null
tx_hash text
proof_url text
notes text
created_at timestamptz default now()
updated_at timestamptz default now()
```

Note: `status = 'skip'` here is unrelated to `tasks.status = 'dropped'`. This is a single day's record for a recurring task, not a permanent state — see Section 20.

### personal_items (Phase 1.5)

New table for Daily checklist items not tied to any project — see Section 20A.

```sql
id uuid primary key
workspace_id uuid references workspaces(id)
title text not null
frequency text check (frequency in ('once','daily','weekly','monthly','custom'))
status text check (status in ('todo','done','dropped'))
note text
created_at timestamptz default now()
updated_at timestamptz default now()
```

### activity_logs

```sql
id uuid primary key
workspace_id uuid references workspaces(id)
project_id uuid references projects(id)
task_id uuid references tasks(id)
account_id uuid references accounts(id)
wallet_id uuid references wallets(id)
inbox_item_id uuid references inbox_items(id)
note_id uuid references notes(id)
action text not null
metadata jsonb
created_at timestamptz default now()
```

### trade_logs (Phase 1.5)

One row per parsed trade history entry — see Section 39A.

```sql
id uuid primary key
workspace_id uuid references workspaces(id)
exchange text
pair text not null
market_type text
order_type text
side text check (side in ('buy','sell'))
total_quote numeric
price numeric
amount_base numeric
fee_amount numeric
fee_currency text
executed_at timestamptz not null
exchange_order_id text
notes text
created_at timestamptz default now()
```

### trade_matches (Phase 1.5)

Records FIFO pairing between a sell row and the buy row(s) it consumed, so realized PnL can be attributed to the correct calendar day without recomputing FIFO on every read.

```sql
id uuid primary key
workspace_id uuid references workspaces(id)
sell_trade_id uuid references trade_logs(id)
buy_trade_id uuid references trade_logs(id)
matched_quantity numeric not null
realized_pnl numeric not null
matched_at timestamptz not null
created_at timestamptz default now()
```

### portfolio_holdings (Phase 1.5)

Manual snapshot of holdings per wallet or CEX — see Section 39A.

```sql
id uuid primary key
workspace_id uuid references workspaces(id)
source_type text check (source_type in ('wallet','cex'))
source_label text not null
linked_wallet_id uuid references wallets(id)
asset text not null
amount numeric not null
recorded_at timestamptz not null
created_at timestamptz default now()
```

### portfolio_transfers (Phase 1.5)

```sql
id uuid primary key
workspace_id uuid references workspaces(id)
from_source text not null
to_source text not null
asset text not null
amount numeric not null
transferred_at timestamptz not null
notes text
created_at timestamptz default now()
```

### token_watchlist (Phase 1.5)

```sql
id uuid primary key
workspace_id uuid references workspaces(id)
symbol text not null
chain text
note text
added_at timestamptz default now()
```

### Settings — Integrations (Phase 1.5)

Not a full table draft yet, but confirmed shape for the API key scaffolding described in Section 39B:

```sql
workspace_settings
  id uuid primary key
  workspace_id uuid references workspaces(id)
  price_feed_provider text
  price_feed_api_key text          -- store encrypted, never returned plaintext
  ai_provider text
  ai_api_key text                  -- store encrypted, never returned plaintext
  updated_at timestamptz default now()
```

---

## 42. Required Indexes

```sql
create index idx_inbox_items_workspace on inbox_items(workspace_id);
create index idx_inbox_items_status on inbox_items(status);
create index idx_inbox_items_priority on inbox_items(priority);
create index idx_inbox_items_created_at on inbox_items(created_at);
create index idx_inbox_items_linked_project on inbox_items(linked_project_id);

create index idx_notes_workspace on notes(workspace_id);
create index idx_notes_pinned on notes(pinned);
create index idx_notes_type on notes(note_type);
create index idx_notes_updated_at on notes(updated_at);
create index idx_notes_linked_project on notes(linked_project_id);

create index idx_projects_workspace on projects(workspace_id);
create index idx_projects_status on projects(status);
create index idx_projects_hunt_type on projects(hunt_type);
create index idx_projects_priority on projects(priority);
create index idx_projects_archived on projects(is_archived);

create index idx_tasks_project on tasks(project_id);
create index idx_tasks_workspace on tasks(workspace_id);
create index idx_tasks_status on tasks(status);
create index idx_tasks_frequency on tasks(frequency);

create index idx_task_logs_date on task_logs(logged_date);
create index idx_task_logs_task_account_date on task_logs(task_id, account_id, logged_date);
create index idx_task_logs_account_date on task_logs(account_id, logged_date);
create index idx_task_logs_project on task_logs(project_id);

create index idx_wallets_owner on wallets(owner_account_id);
create index idx_wallets_group on wallets(wallet_group_id);
create index idx_wallets_address on wallets(address);

create index idx_project_accounts_project on project_accounts(project_id);
create index idx_project_wallets_project on project_wallets(project_id);
```

### Task Logs Unique Index

Use one unique index for daily logs:

```sql
CREATE UNIQUE INDEX task_logs_unique_daily
ON task_logs(task_id, account_id, logged_date);
```

This enforces one log per task/account/date.

`wallet_id` remains optional metadata and is intentionally not part of the unique index in the MVP.

---

## 43. RLS Summary

All main tables must enforce workspace-based access.

General rule:

```txt
User can select, insert, update, delete rows only if row.workspace_id belongs to a workspace where auth.uid() is a member.
```

For join tables without `workspace_id`, access must be checked through related project/task/account/wallet workspace.

Inbox items and notes must also enforce workspace-based access.

User must not be able to link an inbox item or note to a project/task/account/wallet from another workspace.

---

## 44. MVP Scope

**v3.0 change:** split into Phase 1 Core (build first, ships a usable app) and Phase 1.5 (fully specified, built as fast-follow). See phasing note at the top of this document.

### Phase 1 Core

```txt
Auth
Username signup/login/logout
Auto-create default personal workspace
Protected routes

Dashboard — compact overview only (see Dashboard Scope below)
Manual Inbox
Inbox item CRUD
Inbox item conversion actions
Docs (unified notes system — global and project-linked)
Pinned Docs
Recent Docs

Accounts CRUD
Account avatar (upload/URL, scaffold-first per Section 33)
Wallet Groups CRUD
Wallets CRUD (dual entry point: from Account, from Project)
Account Detail Panel
Wallet Detail Panel
Projects CRUD
Project logo upload / URL
Project detail with tabs
Project-linked Docs (via linked_project_id, not a separate table)
Task CRUD with quick add
Task frequency and status badges in UI
Task assignment to accounts
Task logs
Daily checklist with checklist / running-recheck split
Archive with archive reason (project-scoped only)
Basic activity logs
```

### Phase 1.5 (fully specified, built after Core ships)

```txt
Personal Item (Section 20A)
Trading — Trade Log with FIFO realized PnL (Section 39A)
Trading — Portfolio Holdings and Transfers, manual entry
Trading — Token Watchlist, manual entry
Settings — Integrations section, API key storage (scaffold only,
  no live fetch/activation — Section 39B)
```

### Phase 1 Core Dashboard Scope

**v3.0 change:** Running/Recheck removed from Dashboard entirely (moved to Daily and Projects only). A "Reminders" panel was discussed in earlier planning but is not present in the current shipped five-panel grid (Notes desk, Upcoming deadlines, Hunting pulse, Inbox to process, Recent activity) — see DESIGN.md Section 14 "Open question — Reminders panel." Confirm with the user whether to still build it before including it in scope.

Dashboard must show:

```txt
Quick Capture
Notes desk (pinned + recent Docs combined in one panel)
Upcoming Deadlines
Hunting Pulse (Overview stat tiles + Category pills)
Inbox to Process
Recent Activity
```

Reminders is not yet built — see DESIGN.md Section 14 open question above. Add it as a sixth standalone panel only after confirming it's still wanted.

Dashboard should not show:

```txt
Full Daily checklist
Full Projects table
Running / Recheck section
Crypto news
Gmail-connected inbox
X/Twitter monitoring
AI summaries
Token price widget
Trading data (Trading has its own dedicated page)
```

---

## 45. Out of Scope for MVP

Do not implement in Phase 1 Core or Phase 1.5:

```txt
Gmail integration
multi-email sync
Google OAuth
auto email detection
AI email classification
scheduled inbox sync
X/Twitter monitoring
Watchlist auto-monitoring bot (X/Discord activity detection)
agent discovery
crypto news widget
live token price widget (Token Watchlist is manual-only in Phase 1.5)
team invite UI
workspace switcher UI
role permission UI
billing
auto wallet balance tracking (Portfolio is manual entry in Phase 1.5)
CEX API auto-sync for trading/portfolio data
Crypto Price Feed API — live activation (UI scaffold only in Phase 1.5)
AI Assistant API — live activation (UI scaffold only in Phase 1.5)
auto-detect transactions
push notifications
email notifications
CSV export
public sharing
native mobile app
advanced analytics
automatic favicon fetch in MVP
general file attachments beyond project logos, account avatars, and task proof links
```

---

## 46. Phase 2 Ideas

```txt
Connected Email Accounts
Gmail manual sync
multi-email inbox support
scan selected Gmail labels/search filters
email-to-inbox import
inbox deduplication by provider message ID
project templates
copy tasks from another project
deadline reminder
weekly report
wallet usage analytics
soft notification system
CSV export
keyboard shortcuts
Activate Crypto Price Feed API — live price fetch for Token Watchlist
Activate AI Assistant API — functional chat using stored key
CEX API auto-sync for Portfolio Holdings (read-only permission)
```

---

## 47. Phase 3 Ideas

```txt
AI email classification
auto-detect project from email
AI summary for inbox items
suggest create project/task/note from email
scheduled Gmail sync
X/Twitter monitoring
Watchlist auto-monitoring bot — auto-detect project X/Discord
  activity and surface updates in Watchlist
alpha notes assistant
Discovery / Alpha Inbox
on-chain wallet activity sync
token price widget
team comments
advanced permission roles
Supabase Edge Functions for background tools
Connect existing external price alert bot (currently in testing,
  separate system) into Trading/Token Watchlist
```

---

## 48. Success Criteria

MVP is successful if user can:

1. sign up/login with username and access a private dashboard
2. get a default personal workspace automatically
3. capture a raw idea, link, or reminder into Inbox quickly
4. review Inbox items and convert them into Project, Task, or Note
5. create and pin global notes
6. see Inbox to Process, Pinned Docs, Recent Docs, and Hunting Pulse on Dashboard
7. add a new Web3 project in under 30 seconds
8. assign project to Moree, Wdym, Wayss, or wallets
9. add wallets and identify where they are used
10. add a task by typing title and pressing Enter
11. open Daily page and instantly know what needs to be done today per account
12. see running and recheck tasks separately from the checklist
13. mark task done/skip per account
14. open project detail and see project notes, tasks, accounts, and wallets clearly
15. archive project with proper reason
16. manage high-volume projects, notes, inbox items, and daily work without returning to Notion

---

## 49. Codex Implementation Instruction

Build Phase 1 only.

Use:

```txt
Next.js 15 App Router
TypeScript
Tailwind CSS
shadcn/ui
Supabase PostgreSQL
Supabase Auth
Supabase Storage
Drizzle ORM
Zod
React Hook Form
Vercel
```

Implementation order:

```txt
1. Project setup
2. Tailwind theme and UI tokens
3. Design preview screens
4. Supabase connection
5. Supabase Auth
6. Login/signup/logout pages
7. Protected app layout
8. Default personal workspace auto-create
9. Database schema and migrations
10. RLS policies
11. Manual Inbox
12. Global Notes
13. Dashboard with Inbox + Docs + Pulse
14. Accounts CRUD
15. Wallet groups CRUD
16. Wallets CRUD
17. Projects CRUD
18. Project logo upload / URL support
19. Project detail tabs
20. Project Notes
21. Tasks CRUD with quick add
22. Task account assignment
23. Task logs
24. Daily checklist with checklist / running-recheck split
25. Archive system
26. Activity logs
```

Do not build Phase 2 or Phase 3 features yet.

Focus on:

```txt
clean architecture
readable code
type safety
server actions
workspace-based security
smooth UI
production-ready folder structure
```

---

## 50. First Codex Prompt

Use this prompt to start or re-align implementation:

```txt
Read this PRD carefully and build Phase 1 only.

This is a personal-first Web3 Hunting OS built with Next.js 15, TypeScript, Tailwind CSS, shadcn/ui, Supabase Auth, Supabase PostgreSQL, Supabase Storage, Drizzle ORM, Zod, and React Hook Form.

Important decisions:
- Use username + password in the UI with Supabase Auth under the hood.
- Do not ask for an auth email or require email verification in MVP.
- Generate the internal Supabase email as `{normalized_username}@web3-hunting.local`.
- Username must match `^[a-z0-9_]{3,24}$` and be unique.
- Store username and display name in Supabase user metadata.
- After signup/login, automatically create one default personal workspace if the user does not have one.
- Keep workspace_members table and workspace_id on all data for future team support, but do not build team invite UI in MVP.
- Use Vercel as frontend deployment target.
- Use Supabase as backend core.

Product model:
- Account is persona. Wallet is address. Do not merge them.
- Inbox item is raw input waiting to be processed.
- Docs entries can be global or project-linked.
- Dashboard = Inbox + Docs + Pulse.
- Daily = full checklist.
- Projects = full project database.
- Do not make Dashboard a mini Daily page or mini Projects page.
- Do not build Gmail integration in Phase 1.
- Do not build multi-email sync in Phase 1.
- Do not auto-create projects or tasks from inbox items without user confirmation.

Task rules:
- Projects can be assigned to accounts and wallets.
- Tasks can be assigned to accounts and optional wallets.
- Task entry must use quick add: type title, press Enter, task is saved with defaults.
- Task defaults on quick add: status = todo, frequency = once, priority = medium, assigned = all accounts in project.
- Task status and frequency must both be shown as badges in all task views.
- Daily checklist must be grouped by account.
- Each account has two sections: Checklist and Running/Recheck.
- Task assignment fallback: if a task has no entries in task_accounts, treat it as assigned to all accounts in project_accounts.
- logged_date in task_logs must use Asia/Jakarta timezone (WIB, UTC+7), not UTC.
- task_logs unique constraint uses one unique index on task_id + account_id + logged_date.
- wallet_id is optional metadata and must not create duplicate daily logs in MVP.
- Archive replaces Trash and requires archive_reason.

Build in this order:
1. Project setup
2. Tailwind theme tokens
3. Design preview screens
4. Supabase setup
5. Auth
6. Protected app layout
7. Default workspace creation
8. Database schema and migrations
9. RLS policies
10. Manual Inbox
11. Global Notes
12. Dashboard with Inbox + Docs + Pulse
13. Accounts
14. Wallet groups
15. Wallets
16. Projects
17. Project logo upload / URL
18. Project detail tabs
19. Project Notes
20. Tasks with quick add
21. Task assignment
22. Task logs
23. Daily checklist
24. Archive
25. Activity logs

Before writing code, propose the folder structure and implementation plan.
```
