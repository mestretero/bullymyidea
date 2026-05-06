-- Switch all content to English-only
UPDATE ideas SET language = 'en' WHERE language != 'en';
UPDATE feedbacks SET language = 'en' WHERE language != 'en';

-- Update default
ALTER TABLE ideas ALTER COLUMN language SET DEFAULT 'en';
ALTER TABLE feedbacks ALTER COLUMN language SET DEFAULT 'en';
