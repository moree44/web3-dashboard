BEGIN;

CREATE TABLE IF NOT EXISTS public.personal_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id),
  title text NOT NULL,
  frequency text NOT NULL DEFAULT 'once' CHECK (frequency IN ('once', 'daily', 'weekly', 'monthly', 'custom')),
  status text NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'done', 'dropped')),
  note text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS personal_items_workspace_status_idx
  ON public.personal_items (workspace_id, status);

CREATE INDEX IF NOT EXISTS personal_items_workspace_updated_idx
  ON public.personal_items (workspace_id, updated_at);

ALTER TABLE public.personal_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS personal_items_workspace_access ON public.personal_items;
CREATE POLICY personal_items_workspace_access ON public.personal_items
  USING (workspace_id IN (SELECT public.user_workspace_ids()))
  WITH CHECK (workspace_id IN (SELECT public.user_workspace_ids()));

COMMIT;
