-- Storage policies for idea-media bucket
-- Bucket must be public for read access
INSERT INTO storage.buckets (id, name, public)
VALUES ('idea-media', 'idea-media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Only registered (non-anonymous) users can upload
-- Anonymous users cannot submit ideas, so they have no reason to upload
CREATE POLICY "registered can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'idea-media'
  AND (auth.jwt() ->> 'is_anonymous')::boolean IS NOT TRUE
);

-- Allow public read
CREATE POLICY "public can read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'idea-media');

-- Allow owner to delete their uploads
CREATE POLICY "owner can delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'idea-media' AND auth.uid() = owner);
