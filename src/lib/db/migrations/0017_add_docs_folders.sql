BEGIN;

CREATE TABLE IF NOT EXISTS public.docs_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS docs_folders_workspace_name_unique
  ON public.docs_folders (workspace_id, lower(trim(name)));

CREATE INDEX IF NOT EXISTS docs_folders_workspace_sort_idx
  ON public.docs_folders (workspace_id, sort_order, name);

INSERT INTO public.docs_folders (workspace_id, name, description, sort_order)
SELECT workspaces.id, defaults.name, defaults.description, defaults.sort_order
FROM public.workspaces
CROSS JOIN (VALUES
  ('Research', 'Protocol notes and findings', 0),
  ('Tools & Links', 'Dashboards, explorers, docs', 1),
  ('Guides / SOP', 'Repeatable workflows', 2),
  ('Project References', 'Setup and campaign notes', 3),
  ('Accounts & Access', 'Account links and vault hints', 4),
  ('Templates', 'Reusable tracking formats', 5),
  ('Personal Notes', 'Strategy and reminders', 6)
) AS defaults(name, description, sort_order)
ON CONFLICT DO NOTHING;

INSERT INTO public.docs_folders (workspace_id, name, sort_order)
SELECT notes.workspace_id, trim(notes.folder), 7
FROM public.notes
WHERE notes.folder IS NOT NULL AND trim(notes.folder) <> ''
GROUP BY notes.workspace_id, trim(notes.folder)
ON CONFLICT DO NOTHING;

ALTER TABLE public.docs_folders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS docs_folders_workspace_access
  ON public.docs_folders;
CREATE POLICY docs_folders_workspace_access
  ON public.docs_folders
  FOR ALL
  USING (workspace_id IN (SELECT public.user_workspace_ids()))
  WITH CHECK (workspace_id IN (SELECT public.user_workspace_ids()));

GRANT SELECT, INSERT, UPDATE, DELETE
  ON public.docs_folders
  TO authenticated;

COMMIT;
