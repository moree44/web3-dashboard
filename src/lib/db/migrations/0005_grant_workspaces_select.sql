-- Migration: Grant SELECT on workspaces so storage RLS policies can check ownership
--
-- The storage INSERT policy for project-logos queries public.workspaces
-- to verify the user owns the workspace they're uploading into.
-- This needs base SELECT permission for the authenticated role.
-- Row-level filtering is still enforced by existing workspaces RLS policies.

GRANT SELECT ON public.workspaces TO authenticated;
