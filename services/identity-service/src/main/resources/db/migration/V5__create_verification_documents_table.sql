CREATE TABLE verification_documents (
    id                UUID PRIMARY KEY,
    user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type              VARCHAR(20) NOT NULL,
    storage_path      VARCHAR(500) NOT NULL,
    original_filename VARCHAR(255),
    content_type      VARCHAR(100),
    file_size_bytes   BIGINT NOT NULL,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ix_verification_documents_user_id ON verification_documents (user_id);
