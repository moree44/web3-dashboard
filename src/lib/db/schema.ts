import type { AnyPgColumn } from "drizzle-orm/pg-core";
import {
  pgTable,
  uuid,
  text,
  boolean,
  date,
  numeric,
  jsonb,
  timestamp,
  integer,
  primaryKey,
} from "drizzle-orm/pg-core";

// ─── Workspaces ───────────────────────────────────────────────────────────────

export const workspaces = pgTable("workspaces", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  ownerId: uuid("owner_id")
    .notNull()
    .references(() => authUsers.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Auth users reference (used by FK in workspaces and workspace_members)
// This is a placeholder reference — the actual table lives in Supabase auth schema
export const authUsers = pgTable("auth_users", {
  id: uuid("id").primaryKey(),
});

// ─── Workspace Members ────────────────────────────────────────────────────────

export const workspaceMembers = pgTable("workspace_members", {
  id: uuid("id").defaultRandom().primaryKey(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id),
  userId: uuid("user_id")
    .notNull()
    .references(() => authUsers.id),
  role: text("role", { enum: ["owner", "member"] }).notNull(),
  joinedAt: timestamp("joined_at", { withTimezone: true }).defaultNow(),
});

// ─── Accounts ─────────────────────────────────────────────────────────────────

export const accounts = pgTable("accounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id),
  label: text("label").notNull(),
  avatarUrl: text("avatar_url"),
  avatarSource: text("avatar_source", {
    enum: ["uploaded", "external_url", "manual", "none"],
  }),
  color: text("color"),
  xUsername: text("x_username"),
  xUrl: text("x_url"),
  discordUsername: text("discord_username"),
  email: text("email"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ─── Wallet Groups ────────────────────────────────────────────────────────────

export const walletGroups = pgTable("wallet_groups", {
  id: uuid("id").defaultRandom().primaryKey(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ─── Wallets ──────────────────────────────────────────────────────────────────

export const wallets = pgTable("wallets", {
  id: uuid("id").defaultRandom().primaryKey(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id),
  ownerAccountId: uuid("owner_account_id").references(() => accounts.id),
  walletGroupId: uuid("wallet_group_id").references(() => walletGroups.id),
  label: text("label").notNull(),
  address: text("address").notNull(),
  chainType: text("chain_type"),
  walletType: text("wallet_type", {
    enum: [
      "main",
      "project_wallet",
      "burner",
      "l1",
      "testnet",
      "retro",
      "nft",
      "other",
    ],
  }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ─── Projects ─────────────────────────────────────────────────────────────────

export const projects = pgTable("projects", {
  id: uuid("id").defaultRandom().primaryKey(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id),
  name: text("name").notNull(),
  slug: text("slug"),
  description: text("description"),
  logoUrl: text("logo_url"),
  logoPath: text("logo_path"),
  logoSource: text("logo_source", {
    enum: ["uploaded", "external_url", "favicon", "manual", "none"],
  }),
  huntType: text("hunt_type", {
    enum: ["free_hunts", "retro", "nft", "waitlist"],
  }),
  status: text("status", {
    enum: [
      "watching",
      "in_progress",
      "running",
      "paused",
      "done",
      "dropped",
      "archived",
    ],
  }),
  priority: text("priority", { enum: ["high", "medium", "low"] }),
  workTypes: text("work_types").array(),
  projectTypes: text("project_types").array(),
  progressEstimate: numeric("progress_estimate").default("0"),
  stageResult: text("stage_result"),
  dateStart: date("date_start"),
  dateEnd: date("date_end"),
  websiteUrl: text("website_url"),
  twitterUrl: text("twitter_url"),
  discordUrl: text("discord_url"),
  githubUrl: text("github_url"),
  docsUrl: text("docs_url"),
  notes: text("notes"),
  isArchived: boolean("is_archived").default(false),
  archiveReason: text("archive_reason"),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ─── Project Accounts ─────────────────────────────────────────────────────────

export const projectAccounts = pgTable(
  "project_accounts",
  {
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id),
    accountId: uuid("account_id")
      .notNull()
      .references(() => accounts.id),
  },
  (table) => [primaryKey({ columns: [table.projectId, table.accountId] })],
);

// ─── Project Wallets ──────────────────────────────────────────────────────────

export const projectWallets = pgTable(
  "project_wallets",
  {
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id),
    walletId: uuid("wallet_id")
      .notNull()
      .references(() => wallets.id),
  },
  (table) => [primaryKey({ columns: [table.projectId, table.walletId] })],
);

// ─── Tasks ────────────────────────────────────────────────────────────────────

export const tasks = pgTable("tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id),
  projectId: uuid("project_id").references(() => projects.id),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status", {
    enum: ["todo", "in_progress", "running", "recheck", "done", "dropped"],
  }),
  frequency: text("frequency", {
    enum: ["once", "daily", "weekly", "monthly", "custom"],
  }),
  priority: text("priority", { enum: ["high", "medium", "low"] }),
  url: text("url"),
  sortOrder: integer("sort_order").default(0),
  dueDate: date("due_date"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ─── Task Accounts ────────────────────────────────────────────────────────────

export const taskAccounts = pgTable(
  "task_accounts",
  {
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id),
    accountId: uuid("account_id")
      .notNull()
      .references(() => accounts.id),
  },
  (table) => [primaryKey({ columns: [table.taskId, table.accountId] })],
);

// ─── Task Wallets ─────────────────────────────────────────────────────────────

export const taskWallets = pgTable(
  "task_wallets",
  {
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id),
    walletId: uuid("wallet_id")
      .notNull()
      .references(() => wallets.id),
  },
  (table) => [primaryKey({ columns: [table.taskId, table.walletId] })],
);

// ─── Task Logs ────────────────────────────────────────────────────────────────

export const taskLogs = pgTable("task_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id),
  taskId: uuid("task_id")
    .notNull()
    .references(() => tasks.id),
  projectId: uuid("project_id").references(() => projects.id),
  accountId: uuid("account_id").references(() => accounts.id),
  walletId: uuid("wallet_id").references(() => wallets.id),
  status: text("status", { enum: ["done", "skip", "pending"] }).notNull(),
  loggedDate: date("logged_date").notNull(),
  txHash: text("tx_hash"),
  proofUrl: text("proof_url"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ─── Inbox Items ──────────────────────────────────────────────────────────────

export const inboxItems = pgTable("inbox_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id),
  source: text("source", {
    enum: [
      "manual",
      "quick_capture",
      "gmail",
      "twitter_x",
      "browser_extension",
      "api",
    ],
  }),
  title: text("title").notNull(),
  content: text("content"),
  url: text("url"),
  sender: text("sender"),
  receivedAt: timestamp("received_at", { withTimezone: true }),
  status: text("status", {
    enum: [
      "new",
      "reviewing",
      "linked",
      "converted",
      "ignored",
      "archived",
    ],
  }),
  priority: text("priority", { enum: ["high", "medium", "low"] }),
  detectedProjectName: text("detected_project_name"),
  linkedProjectId: uuid("linked_project_id").references(() => projects.id),
  linkedTaskId: uuid("linked_task_id").references(() => tasks.id),
  linkedNoteId: uuid("linked_note_id").references((): AnyPgColumn => notes.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ─── Notes ────────────────────────────────────────────────────────────────────

export const notes = pgTable("notes", {
  id: uuid("id").defaultRandom().primaryKey(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id),
  title: text("title"),
  content: text("content"),
  noteType: text("note_type", {
    enum: [
      "general",
      "alpha",
      "research",
      "setup",
      "commands",
      "links",
      "reminder",
      "strategy",
      "result",
      "private_note",
      "keys_hint",
    ],
  }),
  pinned: boolean("pinned").default(false),
  linkedProjectId: uuid("linked_project_id").references(() => projects.id),
  linkedTaskId: uuid("linked_task_id").references(() => tasks.id),
  linkedAccountId: uuid("linked_account_id").references(() => accounts.id),
  linkedWalletId: uuid("linked_wallet_id").references(() => wallets.id),
  linkedInboxItemId: uuid("linked_inbox_item_id").references(
    (): AnyPgColumn => inboxItems.id,
  ),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ─── Activity Logs ────────────────────────────────────────────────────────────

export const activityLogs = pgTable("activity_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id),
  projectId: uuid("project_id").references(() => projects.id),
  taskId: uuid("task_id").references(() => tasks.id),
  accountId: uuid("account_id").references(() => accounts.id),
  walletId: uuid("wallet_id").references(() => wallets.id),
  inboxItemId: uuid("inbox_item_id").references(() => inboxItems.id),
  noteId: uuid("note_id").references(() => notes.id),
  action: text("action").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
