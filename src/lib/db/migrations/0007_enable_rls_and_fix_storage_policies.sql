-- Migration: Enable RLS on all application tables + fix storage upload policies
--
-- WHY THIS EXISTS
--   0001_rls_policies.sql was never applied successfully. Every table in `public`
--   still has RLS disabled with zero policies, while 0005 granted SELECT on
--   `workspaces` to the `authenticated` role — so any signed-in user could read
--   every workspace row through the REST API. This migration supersedes 0001.
--
--   0001 could not simply be re-run: its `workspace_members_select` policy
--   selects from `workspace_members` inside a policy ON `workspace_members`,
--   which raises `infinite recursion detected in policy for relation`. The fix
--   is the SECURITY DEFINER helper below, which reads memberships with RLS
--   bypassed and so terminates the cycle.
--
-- SAFE FOR THE APP
--   Server actions connect via DATABASE_URL as `postgres`, which owns all 15
--   tables and has rolbypassrls = true. Drizzle queries are unaffected by RLS.
--   These policies constrain the `authenticated` role only — i.e. PostgREST and
--   the storage API.
--
-- Idempotent: safe to re-run.

BEGIN;

-- ── 1. Membership lookup, RLS-free ──────────────────────────────────────────
-- SECURITY DEFINER runs as the function owner, so reading workspace_members
-- here does NOT re-enter workspace_members' own policies.

CREATE OR REPLACE FUNCTION public.user_workspace_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
$$;

REVOKE ALL ON FUNCTION public.user_workspace_ids() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_workspace_ids() TO authenticated;

-- ── 2. workspaces ───────────────────────────────────────────────────────────

ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "workspaces_owner_all" ON public.workspaces;
CREATE POLICY "workspaces_owner_all" ON public.workspaces
  FOR ALL TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "workspaces_member_select" ON public.workspaces;
CREATE POLICY "workspaces_member_select" ON public.workspaces
  FOR SELECT TO authenticated
  USING (id IN (SELECT public.user_workspace_ids()));

-- ── 3. workspace_members ────────────────────────────────────────────────────
-- Self-select is a flat predicate (no subquery) so it cannot recurse.
-- The owner policy reaches into `workspaces`, whose own policies never read
-- workspace_members directly — they go through the SECURITY DEFINER helper.

ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "workspace_members_select" ON public.workspace_members;
DROP POLICY IF EXISTS "workspace_members_self_select" ON public.workspace_members;
CREATE POLICY "workspace_members_self_select" ON public.workspace_members
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "workspace_members_owner_all" ON public.workspace_members;
CREATE POLICY "workspace_members_owner_all" ON public.workspace_members
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workspaces w
      WHERE w.id = workspace_members.workspace_id
        AND w.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workspaces w
      WHERE w.id = workspace_members.workspace_id
        AND w.owner_id = auth.uid()
    )
  );

-- ── 4. Tables that carry workspace_id directly ──────────────────────────────

DO $do$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'accounts', 'wallet_groups', 'wallets', 'projects',
    'tasks', 'task_logs', 'inbox_items', 'notes', 'activity_logs'
  ]
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_workspace_access', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL TO authenticated '
      'USING (workspace_id IN (SELECT public.user_workspace_ids())) '
      'WITH CHECK (workspace_id IN (SELECT public.user_workspace_ids()))',
      t || '_workspace_access', t
    );
  END LOOP;
END
$do$;

-- ── 5. Join tables — scoped through their parent ────────────────────────────

DO $do$
DECLARE
  spec text[];
BEGIN
  FOREACH spec SLICE 1 IN ARRAY ARRAY[
    ['project_accounts', 'project_id', 'projects'],
    ['project_wallets',  'project_id', 'projects'],
    ['task_accounts',    'task_id',    'tasks'],
    ['task_wallets',     'task_id',    'tasks']
  ]
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', spec[1]);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', spec[1] || '_workspace_access', spec[1]);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL TO authenticated '
      'USING (%I IN (SELECT id FROM public.%I WHERE workspace_id IN (SELECT public.user_workspace_ids()))) '
      'WITH CHECK (%I IN (SELECT id FROM public.%I WHERE workspace_id IN (SELECT public.user_workspace_ids())))',
      spec[1] || '_workspace_access', spec[1],
      spec[2], spec[3],
      spec[2], spec[3]
    );
  END LOOP;
END
$do$;

-- ── 6. Fix the project-logos upload policy ──────────────────────────────────
-- What is currently live in the database is just `bucket_id = 'project-logos'`,
-- with no ownership check at all — any authenticated user can write into any
-- workspace folder. 0004 intended the check below but bound `name` to
-- workspaces.name instead of storage.objects.name (the inner scope wins), which
-- made it always false; it was presumably "fixed" by deleting the check.
-- Qualifying the column explicitly is what makes this correct.

DROP POLICY IF EXISTS "Users can upload logos to their workspace" ON storage.objects;
CREATE POLICY "Users can upload logos to their workspace"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'project-logos'
    AND EXISTS (
      SELECT 1 FROM public.workspaces w
      WHERE w.id::text = (string_to_array(storage.objects.name, '/'))[1]
        AND w.owner_id = auth.uid()
    )
  );

COMMIT;
