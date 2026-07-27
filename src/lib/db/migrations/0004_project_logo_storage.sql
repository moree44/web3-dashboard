-- Migration: Project logo storage bucket policies
--
-- NOTE: Create the `project-logos` bucket first via Supabase Dashboard:
--   1. Go to Storage → New Bucket
--   2. Name: project-logos, Public bucket: ON
--   3. File size limit: 2 MB
--   4. Allowed MIME types: image/*
--
-- Then run this migration to apply RLS policies.

-- Allow authenticated users to read any project logo (public bucket)
DROP POLICY IF EXISTS "Authenticated users can read project logos" ON storage.objects;
CREATE POLICY "Authenticated users can read project logos"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'project-logos');

-- Allow insert only into workspaces the user owns
DROP POLICY IF EXISTS "Users can upload logos to their workspace" ON storage.objects;
CREATE POLICY "Users can upload logos to their workspace"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'project-logos'
    AND EXISTS (
      SELECT 1 FROM public.workspaces
      WHERE id::text = (string_to_array(name, '/'))[1]
      AND owner_id = auth.uid()
    )
  );

-- Allow update/delete only for objects the user owns
DROP POLICY IF EXISTS "Users can update their own workspace logos" ON storage.objects;
CREATE POLICY "Users can update their own workspace logos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'project-logos'
    AND owner = auth.uid()
  );

DROP POLICY IF EXISTS "Users can delete their own workspace logos" ON storage.objects;
CREATE POLICY "Users can delete their own workspace logos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'project-logos'
    AND owner = auth.uid()
  );
