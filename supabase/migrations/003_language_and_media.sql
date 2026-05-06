-- Add media and language columns
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS media_urls text[] NOT NULL DEFAULT '{}';
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS whitepaper_url text NOT NULL DEFAULT '';
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'tr' CHECK (language IN ('tr', 'en'));

ALTER TABLE feedbacks ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'tr' CHECK (language IN ('tr', 'en'));

CREATE INDEX IF NOT EXISTS ideas_language_idx ON ideas(language);
CREATE INDEX IF NOT EXISTS feedbacks_language_idx ON feedbacks(language);
