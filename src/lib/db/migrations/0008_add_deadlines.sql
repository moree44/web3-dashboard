-- Migration: Add standalone deadlines with optional Project and Task context
--
-- Deadlines are date-sensitive reminders or milestones that may exist without
-- a Task. Task due dates remain on tasks.due_date and are aggregated alongside
-- these records by the application.
--
-- Idempotent: safe to re-run.

BEGIN;

CREATE TABLE IF NOT EXISTS public.deadlines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id),
  title text NOT NULL,
  notes text,
  url text,
  due_date date NOT NULL,
  due_time time(0),
  status text NOT NULL DEFAULT 'upcoming'
    CHECK (status IN ('upcoming', 'done', 'cancelled')),
  linked_project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  linked_task_id uuid REFERENCES public.tasks(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS deadlines_workspace_due_idx
  ON public.deadlines (workspace_id, status, due_date);

CREATE INDEX IF NOT EXISTS deadlines_linked_task_idx
  ON public.deadlines (linked_task_id);

ALTER TABLE public.deadlines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "deadlines_workspace_access" ON public.deadlines;
CREATE POLICY "deadlines_workspace_access" ON public.deadlines
  FOR ALL TO authenticated
  USING (workspace_id IN (SELECT public.user_workspace_ids()))
  WITH CHECK (workspace_id IN (SELECT public.user_workspace_ids()));

COMMIT;
