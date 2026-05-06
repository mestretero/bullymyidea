-- Add display_name for anonymous feedback authors
ALTER TABLE feedbacks
ADD COLUMN IF NOT EXISTS display_name text NOT NULL DEFAULT '';
