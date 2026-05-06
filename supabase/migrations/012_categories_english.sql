-- Migrate category values from Turkish to English.
-- 1. Drop old constraint
-- 2. Rename existing rows
-- 3. Add new English-only constraint

ALTER TABLE ideas DROP CONSTRAINT IF EXISTS ideas_category_check;

UPDATE ideas SET category = CASE category
  WHEN 'teknoloji' THEN 'technology'
  WHEN 'sanat'     THEN 'art'
  WHEN 'iş'        THEN 'business'
  WHEN 'sosyal'    THEN 'social'
  WHEN 'eğitim'   THEN 'education'
  WHEN 'sağlık'   THEN 'health'
  WHEN 'eğlence'  THEN 'entertainment'
  WHEN 'diğer'    THEN 'other'
  ELSE category
END;

ALTER TABLE ideas
  ADD CONSTRAINT ideas_category_check
  CHECK (category IN (
    'technology', 'art', 'business', 'social',
    'education', 'health', 'entertainment', 'other'
  ));
