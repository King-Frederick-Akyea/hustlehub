CREATE TABLE email_verification_codes (
    id            UUID PRIMARY KEY,
    user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code_hash     VARCHAR(64) NOT NULL,
    expires_at    TIMESTAMPTZ NOT NULL,
    consumed_at   TIMESTAMPTZ,
    attempt_count INT NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ix_email_verification_codes_user_id ON email_verification_codes (user_id);
