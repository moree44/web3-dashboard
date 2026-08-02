BEGIN;

ALTER TABLE public.activity_logs
  DROP CONSTRAINT IF EXISTS activity_logs_project_id_projects_id_fk,
  DROP CONSTRAINT IF EXISTS activity_logs_task_id_tasks_id_fk,
  DROP CONSTRAINT IF EXISTS activity_logs_account_id_accounts_id_fk,
  DROP CONSTRAINT IF EXISTS activity_logs_wallet_id_wallets_id_fk,
  DROP CONSTRAINT IF EXISTS activity_logs_inbox_item_id_inbox_items_id_fk,
  DROP CONSTRAINT IF EXISTS activity_logs_note_id_notes_id_fk;

ALTER TABLE public.activity_logs
  ADD CONSTRAINT activity_logs_project_id_projects_id_fk
    FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE SET NULL,
  ADD CONSTRAINT activity_logs_task_id_tasks_id_fk
    FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE SET NULL,
  ADD CONSTRAINT activity_logs_account_id_accounts_id_fk
    FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE SET NULL,
  ADD CONSTRAINT activity_logs_wallet_id_wallets_id_fk
    FOREIGN KEY (wallet_id) REFERENCES public.wallets(id) ON DELETE SET NULL,
  ADD CONSTRAINT activity_logs_inbox_item_id_inbox_items_id_fk
    FOREIGN KEY (inbox_item_id) REFERENCES public.inbox_items(id) ON DELETE SET NULL,
  ADD CONSTRAINT activity_logs_note_id_notes_id_fk
    FOREIGN KEY (note_id) REFERENCES public.notes(id) ON DELETE SET NULL;

COMMIT;
