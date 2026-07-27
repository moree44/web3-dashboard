BEGIN;

ALTER TABLE public.workspaces
  DROP CONSTRAINT IF EXISTS workspaces_owner_id_auth_users_id_fk;

ALTER TABLE public.workspace_members
  DROP CONSTRAINT IF EXISTS workspace_members_user_id_auth_users_id_fk;

ALTER TABLE public.workspaces
  ADD CONSTRAINT workspaces_owner_id_auth_users_id_fk
  FOREIGN KEY (owner_id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;

ALTER TABLE public.workspace_members
  ADD CONSTRAINT workspace_members_user_id_auth_users_id_fk
  FOREIGN KEY (user_id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;

DROP TABLE IF EXISTS public.auth_users;

COMMIT;
