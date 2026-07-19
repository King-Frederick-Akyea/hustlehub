ALTER TABLE notifications ADD COLUMN type VARCHAR(40) NOT NULL DEFAULT 'WALLET_DEPOSIT';
ALTER TABLE notifications ALTER COLUMN type DROP DEFAULT;
ALTER TABLE notifications ADD COLUMN related_entity_id UUID;

CREATE TABLE device_tokens (
    id              UUID PRIMARY KEY,
    user_id         UUID NOT NULL,
    expo_push_token VARCHAR(255) NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unique on the token, not user_id: a user can have multiple devices, and a token upserts to
-- whichever user most recently registered it (handles logout/login on a shared device).
CREATE UNIQUE INDEX ux_device_tokens_expo_push_token ON device_tokens (expo_push_token);
CREATE INDEX ix_device_tokens_user_id ON device_tokens (user_id);
