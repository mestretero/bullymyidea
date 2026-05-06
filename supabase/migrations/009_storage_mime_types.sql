-- Bucket: allowed mime types + size cap (5MB hard limit)
-- Images limited to 3MB client-side; PDF up to 5MB; videos removed (use YouTube embed)
UPDATE storage.buckets
SET
  allowed_mime_types = ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf'
  ],
  file_size_limit = 5242880  -- 5 MB
WHERE id = 'idea-media';

-- Optional YouTube link instead of native video upload
ALTER TABLE ideas
  ADD COLUMN IF NOT EXISTS youtube_url text;
