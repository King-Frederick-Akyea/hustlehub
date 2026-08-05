ALTER TABLE messages ALTER COLUMN text DROP NOT NULL;
ALTER TABLE messages ADD COLUMN image_path VARCHAR(500);
ALTER TABLE messages ADD COLUMN image_content_type VARCHAR(20);
ALTER TABLE messages ADD CONSTRAINT chk_messages_has_content CHECK (text IS NOT NULL OR image_path IS NOT NULL);
