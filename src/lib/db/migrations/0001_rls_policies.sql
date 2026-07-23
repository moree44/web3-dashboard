-- RLS Policies for Web3-Hunting-OS
-- Enable RLS on all application tables

-- ─── Helper: check if user is a member of a workspace ───
-- Used by data table policies below

-- ─── workspaces ────────────────────────────────────────────────────────────

ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

-- Owners can do anything with their workspaces
CREATE POLICY "workspaces_owner_all" ON workspaces
  FOR ALL
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Members can view workspaces they belong to
CREATE POLICY "workspaces_member_select" ON workspaces
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = workspaces.id
        AND workspace_members.user_id = auth.uid()
    )
  );

-- ─── workspace_members ─────────────────────────────────────────────────────

ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;

-- Workspace owner can manage members
CREATE POLICY "workspace_members_owner_all" ON workspace_members
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM workspaces
      WHERE workspaces.id = workspace_members.workspace_id
        AND workspaces.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspaces
      WHERE workspaces.id = workspace_members.workspace_id
        AND workspaces.owner_id = auth.uid()
    )
  );

-- Members can view other members in their workspaces
CREATE POLICY "workspace_members_select" ON workspace_members
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members AS wm
      WHERE wm.workspace_id = workspace_members.workspace_id
        AND wm.user_id = auth.uid()
    )
  );

-- ─── Data table helper: reusable policy for workspace-scoped access ────────
-- Each data table gets:
--   SELECT/INSERT/UPDATE/DELETE for workspace members
--   USING clause: workspace_id IN (user's workspace memberships)

-- ─── accounts ──────────────────────────────────────────────────────────────

ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "accounts_workspace_access" ON accounts
  FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- ─── wallet_groups ─────────────────────────────────────────────────────────

ALTER TABLE wallet_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wallet_groups_workspace_access" ON wallet_groups
  FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- ─── wallets ───────────────────────────────────────────────────────────────

ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wallets_workspace_access" ON wallets
  FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- ─── projects ──────────────────────────────────────────────────────────────

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "projects_workspace_access" ON projects
  FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- ─── project_accounts ──────────────────────────────────────────────────────

ALTER TABLE project_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "project_accounts_workspace_access" ON project_accounts
  FOR ALL
  USING (
    project_id IN (
      SELECT id FROM projects
      WHERE workspace_id IN (
        SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects
      WHERE workspace_id IN (
        SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
      )
    )
  );

-- ─── project_wallets ───────────────────────────────────────────────────────

ALTER TABLE project_wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "project_wallets_workspace_access" ON project_wallets
  FOR ALL
  USING (
    project_id IN (
      SELECT id FROM projects
      WHERE workspace_id IN (
        SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects
      WHERE workspace_id IN (
        SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
      )
    )
  );

-- ─── tasks ─────────────────────────────────────────────────────────────────

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tasks_workspace_access" ON tasks
  FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- ─── task_accounts ─────────────────────────────────────────────────────────

ALTER TABLE task_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "task_accounts_workspace_access" ON task_accounts
  FOR ALL
  USING (
    task_id IN (
      SELECT id FROM tasks
      WHERE workspace_id IN (
        SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    task_id IN (
      SELECT id FROM tasks
      WHERE workspace_id IN (
        SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
      )
    )
  );

-- ─── task_wallets ──────────────────────────────────────────────────────────

ALTER TABLE task_wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "task_wallets_workspace_access" ON task_wallets
  FOR ALL
  USING (
    task_id IN (
      SELECT id FROM tasks
      WHERE workspace_id IN (
        SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    task_id IN (
      SELECT id FROM tasks
      WHERE workspace_id IN (
        SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
      )
    )
  );

-- ─── task_logs ─────────────────────────────────────────────────────────────

ALTER TABLE task_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "task_logs_workspace_access" ON task_logs
  FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- ─── inbox_items ───────────────────────────────────────────────────────────

ALTER TABLE inbox_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "inbox_items_workspace_access" ON inbox_items
  FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- ─── notes ─────────────────────────────────────────────────────────────────

ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notes_workspace_access" ON notes
  FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- ─── activity_logs ─────────────────────────────────────────────────────────

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "activity_logs_workspace_access" ON activity_logs
  FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );
