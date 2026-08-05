ALTER TABLE users ADD COLUMN account_status VARCHAR(10) NOT NULL DEFAULT 'ACTIVE';   -- ACTIVE | SUSPENDED
ALTER TABLE users ADD COLUMN suspension_reason TEXT;
ALTER TABLE users ADD COLUMN suspended_at TIMESTAMPTZ;

-- Admin-granted trust badge - distinct from the existing self-serve `verification_status` pipeline
-- (which auto-completes on ID+face upload with no human review). This is the manual review layer.
ALTER TABLE users ADD COLUMN admin_verified BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN admin_verified_at TIMESTAMPTZ;

ALTER TABLE users ADD COLUMN phone_number VARCHAR(20);
ALTER TABLE users ADD COLUMN availability VARCHAR(200);

-- Tasker specializations - values are TASK_CATEGORIES ids from the frontend (frontend/src/constants/index.tsx),
-- not a free-standing taxonomy, so a tasker's specialties line up with real task categories.
CREATE TABLE user_specializations (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    value   VARCHAR(50) NOT NULL,
    PRIMARY KEY (user_id, value)
);
