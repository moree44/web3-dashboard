CREATE UNIQUE INDEX IF NOT EXISTS projects_workspace_active_name_unique
ON public.projects (workspace_id, lower(btrim(name)))
WHERE is_archived = false;
