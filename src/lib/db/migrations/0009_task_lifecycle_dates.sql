-- Move Task timing from office-style due dates to hunting lifecycle dates.
-- Existing Task due dates become linked Deadline records before the column is removed.

alter table public.tasks
  add column if not exists start_date date,
  add column if not exists completed_at timestamptz;

update public.tasks
set start_date = (created_at at time zone 'Asia/Jakarta')::date
where start_date is null;

update public.tasks
set completed_at = updated_at
where status = 'done'
  and completed_at is null;

insert into public.deadlines (
  workspace_id,
  title,
  notes,
  url,
  due_date,
  status,
  linked_project_id,
  linked_task_id,
  created_at,
  updated_at
)
select
  task.workspace_id,
  task.title,
  'Migrated from the former Task due date.',
  task.url,
  task.due_date,
  case when task.status = 'done' then 'done' else 'upcoming' end,
  task.project_id,
  task.id,
  coalesce(task.created_at, now()),
  now()
from public.tasks as task
where task.due_date is not null
  and not exists (
    select 1
    from public.deadlines as deadline
    where deadline.workspace_id = task.workspace_id
      and deadline.linked_task_id = task.id
      and deadline.due_date = task.due_date
  );

alter table public.tasks
  drop column if exists due_date;
