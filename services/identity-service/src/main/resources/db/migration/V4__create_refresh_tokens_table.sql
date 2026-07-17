CREATE TABLE refresh_tokens (
    id                    UUID PRIMARY KEY,
    user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash            VARCHAR(64) NOT NULL,
    expires_at            TIMESTAMPTZ NOT NULL,
    revoked_at            TIMESTAMPTZ,
    replaced_by_token_id  UUID,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX ux_refresh_tokens_token_hash ON refresh_tokens (token_hash);
CREATE INDEX ix_refresh_tokens_user_id ON refresh_tokens (user_id);
