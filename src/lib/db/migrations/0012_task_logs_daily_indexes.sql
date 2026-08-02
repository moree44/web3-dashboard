CREATE UNIQUE INDEX IF NOT EXISTS task_logs_unique_daily
  ON public.task_logs (task_id, account_id, logged_date);

CREATE INDEX IF NOT EXISTS idx_task_logs_date
  ON public.task_logs (logged_date);

CREATE INDEX IF NOT EXISTS idx_task_logs_account_date
  ON public.task_logs (account_id, logged_date);

CREATE INDEX IF NOT EXISTS idx_task_logs_project
  ON public.task_logs (project_id);
