-- Length constraints + avatar support.
-- Uses NOT VALID to avoid blocking existing rows; existing data is trusted.
-- New rows will be enforced.

ALTER TABLE ideas
  ADD CONSTRAINT ideas_title_length
    CHECK (char_length(title) BETWEEN 3 AND 100) NOT VALID,
  ADD CONSTRAINT ideas_description_length
    CHECK (char_length(description) BETWEEN 10 AND 3000) NOT VALID;

ALTER TABLE feedbacks
  ADD CONSTRAINT feedbacks_strengths_length
    CHECK (char_length(strengths) <= 1000) NOT VALID,
  ADD CONSTRAINT feedbacks_weaknesses_length
    CHECK (char_length(weaknesses) <= 1000) NOT VALID,
  ADD CONSTRAINT feedbacks_suggestions_length
    CHECK (char_length(suggestions) <= 1000) NOT VALID,
  ADD CONSTRAINT feedbacks_display_name_length
    CHECK (display_name IS NULL OR char_length(display_name) <= 40) NOT VALID;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now(),
  ADD CONSTRAINT profiles_bio_length
    CHECK (bio IS NULL OR char_length(bio) <= 200) NOT VALID,
  ADD CONSTRAINT profiles_username_length
    CHECK (username IS NULL OR char_length(username) BETWEEN 2 AND 30) NOT VALID;
