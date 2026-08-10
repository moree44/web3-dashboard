BEGIN;

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS chains text[] NOT NULL DEFAULT '{}'::text[];

CREATE TABLE IF NOT EXISTS public.project_watchlist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  x_url text NOT NULL,
  thesis text,
  chain text,
  project_types text[] NOT NULL DEFAULT '{}'::text[],
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'converted')),
  converted_project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT project_watchlist_conversion_state_check CHECK (
    status = 'converted' OR converted_project_id IS NULL
  )
);

CREATE INDEX IF NOT EXISTS project_watchlist_workspace_status_idx
  ON public.project_watchlist_items (workspace_id, status, updated_at);

CREATE UNIQUE INDEX IF NOT EXISTS project_watchlist_workspace_active_x_url_unique
  ON public.project_watchlist_items (workspace_id, lower(trim(x_url)))
  WHERE status = 'active';

CREATE UNIQUE INDEX IF NOT EXISTS project_watchlist_converted_project_unique
  ON public.project_watchlist_items (converted_project_id)
  WHERE converted_project_id IS NOT NULL;

ALTER TABLE public.project_watchlist_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS project_watchlist_workspace_access
  ON public.project_watchlist_items;
CREATE POLICY project_watchlist_workspace_access
  ON public.project_watchlist_items
  FOR ALL
  USING (workspace_id IN (SELECT public.user_workspace_ids()))
  WITH CHECK (workspace_id IN (SELECT public.user_workspace_ids()));

GRANT SELECT, INSERT, UPDATE, DELETE
  ON public.project_watchlist_items
  TO authenticated;

COMMIT;
