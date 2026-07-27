-- Migration: Account avatar storage bucket policies
--
-- Create the `account-avatars` bucket first (Storage → New Bucket, or SQL):
--   insert into storage.buckets (id, name, public, file_size_limit)
--   values ('account-avatars', 'account-avatars', true, 2097152)
--   on conflict (id) do nothing;
--
-- Then run this migration to apply RLS policies.
-- Upload paths are `{workspaceId}/{accountId}/avatar-{ts}.{ext}` — the policies
-- below authorise on the first path segment.

DROP POLICY IF EXISTS "Authenticated users can read account avatars" ON storage.objects;
CREATE POLICY "Authenticated users can read account avatars"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'account-avatars');

-- NOTE: `storage.objects.name` and `workspaces.name` must be qualified explicitly.
-- An unqualified `name` inside this subquery binds to workspaces.name (the inner
-- scope wins), so the check silently compares a workspace UUID against the
-- workspace's display name and is always false — rejecting every upload.
DROP POLICY IF EXISTS "Users can upload avatars to their workspace" ON storage.objects;
CREATE POLICY "Users can upload avatars to their workspace"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'account-avatars'
    AND EXISTS (
      SELECT 1 FROM public.workspaces w
      WHERE w.id::text = (string_to_array(storage.objects.name, '/'))[1]
      AND w.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update their own workspace avatars" ON storage.objects;
CREATE POLICY "Users can update their own workspace avatars"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'account-avatars'
    AND owner = auth.uid()
  );

DROP POLICY IF EXISTS "Users can delete their own workspace avatars" ON storage.objects;
CREATE POLICY "Users can delete their own workspace avatars"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'account-avatars'
    AND owner = auth.uid()
  );
