ALTER TABLE public.notes
  ADD COLUMN IF NOT EXISTS folder text;

CREATE INDEX IF NOT EXISTS idx_notes_workspace_folder_updated
  ON public.notes (workspace_id, folder, updated_at DESC);
